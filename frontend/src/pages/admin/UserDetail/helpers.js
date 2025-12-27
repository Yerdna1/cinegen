/**
 * UserDetail Helper Functions
 *
 * Badge rendering and utility functions for user detail page.
 */

export const getStatusBadge = (status, t) => {
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

export const getCategoryBadge = (category) => {
  const colors = {
    llm: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' },
    image: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' },
    video: { bg: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' },
    audio: { bg: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' },
    tts: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' },
    credit: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }
  };

  const style = colors[category] || { bg: 'var(--color-bg-surface)', color: 'var(--color-text-muted)' };

  return (
    <span
      className="px-2 py-1 text-xs font-medium rounded-full uppercase"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {category}
    </span>
  );
};
