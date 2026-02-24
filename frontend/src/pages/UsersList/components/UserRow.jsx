import { getRoleText } from '@/utils/role';

const getRoleStyles = (role, isDarkMode) => {
  const styles = {
    admin: isDarkMode
      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
      : 'bg-purple-100 text-purple-700 border border-purple-200',
    storekeeper: isDarkMode
      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      : 'bg-blue-100 text-blue-700 border border-blue-200',
    foreman: isDarkMode
      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
      : 'bg-green-100 text-green-700 border border-green-200',
  };
  return styles[role] || (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500');
};

export const UserRow = ({ user, index, currentPage, pageSize, isDarkMode }) => {
  const rowNumber = (currentPage - 1) * pageSize + index + 1;
  
  return (
    <tr 
      key={user.id}
      className="border-b transition-colors hover:bg-blue-500/5"
      style={{ borderColor: 'var(--table-border)' }}
    >
      <td className="px-4 py-4">{rowNumber}</td>
      <td className="px-4 py-4 font-medium">{user.username}</td>
      <td className="px-4 py-4 opacity-70">{user.email}</td>
      <td className="px-4 py-4">{user.first_name || '-'}</td>
      <td className="px-4 py-4">{user.last_name || '-'}</td>
      <td className="px-4 py-4">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${getRoleStyles(user.role, isDarkMode)}`}>
          {getRoleText(user.role)}
        </span>
      </td>
    </tr>
  );
};

