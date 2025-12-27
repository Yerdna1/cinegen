import React from 'react';
import { useTranslation } from 'react-i18next';

export default function StatusBadge({ status }) {
  const { t } = useTranslation();

  const statusConfig = {
    COMPLETE: {
      bg: 'bg-green-500/10',
      text: 'text-green-500',
      label: t('projects.status.completed'),
      showDot: true
    },
    GENERATING: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-500',
      label: t('projects.status.inProgress'),
      showDot: true,
      animate: true
    },
    FAILED: {
      bg: 'bg-red-500/10',
      text: 'text-red-500',
      label: t('projects.status.failed'),
      showDot: true
    },
    default: {
      bg: 'var(--color-bg-surface)',
      text: 'var(--color-text-muted)',
      label: t('projects.status.draft'),
      showDot: true
    }
  };

  const config = statusConfig[status] || statusConfig.default;
  const isDefault = !statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${isDefault ? '' : config.bg + ' ' + config.text}`}
      style={isDefault ? { backgroundColor: config.bg, color: config.text } : {}}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isDefault ? '' : (config.text.replace('text-', 'bg-') + (config.animate ? ' animate-pulse' : ''))}`}
        style={isDefault ? { backgroundColor: config.text } : {}}
      ></span>
      {config.label}
    </span>
  );
}
