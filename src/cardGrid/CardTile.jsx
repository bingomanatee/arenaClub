import { useState } from 'react'
import Konva from 'konva'
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva'
import { CARD_WIDTH, IMAGE_Y_OFFSET, LABEL_HEIGHT } from '../GridCtrl'

const HEADER_FILL = '#2f6b20'
const HEADER_FILL_DESATURATED = '#4d5c49'
const LIME = '#b6ff3b'

export default function CardTile({
  card,
  height,
  image,
  imageBrightness = 0,
  imageYOffset = IMAGE_Y_OFFSET,
  onDragEnd,
  onDragStart,
  showFooterPrice = false,
  x = 0,
  y = 0,
}) {
  const [isHovered, setIsHovered] = useState(false)
  const imageHeight = Math.max(1, height - LABEL_HEIGHT)
  const naturalImageHeight = image ? (image.height / image.width) * CARD_WIDTH : imageHeight
  const titleWidth = showFooterPrice ? CARD_WIDTH - 10 : CARD_WIDTH - 62
  const titleX = showFooterPrice ? 5 : 5
  const labelFill = showFooterPrice ? '#050505' : isHovered ? HEADER_FILL : HEADER_FILL_DESATURATED
  const labelTextFill = showFooterPrice || isHovered ? LIME : '#ffffff'

  return (
    <Group
      draggable={Boolean(onDragEnd || onDragStart)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragStart={onDragStart}
      x={x}
      y={y}
    >
      <Rect key="label-background" x={0} y={0} width={CARD_WIDTH} height={LABEL_HEIGHT} fill={labelFill} />
      <Text
        key="player"
        x={titleX}
        y={5}
        width={titleWidth}
        height={LABEL_HEIGHT - 6}
        text={card.player}
        fill={labelTextFill}
        fontSize={10}
        fontStyle="bold"
        align={showFooterPrice ? 'center' : 'left'}
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
          fill={labelTextFill}
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
            brightness={imageBrightness}
            filters={imageBrightness ? [Konva.Filters.Brighten] : undefined}
            key="image"
            image={image}
            ref={(node) => {
              if (node && imageBrightness) node.cache()
            }}
            x={0}
            y={imageYOffset}
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
          x={7}
          y={Math.max(LABEL_HEIGHT + 4, height - 22)}
          width={74}
          height={16}
          text={card.price ?? ''}
          fill="#b6ff3b"
          fontSize={12}
          fontStyle="bold"
          align="left"
          shadowColor="#101827"
          shadowBlur={3}
          shadowOpacity={0.8}
          wrap="none"
        />
      )}
    </Group>
  )
}
