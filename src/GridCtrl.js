import { Forest } from '@wonderlandlabs/forestry4'

export const CARD_WIDTH = 192
export const CARD_HEIGHT = 192
export const GAP = 1
export const LABEL_HEIGHT = 22
export const EDGE_ZONE = 150
export const MAX_SPEED = 520
export const WHEEL_SPEED = 1.1
export const COMPRESSED_SCALE = 0.5
export const STILL_SPEED = 10
export const HOVER_DELAY = 1000
export const MIN_OVERLAY_TIME = 1000
export const OVERLAY_SCALE = 1.66
export const OVERLAY_LIFT = 20
export const MAX_SCROLL_TILT_DEGREES = 6
export const IMAGE_Y_OFFSET = -80
export const DRAWER_WIDTH = 184
export const STAGE_OVERSCAN_Y = 50
export const DRAWER_CLOSE_DELAY = 1700
export const SCROLL_BUTTON_RADIUS = 52
export const SCROLL_BUTTON_TOP_Y = 67
export const SCROLL_BUTTON_BOTTOM_OFFSET = 35

export class GridCtrl extends Forest {
  animationFrame = 0
  drawerCloseTimer = 0
  hoverTimer = 0
  lastTick = 0
  pointer = { time: 0, x: 0, y: 0, speed: 0 }
  hoverCandidate = null
  hoverSuppressed = false
  draggingCard = null

  constructor(cards) {
    super({
      name: 'GridCtrl',
      value: {
        cards,
        compression: 0,
        dragOverlay: null,
        dragOverDrawer: false,
        drawerCards: [],
        drawerOpen: false,
        drawerPinned: false,
        edgeIntent: { direction: 0, strength: 0 },
        hoverCursor: false,
        hoverOverlay: null,
        resourceVersion: 0,
        scroll: { row: 0, offset: 0 },
        stageSize: { width: 1280, height: 720 },
      },
    })
  }

  static factory(cards) {
    return new GridCtrl(cards)
  }

  connect() {
    if (this.animationFrame) return
    this.lastTick = 0
    this.animationFrame = window.requestAnimationFrame(this.tick)
  }

  complete() {
    this.disconnect()
    this.releaseImageResources()
    super.complete()
  }

