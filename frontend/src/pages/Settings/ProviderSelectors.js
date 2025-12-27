import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export function ProviderSelector({ label, options, value, onChange, t }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div className="space-y-2">
        {options.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className="w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-3"
            style={{
              backgroundColor: value === opt.id ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
              border: value === opt.id ? '2px solid var(--color-accent)' : '2px solid transparent'
            }}
          >
            {value === opt.id && (
              <CheckCircleIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
            )}
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm block" style={{ color: 'var(--color-text-primary)' }}>{opt.name}</span>
              <span className="text-xs block truncate" style={{ color: 'var(--color-text-muted)' }}>
                {opt.descriptionKey ? t(opt.descriptionKey) : opt.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ModelSelector({ label, options, value, onChange }) {
  if (!options || options.length === 0) return null;
  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      <select
        value={value || options[0]?.id}
        onChange={(e) => onChange(e.target.value)}
        className="cinema-input w-full text-sm"
      >
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>
            {opt.name} - {opt.description}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ProviderWithModelSelector({
  label,
  providerOptions,
  modelOptionsMap,
  providerValue,
  modelValue,
  onProviderChange,
  onModelChange,
  t
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div className="space-y-2">
        {providerOptions.map(opt => (
          <div
            key={opt.id}
            className="rounded-lg transition-all duration-200"
            style={{
              backgroundColor: providerValue === opt.id ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
              border: providerValue === opt.id ? '2px solid var(--color-accent)' : '2px solid transparent'
            }}
          >
            <button
              type="button"
              onClick={() => onProviderChange(opt.id)}
              className="w-full p-3 text-left flex items-center gap-3"
            >
              {providerValue === opt.id && (
                <CheckCircleIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
              )}
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm block" style={{ color: 'var(--color-text-primary)' }}>{opt.name}</span>
                <span className="text-xs block truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {opt.descriptionKey ? t(opt.descriptionKey) : opt.description}
                </span>
              </div>
            </button>
            {providerValue === opt.id && modelOptionsMap[opt.id] && modelOptionsMap[opt.id].length > 1 && (
              <div className="px-3 pb-3">
                <ModelSelector
                  label="Model"
                  options={modelOptionsMap[opt.id]}
                  value={modelValue}
                  onChange={onModelChange}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
