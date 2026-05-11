import { Circle, Group, Rect } from 'react-konva'
import { CARD_HEIGHT, CARD_WIDTH, LABEL_HEIGHT, OVERLAY_SCALE } from '../GridCtrl'
import CardTile from './CardTile'

export default function HoverOverlay({
  ctrl,
  draggable = true,
  dragging = false,
  image,
  overlay,
}) {
  const imageHeight = image ? (image.height / image.width) * CARD_WIDTH : CARD_HEIGHT - LABEL_HEIGHT
  const cardHeight = LABEL_HEIGHT + imageHeight

  return (
    <Group
      draggable={draggable}
      onDragEnd={(event) => {
        if (!draggable) return
        ctrl.onCardDragEnd(event.target.getStage(), overlay.card)
        event.target.position({ x: overlay.x, y: overlay.y })
      }}
      onDragMove={(event) => {
        if (draggable) ctrl.onCardDragMove(event.target)
      }}
      onDragStart={() => {
        if (draggable) ctrl.onCardDragStart(overlay.card, overlay)
      }}
      opacity={dragging ? 0.01 : overlay.opacity}
      x={overlay.x}
      y={overlay.y}
      scaleX={OVERLAY_SCALE}
      scaleY={OVERLAY_SCALE}
    >
      <Rect
        key="overlay-background"
        x={0}
        y={0}
        width={CARD_WIDTH}
        height={cardHeight}
        cornerRadius={8 / OVERLAY_SCALE}
        fill="#ffffff"
        stroke="#2f6b20"
        strokeWidth={2 / OVERLAY_SCALE}
        shadowBlur={48}
        shadowOffsetX={0}
        shadowOffsetY={18}
        shadowColor="#101827"
        shadowOpacity={0.55}
      />
      <CardTile
        key="overlay-card"
        card={overlay.card}
        height={cardHeight}
        image={image}
        imageBrightness={0.15}
        imageYOffset={0}
        showFooterPrice
      />
      {draggable && (
        <Group key="drag-domino" x={7} y={5} opacity={0.95}>
          {[0, 1].map((column) => (
            [0, 1, 2].map((row) => (
              <Circle
                fill="#8a8a8a"
                key={`${column}-${row}`}
                radius={1.6}
                x={column * 5}
                y={row * 5}
              />
            ))
          ))}
        </Group>
      )}
    </Group>
  )
}
