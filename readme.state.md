# State Design Notes

This prototype keeps the interactive grid state in `GridCtrl`, a Forestry `Forest`
instance. The React/Konva components are intentionally thin: they render the
current Forestry value and forward pointer, drag, and click events back to the
controller.

## Primary State Owner

`src/GridCtrl.js` owns the app state for the card-grid experience.

The serializable Forestry value contains state that directly affects rendering:

- `cards`: the marketplace card dataset used by the virtual grid.
- `stageSize`: the current Konva stage size.
- `scroll`: the virtual scroll position, split into `row` and pixel `offset`.
- `compression`: the current row-height compression animation value.
- `edgeIntent`: pointer-driven scroll intent, `{ direction, strength }`.
- `hoverOverlay`: the currently open large card overlay.
- `hoverCursor`: whether the pointer is over the hover overlay.
- `drawerOpen`: whether the drawer panel is expanded.
- `drawerPinned`: whether the drawer was opened manually and should stay open
  until a manual close.
- `drawerCards`: cards that have been dropped into the drawer.
- `dragOverlay`: a temporary visual copy used while dragging the hover card.
- `dragOverDrawer`: whether the current drag is over the drawer drop target.
- `resourceVersion`: a render invalidation counter for async image loads.

Non-serializable or short-lived runtime state is kept in class properties or
`$res`, not inside the Forestry value:

- `animationFrame`: active `requestAnimationFrame` handle.
- `hoverTimer`: delayed hover-open timer.
- `drawerCloseTimer`: delayed drawer-collapse timer.
- `lastTick`: last animation frame timestamp.
- `pointer`: last pointer position, timestamp, and speed.
- `hoverCandidate`: pending card candidate for delayed hover.
- `hoverSuppressed`: blocks immediate hover reopen after an intentional close.
- `draggingCard`: imperative drag bookkeeping.
- `$res.images`: loaded `window.Image` instances keyed by URL.
- `$res.loadingImages`: in-flight image loads keyed by URL.

This follows the current Forestry convention: serializable UI state lives in the
Forest value, while timers, browser objects, image resources, and other
non-serializable content live as class properties or in `$res`.

## Derived State

Several values are derived instead of stored:

- `metrics`: columns, row heights, visible rows, source row count, virtual row
  count, and max scroll row.
- `cells`: the currently visible virtual-grid cells.
- `gridTilt`: CSS tilt angle derived from `edgeIntent`, unless the drawer is open.

These are computed getters because they depend on multiple state fields and
would otherwise need constant synchronization.

## Intentional Overlap

Some state overlaps by design because the interaction model has competing modes.

| State | Overlap | Decision |
| --- | --- | --- |
| `edgeIntent` and `compression` | Both represent scrolling. | `edgeIntent` is input intent; `compression` is eased visual output. This keeps the row squash animation smooth even when pointer intent changes instantly. |
| `scroll` and `compression` | Both affect row placement. | `scroll` is the virtual content position; `compression` only changes visual row height during active scroll. |
| `hoverCandidate` and `hoverOverlay` | Both reference a card near the pointer. | `hoverCandidate` is a pending delayed hover target; `hoverOverlay` is the committed visible overlay. |
| `hoverSuppressed` and `hoverOverlay` | Both affect hover availability. | `hoverSuppressed` prevents a closed overlay from immediately reopening while the pointer is still on the same area. It resets when the pointer leaves the stage. |
| `hoverOverlay` and `dragOverlay` | Both can describe the same card. | The original hover card is faded almost fully out while a separate drag overlay follows the pointer. This avoids the Konva drag node disappearing behind the drawer. |
| `drawerOpen` and `drawerCards.length` | Both influence drawer rendering. | `drawerOpen` controls the expanded panel. `drawerCards.length` controls whether the collapsed purchase slice should remain visible. |
| `drawerOpen` and `drawerPinned` | Both affect whether the drawer remains visible. | `drawerOpen` is the visual expanded state. `drawerPinned` records that the user manually opened the drawer, blocking automatic close paths until the close button is used. |
| `dragOverDrawer` and `pointInDrawer(pointer)` | Both describe drop targeting. | `dragOverDrawer` is cached render state for the dotted target opacity; `pointInDrawer` is the hit-test helper used during events. |
| `stageSize.height` and `STAGE_OVERSCAN_Y` | Both affect vertical layout. | The stage is taller than the visible app area to give CSS perspective tilt enough top overscan. Drawer content compensates by shifting down by the same overscan. |

