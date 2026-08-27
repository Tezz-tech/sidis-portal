import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { modalBackdrop, modalPanel } from '../../lib/motion';
import Button from './Button';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    triggerRef.current = document.activeElement;
    // Deferred a tick so the panel has actually mounted before we try to
    // focus into it (this effect runs on the same render `open` flips true).
    const focusTimer = setTimeout(() => {
      const focusable = panelRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
      (focusable?.[0] || panelRef.current)?.focus();
    }, 0);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus?.();
    };
  }, [open, onClose]);

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
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={`relative w-full ${widths[size]} bg-gray-950/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl max-h-[85vh] flex flex-col outline-none`}
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
