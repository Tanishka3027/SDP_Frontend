import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { StatCard, StatusBadge, PriorityBadge, Modal, EmptyState, LoadingSpinner, Alert, formatTime } from '../components/UI';
import { Plus, Send, Star, RefreshCw, MessageCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import api from '../api';

// ─── Issue Form ───
const IssueForm = ({ politicians, onSubmit, onClose }) => {
  const [form, setForm] = useState({ title: '', description: '', category: 'Infrastructure', priority: 'medium', politician_id: '' });
  const [loading, setLoading] = useState(false);
  const categories = ['Infrastructure', 'Health', 'Education', 'Environment', 'Safety', 'Water', 'Roads', 'General'];
  return (
    <form onSubmit={async e => { e.preventDefault(); setLoading(true); await onSubmit(form); setLoading(false); }} className="space-y-4">
      <div>
        <label className="label">Issue Title *</label>
        <input className="input" placeholder="Brief title of the issue" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
      </div>
      <div>
        <label className="label">Description *</label>
        <textarea className="input resize-none" rows={4} placeholder="Describe the issue in detail..." value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
            {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Assign to Politician (Optional)</label>
        <select className="input" value={form.politician_id} onChange={e => setForm(f => ({...f, politician_id: e.target.value}))}>
          <option value="">-- Select Politician --</option>
          {politicians.map(p => <option key={p.id} value={p.id}>{p.name} {p.constituency ? `(${p.constituency})` : ''}</option>)}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Submitting...' : 'Submit Issue'}
        </button>
      </div>
    </form>
  );
};

// ─── Issue Detail with Comments ───
const IssueDetail = ({ issue, onClose, onComment }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleComment = async e => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    await onComment(issue.id, comment);
    setComment('');
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <StatusBadge status={issue.status} />
        <PriorityBadge priority={issue.priority} />
        <span className="badge bg-gray-100 text-gray-600">{issue.category}</span>
      </div>
      <p className="text-gray-700 leading-relaxed">{issue.description}</p>
      {issue.politician_name && (
        <p className="text-sm text-gray-500">Assigned to: <span className="font-semibold text-gray-700">{issue.politician_name}</span></p>
      )}
      <p className="text-xs text-gray-400">{formatTime(issue.created_at)}</p>

      <div className="border-t pt-4">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MessageCircle size={16} /> Comments ({issue.comments?.length || 0})
        </h4>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {issue.comments?.length === 0 && <p className="text-gray-400 text-sm text-center py-2">No comments yet</p>}
          {issue.comments?.map(c => (
            <div key={c.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-xs text-gray-700">{c.user_name}</span>
                <span className="text-xs text-gray-400 capitalize">({c.user_role})</span>
                <span className="text-xs text-gray-400 ml-auto">{formatTime(c.created_at)}</span>
              </div>
              <p className="text-sm text-gray-600">{c.content}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleComment} className="flex gap-2 mt-3">
          <input className="input flex-1 text-sm" placeholder="Write a comment..." value={comment} onChange={e => setComment(e.target.value)} />
          <button type="submit" disabled={submitting || !comment.trim()} className="btn-primary px-3 py-2">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Feedback Form ───
const FeedbackForm = ({ politicians, onSubmit, onClose }) => {
  const [form, setForm] = useState({ politician_id: '', rating: 0, comment: '' });
  const [loading, setLoading] = useState(false);
  return (
    <form onSubmit={async e => { e.preventDefault(); setLoading(true); await onSubmit(form); setLoading(false); }} className="space-y-4">
      <div>
        <label className="label">Select Politician *</label>
        <select className="input" value={form.politician_id} onChange={e => setForm(f => ({...f, politician_id: e.target.value}))} required>
          <option value="">-- Select --</option>
          {politicians.map(p => <option key={p.id} value={p.id}>{p.name} {p.constituency ? `(${p.constituency})` : ''}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Rating *</label>
        <div className="flex gap-2 mt-1">
          {[1,2,3,4,5].map(n => (
            <button type="button" key={n} onClick={() => setForm(f => ({...f, rating: n}))}
              className={`w-10 h-10 rounded-full border-2 font-bold text-sm transition-all ${form.rating >= n ? 'bg-yellow-400 border-yellow-500 text-white' : 'border-gray-200 text-gray-400 hover:border-yellow-300'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Comment (Optional)</label>
        <textarea className="input resize-none" rows={3} placeholder="Share your thoughts..." value={form.comment} onChange={e => setForm(f => ({...f, comment: e.target.value}))} />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading || !form.politician_id || !form.rating} className="btn-primary flex-1">
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  );
};

// ─── Main Citizen Dashboard ───
export default function CitizenDashboard() {
  const { user } = useAuth();
  const [active, setActive] = useState('dashboard');
  const [issues, setIssues] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [politicians, setPoliticians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // 'issue' | 'feedback' | {detail: issue}
  const [alert, setAlert] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [issueRes, updateRes, feedRes, polRes] = await Promise.all([
        api.get('/issues'), api.get('/updates'), api.get('/feedback'), api.get('/politicians')
      ]);
      setIssues(issueRes.data);
      setUpdates(updateRes.data);
      setFeedbacks(feedRes.data);
      setPoliticians(polRes.data);
    } catch { showAlert('Failed to load data', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleNewIssue = async form => {
    try {
      await api.post('/issues', form);
      await fetchAll();
      setModal(null);
      showAlert('Issue reported successfully! ✅');
    } catch (err) { showAlert(err.response?.data?.message || 'Failed to submit', 'error'); }
  };

  const openIssueDetail = async (issue) => {
    try {
      const { data } = await api.get(`/issues/${issue.id}`);
      setSelectedIssue(data);
      setModal('detail');
    } catch { showAlert('Failed to load issue', 'error'); }
  };

  const handleComment = async (issueId, content) => {
    try {
      await api.post(`/issues/${issueId}/comments`, { content });
      const { data } = await api.get(`/issues/${issueId}`);
      setSelectedIssue(data);
    } catch { showAlert('Failed to add comment', 'error'); }
  };

  const handleFeedback = async form => {
    try {
      await api.post('/feedback', form);
      await fetchAll();
      setModal(null);
      showAlert('Feedback submitted! ⭐');
    } catch (err) { showAlert(err.response?.data?.message || 'Failed to submit', 'error'); }
  };

  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active={active} setActive={setActive} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {active === 'dashboard' && 'My Dashboard'}
              {active === 'issues' && 'My Issues'}
              {active === 'updates' && 'Political Updates'}
              {active === 'feedback' && 'Feedback'}
            </h2>
            <p className="text-sm text-gray-400">Welcome back, {user?.name} 👋</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw size={15} /> Refresh
            </button>
            {active !== 'updates' && active !== 'feedback' && (
              <button onClick={() => setModal('issue')} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={16} /> Report Issue
              </button>
            )}
            {active === 'feedback' && (
              <button onClick={() => setModal('feedback')} className="btn-primary flex items-center gap-2 text-sm">
                <Star size={16} /> Give Feedback
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {alert && <div className="mb-4"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

          {/* ── DASHBOARD TAB ── */}
          {active === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Total Issues" value={stats.total} icon="📋" color="bg-blue-50" sub="All reported" />
                <StatCard title="Open" value={stats.open} icon="🔵" color="bg-blue-50" sub="Awaiting response" />
                <StatCard title="In Progress" value={stats.inProgress} icon="🟡" color="bg-yellow-50" sub="Being addressed" />
                <StatCard title="Resolved" value={stats.resolved} icon="✅" color="bg-green-50" sub="Successfully closed" />
              </div>

              {/* Recent Issues */}
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-4 text-base">Recent Issues</h3>
                {loading ? <LoadingSpinner /> : issues.length === 0 ? (
                  <EmptyState icon="📭" message="No issues reported yet" sub="Click 'Report Issue' to get started" />
                ) : (
                  <div className="space-y-3">
                    {issues.slice(0, 5).map(issue => (
                      <div key={issue.id} onClick={() => openIssueDetail(issue)}
                        className="flex items-start gap-4 p-4 bg-gray-50 hover:bg-blue-50 rounded-xl cursor-pointer transition-all border border-transparent hover:border-blue-100">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{issue.title}</p>
                          <p className="text-sm text-gray-500 truncate mt-0.5">{issue.description}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(issue.created_at)}</p>
                        </div>
                        <div className="flex flex-col gap-1 items-end shrink-0">
                          <StatusBadge status={issue.status} />
                          <PriorityBadge priority={issue.priority} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Latest Updates */}
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-4 text-base">Latest Political Updates</h3>
                {updates.slice(0, 3).map(u => (
                  <div key={u.id} className="border-l-4 border-primary-400 pl-4 py-2 mb-3">
                    <p className="font-semibold text-gray-800 text-sm">{u.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">by {u.politician_name} • {u.constituency}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{u.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(u.created_at)}</p>
                  </div>
                ))}
                {updates.length === 0 && <EmptyState icon="📢" message="No updates yet" />}
              </div>
            </div>
          )}

          {/* ── ISSUES TAB ── */}
          {active === 'issues' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">My Reported Issues ({issues.length})</h3>
                <button onClick={() => setModal('issue')} className="btn-primary text-sm flex items-center gap-2">
                  <Plus size={15} /> New Issue
                </button>
              </div>
              {loading ? <LoadingSpinner /> : issues.length === 0 ? (
                <EmptyState icon="📭" message="No issues reported yet" sub="Start by reporting a community issue" />
              ) : (
                <div className="space-y-3">
                  {issues.map(issue => (
                    <div key={issue.id} onClick={() => openIssueDetail(issue)}
                      className="p-4 border border-gray-100 hover:border-primary-200 bg-white hover:bg-blue-50/30 rounded-xl cursor-pointer transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800">{issue.title}</p>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{issue.description}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="badge bg-gray-100 text-gray-600">{issue.category}</span>
                            {issue.politician_name && <span className="text-xs text-gray-500">→ {issue.politician_name}</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(issue.created_at)}</p>
                        </div>
                        <div className="flex flex-col gap-1 items-end shrink-0">
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
              {loading ? <LoadingSpinner /> : updates.length === 0 ? (
                <div className="card"><EmptyState icon="📢" message="No updates posted yet" /></div>
              ) : updates.map(u => (
                <div key={u.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 shrink-0">
                      {u.politician_name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h4 className="font-bold text-gray-800">{u.title}</h4>
                          <p className="text-sm text-gray-500">{u.politician_name} • <span className="text-primary-600">{u.constituency || 'National'}</span></p>
                        </div>
                        <span className="badge bg-emerald-100 text-emerald-700">{u.category}</span>
                      </div>
                      <p className="text-gray-700 mt-2 leading-relaxed">{u.content}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatTime(u.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── FEEDBACK TAB ── */}
          {active === 'feedback' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setModal('feedback')} className="btn-primary flex items-center gap-2">
                  <Star size={16} /> Give Feedback
                </button>
              </div>
              {loading ? <LoadingSpinner /> : feedbacks.length === 0 ? (
                <div className="card"><EmptyState icon="⭐" message="No feedback submitted yet" sub="Rate your representative's performance" /></div>
              ) : feedbacks.map(f => (
                <div key={f.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{f.politician_name}</p>
                      <div className="flex gap-1 mt-1">
                        {[1,2,3,4,5].map(n => (
                          <span key={n} className={`text-lg ${n <= f.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                        ))}
                      </div>
                      {f.comment && <p className="text-sm text-gray-600 mt-2">{f.comment}</p>}
                      <p className="text-xs text-gray-400 mt-1">{formatTime(f.created_at)}</p>
                    </div>
                    <span className="badge bg-yellow-100 text-yellow-700">{f.rating}/5</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <Modal open={modal === 'issue'} onClose={() => setModal(null)} title="📋 Report New Issue">
        <IssueForm politicians={politicians} onSubmit={handleNewIssue} onClose={() => setModal(null)} />
      </Modal>

      <Modal open={modal === 'detail'} onClose={() => { setModal(null); setSelectedIssue(null); }}
        title={selectedIssue?.title || 'Issue Detail'}>
        {selectedIssue && <IssueDetail issue={selectedIssue} onClose={() => setModal(null)} onComment={handleComment} />}
      </Modal>

      <Modal open={modal === 'feedback'} onClose={() => setModal(null)} title="⭐ Submit Feedback">
        <FeedbackForm politicians={politicians} onSubmit={handleFeedback} onClose={() => setModal(null)} />
      </Modal>
    </div>
  );
}
