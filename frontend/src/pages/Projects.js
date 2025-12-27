import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  FilmIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { ConfirmModal } from '../components/Modal';

// Clear wizard state for new projects
const clearNewWizardState = () => {
  try {
    localStorage.removeItem('cinegen_wizard_new');
  } catch (e) {
    console.error('Failed to clear wizard state:', e);
  }
};

export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, project: null });
  const { t } = useTranslation();

  useEffect(() => {
    const newParams = new URLSearchParams();
    if (search) newParams.set('search', search);
    if (statusFilter) newParams.set('status', statusFilter);
    setSearchParams(newParams, { replace: true });
  }, [search, statusFilter, setSearchParams]);

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter]);

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/projects?${params.toString()}`);
      setProjects(response.data.projects);
    } catch (error) {
      toast.error(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (project) => {
    setDeleteModal({ isOpen: true, project });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, project: null });
  };

  const handleDelete = async () => {
    if (!deleteModal.project) return;

    try {
      await api.delete(`/projects/${deleteModal.project.id}`);
      toast.success(t('projects.deleted'));
      closeDeleteModal();
      fetchProjects();
    } catch (error) {
      toast.error(t('errors.deleteFailed'));
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
            {t('projects.title')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('projects.subtitle', { count: projects.length })}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            placeholder={t('projects.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cinema-input w-full pl-10"
          />
        </div>
        <div className="relative">
          <FunnelIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cinema-input pl-10 pr-10 cursor-pointer"
            style={{ minWidth: '160px' }}
          >
            <option value="">{t('projects.allStatus')}</option>
            <option value="draft">{t('projects.status.draft')}</option>
            <option value="generating">{t('projects.status.inProgress')}</option>
            <option value="complete">{t('projects.status.completed')}</option>
            <option value="failed">{t('projects.status.failed')}</option>
          </select>
        </div>
      </div>

      {/* Projects List/Table */}
      {projects.length === 0 ? (
        <div className="cinema-card p-12 text-center">
          <FilmIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-subtle)' }} />
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('projects.noProjects')}
          </p>
          <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {t('projects.createFirst')}
          </p>
          <Link
            to="/projects/new"
            onClick={clearNewWizardState}
            className="cinema-btn inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            {t('projects.createProject')}
          </Link>
        </div>
      ) : (
        <div className="cinema-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t('projects.name')}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t('projects.genre')}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t('projects.duration')}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t('projects.statusLabel')}
                  </th>
                  <th
                    className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, idx) => (
                  <tr
                    key={project.id}
                    className="transition-colors duration-150"
                    style={{ borderBottom: idx < projects.length - 1 ? '1px solid var(--color-border-subtle)' : 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'var(--color-accent-subtle)' }}
                        >
                          <FilmIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                        </div>
                        <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {project.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>
                      {project.genre || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                        <ClockIcon className="w-4 h-4" />
                        {project.durationSeconds ? `${project.durationSeconds}s` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(project.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/projects/${project.id}`}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: 'var(--color-accent)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-subtle)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          title={t('common.view')}
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>
                        <Link
                          to={`/projects/${project.id}/edit`}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: 'var(--color-text-muted)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                            e.currentTarget.style.color = 'var(--color-text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--color-text-muted)';
                          }}
                          title={t('common.edit')}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(project)}
                          className="p-2 rounded-lg transition-colors text-red-500"
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          title={t('common.delete')}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title={t('projects.deleteProject')}
        message={t('projects.deleteConfirm', { name: deleteModal.project?.name })}
        confirmText={t('common.delete')}
        confirmColor="red"
      />
    </div>
  );
}
