import { useState } from 'react';
import api from '../services/api';
import { setAuth } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { TextInput, PrimaryButton } from '../components/ui';

const LoginPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : form;
      const { data } = await api.post(endpoint, payload);
      setAuth(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-lg shadow-slate-950/60">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-indigo-500 text-xs font-bold mb-2">
            TF
          </div>
          <h1 className="text-lg font-semibold text-slate-50">
            Terraformers Automated Billing System
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'Sign in to your billing workspace'
              : 'Create an account to start billing'}
          </p>
        </div>

        <div className="flex text-xs mb-5 bg-slate-900 rounded-lg p-1">
          <button
            className={`flex-1 py-1.5 rounded-md ${
              mode === 'login'
                ? 'bg-slate-800 text-slate-50'
                : 'text-slate-400'
            }`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            Login
          </button>
          <button
            className={`flex-1 py-1.5 rounded-md ${
              mode === 'signup'
                ? 'bg-slate-800 text-slate-50'
                : 'text-slate-400'
            }`}
            onClick={() => {
              setMode('signup');
              setError('');
            }}
          >
            Signup
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <TextInput
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              required
            />
          )}
          <TextInput
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@company.com"
            required
          />
          <TextInput
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
          {error && (
            <div className="text-[11px] text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <PrimaryButton type="submit" loading={loading} className="w-full mt-1">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

