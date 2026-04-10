import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Landmark, Eye, EyeOff, UserCircle2, ShieldCheck } from 'lucide-react';
import { Alert } from '../components/UI';

export default function Login() {
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'citizen', constituency: '', bio: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user;
      if (mode === 'login') {
        user = await login(form.email, form.password);
      } else {
        if (!form.name) { setError('Name is required'); setLoading(false); return; }
        user = await register(form);
      }
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-blue-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, white 2px, transparent 0)', backgroundSize: '50px 50px' }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 shadow-lg">
            <Landmark className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-extrabold text-white">CivicConnect</h1>
          <p className="text-blue-200 mt-1 text-sm font-medium">Bridging Citizens & Elected Representatives</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === 'login' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === 'register' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            {mode === 'register' && (
              <div>
                <label className="label">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="John Doe" required />
              </div>
            )}

            <div>
              <label className="label">Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="input" placeholder="you@example.com" required />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange}
                  className="input pr-11" placeholder={mode === 'register' ? 'Min. 6 characters' : 'Enter password'} required />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="label">Register As</label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {[
                      { value: 'citizen', label: 'Citizen', icon: <UserCircle2 size={20} />, desc: 'Report issues & give feedback' },
                      { value: 'politician', label: 'Politician', icon: <ShieldCheck size={20} />, desc: 'Respond & post updates' }
                    ].map(r => (
                      <button type="button" key={r.value}
                        onClick={() => setForm(f => ({ ...f, role: r.value }))}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${form.role === r.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className={`${form.role === r.value ? 'text-primary-600' : 'text-gray-400'} mb-1`}>{r.icon}</div>
                        <p className={`font-semibold text-sm ${form.role === r.value ? 'text-primary-700' : 'text-gray-700'}`}>{r.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Constituency / Area</label>
                  <input name="constituency" value={form.constituency} onChange={handleChange} className="input" placeholder="e.g. Mumbai North" />
                </div>

                {form.role === 'politician' && (
                  <div>
                    <label className="label">Short Bio</label>
                    <textarea name="bio" value={form.bio} onChange={handleChange} className="input resize-none" rows={2}
                      placeholder="Brief description about yourself..." />
                  </div>
                )}
              </>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            {/* {mode === 'login' && (
              <div className="text-center">
                <p className="text-xs text-gray-400 mt-2">Demo Admin: <span className="font-mono text-gray-600">admin@civicconnect.com</span> / <span className="font-mono text-gray-600">Admin@123</span></p>
              </div>
            )} */}
          </form>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '🗳️', text: 'Report Issues' },
            { icon: '📢', text: 'Get Updates' },
            { icon: '⭐', text: 'Give Feedback' },
          ].map(f => (
            <div key={f.text} className="bg-white/10 backdrop-blur-sm rounded-xl py-3 px-2">
              <div className="text-2xl mb-1">{f.icon}</div>
              <p className="text-white text-xs font-medium">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
