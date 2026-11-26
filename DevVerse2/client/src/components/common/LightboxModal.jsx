import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function LightboxModal({ src, alt = 'Expanded image', onClose }) {
  useEffect(() => {
    if (!src) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      id="dv-image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[10070] flex items-center justify-center p-6"
      style={{
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close lightbox"
        className="dock-icon-btn fixed right-6 top-6 h-10 w-10 rounded-full"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[88vh] max-w-[92vw] rounded-[var(--radius-md)] object-contain shadow-2xl"
      />
    </div>
  );
}
