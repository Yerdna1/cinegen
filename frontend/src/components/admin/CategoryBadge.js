import React from 'react';

const CATEGORY_COLORS = {
  llm: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' },
  image: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' },
  video: { bg: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' },
  audio: { bg: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' },
  tts: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' },
  credit: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }
};

export default function CategoryBadge({ category }) {
  const style = CATEGORY_COLORS[category] || {
    bg: 'var(--color-bg-surface)',
    color: 'var(--color-text-muted)'
  };

  return (
    <span
      className="px-2 py-1 text-xs font-medium rounded-full uppercase"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {category}
    </span>
  );
}
