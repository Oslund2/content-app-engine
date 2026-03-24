/**
 * Divider — Visual section break.
 *
 * Config:
 * {
 *   type: "divider",
 *   variant: "diamond" | "line" | "dots"
 * }
 */

export default function Divider({ variant = 'diamond' }) {
  if (variant === 'line') {
    return <div className="my-10 h-px bg-rule" />
  }

  if (variant === 'dots') {
    return (
      <div className="my-10 flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-ink-muted" />
        <div className="w-1.5 h-1.5 rounded-full bg-ink-muted" />
        <div className="w-1.5 h-1.5 rounded-full bg-ink-muted" />
      </div>
    )
  }

  return (
    <div className="my-10 flex items-center gap-4">
      <div className="h-px flex-1 bg-rule" />
      <div className="w-1.5 h-1.5 bg-wcpo-red rotate-45" />
      <div className="h-px flex-1 bg-rule" />
    </div>
  )
}
