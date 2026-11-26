export default function GlassCard({
  as: Component = 'div',
  lift = false,
  className = '',
  children,
  ...rest
}) {
  const classes = ['glass', lift ? 'card-lift' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}
