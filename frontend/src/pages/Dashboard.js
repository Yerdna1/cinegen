import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import {
  FilmIcon,
  UsersIcon,
  PlusIcon,
  SparklesIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

// Clear wizard state for new projects
const clearNewWizardState = () => {
  try {
    localStorage.removeItem('cinegen_wizard_new');
  } catch (e) {
    console.error('Failed to clear wizard state:', e);
  }
};

export default function Dashboard() {
  const [stats, setStats] = useState({ projects: 0, characters: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, charactersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/characters')
      ]);

      setRecentProjects(projectsRes.data.projects.slice(0, 5));
      setStats({
        projects: projectsRes.data.projects.length,
        characters: charactersRes.data.characters.length
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            {t('projects.status.completed')}
          </span>
        );
      case 'GENERATING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            {t('projects.status.inProgress')}
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-500">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            {t('projects.status.failed')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-text-muted)' }}></span>
            {t('projects.status.draft')}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="cinema-spinner w-12 h-12" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('dashboard.title')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('dashboard.welcome')}
          </p>
        </div>
        <Link
          to="/projects/new"
          onClick={clearNewWizardState}
          className="cinema-btn inline-flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          {t('projects.newProject')}
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Projects Card */}
        <div
          className="cinema-card p-6 group cursor-pointer"
          onClick={() => window.location.href = '/projects'}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {t('dashboard.totalProjects')}
              </p>
              <p className="mt-2 text-4xl font-display font-bold text-gradient">
                {stats.projects}
              </p>
            </div>
            <div
              className="p-3 rounded-xl transition-transform group-hover:scale-110"
              style={{ backgroundColor: 'var(--color-accent-subtle)' }}
            >
              <FilmIcon className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            <span>{t('common.view')} {t('nav.projects').toLowerCase()}</span>
          </div>
        </div>

        {/* Characters Card */}
        <div
          className="cinema-card p-6 group cursor-pointer"
          onClick={() => window.location.href = '/characters'}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {t('dashboard.totalCharacters')}
              </p>
              <p className="mt-2 text-4xl font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {stats.characters}
              </p>
            </div>
            <div
              className="p-3 rounded-xl transition-transform group-hover:scale-110"
              style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)' }}
            >
              <UsersIcon className="w-6 h-6 text-rose-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            <span>{t('common.view')} {t('nav.characters').toLowerCase()}</span>
          </div>
        </div>

        {/* Quick Action Card */}
        <div
          className="cinema-card p-6 group cursor-pointer md:col-span-2 lg:col-span-1"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent) 0%, #B45309 100%)'
          }}
          onClick={() => { clearNewWizardState(); window.location.href = '/projects/new'; }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">
                {t('dashboard.getStarted')}
              </p>
              <p className="mt-2 text-xl font-display font-bold text-white">
                {t('dashboard.createFirstProject')}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/20">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-white/80">
            <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>{t('projects.createProject')}</span>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="cinema-card overflow-hidden">
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {t('dashboard.recentProjects')}
          </h2>
          <Link
            to="/projects"
            className="text-sm font-medium flex items-center gap-1 transition-colors"
            style={{ color: 'var(--color-accent)' }}
          >
            {t('common.all')}
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div>
          {recentProjects.length === 0 ? (
            <div className="p-12 text-center">
              <FilmIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-subtle)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>
                {t('dashboard.noProjectsYet')}
              </p>
              <Link
                to="/projects/new"
                onClick={clearNewWizardState}
                className="cinema-btn mt-4 inline-flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                {t('projects.createProject')}
              </Link>
            </div>
          ) : (
            recentProjects.map((project, index) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block px-6 py-4 transition-all duration-200"
                style={{
                  borderBottom: index < recentProjects.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-accent-subtle)' }}
                    >
                      <FilmIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {project.name}
                      </h3>
                      <p className="text-sm flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                        <span>{project.genre}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {project.durationSeconds}s
                        </span>
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
