import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FilmIcon, ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/[a-zA-Z]/.test(password)) newErrors.password = 'Password must contain at least one letter';
    else if (!/[0-9]/.test(password)) newErrors.password = 'Password must contain at least one number';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register(email, password);
      toast.success('Registration successful! Please verify your email.');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
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
        <div className="absolute inset-0 bg-gradient-radial from-rose-500/20 via-transparent to-transparent" />
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
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm">
              <SparklesIcon className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-amber-300 font-medium">Start Creating Today</span>
            </div>

            <h1 className="text-5xl font-display font-bold leading-tight">
              <span className="block text-cream-50">Join the Future of</span>
              <span className="block bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent">
                AI Video Creation
              </span>
            </h1>

            <p className="text-lg text-cinema-subtle max-w-md">
              Create stunning long-form videos with consistent characters and cinematic quality.
            </p>

            {/* Features list */}
            <ul className="space-y-3 pt-4">
              {[
                'AI-powered scene generation',
                'Consistent character creation',
                'Natural dialogue synthesis',
                'Professional video output'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-cinema-subtle">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom */}
          <div className="relative z-10 space-y-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 border-2 border-cinema-black"
                />
              ))}
            </div>
            <p className="text-sm text-cinema-muted">
              Join 2,000+ creators building with CineGen
            </p>
          </div>
        </div>

        {/* Right: Register Form */}
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

            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold text-cream-50">
                Create Account
              </h2>
              <p className="text-cinema-subtle">
                Start your creative journey in minutes
              </p>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-cream-50">
                  Email Address
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
                  <p className="text-sm text-rose-400">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-cream-50">
                  Password
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
                  <p className="text-sm text-rose-400">{errors.password}</p>
                )}
                <p className="text-xs text-cinema-muted">
                  Min 8 characters, at least one letter and number
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-cream-50">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 bg-cinema-surface border rounded-xl text-cream-50 placeholder-cinema-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all ${
                    errors.confirmPassword ? 'border-rose-500' : 'border-cinema-border'
                  }`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-rose-400">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-cinema-black font-bold rounded-xl overflow-hidden shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? 'Creating account...' : 'Create Account'}
                  {!loading && <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Terms */}
              <p className="text-xs text-center text-cinema-muted">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-cinema-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-cinema-void text-cinema-muted">or</span>
                </div>
              </div>

              {/* Sign in link */}
              <div className="text-center">
                <p className="text-sm text-cinema-subtle">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              {/* Back to home */}
              <div className="text-center pt-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm text-cinema-muted hover:text-cream-50 transition-colors"
                >
                  ← Back to home
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
