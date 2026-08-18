import { cn } from "@/lib/utils"

export function ShopLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className={cn("size-8 shrink-0", className)}
      src="/logo.svg"
    />
  )
}
