import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FilmIcon, ArrowRightIcon, LanguageIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [language, setLanguage] = useState('sk');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const translations = {
    sk: {
      welcomeBack: 'Vitajte späť',
      welcomeBack2: 'vo vašom kreatívnom štúdiu',
      continueCreating: 'Pokračujte v tvorbe filmových príbehov s generovaním videa pomocou AI.',
      trustedBy: 'Dôveruje nám 2 000+ tvorcov po celom svete',
      signIn: 'Prihlásiť sa',
      enterCredentials: 'Zadajte svoje prihlasovacie údaje',
      emailAddress: 'E-mailová adresa',
      password: 'Heslo',
      forgotPassword: 'Zabudli ste heslo?',
      signingIn: 'Prihlasuje sa...',
      or: 'alebo',
      noAccount: 'Nemáte účet?',
      createOne: 'Vytvoriť teraz',
      backToHome: '← Späť na domovskú stránku',
      emailRequired: 'E-mail je povinný',
      emailInvalid: 'Neplatný formát e-mailu',
      passwordRequired: 'Heslo je povinné'
    },
    en: {
      welcomeBack: 'Welcome Back to',
      welcomeBack2: 'Your Creative Studio',
      continueCreating: 'Continue crafting cinematic stories with AI-powered video generation.',
      trustedBy: 'Trusted by 2,000+ creators worldwide',
      signIn: 'Sign In',
      enterCredentials: 'Enter your credentials to access your account',
      emailAddress: 'Email Address',
      password: 'Password',
      forgotPassword: 'Forgot your password?',
      signingIn: 'Signing in...',
      or: 'or',
      noAccount: "Don't have an account?",
      createOne: 'Create one now',
      backToHome: '← Back to home',
      emailRequired: 'Email is required',
      emailInvalid: 'Invalid email format',
      passwordRequired: 'Password is required'
    }
  };

  const t = translations[language];

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = t.emailRequired;
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = t.emailInvalid;
    if (!password) newErrors.password = t.passwordRequired;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      toast.success(language === 'sk' ? 'Prihlásenie úspešné' : 'Login successful');
      navigate(from, { replace: true });
    } catch (error) {
      const message = error.response?.data?.error || (language === 'sk' ? 'Prihlásenie zlyhalo' : 'Login failed');
      toast.error(message);
      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cinema-void text-cream-50 relative overflow-hidden">
      {/* Film grain overlay */}
      <div className="fixed inset-0 bg-noise opacity-[0.015] pointer-events-none mix-blend-overlay z-50" />

      {/* Background gradient */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-amber-500/20 via-transparent to-transparent" />
      </div>

      <div className="relative min-h-screen grid lg:grid-cols-2">
        {/* Left: Branding & Visual */}
        <div className="hidden lg:flex flex-col justify-between p-12 border-r border-cinema-border relative overflow-hidden">
          {/* Background accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-cinema-dark to-cinema-surface opacity-50" />

          {/* Content */}
          <div className="relative z-10">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <FilmIcon className="w-10 h-10 text-amber-400 group-hover:text-amber-300 transition-colors" />
                <div className="absolute inset-0 blur-lg bg-amber-400/30" />
              </div>
              <span className="text-3xl font-display font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-rose-400 bg-clip-text text-transparent">
                CineGen
              </span>
            </Link>
          </div>

          {/* Center content */}
          <div className="relative z-10 space-y-6">
            <h1 className="text-5xl font-display font-bold leading-tight">
              <span className="block text-cream-50">{t.welcomeBack}</span>
              <span className="block bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
                {t.welcomeBack2}
              </span>
            </h1>
            <p className="text-lg text-cinema-subtle max-w-md">
              {t.continueCreating}
            </p>

            {/* Decorative film strip */}
            <div className="flex items-center gap-2 pt-8">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-12 h-16 bg-cinema-surface border border-cinema-border rounded opacity-50"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="relative z-10">
            <p className="text-sm text-cinema-muted">
              {t.trustedBy}
            </p>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden text-center">
              <Link to="/" className="inline-flex items-center space-x-3">
                <FilmIcon className="w-8 h-8 text-amber-400" />
                <span className="text-2xl font-display font-bold bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
                  CineGen
                </span>
              </Link>
            </div>

            {/* Language Switcher */}
            <div className="flex justify-end">
              <button
                onClick={() => setLanguage(language === 'sk' ? 'en' : 'sk')}
                className="flex items-center gap-2 text-cinema-subtle hover:text-cream-50 transition-colors text-sm font-medium"
              >
                <LanguageIcon className="w-4 h-4" />
                {language === 'sk' ? 'EN' : 'SK'}
              </button>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold text-cream-50">
                {t.signIn}
              </h2>
              <p className="text-cinema-subtle">
                {t.enterCredentials}
              </p>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-cream-50">
                  {t.emailAddress}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 bg-cinema-surface border rounded-xl text-cream-50 placeholder-cinema-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all ${
                    errors.email ? 'border-rose-500' : 'border-cinema-border'
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-rose-400 flex items-center gap-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-cream-50">
                  {t.password}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 bg-cinema-surface border rounded-xl text-cream-50 placeholder-cinema-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all ${
                    errors.password ? 'border-rose-500' : 'border-cinema-border'
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-sm text-rose-400 flex items-center gap-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Forgot password */}
              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
                >
                  {t.forgotPassword}
                </Link>
              </div>

              {/* Submit error */}
              {errors.submit && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <p className="text-sm text-rose-400">{errors.submit}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-cinema-black font-bold rounded-xl overflow-hidden shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? t.signingIn : t.signIn}
                  {!loading && <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-cinema-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-cinema-void text-cinema-muted">{t.or}</span>
                </div>
              </div>

              {/* Sign up link */}
              <div className="text-center">
                <p className="text-sm text-cinema-subtle">
                  {t.noAccount}{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    {t.createOne}
                  </Link>
                </p>
              </div>

              {/* Back to home */}
              <div className="text-center pt-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm text-cinema-muted hover:text-cream-50 transition-colors"
                >
                  {t.backToHome}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
