import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './Button'

/* ---------------- Modal ---------------- */
export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const modalSizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`surface-panel-strong glass relative w-full ${modalSizes[size]} rounded-3xl border surface-border p-6 shadow-soft-lg`}
          >
            {title && (
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="type-section-title">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-theme-secondary hover:bg-[rgba(var(--surface-3-rgb),0.7)] hover:text-theme-primary"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="text-sm text-theme-secondary">{children}</div>
            {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ---------------- Drawer ---------------- */
export const Drawer: React.FC<{
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  side?: 'left' | 'right'
  width?: string
}> = ({ open, onClose, title, children, side = 'right', width = '380px' }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[100]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.aside
          initial={{ x: side === 'right' ? '100%' : '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: side === 'right' ? '100%' : '-100%' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ width }}
          className={`surface-panel-strong glass absolute inset-y-0 ${
            side === 'right' ? 'right-0 border-l' : 'left-0 border-r'
          } flex max-w-full flex-col surface-border shadow-soft-lg`}
        >
          {title && (
            <div className="flex items-center justify-between border-b surface-border px-5 py-4">
              <h2 className="type-card-title">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-theme-secondary hover:bg-[rgba(var(--surface-3-rgb),0.7)] hover:text-theme-primary"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-5">{children}</div>
        </motion.aside>
      </div>
    )}
  </AnimatePresence>
)

/* ---------------- Confirm Dialog ---------------- */
export const ConfirmDialog: React.FC<{
  open: boolean
  title: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) => (
  <Modal
    open={open}
    onClose={onCancel}
    title={title}
    size="sm"
    footer={
      <>
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    {message}
  </Modal>
)
