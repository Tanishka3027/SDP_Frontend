import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { StatCard, StatusBadge, PriorityBadge, Modal, EmptyState, LoadingSpinner, Alert, formatTime } from '../components/UI';
import { RefreshCw, Flag, Trash2, CheckCircle, AlertTriangle, Eye, ShieldOff, Shield } from 'lucide-react';
import api from '../api';

export default function ModeratorDashboard() {
  const { user } = useAuth();
  const [active, setActive] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [flagged, setFlagged] = useState({ flaggedIssues: [], flaggedComments: [] });
  const [allIssues, setAllIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, flaggedRes, issuesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/moderator/flagged'),
        api.get('/issues')
      ]);
      setStats(statsRes.data);
      setFlagged(flaggedRes.data);
      setAllIssues(issuesRes.data);
    } catch { showAlert('Failed to load data', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleFlagIssue = async (id, flag) => {
    try {
      await api.put(`/moderator/issues/${id}/flag`, { is_flagged: flag });
      await fetchAll();
      showAlert(flag ? '🚩 Issue flagged' : '✅ Issue unflagged');
    } catch { showAlert('Action failed', 'error'); }
  };

  const handleFlagComment = async (id, flag) => {
    try {
      await api.put(`/comments/${id}/flag`, { is_flagged: flag });
      await fetchAll();
      showAlert(flag ? '🚩 Comment flagged' : '✅ Comment unflagged');
    } catch { showAlert('Action failed', 'error'); }
  };

  const handleDeleteComment = async (id) => {
    if (!confirm('Delete this comment permanently?')) return;
    try {
      await api.delete(`/comments/${id}`);
      await fetchAll();
      showAlert('Comment deleted');
    } catch { showAlert('Failed to delete', 'error'); }
  };

  const handleIssueStatus = async (id, status) => {
    try {
      await api.put(`/issues/${id}`, { status });
      await fetchAll();
      showAlert(`Issue status updated to ${status.replace('_', ' ')}`);
    } catch { showAlert('Failed to update', 'error'); }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active={active} setActive={setActive} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {active === 'dashboard' && 'Moderator Dashboard'}
              {active === 'flagged' && 'Flagged Content'}
              {active === 'issues' && 'All Issues'}
              {active === 'log' && 'Activity Log'}
            </h2>
            <p className="text-sm text-gray-400">Monitor & moderate platform interactions</p>
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
                    <StatCard title="Total Issues" value={stats.issues} icon="📋" color="bg-blue-50" />
                    <StatCard title="Open Issues" value={stats.openIssues} icon="🔵" color="bg-blue-50" />
                    <StatCard title="Flagged Issues" value={stats.flaggedIssues} icon="🚩" color="bg-red-50" sub="Needs review" />
                    <StatCard title="Flagged Comments" value={stats.flaggedComments} icon="⚠️" color="bg-orange-50" sub="Needs review" />
                  </div>

                  {/* Alert section for flagged content */}
                  {(stats.flaggedIssues > 0 || stats.flaggedComments > 0) && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                      <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-semibold text-red-700">Action Required</p>
                        <p className="text-sm text-red-600 mt-0.5">
                          {stats.flaggedIssues > 0 && `${stats.flaggedIssues} issue(s) flagged. `}
                          {stats.flaggedComments > 0 && `${stats.flaggedComments} comment(s) flagged.`}
                        </p>
                        <button onClick={() => setActive('flagged')} className="btn-danger text-xs mt-2 py-1.5 px-3">
                          Review Now →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Recent flagged issues preview */}
                  <div className="card">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Flag size={16} className="text-red-500" /> Recent Flagged Issues
                    </h3>
                    {flagged.flaggedIssues.length === 0 ? (
                      <EmptyState icon="✅" message="No flagged issues" sub="Platform content is clean" />
                    ) : flagged.flaggedIssues.slice(0, 3).map(issue => (
                      <div key={issue.id} className="flex items-start gap-4 p-4 bg-red-50 rounded-xl mb-2 border border-red-100">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{issue.title}</p>
                          <p className="text-sm text-gray-500">By: {issue.citizen_name}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(issue.created_at)}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => handleFlagIssue(issue.id, false)}
                            className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-all" title="Unflag">
                            <ShieldOff size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── FLAGGED CONTENT TAB ── */}
          {active === 'flagged' && (
            <div className="space-y-6">
              {/* Flagged Issues */}
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Flag size={16} className="text-red-500" /> Flagged Issues ({flagged.flaggedIssues.length})
                </h3>
                {loading ? <LoadingSpinner /> : flagged.flaggedIssues.length === 0 ? (
                  <EmptyState icon="✅" message="No flagged issues" sub="All clear!" />
                ) : (
                  <div className="space-y-3">
                    {flagged.flaggedIssues.map(issue => (
                      <div key={issue.id} className="border border-red-200 bg-red-50 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-red-500 text-sm">🚩</span>
                              <p className="font-semibold text-gray-800">{issue.title}</p>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{issue.description}</p>
                            <div className="flex gap-2 mt-2 flex-wrap items-center">
                              <StatusBadge status={issue.status} />
                              <PriorityBadge priority={issue.priority} />
                              <span className="text-xs text-gray-500">By: {issue.citizen_name}</span>
                              <span className="text-xs text-gray-400">{formatTime(issue.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button onClick={() => handleFlagIssue(issue.id, false)}
                              className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-all">
                              <Shield size={12} /> Clear Flag
                            </button>
                            <button onClick={() => handleIssueStatus(issue.id, 'closed')}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-all">
                              Close Issue
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Flagged Comments */}
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-500" /> Flagged Comments ({flagged.flaggedComments.length})
                </h3>
                {loading ? <LoadingSpinner /> : flagged.flaggedComments.length === 0 ? (
                  <EmptyState icon="✅" message="No flagged comments" sub="All clear!" />
                ) : (
                  <div className="space-y-3">
                    {flagged.flaggedComments.map(comment => (
                      <div key={comment.id} className="border border-orange-200 bg-orange-50 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm text-gray-700">{comment.user_name}</span>
                              <span className="text-xs text-gray-400 capitalize">({comment.user_role})</span>
                              <span className="text-xs text-gray-400">{formatTime(comment.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-700 bg-white/60 rounded-lg p-2">{comment.content}</p>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button onClick={() => handleFlagComment(comment.id, false)}
                              className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-all">
                              <Shield size={12} /> Approve
                            </button>
                            <button onClick={() => handleDeleteComment(comment.id)}
                              className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-all">
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ALL ISSUES TAB ── */}
          {active === 'issues' && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4">All Platform Issues ({allIssues.length})</h3>
              {loading ? <LoadingSpinner /> : allIssues.length === 0 ? (
                <EmptyState icon="📭" message="No issues found" />
              ) : (
                <div className="space-y-3">
                  {allIssues.map(issue => (
                    <div key={issue.id} className={`p-4 border rounded-xl transition-all ${issue.is_flagged ? 'border-red-200 bg-red-50/50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {issue.is_flagged && <span className="text-red-500">🚩</span>}
                            <p className="font-semibold text-gray-800 truncate">{issue.title}</p>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{issue.description}</p>
                          <div className="flex gap-2 mt-2 flex-wrap items-center">
                            <span className="badge bg-gray-100 text-gray-600">{issue.category}</span>
                            <span className="text-xs text-gray-500">By: {issue.citizen_name}</span>
                            {issue.politician_name && <span className="text-xs text-blue-500">→ {issue.politician_name}</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(issue.created_at)}</p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0 items-end">
                          <StatusBadge status={issue.status} />
                          <PriorityBadge priority={issue.priority} />
                          <button
                            onClick={() => handleFlagIssue(issue.id, !issue.is_flagged)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all mt-1 ${issue.is_flagged ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'}`}>
                            {issue.is_flagged ? <><Shield size={11}/> Unflag</> : <><Flag size={11}/> Flag</>}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── LOG TAB ── */}
          {active === 'log' && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4">Activity Overview</h3>
              {!stats ? <LoadingSpinner /> : (
                <div className="space-y-3">
                  {[
                    { label: 'Total registered users', value: stats.users, icon: '👥', color: 'bg-purple-50 text-purple-700' },
                    { label: 'Issues reported', value: stats.issues, icon: '📋', color: 'bg-blue-50 text-blue-700' },
                    { label: 'Issues open', value: stats.openIssues, icon: '🔵', color: 'bg-blue-50 text-blue-700' },
                    { label: 'Issues resolved', value: stats.resolvedIssues, icon: '✅', color: 'bg-green-50 text-green-700' },
                    { label: 'Updates posted', value: stats.updates, icon: '📢', color: 'bg-emerald-50 text-emerald-700' },
                    { label: 'Feedback submitted', value: stats.feedback, icon: '⭐', color: 'bg-yellow-50 text-yellow-700' },
                    { label: 'Flagged issues', value: stats.flaggedIssues, icon: '🚩', color: 'bg-red-50 text-red-700' },
                    { label: 'Flagged comments', value: stats.flaggedComments, icon: '⚠️', color: 'bg-orange-50 text-orange-700' },
                  ].map(({ label, value, icon, color }) => (
                    <div key={label} className={`flex items-center justify-between p-4 rounded-xl ${color.split(' ')[0]}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{icon}</span>
                        <span className={`font-medium ${color.split(' ')[1]}`}>{label}</span>
                      </div>
                      <span className={`text-2xl font-bold ${color.split(' ')[1]}`}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
