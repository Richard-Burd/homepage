/**
 * Location phrase for a description on the start rail.
 *
 * Desktop: the end-rail element sits on the inline-end side (right in LTR,
 * left in RTL). Below 800px the rails stack and that element sits under the
 * description. Each locale supplies both phrases; this only picks the one
 * that matches the current layout.
 */
export default function OrientationText({
  side,
  below,
}: {
  side: string
  below: string
}) {
  return (
    <>
      <span className="min-[800px]:hidden">{below}</span>
      <span className="hidden min-[800px]:inline">{side}</span>
    </>
  )
}
