import { Loader2 } from 'lucide-react';

const VARIANT_CLASSES = {
  primary: 'btn btn-primary',
  ghost: 'btn btn-ghost',
  outline: 'btn btn-outline',
  danger: 'thread-delete-btn',
};

const SIZE_CLASSES = {
  sm: 'btn-sm',
  md: '',
  icon: 'btn-icon',
};

export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
    SIZE_CLASSES[size] || '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const isButton = Component === 'button';

  return (
    <Component
      className={classes}
      disabled={isButton ? disabled || loading : undefined}
      aria-busy={loading ? 'true' : undefined}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </Component>
  );
}
