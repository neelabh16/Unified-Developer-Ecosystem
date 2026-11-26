import { createContext, useCallback, useEffect, useReducer, useRef } from 'react';

export const ToastContext = createContext(null);

function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, action.payload];
    case 'START_CLOSE':
      return state.map((item) =>
        item.id === action.payload ? { ...item, closing: true } : item
      );
    case 'REMOVE_TOAST':
      return state.filter((item) => item.id !== action.payload);
    default:
      return state;
  }
}

let toastSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const existing = timersRef.current.get(id);
    if (existing) {
      clearTimeout(existing.closeTimer);
      clearTimeout(existing.removeTimer);
      timersRef.current.delete(id);
    }
    dispatch({ type: 'START_CLOSE', payload: id });
    const removeTimer = setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, 320);
    timersRef.current.set(id, { closeTimer: null, removeTimer });
  }, []);

  const showToast = useCallback((message, typeOrOptions = 'info', durationArg = 2400) => {
    const opts =
      typeof typeOrOptions === 'object' && typeOrOptions !== null
        ? typeOrOptions
        : { type: typeOrOptions, duration: durationArg };

    const type = opts.type || 'info';
    const duration = typeof opts.duration === 'number' ? opts.duration : 2400;
    const id = `dv-toast-${++toastSeq}`;

    dispatch({
      type: 'ADD_TOAST',
      payload: { id, message: String(message || ''), type, closing: false },
    });

    const closeTimer = setTimeout(() => {
      dispatch({ type: 'START_CLOSE', payload: id });
    }, duration);

    const removeTimer = setTimeout(() => {
      timersRef.current.delete(id);
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, duration + 320);

    timersRef.current.set(id, { closeTimer, removeTimer });
    return id;
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((entry) => {
        if (entry.closeTimer) clearTimeout(entry.closeTimer);
        if (entry.removeTimer) clearTimeout(entry.removeTimer);
      });
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, toast: showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}
