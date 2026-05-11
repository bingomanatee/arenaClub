import { Group, Rect } from 'react-konva'
import { CARD_HEIGHT, CARD_WIDTH, LABEL_HEIGHT, OVERLAY_SCALE } from '../GridCtrl'
import CardTile from './CardTile'

export default function HoverOverlay({ image, overlay }) {
  const imageHeight = image ? (image.height / image.width) * CARD_WIDTH : CARD_HEIGHT - LABEL_HEIGHT
  const cardHeight = LABEL_HEIGHT + imageHeight

  return (
    <Group
      listening={false}
      opacity={overlay.opacity}
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
        showFooterPrice
      />
    </Group>
  )
}
