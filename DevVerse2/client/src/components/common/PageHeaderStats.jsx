export default function PageHeaderStats({ stats = [], loading = false }) {
  if (!loading && (!stats || stats.length === 0)) {
    return null;
  }

  return (
    <div className="page-header-stats" id="page-header-stats">
      {loading
        ? [0, 1, 2].map((idx) => (
            <div key={idx} className="page-header-stat">
              <div className="skel h-3 w-24 rounded" />
              <div className="skel h-4 w-12 rounded" />
            </div>
          ))
        : stats.map((item) => (
            <div key={item.label} className="page-header-stat">
              <span className="phs-label">{item.label}</span>
              <span className="phs-value">{item.value}</span>
            </div>
          ))}
    </div>
  );
}
