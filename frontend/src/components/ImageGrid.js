import React from 'react';
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function ImageGrid({ images, getImageUrl, onDelete, primaryLabel = 'Primary' }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {images.map((img, index) => (
        <div
          key={img.id}
          className="relative aspect-square rounded-lg overflow-hidden group"
          style={{ backgroundColor: 'var(--color-bg-surface)' }}
        >
          <img
            src={getImageUrl(img.imageUrl)}
            alt={`Image ${index + 1}`}
            className="w-full h-full object-cover"
          />
          {index === 0 && (
            <div
              className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg-primary)' }}
            >
              {primaryLabel}
            </div>
          )}
          <button
            type="button"
            onClick={() => onDelete(img.id)}
            className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function NewImageGrid({ images, onRemove }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {images.map((img, index) => (
        <div
          key={index}
          className="relative aspect-square rounded-lg overflow-hidden group"
          style={{ backgroundColor: 'var(--color-bg-surface)' }}
        >
          <img
            src={img.preview}
            alt={`New ${index + 1}`}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.9)', color: 'white' }}
          >
            New
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
