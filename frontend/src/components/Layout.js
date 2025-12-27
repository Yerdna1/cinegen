import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LanguageSelector from './LanguageSelector';
import {
  HomeIcon,
  FilmIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  PhotoIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  SunIcon,
  MoonIcon,
  SparklesIcon,
  LanguageIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  FilmIcon as FilmIconSolid,
  UsersIcon as UsersIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  PhotoIcon as PhotoIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  QuestionMarkCircleIcon as QuestionMarkCircleIconSolid
} from '@heroicons/react/24/solid';
import api from '../services/api';

const navigation = [
  { key: 'dashboard', href: '/dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
  { key: 'projects', href: '/projects', icon: FilmIcon, iconSolid: FilmIconSolid },
  { key: 'characters', href: '/characters', icon: UsersIcon, iconSolid: UsersIconSolid },
  { key: 'gallery', href: '/gallery', icon: PhotoIcon, iconSolid: PhotoIconSolid },
  { key: 'statistics', href: '/statistics', icon: ChartBarIcon, iconSolid: ChartBarIconSolid },
  { key: 'help', href: '/help', icon: QuestionMarkCircleIcon, iconSolid: QuestionMarkCircleIconSolid },
  { key: 'settings', href: '/settings', icon: Cog6ToothIcon, iconSolid: Cog6ToothIconSolid }
];

const adminNavigation = [
  { key: 'admin', href: '/admin', icon: ShieldCheckIcon, iconSolid: ShieldCheckIconSolid }
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creditBalance, setCreditBalance] = useState(null);
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCreditBalance();
  }, []);

  const fetchCreditBalance = async () => {
    try {
      const response = await api.get('/statistics/credit-balance');
      setCreditBalance(response.data.creditBalance);
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  const allNavigation = user?.role === 'ADMIN'
    ? [...navigation, ...adminNavigation]
    : navigation;

  return (
    <div className="min-h-screen film-grain" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-cinema lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: 'var(--color-bg-elevated)' }}
      >
        {/* Mobile sidebar header */}
        <div
          className="flex items-center justify-between h-16 px-5"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-cinema-black" />
            </div>
            <span className="text-xl font-display font-bold text-gradient">CineGen</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile navigation */}
        <nav className="p-4 space-y-1">
          {allNavigation.map((item) => {
            const active = isActive(item.href);
            const Icon = active ? item.iconSolid : item.icon;
            return (
              <Link
                key={item.key}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`nav-link ${active ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5 mr-3 nav-icon" />
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>

        {/* Mobile sidebar footer */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <button
            onClick={handleLogout}
            className="nav-link w-full justify-start"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            {t('nav.logout')}
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div
          className="flex flex-col flex-grow"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            borderRight: '1px solid var(--color-border-subtle)'
          }}
        >
          {/* Logo */}
          <div
            className="flex items-center h-16 px-5"
            style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-glow">
                <SparklesIcon className="w-5 h-5 text-cinema-black" />
              </div>
              <span className="text-xl font-display font-bold text-gradient">CineGen</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {allNavigation.map((item, index) => {
              const active = isActive(item.href);
              const Icon = active ? item.iconSolid : item.icon;
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={`nav-link ${active ? 'active' : ''}`}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <Icon className="w-5 h-5 mr-3 nav-icon" />
                  <span>{t(`nav.${item.key}`)}</span>
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div
            className="p-3 space-y-2"
            style={{ borderTop: '1px solid var(--color-border-subtle)' }}
          >
            {/* Language selector */}
            <LanguageSelector compact className="w-full" />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="nav-link w-full justify-start group"
            >
              {isDark ? (
                <SunIcon className="w-5 h-5 mr-3 text-amber-500 group-hover:rotate-45 transition-transform duration-300" />
              ) : (
                <MoonIcon className="w-5 h-5 mr-3 text-cinema-muted group-hover:-rotate-12 transition-transform duration-300" />
              )}
              <span>{isDark ? t('nav.lightMode') : t('nav.darkMode')}</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="nav-link w-full justify-start hover:text-rose-500"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Top header */}
        <header
          className="sticky top-0 z-30 flex items-center h-16 px-4 lg:px-6 backdrop-blur-md"
          style={{
            backgroundColor: isDark ? 'rgba(13, 13, 15, 0.8)' : 'rgba(250, 247, 242, 0.8)',
            borderBottom: '1px solid var(--color-border-subtle)'
          }}
        >
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg lg:hidden transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 ml-2 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-cinema-black" />
            </div>
            <span className="font-display font-bold text-gradient">CineGen</span>
          </div>

          <div className="flex-1" />

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Theme toggle (mobile) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg lg:hidden transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                color: isDark ? '#FBBF24' : 'var(--color-text-muted)'
              }}
            >
              {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>

            {/* Credit balance */}
            {creditBalance !== null && (
              <Link
                to="/statistics"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 group hover:scale-105"
                style={{
                  backgroundColor: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)'
                }}
              >
                <CurrencyDollarIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span className="text-sm font-semibold">{creditBalance.toFixed(2)}</span>
              </Link>
            )}

            {/* User info */}
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-secondary)'
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-bg-primary)'
                }}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm max-w-[120px] truncate">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 animate-fade-in">
          <Outlet />
        </main>

        {/* Footer */}
        <footer
          className="py-4 px-6 text-center text-xs"
          style={{
            color: 'var(--color-text-subtle)',
            borderTop: '1px solid var(--color-border-subtle)'
          }}
        >
          <span className="font-display">CineGen</span> — {t('footer.tagline')}
        </footer>
      </div>
    </div>
  );
}
