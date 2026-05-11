import { useEffect, useRef } from 'react'
import { GridCtrl } from '../GridCtrl'
import { arenaCards } from '../data/cards'
import useForestryLocal from '../lib/useForestryLocal'
import CardGridStage from './CardGridStage'
import ScrollControls from './ScrollControls'
import text from './text.json'

export default function CardGridPage() {
  const shellRef = useRef(null)
  const [grid, ctrl] = useForestryLocal(GridCtrl.factory, arenaCards)

  useEffect(() => {
    if (!shellRef.current) return undefined

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      ctrl.setStageSize(width, height)
    })

    observer.observe(shellRef.current)
    return () => observer.disconnect()
  }, [ctrl])

  useEffect(() => {
    ctrl.connect()
    return () => ctrl.disconnect()
  }, [ctrl])

  return (
    <main className="app-shell">
      <header className="toolbar">
        <div className="toolbar-left">
          <img className="arena-logo" src="/arena-club-logo.svg" alt={text.logoAlt} />
          <nav className="arena-nav" aria-label="Arena Club sections">
            {text.nav.map((item) => (
              <a
                className={item === 'Marketplace' ? 'arena-nav-link is-active' : 'arena-nav-link'}
                href="/"
                key={item}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>

        <div className="toolbar-right">
          <label className="perspective-toggle">
            <input
              checked={grid.perspectiveEnabled}
              onChange={(event) => ctrl.setPerspectiveEnabled(event.target.checked)}
              type="checkbox"
            />
            <span>Perspective</span>
          </label>
          <label className="market-search">
            <span>{text.searchPlaceholder}</span>
            <input aria-label={text.searchPlaceholder} placeholder={text.searchPlaceholder} />
          </label>
          <button className="login-button" type="button">{text.login}</button>
          <button className="signup-button" type="button">{text.signup}</button>
        </div>
      </header>

      <div className="market-strip">
        <strong>{text.marketplaceTitle}</strong>
        <span>{text.marketplaceSubtitle}</span>
      </div>

      <section
        ref={shellRef}
        className={
          grid.dragOverlay
            ? 'grid-stage is-grabbing'
            : grid.hoverCursor
              ? 'grid-stage is-hover-draggable'
              : 'grid-stage'
        }
        aria-label={text.gridAriaLabel}
        onWheel={(event) => ctrl.onDomWheel(event)}
      >
        <CardGridStage ctrl={ctrl} grid={grid} />
        <ScrollControls ctrl={ctrl} direction={grid.edgeIntent.direction} />
      </section>
    </main>
  )
}
