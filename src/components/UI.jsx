// Reusable UI Components

export const StatusBadge = ({ status }) => {
  const map = {
    open:        'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    resolved:    'bg-green-100 text-green-700',
    closed:      'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`badge ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace('_', ' ').toUpperCase()}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const map = {
    low:    'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high:   'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`badge ${map[priority] || 'bg-gray-100 text-gray-600'}`}>
      {priority?.toUpperCase()}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const map = {
    admin:     'bg-purple-100 text-purple-700',
    citizen:   'bg-blue-100 text-blue-700',
    politician:'bg-emerald-100 text-emerald-700',
    moderator: 'bg-orange-100 text-orange-700',
  };
  const icons = { admin: '⚙️', citizen: '👤', politician: '🏅', moderator: '🛡️' };
  return (
    <span className={`badge ${map[role] || 'bg-gray-100 text-gray-600'}`}>
      {icons[role]} {role?.charAt(0).toUpperCase() + role?.slice(1)}
    </span>
  );
};

export const StatCard = ({ title, value, icon, color, sub }) => (
  <div className={`card flex items-start gap-4`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

export const EmptyState = ({ icon, message, sub }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-5xl mb-3">{icon}</div>
    <p className="text-gray-700 font-semibold text-lg">{message}</p>
    {sub && <p className="text-gray-400 text-sm mt-1">{sub}</p>}
  </div>
);

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const Alert = ({ type = 'error', message, onClose }) => {
  if (!message) return null;
  const styles = {
    error:   'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info:    'bg-blue-50 border-blue-200 text-blue-700',
  };
  return (
    <div className={`border rounded-lg px-4 py-3 flex items-center justify-between ${styles[type]}`}>
      <span className="text-sm font-medium">{message}</span>
      {onClose && <button onClick={onClose} className="ml-3 text-lg leading-none opacity-60 hover:opacity-100">&times;</button>}
    </div>
  );
};

export const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
export const formatTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
