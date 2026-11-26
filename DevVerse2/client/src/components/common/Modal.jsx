import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title = '',
  maxWidth = '540px',
  children,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal dialog'}
      className="fixed inset-0 z-[10060] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="glass relative w-full overflow-y-auto p-6"
        style={{
          maxWidth,
          maxHeight: '90vh',
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-strong)',
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          {title ? <h3 className="text-lg font-semibold">{title}</h3> : <span />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="dock-icon-btn h-8 w-8 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
