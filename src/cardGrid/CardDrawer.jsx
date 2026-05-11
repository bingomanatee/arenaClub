import { useState } from 'react'
import { Circle, Group, Image as KonvaImage, Line, Rect, Text } from 'react-konva'
import { CARD_WIDTH, DRAWER_WIDTH, LABEL_HEIGHT, STAGE_OVERSCAN_Y } from '../GridCtrl'

const DRAWER_CARD_SCALE = 0.5
const DRAWER_PADDING = 12
const DRAWER_CARD_WIDTH = CARD_WIDTH * DRAWER_CARD_SCALE
const DRAWER_LABEL_HEIGHT = LABEL_HEIGHT * DRAWER_CARD_SCALE
const DRAWER_CARD_HEIGHT = DRAWER_CARD_WIDTH + DRAWER_LABEL_HEIGHT + 18
const DRAWER_TOGGLE_MARGIN = 12
const DRAWER_TOGGLE_RADIUS = 18
const DRAWER_TOGGLE_HIT_RADIUS = DRAWER_TOGGLE_RADIUS * 1.5
const PURCHASE_HEIGHT = 44

export default function CardDrawer({ cards, ctrl, dragging, dragOver, height, open, width }) {
  const drawerX = width - DRAWER_WIDTH
  const cardStep = DRAWER_CARD_HEIGHT + 16
  const drawerTop = STAGE_OVERSCAN_Y
  const targetY = drawerTop + 58 + cards.length * cardStep
  const drawerTotal = cards.reduce((sum, card) => sum + (card.value || 0), 0)
  const helperText = cards.length ? `Total ${formatCurrency(drawerTotal)}` : 'Drag cards here'

  if (!open) {
    return (
      <Group key="card-drawer-closed" x={drawerX} y={0}>
        <DrawerToggleButton
          ctrl={ctrl}
          direction="left"
          x={DRAWER_WIDTH - DRAWER_TOGGLE_RADIUS - DRAWER_TOGGLE_MARGIN}
          y={STAGE_OVERSCAN_Y + 42}
        />
        {cards.length > 0 && <PurchaseButton y={height - PURCHASE_HEIGHT} />}
      </Group>
    )
  }

  return (
    <Group key="card-drawer" x={drawerX} y={0}>
      <Rect
        height={height}
        opacity={0.9}
        fill="#050505"
        shadowBlur={34}
        shadowColor="#101827"
        shadowOffsetX={-18}
        shadowOpacity={0.18}
        stroke="#2f6b20"
        strokeWidth={1}
        width={DRAWER_WIDTH}
      />
      <DrawerToggleButton ctrl={ctrl} direction="right" x={0} y={drawerTop + 42} />
      <Text
        x={DRAWER_PADDING}
        y={drawerTop + 12}
        width={DRAWER_WIDTH - DRAWER_PADDING * 2}
        height={14}
        text="SAVED"
        fill="#b6ff3b"
        fontSize={11}
        fontStyle="bold"
        align="center"
      />
      <Text
        x={DRAWER_PADDING}
        y={drawerTop + 29}
        width={DRAWER_WIDTH - DRAWER_PADDING * 2}
        height={16}
        text={helperText}
        fill={cards.length ? '#808080' : '#ffffff'}
        fontSize={13}
        fontStyle="bold"
        align="center"
      />
      {dragging && (
        <Group
          key="drawer-drop-target"
          x={(DRAWER_WIDTH - DRAWER_CARD_WIDTH) / 2}
          y={targetY}
          opacity={dragOver ? 1 : 0.5}
        >
          <Rect
            width={DRAWER_CARD_WIDTH}
            height={DRAWER_CARD_HEIGHT}
            dash={[6, 5]}
            stroke="#b6ff3b"
            strokeWidth={2}
            cornerRadius={3}
          />
          <Text
            x={6}
            y={DRAWER_CARD_HEIGHT / 2 - 8}
            width={DRAWER_CARD_WIDTH - 12}
            height={16}
            text="Drop"
            fill="#b6ff3b"
            fontSize={12}
            fontStyle="bold"
            align="center"
          />
        </Group>
      )}
      {cards.map((card, index) => (
        <DrawerCard
          card={card}
          ctrl={ctrl}
          image={ctrl.imageFor(card)}
          key={card.id}
          x={(DRAWER_WIDTH - DRAWER_CARD_WIDTH) / 2}
          y={drawerTop + 58 + index * cardStep}
        />
      ))}
      {cards.length > 0 && <PurchaseButton y={height - PURCHASE_HEIGHT} />}
    </Group>
  )
}

