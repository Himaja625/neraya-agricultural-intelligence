import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import Logo from './ui/Logo';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, Loader2 } from './ui/Icons';

type AuthView = 'login' | 'signup' | 'forgot';

interface AuthProps {
  view: AuthView;
  onNavigate: (view: AuthView) => void;
  onBack: () => void;
}

export default function Auth({ view, onNavigate, onBack }: AuthProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const titles = {
    login: 'Welcome back',
    signup: 'Create your account',
    forgot: 'Reset your password',
  };

  const subtitles = {
    login: 'Sign in to continue working with your fields.',
    signup: 'Start understanding your crops with Neraya.',
    forgot: 'We\'ll send you a link to reset your password.',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (view === 'login') {
        const { error } = await signIn(email, password);
        if (error) setError(error);
      } else if (view === 'signup') {
        const { error } = await signUp(email, password);
        if (error) setError(error);
        else setError('Check your email for a confirmation link to finish creating your account.');
      } else if (view === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) setError(error);
        else setResetSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-forest-50">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-sm">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-forest-500 hover:text-forest-700 transition-colors mb-8">
            <ArrowLeft size={16} />
            Back to home
          </button>

          <div className="mb-8">
            <Logo size="lg" className="mb-6" />
            <h1 className="font-serif text-2xl font-medium text-forest-950 mb-2">{titles[view]}</h1>
            <p className="text-sm text-forest-500">{subtitles[view]}</p>
          </div>

          {resetSent ? (
            <div className="card p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50 text-success-600 mx-auto mb-4">
                <Mail size={20} />
              </div>
              <h3 className="font-serif text-lg font-medium text-forest-900 mb-2">Check your email</h3>
              <p className="text-sm text-forest-500 mb-4">
                If an account exists for {email}, you'll receive a link to reset your password.
              </p>
              <button onClick={() => onNavigate('login')} className="btn-secondary w-full">
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {view !== 'forgot' && (
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      className="input-field pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-forest-400 hover:text-forest-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-error-50 border border-error-100 text-sm text-error-700">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {view === 'login' ? 'Sign in' : view === 'signup' ? 'Create account' : 'Send reset link'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {view === 'login' && (
                <div className="text-center">
                  <button type="button" onClick={() => onNavigate('forgot')} className="text-sm text-forest-500 hover:text-forest-700">
                    Forgot your password?
                  </button>
                </div>
              )}

              {view !== 'forgot' && (
                <p className="text-center text-sm text-forest-500">
                  {view === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => onNavigate(view === 'login' ? 'signup' : 'login')}
                    className="font-medium text-forest-700 hover:text-forest-900"
                  >
                    {view === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
