import { useToast } from '../../hooks/useToast';

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div id="toast-stack" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={`toast ${item.type === 'error' ? 'toast-error' : ''} ${
            item.type === 'success' ? 'toast-success' : ''
          } ${item.closing ? 'out' : ''}`.trim()}
          onClick={() => dismissToast(item.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') dismissToast(item.id);
          }}
        >
          <span className="tdot" aria-hidden="true" />
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  );
}
