const Badge = ({ label, count, isCollapsed }) => {
  const countMap = {
    'Подтвердить ТМЦ': { color: 'bg-amber-500', pulse: true },
    'Подтвердить ремонт': { color: 'bg-amber-600', pulse: true },
  };

  const badge = countMap[label];
  if (!badge || count === 0) return null;

  const shouldPulse = badge.pulse && count > 0;

  if (isCollapsed) {
    return (
      <div
        className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${badge.color} 
          ${shouldPulse ? 'badge-pulse' : ''}`}
        title={`${count} ${label}`}
      />
    );
  }

  return (
    <span
      className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-sm transition-all 
        ${badge.color} 
        ${shouldPulse ? 'badge-pulse ring-2 ring-amber-500/20' : ''}`}
      title={`${count} ${label}`}
    >
      {count}
    </span>
  );
};

export default Badge;

