import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { StatCard, StatusBadge, PriorityBadge, RoleBadge, Modal, EmptyState, LoadingSpinner, Alert, formatTime } from '../components/UI';
import { RefreshCw, Trash2, Edit2, Check, X, Users, FileText, Bell } from 'lucide-react';
import api from '../api';

// ─── Edit User Modal ───
const EditUserModal = ({ user: u, onSave, onClose }) => {
  const [form, setForm] = useState({ role: u.role, is_active: u.is_active });
  const [loading, setLoading] = useState(false);
  const roles = ['admin', 'citizen', 'politician', 'moderator'];
  return (
    <form onSubmit={async e => { e.preventDefault(); setLoading(true); await onSave(u.id, form); setLoading(false); }} className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="font-semibold text-gray-800">{u.name}</p>
        <p className="text-sm text-gray-500">{u.email}</p>
      </div>
      <div>
        <label className="label">Role</label>
        <select className="input" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
          {roles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Account Status</label>
        <div className="flex gap-3 mt-1">
          {[{ v: 1, label: 'Active', cls: 'border-green-300 bg-green-50 text-green-700' }, { v: 0, label: 'Suspended', cls: 'border-red-300 bg-red-50 text-red-700' }].map(({ v, label, cls }) => (
            <button type="button" key={v} onClick={() => setForm(f => ({...f, is_active: v}))}
              className={`flex-1 py-2 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${form.is_active === v ? cls : 'border-gray-200 text-gray-400'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [active, setActive] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [alert, setAlert] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, issuesRes, updatesRes] = await Promise.all([
        api.get('/admin/stats'), api.get('/admin/users'),
        api.get('/issues'), api.get('/updates')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setIssues(issuesRes.data);
      setUpdates(updatesRes.data);
    } catch { showAlert('Failed to load data', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleEditUser = async (id, data) => {
    try {
      await api.put(`/admin/users/${id}`, data);
      await fetchAll();
      setModal(null);
      setEditUser(null);
      showAlert('User updated successfully ✅');
    } catch (err) { showAlert(err.response?.data?.message || 'Update failed', 'error'); }
  };

  const handleDeleteUser = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      await fetchAll();
      showAlert('User deleted');
    } catch { showAlert('Failed to delete user', 'error'); }
  };

  const handleDeleteIssue = async (id) => {
    if (!confirm('Delete this issue permanently?')) return;
    try {
      await api.delete(`/issues/${id}`);
      await fetchAll();
      showAlert('Issue deleted');
    } catch { showAlert('Failed to delete issue', 'error'); }
  };

  const handleDeleteUpdate = async (id) => {
    if (!confirm('Delete this update?')) return;
    try {
      await api.delete(`/updates/${id}`);
      await fetchAll();
      showAlert('Update deleted');
    } catch { showAlert('Failed to delete update', 'error'); }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active={active} setActive={setActive} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {active === 'dashboard' && 'Admin Dashboard'}
              {active === 'users' && 'User Management'}
              {active === 'issues' && 'All Issues'}
              {active === 'updates' && 'All Updates'}
            </h2>
            <p className="text-sm text-gray-400">Full system oversight & control</p>
          </div>
          <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={15} /> Refresh
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {alert && <div className="mb-4"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

          {/* ── DASHBOARD ── */}
          {active === 'dashboard' && (
            <div className="space-y-6">
              {!stats ? <LoadingSpinner /> : (
                <>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Total Users" value={stats.users} icon="👥" color="bg-purple-50" />
                    <StatCard title="Total Issues" value={stats.issues} icon="📋" color="bg-blue-50" />
                    <StatCard title="Open Issues" value={stats.openIssues} icon="🔵" color="bg-blue-50" />
                    <StatCard title="Resolved" value={stats.resolvedIssues} icon="✅" color="bg-green-50" />
                  </div>
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard title="Updates Posted" value={stats.updates} icon="📢" color="bg-emerald-50" />
                    <StatCard title="Feedback" value={stats.feedback} icon="⭐" color="bg-yellow-50" />
                    <StatCard title="Flagged Issues" value={stats.flaggedIssues} icon="🚩" color="bg-red-50" />
                    <StatCard title="Flagged Comments" value={stats.flaggedComments} icon="⚠️" color="bg-orange-50" />
                  </div>

                  {/* Role breakdown */}
                  <div className="card">
                    <h3 className="font-bold text-gray-800 mb-4">User Role Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {stats.roleBreakdown?.map(r => (
                        <div key={r.role} className="bg-gray-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-gray-800">{r.count}</p>
                          <RoleBadge role={r.role} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Users */}
                  <div className="card">
                    <h3 className="font-bold text-gray-800 mb-4">Recently Registered Users</h3>
                    <div className="space-y-2">
                      {users.slice(0, 5).map(u => (
                        <div key={u.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700">
                            {u.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-800 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                          <RoleBadge role={u.role} />
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {u.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── USERS TAB ── */}
          {active === 'users' && (
            <div className="card">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input className="input flex-1 text-sm" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="input w-auto text-sm" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                  <option value="all">All Roles</option>
                  {['admin','citizen','politician','moderator'].map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-gray-500 mb-4">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found</p>
              {loading ? <LoadingSpinner /> : filteredUsers.length === 0 ? (
                <EmptyState icon="👥" message="No users found" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Constituency</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                        <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-xs shrink-0">
                                {u.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-800 truncate">{u.name}</p>
                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2"><RoleBadge role={u.role} /></td>
                          <td className="py-3 px-2 text-gray-500 text-xs">{u.constituency || '—'}</td>
                          <td className="py-3 px-2">
                            <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {u.is_active ? '● Active' : '○ Suspended'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-gray-400 text-xs">{formatTime(u.created_at)}</td>
                          <td className="py-3 px-2">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => { setEditUser(u); setModal('editUser'); }}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                                <Edit2 size={15} />
                              </button>
                              <button onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── ISSUES TAB ── */}
          {active === 'issues' && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4">All Issues ({issues.length})</h3>
              {loading ? <LoadingSpinner /> : issues.length === 0 ? (
                <EmptyState icon="📭" message="No issues found" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Citizen</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Flagged</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                        <th className="text-right py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map(issue => (
                        <tr key={issue.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${issue.is_flagged ? 'bg-red-50/50' : ''}`}>
                          <td className="py-3 px-2">
                            <p className="font-medium text-gray-800 max-w-[180px] truncate">{issue.title}</p>
                            <span className="text-xs text-gray-400">{issue.category}</span>
                          </td>
                          <td className="py-3 px-2 text-gray-600 text-xs">{issue.citizen_name}</td>
                          <td className="py-3 px-2"><StatusBadge status={issue.status} /></td>
                          <td className="py-3 px-2"><PriorityBadge priority={issue.priority} /></td>
                          <td className="py-3 px-2">
                            {issue.is_flagged ? <span className="text-red-500 font-bold">🚩 Yes</span> : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="py-3 px-2 text-gray-400 text-xs">{formatTime(issue.created_at)}</td>
                          <td className="py-3 px-2">
                            <div className="flex justify-end">
                              <button onClick={() => handleDeleteIssue(issue.id)}
                                className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── UPDATES TAB ── */}
          {active === 'updates' && (
            <div className="space-y-4">
              {loading ? <LoadingSpinner /> : updates.length === 0 ? (
                <div className="card"><EmptyState icon="📢" message="No updates found" /></div>
              ) : updates.map(u => (
                <div key={u.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-800">{u.title}</h4>
                        <span className="badge bg-emerald-100 text-emerald-700">{u.category}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">By: <span className="font-medium">{u.politician_name}</span> {u.constituency && `• ${u.constituency}`}</p>
                      <p className="text-gray-600 mt-2 text-sm leading-relaxed line-clamp-2">{u.content}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatTime(u.created_at)}</p>
                    </div>
                    <button onClick={() => handleDeleteUpdate(u.id)}
                      className="text-red-400 hover:text-red-600 ml-4 p-2 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Modal open={modal === 'editUser'} onClose={() => { setModal(null); setEditUser(null); }} title="✏️ Edit User">
        {editUser && <EditUserModal user={editUser} onSave={handleEditUser} onClose={() => { setModal(null); setEditUser(null); }} />}
      </Modal>
    </div>
  );
}