  disconnect() {
    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame)
      this.animationFrame = 0
    }
    this.clearHoverCandidate()
    this.clearDrawerCloseTimer()
  }

  imageFor(card) {
    if (!card?.image || typeof window === 'undefined') return null

    const images = this.imageResources
    if (images.has(card.image)) return images.get(card.image)

    this.loadImage(card.image)
    return null
  }

  setStageSize(width, height) {
    this.set('stageSize', {
      height: Math.max(1, Math.floor(height)),
      width: Math.max(320, Math.floor(width)),
    })
  }

  onPointerMove(stage) {
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const eventTime = stage.getPointerPosition()?._timestamp ?? window.performance.now()
    this.updatePointer(pointer, eventTime)
    this.set('hoverCursor', this.pointInHoverOverlay(pointer))
    const scrollButtonIntent = this.scrollButtonIntentAt(pointer)

    if (this.pointInDrawerChrome(pointer) || scrollButtonIntent.direction) {
      this.clearHoverCandidate()
    } else {
      this.schedulePointerHover(pointer)
    }

    if (this.value.drawerOpen) {
      if (this.pointerInScrollZone(pointer) && !this.value.drawerPinned) {
        this.closeDrawer()
      } else {
        this.set('edgeIntent', { direction: 0, strength: 0 })
        return
      }
    }

    if (!this.value.drawerOpen && this.pointInDrawerChrome(pointer)) {
      this.set('edgeIntent', { direction: 0, strength: 0 })
      return
    }

    if (scrollButtonIntent.direction) {
      this.set('edgeIntent', scrollButtonIntent)
      return
    }

    const { height } = this.value.stageSize
    const { maxRow } = this.metrics
    const bottomDistance = height - pointer.y
    const topDistance = pointer.y

    if (bottomDistance < EDGE_ZONE && this.value.scroll.row < maxRow) {
      this.clearHoverCandidate()
      this.set('edgeIntent', {
        direction: 1,
        strength: 1 - bottomDistance / EDGE_ZONE,
      })
      return
    }

    if (
      topDistance < EDGE_ZONE &&
      (this.value.scroll.row > 0 || this.value.scroll.offset > 0)
    ) {
      this.clearHoverCandidate()
      this.set('edgeIntent', {
        direction: -1,
        strength: 1 - topDistance / EDGE_ZONE,
      })
      return
    }

    this.set('edgeIntent', { direction: 0, strength: 0 })
  }

  onWheel(event) {
    const deltaY = event.evt?.deltaY ?? event.deltaY ?? 0
    if (!deltaY) return

    event.cancelBubble = true
    event.evt?.preventDefault()

    if (this.value.hoverOverlay) this.closeHoverOverlay()
    if (this.value.drawerOpen && !this.value.drawerPinned) this.closeDrawer()
    if (this.value.drawerOpen && this.value.drawerPinned) return

    this.clearHoverCandidate()
    const direction = Math.sign(deltaY)
    const strength = Math.min(1, Math.abs(deltaY) / 140)
    const { maxRow, visualRowHeight } = this.metrics

    this.mutate((draft) => {
      draft.edgeIntent = { direction, strength }
      draft.scroll = advanceScroll(
        draft.scroll,
        deltaY * WHEEL_SPEED,
        visualRowHeight,
        maxRow,
      )
    })
  }

  onPointerClick(stage) {
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    if (this.pointInDrawerChrome(pointer)) {
      if (!this.value.drawerOpen) this.openDrawer()
      return
    }

    if (this.value.hoverOverlay) {
      if (this.pointInHoverOverlay(pointer) || this.pointInHoverSourceCard(pointer)) {
        this.closeHoverOverlay()
      }
      return
    }

    const candidate = this.cardCandidateAt(pointer)
    if (!candidate) return

    this.clearHoverCandidate()
    this.hoverCandidate = candidate
    this.showHoverOverlay()
  }

  onCardDragStart(card, origin) {
    this.clearDrawerCloseTimer()
    this.clearHoverCandidate()
    this.hoverSuppressed = true
    this.set('dragOverlay', {
      card,
      height: origin?.height ?? CARD_HEIGHT,
      opacity: 1,
      x: origin?.x ?? 0,
      y: origin?.y ?? 0,
    })
    this.autoOpenDrawer()
    this.set('edgeIntent', { direction: 0, strength: 0 })
    this.draggingCard = card
  }

  onCardDragMove(node) {
    const overlay = this.value.dragOverlay
    if (!overlay) return

    const stage = node.getStage()
    const pointer = stage?.getPointerPosition()

    this.set('dragOverlay', {
      ...overlay,
      x: node.x(),
      y: node.y(),
    })

    this.set('dragOverDrawer', Boolean(pointer && this.pointInDrawer(pointer)))
  }

  onCardDragEnd(stage, card) {
    const pointer = stage.getPointerPosition()
    const droppedInDrawer = pointer && this.pointInDrawer(pointer)

    this.draggingCard = null
    this.set('dragOverlay', null)
    this.set('dragOverDrawer', false)

    if (droppedInDrawer) {
      this.addDrawerCard(card)
      this.set('hoverOverlay', null)
      this.scheduleDrawerClose()
      return
    }

    if (!this.value.drawerCards.length) {
      this.set('drawerOpen', false)
    }
  }

  onDrawerCardDragEnd(stage, card) {
    const pointer = stage.getPointerPosition()
    if (!pointer || !this.pointInDrawer(pointer)) {
      this.removeDrawerCard(card)
    }
  }

  closeDrawer() {
    this.clearDrawerCloseTimer()
    this.mutate((draft) => {
      draft.drawerOpen = false
      draft.drawerPinned = false
    })
  }

  openDrawer() {
    this.clearDrawerCloseTimer()
    this.mutate((draft) => {
      draft.drawerOpen = true
      draft.drawerPinned = true
      draft.edgeIntent = { direction: 0, strength: 0 }
    })
  }

  autoOpenDrawer() {
    this.clearDrawerCloseTimer()
    this.mutate((draft) => {
      draft.drawerOpen = true
      if (!draft.drawerPinned) draft.drawerPinned = false
      draft.edgeIntent = { direction: 0, strength: 0 }
    })
  }

  onPointerLeave() {
    this.clearHoverCandidate()
    this.hoverSuppressed = false
    this.set('hoverCursor', false)
    this.set('edgeIntent', { direction: 0, strength: 0 })
  }

  get metrics() {
    const { cards, compression, stageSize } = this.value
    const columns = Math.max(1, Math.floor((stageSize.width + GAP) / (CARD_WIDTH + GAP)))
    const logicalRowHeight = CARD_HEIGHT + GAP
    const visualCardHeight = CARD_HEIGHT - compression * (CARD_HEIGHT * (1 - COMPRESSED_SCALE))
    const visualRowHeight = visualCardHeight + GAP
    const sourceRows = Math.max(1, Math.ceil(cards.length / columns))
    const virtualRows = sourceRows * 40
    const maxRow = Math.max(0, virtualRows - Math.ceil(stageSize.height / logicalRowHeight) - 1)
    const visibleRows = Math.ceil(stageSize.height / (CARD_HEIGHT * COMPRESSED_SCALE + GAP)) + 3

    return {
      columns,
      logicalRowHeight,
      maxRow,
      sourceRows,
      virtualRows,
      visibleRows,
      visualCardHeight,
      visualRowHeight,
    }
  }

  get cells() {
    const { cards, scroll } = this.value
    const { columns, sourceRows, visibleRows, visualRowHeight } = this.metrics
    const visualOffsetY = Math.min(scroll.offset, visualRowHeight)
    const cells = []

    for (let row = 0; row < visibleRows; row += 1) {
      const virtualRow = scroll.row + row
      const sourceRow = virtualRow % sourceRows
      for (let column = 0; column < columns; column += 1) {
        const cardIndex = (sourceRow * columns + column) % cards.length
        cells.push({
          card: cards[cardIndex],
          key: `${virtualRow}-${column}`,
          x: column * (CARD_WIDTH + GAP),
          y: row * visualRowHeight - visualOffsetY,
        })
      }
    }

    return cells
  }

  get gridTilt() {
    if (this.value.drawerOpen) return 0

    const { direction, strength } = this.value.edgeIntent
    return direction * strength * -MAX_SCROLL_TILT_DEGREES
  }

  tick = (time) => {
    if (!this.lastTick) this.lastTick = time
    const delta = (time - this.lastTick) / 1000
    this.lastTick = time

    const { direction, strength } = this.value.drawerOpen
      ? { direction: 0, strength: 0 }
      : this.value.edgeIntent
    const targetCompression = direction !== 0 && strength > 0 ? 1 : 0
    const easing = Math.min(1, delta * 7)

    this.mutate((draft) => {
      draft.compression += (targetCompression - draft.compression) * easing
    })

    if (direction !== 0 && strength > 0) {
      if (this.value.hoverOverlay) this.closeHoverOverlay()
      this.clearHoverCandidate()
      const { maxRow, visualRowHeight } = this.metrics
      this.set(
        'scroll',
        advanceScroll(
          this.value.scroll,
          direction * strength * MAX_SPEED * delta,
          visualRowHeight,
          maxRow,
        ),
      )
    }

    this.armStillHover()
    this.animationFrame = window.requestAnimationFrame(this.tick)
  }

  fadeHoverOverlay(time, direction) {
    const overlay = this.value.hoverOverlay
    if (!overlay) return

    const age = time - overlay.shownAt
    const shouldFade =
      age >= MIN_OVERLAY_TIME &&
      (direction !== 0 || this.pointer.speed > STILL_SPEED)

    if (!shouldFade) return

    const opacity = Math.max(0, overlay.opacity - 0.05)

    if (opacity <= 0) {
      this.clearHoverCandidate()
      this.set('hoverOverlay', null)
      return
    }

    this.set('hoverOverlay', { ...overlay, opacity })
  }

  updatePointer(pointer, time) {
    const elapsed = Math.max(1, time - this.pointer.time) / 1000
    const distance = Math.hypot(pointer.x - this.pointer.x, pointer.y - this.pointer.y)
    this.pointer = {
      speed: distance / elapsed,
      time,
      x: pointer.x,
      y: pointer.y,
    }
  }

  schedulePointerHover(pointer) {
    if (this.hoverSuppressed || this.value.hoverOverlay || this.value.drawerOpen) return

    if (this.value.edgeIntent.direction !== 0 || this.value.compression > 0.03) {
      this.clearHoverCandidate()
      return
    }

    const candidate = this.cardCandidateAt(pointer)

    if (!candidate) {
      this.clearHoverCandidate()
      return
    }

    if (this.hoverCandidate?.key === candidate.key) return

    this.clearHoverCandidate()
    this.hoverCandidate = candidate
    this.hoverTimer = window.setTimeout(() => this.showHoverOverlay(), HOVER_DELAY)
  }

  armStillHover() {
    if (
      this.hoverTimer ||
      this.hoverCandidate ||
      this.hoverSuppressed ||
      this.value.hoverOverlay ||
      this.value.drawerOpen ||
      this.value.edgeIntent.direction !== 0 ||
      this.value.compression > 0.03 ||
      this.pointer.speed > STILL_SPEED
    ) {
      return
    }

    this.schedulePointerHover(this.pointer)
  }

  showHoverOverlay() {
    if (!this.hoverCandidate) return

    const { card, x, y } = this.hoverCandidate
    this.pointer = { ...this.pointer, speed: 0 }
    const { width } = this.value.stageSize
    const image = this.imageFor(card)
    const imageRatio = image ? image.height / image.width : 1.45
    const overlayCardHeight = LABEL_HEIGHT + CARD_WIDTH * imageRatio
    const overlayWidth = CARD_WIDTH * OVERLAY_SCALE
    const nextX = clamp(x + CARD_WIDTH / 2 - overlayWidth / 2, 8, Math.max(8, width - overlayWidth - 8))
    const nextY = Math.max(8, y - OVERLAY_LIFT)

    this.set('hoverOverlay', {
      card,
      height: overlayCardHeight,
      opacity: 1,
      shownAt: this.pointer.time + HOVER_DELAY,
      x: nextX,
      y: nextY,
    })
    this.autoOpenDrawer()
  }

  clearHoverCandidate() {
    this.hoverCandidate = null
    if (this.hoverTimer) {
      window.clearTimeout(this.hoverTimer)
      this.hoverTimer = 0
    }
  }

  closeHoverOverlay() {
    this.clearHoverCandidate()
    this.hoverSuppressed = true
    this.set('dragOverlay', null)
    this.set('hoverOverlay', null)
    this.scheduleDrawerClose()
  }

  cardCandidateAt(pointer) {
    if (this.pointInDrawerChrome(pointer)) return null

    const { columns, sourceRows, visibleRows, visualRowHeight } = this.metrics
    const visualOffsetY = Math.min(this.value.scroll.offset, visualRowHeight)
    const column = Math.floor(pointer.x / (CARD_WIDTH + GAP))
    const row = Math.floor((pointer.y + visualOffsetY) / visualRowHeight)

    if (column < 0 || column >= columns || row < 0 || row >= visibleRows) {
      return null
    }

    const virtualRow = this.value.scroll.row + row
    const sourceRow = virtualRow % sourceRows
    const cardIndex = (sourceRow * columns + column) % this.value.cards.length
    const card = this.value.cards[cardIndex]
    const x = column * (CARD_WIDTH + GAP)
    const y = row * visualRowHeight - visualOffsetY

    return {
      card,
      key: `${virtualRow}-${column}`,
      x,
      y,
    }
  }

  pointInHoverOverlay(pointer) {
    const overlay = this.value.hoverOverlay
    if (!overlay) return false

    const width = CARD_WIDTH * OVERLAY_SCALE
    const height = overlay.height * OVERLAY_SCALE

    return (
      pointer.x >= overlay.x &&
      pointer.x <= overlay.x + width &&
      pointer.y >= overlay.y &&
      pointer.y <= overlay.y + height
    )
  }

  pointInHoverSourceCard(pointer) {
    const overlay = this.value.hoverOverlay
    if (!overlay) return false

    const candidate = this.cardCandidateAt(pointer)
    return candidate?.card.id === overlay.card.id
  }

  pointInDrawer(pointer) {
    return pointer.x >= this.value.stageSize.width - DRAWER_WIDTH
  }

  pointInDrawerChrome(pointer) {
    return pointer.x >= this.value.stageSize.width - DRAWER_WIDTH - 40
  }

  pointerInScrollZone(pointer) {
    const { height } = this.value.stageSize
    const { maxRow } = this.metrics
    const bottomDistance = height - pointer.y
    const topDistance = pointer.y

    return (
      (bottomDistance < EDGE_ZONE && this.value.scroll.row < maxRow) ||
      (topDistance < EDGE_ZONE &&
        (this.value.scroll.row > 0 || this.value.scroll.offset > 0))
    )
  }

  scrollButtonIntentAt(pointer) {
    const { height, width } = this.value.stageSize
    const { maxRow } = this.metrics
    const topCenter = { x: width / 2, y: SCROLL_BUTTON_TOP_Y }
    const bottomCenter = { x: width / 2, y: height - SCROLL_BUTTON_BOTTOM_OFFSET }
    const topDistance = Math.hypot(pointer.x - topCenter.x, pointer.y - topCenter.y)
    const bottomDistance = Math.hypot(pointer.x - bottomCenter.x, pointer.y - bottomCenter.y)

    if (
      topDistance <= SCROLL_BUTTON_RADIUS &&
      (this.value.scroll.row > 0 || this.value.scroll.offset > 0)
    ) {
      return {
        direction: -1,
        strength: clamp(1 - topDistance / SCROLL_BUTTON_RADIUS, 0.25, 1),
      }
    }

    if (bottomDistance <= SCROLL_BUTTON_RADIUS && this.value.scroll.row < maxRow) {
      return {
        direction: 1,
        strength: clamp(1 - bottomDistance / SCROLL_BUTTON_RADIUS, 0.25, 1),
      }
    }

    return { direction: 0, strength: 0 }
  }

  addDrawerCard(card) {
    this.clearDrawerCloseTimer()
    this.mutate((draft) => {
      const exists = draft.drawerCards.some((drawerCard) => drawerCard.id === card.id)
      if (!exists) draft.drawerCards.push(card)
      draft.drawerOpen = true
    })
  }

  removeDrawerCard(card) {
    this.mutate((draft) => {
      draft.drawerCards = draft.drawerCards.filter((drawerCard) => drawerCard.id !== card.id)
      draft.drawerOpen = draft.drawerPinned || draft.drawerCards.length > 0
    })
  }

  scheduleDrawerClose() {
    if (this.value.drawerPinned) return
    this.clearDrawerCloseTimer()
    this.drawerCloseTimer = window.setTimeout(() => {
      this.set('drawerOpen', false)
      this.drawerCloseTimer = 0
    }, DRAWER_CLOSE_DELAY)
  }

  clearDrawerCloseTimer() {
    if (this.drawerCloseTimer) {
      window.clearTimeout(this.drawerCloseTimer)
      this.drawerCloseTimer = 0
    }
  }

  get imageResources() {
    if (!this.$res.has('images')) this.$res.set('images', new Map())
    return this.$res.get('images')
  }

  get loadingImageResources() {
    if (!this.$res.has('loadingImages')) this.$res.set('loadingImages', new Map())
    return this.$res.get('loadingImages')
  }

  loadImage(src) {
    const images = this.imageResources
    const loadingImages = this.loadingImageResources
    if (!src || images.has(src) || loadingImages.has(src)) return

    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    loadingImages.set(src, image)

    image.onload = () => {
      images.set(src, image)
      loadingImages.delete(src)
      image.onload = null
      image.onerror = null
      this.mutate((draft) => {
        draft.resourceVersion += 1
      })
    }

    image.onerror = () => {
      image.onload = null
      image.onerror = null
      loadingImages.delete(src)
    }

    image.src = src
  }

  releaseImageResources() {
    const loadingImages = this.$res.get('loadingImages')
    if (loadingImages) {
      for (const image of loadingImages.values()) {
        image.onload = null
        image.onerror = null
      }
    }

    this.$res.clear()
  }
}

function advanceScroll(current, delta, rowHeight, maxRow) {
  let row = current.row
  let offset = current.offset + delta

  while (offset >= rowHeight && row < maxRow) {
    offset -= rowHeight
    row += 1
  }

  while (offset < 0 && row > 0) {
    offset += rowHeight
    row -= 1
  }

  if (row <= 0 && offset < 0) {
    return { row: 0, offset: 0 }
  }

  if (row >= maxRow && offset > rowHeight) {
    return { row: maxRow, offset: rowHeight }
  }

  return { row, offset: clamp(offset, 0, rowHeight) }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}
