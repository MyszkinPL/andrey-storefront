"use client"

import type { ReactNode } from "react"
import { Button } from "sealui"
import {
  DialogBackdrop,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogViewport,
} from "sealui/components/Dialog"
import {
  DrawerBackdrop,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPopup,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerViewport,
} from "sealui/components/Drawer"

import { useTranslate } from "@/components/i18n-provider"
import { useMediaQuery } from "@/hooks/use-media-query"

/**
 * Confirmation that reaches the thumb: a bottom sheet on a phone, a centred
 * dialog from `sm` up. Both are sealui parts, so the sheet keeps Base UI's
 * swipe-to-close and the dialog its focus trap.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = "primary",
  confirmDisabled = false,
  loading,
  onConfirm,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel: string
  confirmVariant?: "primary" | "danger"
  /** Keeps the confirm button off until the reader has done their part. */
  confirmDisabled?: boolean
  loading?: boolean
  onConfirm: () => void
  children?: ReactNode
}) {
  const t = useTranslate()
  const isDesktop = useMediaQuery("sm")

  const handleOpenChange = (next: boolean) => {
    if (!loading) onOpenChange(next)
  }

  const actions = (
    <>
      <Button disabled={loading} onClick={() => handleOpenChange(false)} variant="outline">
        {t("common.cancel")}
      </Button>
      <Button
        disabled={loading || confirmDisabled}
        loading={loading}
        onClick={onConfirm}
        variant={confirmVariant}
      >
        {confirmLabel}
      </Button>
    </>
  )

  if (isDesktop) {
    return (
      <DialogRoot onOpenChange={handleOpenChange} open={open}>
        <DialogPortal>
          <DialogBackdrop />
          <DialogViewport>
            <DialogPopup>
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                {description ? <DialogDescription>{description}</DialogDescription> : null}
              </DialogHeader>
              {children}
              <DialogFooter>{actions}</DialogFooter>
            </DialogPopup>
          </DialogViewport>
        </DialogPortal>
      </DialogRoot>
    )
  }

  return (
    <DrawerRoot onOpenChange={handleOpenChange} open={open} swipeDirection="down">
      <DrawerPortal>
        <DrawerBackdrop />
        <DrawerViewport side="bottom">
          <DrawerPopup>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{title}</DrawerTitle>
                {description ? <DrawerDescription>{description}</DrawerDescription> : null}
              </DrawerHeader>
              {children}
              <DrawerFooter>{actions}</DrawerFooter>
            </DrawerContent>
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </DrawerRoot>
  )
}
