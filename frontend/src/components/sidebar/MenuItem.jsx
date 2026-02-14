import Badge from './Badge';

const MenuItem = ({ item, isActive, isCollapsed, onClick, stats }) => {
  // Определение количества для бейджа
  const getBadgeCount = (label) => {
    if (label === 'Подтвердить ТМЦ') {
      return stats?.to_receive || 0;
    }
    if (label === 'Подтвердить ремонт') {
      return stats?.to_repair || 0;
    }
    return 0;
  };

  const badgeCount = getBadgeCount(item.label);

  return (
    <div
      onClick={() => onClick(item.label)}
      className={`relative flex items-center px-4 py-3 cursor-pointer transition-all text-primary
        ${isActive
          ? 'bg-blue-600/30 text-blue-400 border-r-2 border-blue-500'
          : 'hover:bg-blue-500/10'
        }`}
    >
      <div className="relative min-w-[24px]">
        {item.icon}
        {isCollapsed && badgeCount > 0 && (
          <Badge label={item.label} count={badgeCount} isCollapsed />
        )}
      </div>

      {!isCollapsed && (
        <>
          <span className="ml-4 text-sm font-medium whitespace-nowrap">{item.label}</span>
          <Badge label={item.label} count={badgeCount} />
        </>
      )}
    </div>
  );
};

export default MenuItem;

