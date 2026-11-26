const VARIANT_MAP = {
  default: 'chip',
  accent: 'chip chip-accent',
  tier: 'tier-badge',
  link: 'chip chip-link',
};

export default function Badge({
  as: Component = 'span',
  variant = 'default',
  icon = null,
  className = '',
  children,
  ...rest
}) {
  const classes = [VARIANT_MAP[variant] || VARIANT_MAP.default, className]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classes} {...rest}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </Component>
  );
}
