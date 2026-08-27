import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { modalBackdrop, modalPanel } from '../../lib/motion';
import Button from './Button';

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            {...modalBackdrop}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            {...modalPanel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative w-full ${widths[size]} bg-gray-950/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl max-h-[85vh] flex flex-col`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-colors duration-200"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto">{children}</div>
            {footer && <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ModalFooterActions({ onCancel, onConfirm, cancelLabel = 'Cancel', confirmLabel = 'Confirm', confirmVariant = 'primary', loading }) {
  return (
    <>
      <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
      <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>{confirmLabel}</Button>
    </>
  );
}
