import { cn } from "@/lib/utils"

/**
 * The source file draws a 503×285 mark inside a 1080×1080 canvas, so a square
 * `size-8` box rendered it about 15px wide with the rest empty. The viewBox is
 * cropped to the artwork and the height drives the size; the width follows the
 * real 1.76:1 aspect.
 */
export function ShopLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-7 w-auto shrink-0 text-foreground", className)}
      fill="currentColor"
      role="img"
      viewBox="279.3 397.36 503.4 285.34"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m615.48 529.98l38.43-68.97-39.5-63.65h-65.78-7.04l34.85 62.55z" />
      <path d="m322.41 525.4l21.49 38.55h65.72 19.4l35.55-63.8h-83.19l-0.15-0.28 21.58-38.72h114.28l39.31-0.82-35.09-62.97h-155.98l-20.62 36.99-8.03 14.4-6.91 12.4-21.57 38.74 3.15 5.65z" />
      <path d="m782.68 397.36h-73.03l-130.29 233.81-47.25-84.79-11.07-19.87-14.78-26.55h-6.83-14.54l-1.75 3.25-64.33 115.44h-103.93l-35.56 63.8h176.97l39.3-70.54 39.42 70.73h15.67 14.18 58.85l38.42-68.95 38.42 68.95h73.02l-74.93-134.47z" />
    </svg>
  )
}
