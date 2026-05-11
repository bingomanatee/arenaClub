import { Layer, Rect, Stage } from 'react-konva'
import { STAGE_OVERSCAN_Y } from '../GridCtrl'
import CardDrawer from './CardDrawer'
import CardTile from './CardTile'
import HoverOverlay from './HoverOverlay'
import ScrollIndicator from './ScrollIndicator'

export default function CardGridStage({ ctrl, grid }) {
  const { height, width } = grid.stageSize
  const stageHeight = height + STAGE_OVERSCAN_Y
  const metrics = ctrl.metrics
  const cells = ctrl.cells
  const tiltStyle = { '--grid-tilt': `${ctrl.gridTilt}deg` }

  return (
    <div className="konva-tilt-shell" style={tiltStyle}>
      <Stage
        height={stageHeight}
        onClick={(event) => ctrl.onPointerClick(event.target.getStage())}
        onMouseLeave={ctrl.$.onPointerLeave}
        onMouseMove={(event) => ctrl.onPointerMove(event.target.getStage())}
        onWheel={(event) => ctrl.onWheel(event)}
        width={width}
      >
        <Layer>
          <Rect key="background" x={0} y={0} width={width} height={stageHeight} fill="#eef2f6" />
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
              ctrl={ctrl}
              dragging={Boolean(grid.dragOverlay)}
              image={ctrl.imageFor(grid.hoverOverlay.card)}
              key="hover-overlay"
              overlay={grid.hoverOverlay}
            />
          )}
          <CardDrawer
            cards={grid.drawerCards}
            ctrl={ctrl}
            dragging={Boolean(grid.dragOverlay)}
            dragOver={grid.dragOverDrawer}
            height={stageHeight}
            open={grid.drawerOpen}
            width={width}
          />
          {grid.dragOverlay && (
            <HoverOverlay
              ctrl={ctrl}
              draggable={false}
              image={ctrl.imageFor(grid.dragOverlay.card)}
              key="drag-overlay"
              overlay={grid.dragOverlay}
            />
          )}
        </Layer>
      </Stage>
    </div>
  )
}
