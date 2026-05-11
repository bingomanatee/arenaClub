import { Circle, Group, Line } from 'react-konva'
import {
  SCROLL_BUTTON_BOTTOM_OFFSET,
  SCROLL_BUTTON_RADIUS,
  SCROLL_BUTTON_TOP_Y,
} from '../GridCtrl'

export default function ScrollIndicator({ direction, height, strength, width }) {
  const activeOpacity = direction ? Math.min(0.9, 0.35 + strength * 0.55) : 0.35

  return (
    <Group>
      <ScrollTriangle
        active={direction < 0}
        centerX={width / 2}
        centerY={SCROLL_BUTTON_TOP_Y}
        direction={-1}
        opacity={direction < 0 ? activeOpacity : 0.35}
      />
      <ScrollTriangle
        active={direction > 0}
        centerX={width / 2}
        centerY={height - SCROLL_BUTTON_BOTTOM_OFFSET}
        direction={1}
        opacity={direction > 0 ? activeOpacity : 0.35}
      />
    </Group>
  )
}

function ScrollTriangle({ active, centerX, centerY, direction, opacity }) {
  const triangleHeight = 34
  const halfWidth = 26
  const setPointerCursor = (event) => {
    event.target.getStage().container().style.cursor = 'pointer'
  }
  const clearPointerCursor = (event) => {
    event.target.getStage().container().style.cursor = ''
  }
  const points =
    direction > 0
      ? [
          centerX - halfWidth,
          centerY - triangleHeight / 2,
          centerX + halfWidth,
          centerY - triangleHeight / 2,
          centerX,
          centerY + triangleHeight / 2,
        ]
      : [
          centerX - halfWidth,
          centerY + triangleHeight / 2,
          centerX + halfWidth,
          centerY + triangleHeight / 2,
          centerX,
          centerY - triangleHeight / 2,
        ]

  return (
    <Group
      opacity={opacity}
      onMouseEnter={setPointerCursor}
      onMouseLeave={clearPointerCursor}
    >
      <Circle
        x={centerX}
        y={centerY}
        radius={SCROLL_BUTTON_RADIUS}
        fill="#b6ff3b"
        opacity={0.01}
      />
      <Line
        points={points}
        closed
        fill="#b6ff3b"
        shadowBlur={active ? 16 : 10}
        shadowColor="#101827"
        shadowOpacity={active ? 0.28 : 0.16}
      />
    </Group>
  )
}