## Interaction Rules

### Hover

Hover opens in two ways:

- After the pointer is effectively still over a card for `HOVER_DELAY`.
- Immediately when the user clicks a card.

Hover does not open while:

- the pointer is over drawer chrome,
- scrolling is active,
- row compression is still easing,
- a hover is already open,
- hover has been suppressed after an intentional close.

Clicking the hover card or its source card closes the hover. Closing schedules
the drawer to collapse after `DRAWER_CLOSE_DELAY`.

### Scroll

Scroll is pointer-driven:

- Hovering over the persistent top or bottom lime triangle creates scroll intent.
- Near the bottom edge, `edgeIntent.direction` becomes `1`.
- Near the top edge, `edgeIntent.direction` becomes `-1`.
- Strength increases as the pointer gets closer to the edge.
- Mouse wheel events advance the virtual scroll directly and briefly set
  `edgeIntent` so compression and tilt can respond.

The animation loop uses `edgeIntent` to:

- advance `scroll`,
- ease `compression` toward the compressed layout,
- derive CSS perspective tilt through `gridTilt`.

If the drawer is open, scroll and tilt are disabled. Moving into a scroll zone
while the drawer is open closes the drawer first, then scrolling can proceed.

### Drawer

The drawer has two visual states:

- Expanded: full right-side drawer with title, helper/total text, saved cards,
  drop target, purchase slice, and edge-mounted close button.
- Collapsed: persistent upper-right open button, plus the purchase slice if
  saved cards exist.

The drawer opens when:

- a hover overlay opens,
- a hover drag starts,
- the collapsed open button is clicked.

Opening from hover or drag is automatic and can still collapse after the relevant
delay. Opening from the collapsed button is manual and sets `drawerPinned`, so
the drawer remains open until the edge-mounted close button is clicked.

The drawer closes when:

- the edge-mounted close button is clicked,
- scrolling starts, unless `drawerPinned` is set,
- a hover closes and the delayed collapse timer fires, unless `drawerPinned` is set,
- a card is dropped successfully and the delayed collapse timer fires, unless
  `drawerPinned` is set.

After a successful drop, the drawer remains open for `DRAWER_CLOSE_DELAY`
currently set to `1700ms`, giving a buffer over the requested 1.5-second hold.

### Drag

Only the hover card is draggable from the grid. Regular grid tiles are not.

During a hover drag:

- `dragOverlay` creates the visual card that follows the pointer.
- `drawerOpen` is forced on.
- `edgeIntent` is cleared so the grid does not scroll or tilt.
- `dragOverDrawer` controls the drop target alpha.

Cards already inside the drawer are draggable out. Dropping a drawer card
outside the drawer removes it.

## Rendering Order

`CardGridStage` renders one Konva layer in this order:

1. Background.
2. Virtual grid cells.
3. Scroll direction indicator.
4. Hover overlay.
5. Drawer.
6. Drag overlay.

The drag overlay intentionally renders after the drawer so a dragged card can
appear above the drawer while validating the drop.

## Known Tradeoffs

- The current state model favors fast UX iteration over strict finite-state
  machine modeling.
- `hoverOverlay`, `dragOverlay`, and `drawerOpen` can temporarily describe the
  same interaction from different render perspectives.
- `drawerOpen` is not equivalent to "drawer exists"; the collapsed controls can
  render even when `drawerOpen` is false.
- `fadeHoverOverlay` remains in `GridCtrl` but is not currently used by the
  active hover behavior. It should be removed or restored when the hover-close
  policy stabilizes.
- The virtual grid recycles card data for the demo. `scroll.row` is a virtual
  row index, not a direct index into the source card array.

## Refactor Direction

If this prototype grows, the next useful state cleanup would be to split the
controller into small mode reducers:

- `ScrollState`: edge intent, compression, scroll position, tilt.
- `HoverState`: candidate, suppression, overlay.
- `DrawerState`: open/collapsed, saved cards, delayed close.
- `DragState`: active drag overlay and drop target.

That would make the overlap explicit without losing the current single
controller API that the Konva components use.
