"use client"

import { useCallback, useRef, useState, type ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ConfirmOptions = {
  title?: string
  confirmLabel?: string
  destructive?: boolean
}

type Pending = ConfirmOptions & { message: string }

/**
 * Remplace `window.confirm` : `const [confirm, confirmDialog] = useConfirm()`,
 * puis `if (!(await confirm("Message"))) return` dans le handler et
 * `{confirmDialog}` n'importe où dans le JSX du composant.
 */
export function useConfirm(): readonly [
  (message: string, options?: ConfirmOptions) => Promise<boolean>,
  ReactNode,
] {
  const [pending, setPending] = useState<Pending | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback(
    (message: string, options?: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve
        setPending({ message, ...options })
      }),
    []
  )

  function settle(value: boolean) {
    resolver.current?.(value)
    resolver.current = null
    setPending(null)
  }

  const dialog = (
    <AlertDialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) settle(false)
      }}
    >
      <AlertDialogContent>
        <AlertDialogTitle>{pending?.title ?? "Confirmer l'action"}</AlertDialogTitle>
        <AlertDialogDescription>{pending?.message}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            variant={pending?.destructive ? "destructive" : "default"}
            onClick={() => settle(true)}
          >
            {pending?.confirmLabel ?? "Confirmer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return [confirm, dialog] as const
}
