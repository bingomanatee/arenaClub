import { Group, Image as KonvaImage, Rect, Text } from 'react-konva'
import { CARD_WIDTH, LABEL_HEIGHT } from '../GridCtrl'

export default function CardTile({
  card,
  height,
  image,
  showFooterPrice = false,
  x = 0,
  y = 0,
}) {
  const imageHeight = Math.max(1, height - LABEL_HEIGHT)
  const naturalImageHeight = image ? (image.height / image.width) * CARD_WIDTH : imageHeight
  const titleWidth = showFooterPrice ? CARD_WIDTH - 10 : CARD_WIDTH - 62
  const labelFill = showFooterPrice ? '#050505' : '#2f6b20'
  const labelTextFill = showFooterPrice ? '#b6ff3b' : '#ffffff'

  return (
    <Group x={x} y={y}>
      <Rect key="label-background" x={0} y={0} width={CARD_WIDTH} height={LABEL_HEIGHT} fill={labelFill} />
      <Text
        key="player"
        x={5}
        y={5}
        width={titleWidth}
        height={LABEL_HEIGHT - 6}
        text={card.player}
        fill={labelTextFill}
        fontSize={10}
        fontStyle="bold"
        ellipsis
        wrap="none"
      />
      {!showFooterPrice && (
        <Text
          key="price"
          x={CARD_WIDTH - 58}
          y={5}
          width={53}
          height={LABEL_HEIGHT - 6}
          text={card.price ?? ''}
          fill="#ffffff"
          fontSize={10}
          fontStyle="bold"
          align="right"
          ellipsis
          wrap="none"
        />
      )}
      {image ? (
        <Group key="image-mask" x={0} y={LABEL_HEIGHT} clipX={0} clipY={0} clipWidth={CARD_WIDTH} clipHeight={imageHeight}>
          <KonvaImage
            key="image"
            image={image}
            x={0}
            y={0}
            width={CARD_WIDTH}
            height={naturalImageHeight}
          />
        </Group>
      ) : (
        <Rect
          key="placeholder"
          x={0}
          y={LABEL_HEIGHT}
          width={CARD_WIDTH}
          height={imageHeight}
          fill={card.color}
        />
      )}
      {showFooterPrice && (
        <Text
          key="footer-price"
          x={CARD_WIDTH - 72}
          y={Math.max(LABEL_HEIGHT + 4, height - 22)}
          width={66}
          height={16}
          text={card.price ?? ''}
          fill="#b6ff3b"
          fontSize={12}
          fontStyle="bold"
          align="right"
          shadowColor="#101827"
          shadowBlur={3}
          shadowOpacity={0.8}
          wrap="none"
        />
      )}
    </Group>
  )
}
