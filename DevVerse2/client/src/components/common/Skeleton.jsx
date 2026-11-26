export default function Skeleton({
  variant = 'line',
  width,
  height,
  count = 1,
  className = '',
}) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'card') {
    return (
      <>
        {items.map((idx) => (
          <div key={idx} className={`glass flex flex-col gap-3.5 p-[18px] ${className}`.trim()}>
            <div className="skel h-[150px] w-full" />
            <div className="skel h-4 w-3/4 rounded-md" />
            <div className="skel h-3 w-full rounded-md" />
            <div className="skel h-3 w-2/3 rounded-md" />
          </div>
        ))}
      </>
    );
  }

  const defaultHeight = variant === 'rect' ? '120px' : '16px';

  return (
    <>
      {items.map((idx) => (
        <div
          key={idx}
          className={`skel ${className}`.trim()}
          style={{
            width: width || '100%',
            height: height || defaultHeight,
          }}
        />
      ))}
    </>
  );
}
