import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Bell, MessageSquare, Star,
  Users, ShieldAlert, LogOut, Landmark, Flag, ChevronRight
} from 'lucide-react';

const roleConfig = {
  citizen: {
    color: 'from-blue-600 to-blue-800',
    badge: 'bg-blue-100 text-blue-700',
    icon: '🏛️',
    label: 'Citizen',
    links: [
      { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
      { icon: FileText, label: 'My Issues', key: 'issues' },
      { icon: Bell, label: 'Updates Feed', key: 'updates' },
      { icon: Star, label: 'Give Feedback', key: 'feedback' },
    ]
  },
  politician: {
    color: 'from-emerald-600 to-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: '🏅',
    label: 'Politician',
    links: [
      { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
      { icon: MessageSquare, label: 'Citizen Issues', key: 'issues' },
      { icon: Bell, label: 'Post Updates', key: 'updates' },
      { icon: Star, label: 'My Ratings', key: 'feedback' },
    ]
  },
  admin: {
    color: 'from-purple-600 to-purple-800',
    badge: 'bg-purple-100 text-purple-700',
    icon: '⚙️',
    label: 'Admin',
    links: [
      { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
      { icon: Users, label: 'Manage Users', key: 'users' },
      { icon: FileText, label: 'All Issues', key: 'issues' },
      { icon: Bell, label: 'All Updates', key: 'updates' },
    ]
  },
  moderator: {
    color: 'from-orange-500 to-orange-700',
    badge: 'bg-orange-100 text-orange-700',
    icon: '🛡️',
    label: 'Moderator',
    links: [
      { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
      { icon: Flag, label: 'Flagged Content', key: 'flagged' },
      { icon: FileText, label: 'All Issues', key: 'issues' },
      { icon: ShieldAlert, label: 'Activity Log', key: 'log' },
    ]
  }
};

export default function Sidebar({ active, setActive }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const config = roleConfig[user?.role] || roleConfig.citizen;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Brand Header */}
      <div className={`bg-gradient-to-br ${config.color} px-6 py-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Landmark className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">CivicConnect</h1>
            <p className="text-white/70 text-xs">Governance Platform</p>
          </div>
        </div>
        {/* User Info */}
        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-white/20 text-white`}>
                {config.icon} {config.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {config.links.map(({ icon: Icon, label, key }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
              active === key
                ? 'bg-primary-50 text-primary-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon size={18} className={active === key ? 'text-primary-600' : 'text-gray-400'} />
            <span className="flex-1 text-left">{label}</span>
            {active === key && <ChevronRight size={16} className="text-primary-500" />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-4 border-t border-gray-100 pt-4">
        {user?.constituency && (
          <div className="px-3 py-2 bg-gray-50 rounded-lg mb-3">
            <p className="text-xs text-gray-400 font-medium">Constituency</p>
            <p className="text-sm text-gray-700 font-semibold truncate">{user.constituency}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
