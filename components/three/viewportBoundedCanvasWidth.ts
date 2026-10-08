/**
 * CSS width for a fixed-aspect canvas that should shrink on short viewports.
 *
 * Available height = `100svh` minus the navbar minus `reservedBelowNavbar`
 * (page padding, hero title, etc.). The canvas is allowed to be as tall as
 * `available / fractionThatMustFit`, and width follows from the aspect ratio.
 * `min(100%, …)` means the cap only kicks in once the viewport is short enough
 * that the full-width canvas would break the rule; on tall viewports the
 * canvas stays at 100% of its column.
 *
 * @param aspectWidth  Canvas aspect numerator (must match the CSS `aspect-ratio`).
 * @param aspectHeight Canvas aspect denominator (must match the CSS `aspect-ratio`).
 * @param reservedBelowNavbar CSS length for content stacked above the canvas.
 * @param fractionThatMustFit Share of the canvas height (0–1] that must fit in
 *   the available height. `1` keeps the whole canvas above the fold; smaller
 *   values let it hang below the fold and only shrink on much shorter viewports.
 */
export function viewportBoundedCanvasWidth(
  aspectWidth: number,
  aspectHeight: number,
  reservedBelowNavbar = '12rem',
  fractionThatMustFit = 1
): string {
  const effectiveAspectHeight = aspectHeight * fractionThatMustFit
  return `min(100%, calc((100svh - var(--navbar-height, 4.15rem) - ${reservedBelowNavbar}) * ${aspectWidth} / ${effectiveAspectHeight}))`
}
