"use client"

import { BottomTabs } from "@/components/bottom-tabs"
import { ModeSwitcher } from "@/components/mode-switcher"
import { SideNav } from "@/components/side-nav"

/**
 * Two navigations live in the tree at once and CSS chooses between them: the
 * tab bar for phones, the side rail from `lg` up. Doing this in CSS instead of
 * a media-query hook keeps the first paint correct on both.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex lg:min-h-dvh">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <ModeSwitcher className="lg:hidden" />
        {children}
        <BottomTabs />
      </div>
    </div>
  )
}
