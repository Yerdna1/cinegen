import React from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';
import { getStatusBadge } from './helpers';

export default function UserProjects({ user, t }) {
  return (
    <div className="cinema-card overflow-hidden">
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Recent Projects
        </h2>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {user._count?.projects || 0} total
        </span>
      </div>

      {user.projects?.length > 0 ? (
        <div>
          {user.projects.map((project, index) => (
            <div
              key={project.id}
              className="px-6 py-4"
              style={{
                borderBottom: index < user.projects.length - 1 ? '1px solid var(--color-border-subtle)' : 'none'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {project.name}
                </span>
                {getStatusBadge(project.status, t)}
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <FolderIcon className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--color-text-subtle)' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>No projects</p>
        </div>
      )}
    </div>
  );
}
