import {
  SCROLL_BUTTON_BOTTOM_OFFSET,
  SCROLL_BUTTON_TOP_Y,
} from '../GridCtrl'

export default function ScrollControls({ ctrl, direction }) {
  return (
    <div
      className="scroll-controls"
      onWheel={(event) => ctrl.onDomWheel(event)}
    >
      <ScrollButton
        active={direction < 0}
        ctrl={ctrl}
        direction={-1}
        style={{ top: SCROLL_BUTTON_TOP_Y }}
      />
      <ScrollButton
        active={direction > 0}
        ctrl={ctrl}
        direction={1}
        style={{ top: `calc(100% - ${SCROLL_BUTTON_BOTTOM_OFFSET}px)` }}
      />
    </div>
  )
}

function ScrollButton({ active, ctrl, direction, style }) {
  const startScroll = () => ctrl.setScrollButtonIntent(direction)
  const stopScroll = () => ctrl.clearScrollButtonIntent(direction)

  return (
    <button
      aria-label={direction > 0 ? 'Scroll down' : 'Scroll up'}
      className={active ? 'scroll-control is-active' : 'scroll-control'}
      onFocus={startScroll}
      onMouseEnter={startScroll}
      onMouseLeave={stopScroll}
      onMouseMove={startScroll}
      onPointerEnter={startScroll}
      onPointerLeave={stopScroll}
      onBlur={stopScroll}
      style={style}
      type="button"
    >
      <span className={direction > 0 ? 'scroll-triangle is-down' : 'scroll-triangle is-up'} />
    </button>
  )
}
