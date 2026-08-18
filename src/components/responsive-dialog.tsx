"use client"

import { useTranslate } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPopup,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"

/**
 * Confirmation that reaches the thumb: a bottom sheet on a phone, a centred
 * dialog from `sm` up. Every confirmation used to be a centred dialog, which
 * on a phone puts a destructive choice in the middle of the screen, far from
 * where the hand is.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  loading,
  onConfirm,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel: string
  confirmVariant?: "default" | "destructive"
  loading?: boolean
  onConfirm: () => void
  children?: React.ReactNode
}) {
  const t = useTranslate()
  const isDesktop = useMediaQuery("sm")

  const Root = isDesktop ? Dialog : Drawer
  const Popup = isDesktop ? DialogPopup : DrawerPopup
  const Header = isDesktop ? DialogHeader : DrawerHeader
  const Title = isDesktop ? DialogTitle : DrawerTitle
  const Description = isDesktop ? DialogDescription : DrawerDescription
  const Footer = isDesktop ? DialogFooter : DrawerFooter
  const Close = isDesktop ? DialogClose : DrawerClose

  return (
    <Root open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <Popup>
        <Header>
          <Title>{title}</Title>
          {description ? <Description>{description}</Description> : null}
        </Header>

        {children}

        <Footer>
          <Close disabled={loading} render={<Button variant="outline" />}>
            {t("common.cancel")}
          </Close>
          <Button disabled={loading} loading={loading} onClick={onConfirm} variant={confirmVariant}>
            {confirmLabel}
          </Button>
        </Footer>
      </Popup>
    </Root>
  )
}
