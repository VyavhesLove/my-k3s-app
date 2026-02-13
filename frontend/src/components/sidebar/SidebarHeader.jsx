import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import UserInfo from './UserInfo';

const SidebarHeader = ({ isCollapsed, setIsCollapsed, user }) => {
  return (
    <div className="flex flex-col p-4 border-b border-theme">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-primary">
          <Home size={24} className="text-blue-500" />
          {!isCollapsed && <span className="font-bold text-xl uppercase">Учёт ТМЦ</span>}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md transition-colors hover:bg-blue-500/10"
        >
          {isCollapsed ? (
            <ChevronRight className="text-primary" />
          ) : (
            <ChevronLeft className="text-primary" />
          )}
        </button>
      </div>

      <UserInfo user={user} isCollapsed={isCollapsed} />
    </div>
  );
};

export default SidebarHeader;

