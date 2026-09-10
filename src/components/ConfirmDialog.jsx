import { useEffect, useRef } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

/**
 * ConfirmDialog — modal de confirmation stylée (remplace window.confirm / window.alert).
 *
 * Props:
 *   open        – boolean
 *   title       – string (defaut: "Confirmer la suppression")
 *   message     – string
 *   confirmLabel – string (defaut: "Supprimer")
 *   cancelLabel  – string (defaut: "Annuler")
 *   variant     – "danger" | "warning" | "info"
 *   onConfirm   – () => void
 *   onCancel    – () => void
 */
export default function ConfirmDialog({
  open,
  title = 'Confirmer la suppression',
  message,
  confirmLabel = 'Supprimer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null)

  useEffect(() => {
    if (open) {
      // Focus le bouton annuler par défaut pour éviter les suppressions accidentelles
      setTimeout(() => cancelRef.current?.focus(), 50)
    }
  }, [open])

  // Fermer sur Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onCancel?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      Icon: Trash2,
      confirmBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-300',
    },
    warning: {
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      Icon: AlertTriangle,
      confirmBg: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-300',
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      Icon: AlertTriangle,
      confirmBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300',
    },
  }

  const v = variantStyles[variant] || variantStyles.danger
  const VIcon = v.Icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in overflow-hidden">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-6 pt-8 text-center">
          {/* Icon */}
          <div className={`w-14 h-14 ${v.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <VIcon className={`w-7 h-7 ${v.iconColor}`} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>

          {/* Message */}
          {message && (
            <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 pt-0">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition focus:outline-none focus:ring-2 ${v.confirmBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
