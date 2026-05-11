import { Layer, Rect, Stage } from 'react-konva'
import CardTile from './CardTile'
import HoverOverlay from './HoverOverlay'
import ScrollIndicator from './ScrollIndicator'

export default function CardGridStage({ ctrl, grid }) {
  const { height, width } = grid.stageSize
  const metrics = ctrl.metrics
  const cells = ctrl.cells
  const tiltStyle = { '--grid-tilt': `${ctrl.gridTilt}deg` }

  return (
    <div className="konva-tilt-shell" style={tiltStyle}>
      <Stage
        height={height}
        onMouseLeave={ctrl.$.onPointerLeave}
        onMouseMove={(event) => ctrl.onPointerMove(event.target.getStage())}
        width={width}
      >
        <Layer>
          <Rect key="background" x={0} y={0} width={width} height={height} fill="#eef2f6" />
          {cells.map(({ card, key, x, y }) => (
            <CardTile
              card={card}
              height={metrics.visualCardHeight}
              image={ctrl.imageFor(card)}
              key={`cell-${key}`}
              x={x}
              y={y}
            />
          ))}
          <ScrollIndicator
            direction={grid.edgeIntent.direction}
            height={height}
            key="scroll-indicator"
            strength={grid.edgeIntent.strength}
            width={width}
          />
          {grid.hoverOverlay && (
            <HoverOverlay
              image={ctrl.imageFor(grid.hoverOverlay.card)}
              key="hover-overlay"
              overlay={grid.hoverOverlay}
            />
          )}
        </Layer>
      </Stage>
    </div>
  )
}