function DrawerToggleButton({ ctrl, direction, x, y }) {
  const [isHovered, setIsHovered] = useState(false)
  const toggleDrawer = (event) => {
    event.cancelBubble = true
    event.evt?.stopPropagation()
    if (direction === 'right') {
      ctrl.closeDrawer()
    } else {
      ctrl.openDrawer()
    }
  }
  const firstChevron =
    direction === 'right' ? [-6, -7, 0, 0, -6, 7] : [6, -7, 0, 0, 6, 7]
  const secondChevron =
    direction === 'right' ? [2, -7, 8, 0, 2, 7] : [-2, -7, -8, 0, -2, 7]
  const chevronColor = isHovered ? '#ffffff' : '#b6ff3b'

  return (
    <Group
      x={x}
      y={y}
      onClick={toggleDrawer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTap={toggleDrawer}
    >
      <Circle
        x={0}
        y={0}
        radius={DRAWER_TOGGLE_HIT_RADIUS}
        fill="#050505"
        opacity={0.01}
      />
      <Circle x={0} y={0} radius={DRAWER_TOGGLE_RADIUS} fill="#050505" stroke="#2f6b20" strokeWidth={1} />
      <Line points={firstChevron} stroke={chevronColor} strokeWidth={2.2} lineCap="round" lineJoin="round" />
      <Line points={secondChevron} stroke={chevronColor} strokeWidth={2.2} lineCap="round" lineJoin="round" />
    </Group>
  )
}

function PurchaseButton({ y }) {
  return (
    <Group y={y}>
      <Rect width={DRAWER_WIDTH} height={PURCHASE_HEIGHT} fill="#b6ff3b" />
      <Text
        x={0}
        y={14}
        width={DRAWER_WIDTH}
        height={18}
        text="Purchase"
        fill="#050505"
        fontSize={14}
        fontStyle="bold"
        align="center"
      />
      <Line
        points={[
          DRAWER_WIDTH - 28,
          PURCHASE_HEIGHT / 2 - 7,
          DRAWER_WIDTH - 28,
          PURCHASE_HEIGHT / 2 + 7,
          DRAWER_WIDTH - 16,
          PURCHASE_HEIGHT / 2,
        ]}
        closed
        fill="#050505"
      />
    </Group>
  )
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

function DrawerCard({ card, ctrl, image, x, y }) {
  const naturalImageHeight = image ? (image.height / image.width) * DRAWER_CARD_WIDTH : DRAWER_CARD_WIDTH

  return (
    <Group
      draggable
      onDragEnd={(event) => {
        ctrl.onDrawerCardDragEnd(event.target.getStage(), card)
        event.target.position({ x, y })
      }}
      x={x}
      y={y}
    >
      <Rect x={0} y={0} width={DRAWER_CARD_WIDTH} height={DRAWER_LABEL_HEIGHT} fill="#2f6b20" />
      <Text
        x={4}
        y={2}
        width={DRAWER_CARD_WIDTH - 8}
        height={DRAWER_LABEL_HEIGHT - 2}
        text={card.player}
        fill="#ffffff"
        fontSize={11}
        fontStyle="bold"
        align="center"
        ellipsis
        wrap="none"
      />
      {image && (
        <Group
          x={0}
          y={DRAWER_LABEL_HEIGHT}
          clipX={0}
          clipY={0}
          clipWidth={DRAWER_CARD_WIDTH}
          clipHeight={DRAWER_CARD_WIDTH}
        >
          <KonvaImage image={image} x={0} y={0} width={DRAWER_CARD_WIDTH} height={naturalImageHeight} />
        </Group>
      )}
      {!image && (
        <Rect
          x={0}
          y={DRAWER_LABEL_HEIGHT}
          width={DRAWER_CARD_WIDTH}
          height={DRAWER_CARD_WIDTH}
          fill={card.color}
        />
      )}
      <Text
        x={0}
        y={DRAWER_LABEL_HEIGHT + DRAWER_CARD_WIDTH + 4}
        width={DRAWER_CARD_WIDTH}
        height={14}
        text={card.price ?? ''}
        fill="#b6ff3b"
        fontSize={13}
        fontStyle="bold"
        align="center"
      />
    </Group>
  )
}
