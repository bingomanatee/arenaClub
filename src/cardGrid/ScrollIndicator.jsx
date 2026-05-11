import { Group, Line } from 'react-konva'

export default function ScrollIndicator({ direction, height, strength, width }) {
  if (!direction) return null

  const overlayOpacity = Math.min(0.85, strength * 0.85)
  const triangleY = direction > 0 ? height - 52 : 30
  const points =
    direction > 0
      ? [width / 2 - 26, triangleY, width / 2 + 26, triangleY, width / 2, triangleY + 34]
      : [width / 2 - 26, triangleY + 34, width / 2 + 26, triangleY + 34, width / 2, triangleY]

  return (
    <Group opacity={overlayOpacity}>
      <Line
        points={points}
        closed
        fill="#b6ff3b"
        shadowBlur={12}
        shadowColor="#101827"
        shadowOpacity={0.22}
      />
    </Group>
  )
}
