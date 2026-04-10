import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { StatCard, StatusBadge, PriorityBadge, Modal, EmptyState, LoadingSpinner, Alert, formatTime } from '../components/UI';
import { Plus, Send, RefreshCw, MessageCircle, CheckCircle, Clock, Archive } from 'lucide-react';
import api from '../api';

// ─── Update Form ───
const UpdateForm = ({ onSubmit, onClose }) => {
  const [form, setForm] = useState({ title: '', content: '', category: 'General' });
  const [loading, setLoading] = useState(false);
  const categories = ['General', 'Infrastructure', 'Health', 'Education', 'Policy', 'Environment', 'Budget', 'Other'];
  return (
    <form onSubmit={async e => { e.preventDefault(); setLoading(true); await onSubmit(form); setLoading(false); }} className="space-y-4">
      <div>
        <label className="label">Update Title *</label>
        <input className="input" placeholder="Headline of your update" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
      </div>
      <div>
        <label className="label">Category</label>
        <select className="input" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Content *</label>
        <textarea className="input resize-none" rows={6} placeholder="Write your update message to citizens..." value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} required />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Posting...' : '📢 Post Update'}
        </button>
      </div>
    </form>
  );
};

// ─── Issue Detail (Politician view with respond) ───
const IssueDetail = ({ issue, onClose, onStatusChange, onComment }) => {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleComment = async e => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    await onComment(issue.id, comment);
    setComment('');
    setSubmitting(false);
  };

  const changeStatus = async (status) => {
    setUpdatingStatus(true);
    await onStatusChange(issue.id, status);
    setUpdatingStatus(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <StatusBadge status={issue.status} />
        <PriorityBadge priority={issue.priority} />
        <span className="badge bg-gray-100 text-gray-600">{issue.category}</span>
      </div>
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Reported by</p>
        <p className="font-semibold text-gray-700">{issue.citizen_name}</p>
      </div>
      <p className="text-gray-700 leading-relaxed">{issue.description}</p>
      <p className="text-xs text-gray-400">{formatTime(issue.created_at)}</p>

      {/* Status Change */}
      <div className="border rounded-xl p-4 bg-blue-50">
        <p className="text-sm font-semibold text-gray-700 mb-3">Update Status</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { s: 'in_progress', label: 'In Progress', icon: <Clock size={14}/>, cls: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200' },
            { s: 'resolved', label: 'Resolved', icon: <CheckCircle size={14}/>, cls: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' },
            { s: 'closed', label: 'Closed', icon: <Archive size={14}/>, cls: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200' },
          ].map(({ s, label, icon, cls }) => (
            <button key={s} disabled={updatingStatus || issue.status === s}
              onClick={() => changeStatus(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 ${cls}`}>
              {icon}{label}
            </button>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="border-t pt-4">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MessageCircle size={16} /> Discussion ({issue.comments?.length || 0})
        </h4>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {issue.comments?.length === 0 && <p className="text-gray-400 text-sm text-center py-2">No comments yet — be the first to respond!</p>}
          {issue.comments?.map(c => (
            <div key={c.id} className={`rounded-xl p-3 ${c.user_role === 'politician' ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-xs text-gray-700">{c.user_name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.user_role === 'politician' ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                  {c.user_role}
                </span>
                <span className="text-xs text-gray-400 ml-auto">{formatTime(c.created_at)}</span>
              </div>
              <p className="text-sm text-gray-600">{c.content}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleComment} className="flex gap-2 mt-3">
          <input className="input flex-1 text-sm" placeholder="Write your official response..." value={comment} onChange={e => setComment(e.target.value)} />
          <button type="submit" disabled={submitting || !comment.trim()} className="btn-primary px-3 py-2">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default function PoliticianDashboard() {
  const { user } = useAuth();
  const [active, setActive] = useState('dashboard');
  const [issues, setIssues] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [alert, setAlert] = useState(null);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [issueRes, updateRes, feedRes] = await Promise.all([
        api.get('/issues'), api.get('/updates'), api.get('/feedback')
      ]);
      setIssues(issueRes.data);
      setUpdates(updateRes.data.filter(u => u.politician_id === user.id));
      setFeedbacks(feedRes.data);
    } catch { showAlert('Failed to load data', 'error'); }
    finally { setLoading(false); }
  }, [user.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handlePostUpdate = async form => {
    try {
      await api.post('/updates', form);
      await fetchAll();
      setModal(null);
      showAlert('Update posted successfully! 📢');
    } catch (err) { showAlert(err.response?.data?.message || 'Failed to post', 'error'); }
  };

  const handleDeleteUpdate = async id => {
    if (!confirm('Delete this update?')) return;
    try {
      await api.delete(`/updates/${id}`);
      await fetchAll();
      showAlert('Update deleted');
    } catch { showAlert('Failed to delete', 'error'); }
  };

  const openIssueDetail = async issue => {
    try {
      const { data } = await api.get(`/issues/${issue.id}`);
      setSelectedIssue(data);
      setModal('detail');
    } catch { showAlert('Failed to load issue', 'error'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/issues/${id}`, { status });
      const { data } = await api.get(`/issues/${id}`);
      setSelectedIssue(data);
      await fetchAll();
      showAlert(`Issue marked as ${status.replace('_', ' ')} ✅`);
    } catch { showAlert('Failed to update status', 'error'); }
  };

  const handleComment = async (issueId, content) => {
    try {
      await api.post(`/issues/${issueId}/comments`, { content });
      const { data } = await api.get(`/issues/${issueId}`);
      setSelectedIssue(data);
    } catch { showAlert('Failed to add comment', 'error'); }
  };

  const stats = {
    assigned: issues.filter(i => i.politician_id === user.id).length,
    open: issues.filter(i => i.politician_id === user.id && i.status === 'open').length,
    resolved: issues.filter(i => i.politician_id === user.id && i.status === 'resolved').length,
    avgRating: feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : '—',
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active={active} setActive={setActive} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {active === 'dashboard' && 'Politician Dashboard'}
              {active === 'issues' && 'Citizen Issues'}
              {active === 'updates' && 'My Updates'}
              {active === 'feedback' && 'My Ratings & Feedback'}
            </h2>
            <p className="text-sm text-gray-400">Welcome, {user?.name} {user?.constituency ? `• ${user.constituency}` : ''}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw size={15} /> Refresh
            </button>
            {active === 'updates' && (
              <button onClick={() => setModal('update')} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={16} /> Post Update
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {alert && <div className="mb-4"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

          {/* ── DASHBOARD ── */}
          {active === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Assigned Issues" value={stats.assigned} icon="📋" color="bg-emerald-50" />
                <StatCard title="Open Issues" value={stats.open} icon="🔵" color="bg-blue-50" sub="Need response" />
                <StatCard title="Resolved" value={stats.resolved} icon="✅" color="bg-green-50" />
                <StatCard title="Avg Rating" value={stats.avgRating} icon="⭐" color="bg-yellow-50" sub={`from ${feedbacks.length} reviews`} />
              </div>

              {/* Open issues */}
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-4">Pending Citizen Issues</h3>
                {loading ? <LoadingSpinner /> :
                  issues.filter(i => i.politician_id === user.id && i.status === 'open').length === 0
                    ? <EmptyState icon="🎉" message="No pending issues!" sub="All caught up" />
                    : issues.filter(i => i.politician_id === user.id && i.status === 'open').slice(0, 5).map(issue => (
                        <div key={issue.id} onClick={() => openIssueDetail(issue)}
                          className="flex items-start gap-4 p-4 bg-gray-50 hover:bg-emerald-50 rounded-xl cursor-pointer transition-all mb-2 border border-transparent hover:border-emerald-100">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">{issue.title}</p>
                            <p className="text-sm text-gray-500 truncate">{issue.citizen_name} • {formatTime(issue.created_at)}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <PriorityBadge priority={issue.priority} />
                          </div>
                        </div>
                    ))
                }
              </div>

              {/* My recent updates */}
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-4">My Recent Updates</h3>
                {updates.length === 0 ? <EmptyState icon="📢" message="No updates posted yet" sub="Keep citizens informed" />
                  : updates.slice(0, 3).map(u => (
                    <div key={u.id} className="border-l-4 border-emerald-400 pl-4 py-2 mb-3">
                      <p className="font-semibold text-gray-800 text-sm">{u.title}</p>
                      <p className="text-xs text-gray-400">{formatTime(u.created_at)}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{u.content}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* ── ISSUES TAB ── */}
          {active === 'issues' && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4">Citizen Issues ({issues.length})</h3>
              {loading ? <LoadingSpinner /> : issues.length === 0 ? (
                <EmptyState icon="📭" message="No issues assigned" />
              ) : (
                <div className="space-y-3">
                  {issues.map(issue => (
                    <div key={issue.id} onClick={() => openIssueDetail(issue)}
                      className="p-4 border border-gray-100 hover:border-emerald-200 bg-white hover:bg-emerald-50/30 rounded-xl cursor-pointer transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800">{issue.title}</p>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{issue.description}</p>
                          <div className="flex gap-2 mt-2 flex-wrap items-center">
                            <span className="badge bg-gray-100 text-gray-600">{issue.category}</span>
                            <span className="text-xs text-gray-500">By: {issue.citizen_name}</span>
                            <span className="text-xs text-gray-400">{formatTime(issue.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <StatusBadge status={issue.status} />
                          <PriorityBadge priority={issue.priority} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── UPDATES TAB ── */}
          {active === 'updates' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setModal('update')} className="btn-primary flex items-center gap-2">
                  <Plus size={16} /> Post Update
                </button>
              </div>
              {loading ? <LoadingSpinner /> : updates.length === 0 ? (
                <div className="card"><EmptyState icon="📢" message="No updates posted" sub="Keep your constituents informed" /></div>
              ) : updates.map(u => (
                <div key={u.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-800">{u.title}</h4>
                        <span className="badge bg-emerald-100 text-emerald-700">{u.category}</span>
                      </div>
                      <p className="text-gray-600 mt-2 leading-relaxed">{u.content}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatTime(u.created_at)}</p>
                    </div>
                    <button onClick={() => handleDeleteUpdate(u.id)}
                      className="text-red-400 hover:text-red-600 ml-4 p-2 hover:bg-red-50 rounded-lg transition-all">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── FEEDBACK TAB ── */}
          {active === 'feedback' && (
            <div className="space-y-4">
              <div className="card bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-100">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-5xl font-extrabold text-emerald-600">{stats.avgRating}</p>
                    <p className="text-sm text-gray-500 mt-1">Average Rating</p>
                  </div>
                  <div>
                    {[5,4,3,2,1].map(n => {
                      const count = feedbacks.filter(f => f.rating === n).length;
                      const pct = feedbacks.length ? (count / feedbacks.length) * 100 : 0;
                      return (
                        <div key={n} className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 w-4">{n}★</span>
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div style={{ width: `${pct}%` }} className="h-full bg-yellow-400 rounded-full" />
                          </div>
                          <span className="text-xs text-gray-400">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {loading ? <LoadingSpinner /> : feedbacks.length === 0 ? (
                <div className="card"><EmptyState icon="⭐" message="No feedback yet" /></div>
              ) : feedbacks.map(f => (
                <div key={f.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-700">{f.citizen_name}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5].map(n => <span key={n} className={`text-base ${n <= f.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>)}
                      </div>
                      {f.comment && <p className="text-sm text-gray-600 mt-2 italic">"{f.comment}"</p>}
                      <p className="text-xs text-gray-400 mt-1">{formatTime(f.created_at)}</p>
                    </div>
                    <span className="badge bg-yellow-100 text-yellow-700 text-base">{f.rating}/5</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Modal open={modal === 'update'} onClose={() => setModal(null)} title="📢 Post New Update">
        <UpdateForm onSubmit={handlePostUpdate} onClose={() => setModal(null)} />
      </Modal>

      <Modal open={modal === 'detail'} onClose={() => { setModal(null); setSelectedIssue(null); }}
        title={selectedIssue?.title || 'Issue Detail'}>
        {selectedIssue && (
          <IssueDetail issue={selectedIssue} onClose={() => setModal(null)}
            onStatusChange={handleStatusChange} onComment={handleComment} />
        )}
      </Modal>
    </div>
  );
}
