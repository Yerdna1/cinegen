import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpenIcon,
  FilmIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  ScissorsIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PlayIcon,
  MusicalNoteIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

const steps = [
  {
    id: 1,
    key: 'createProject',
    icon: FilmIcon,
    color: 'amber'
  },
  {
    id: 2,
    key: 'addCharacters',
    icon: UserGroupIcon,
    color: 'purple'
  },
  {
    id: 3,
    key: 'generateContent',
    icon: DocumentTextIcon,
    color: 'blue'
  },
  {
    id: 4,
    key: 'generateImages',
    icon: PhotoIcon,
    color: 'emerald'
  },
  {
    id: 5,
    key: 'generateVideos',
    icon: VideoCameraIcon,
    color: 'rose'
  },
  {
    id: 6,
    key: 'generateAudio',
    icon: SpeakerWaveIcon,
    color: 'cyan'
  },
  {
    id: 7,
    key: 'combineInEditor',
    icon: ScissorsIcon,
    color: 'orange'
  }
];

export default function Help() {
  const { t } = useTranslation();
  const [expandedStep, setExpandedStep] = useState(1);

  const toggleStep = (stepId) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const getColorClasses = (color) => {
    const colors = {
      amber: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#F59E0B' },
      purple: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', text: '#8B5CF6' },
      blue: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#3B82F6' },
      emerald: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10B981' },
      rose: { bg: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.3)', text: '#F43F5E' },
      cyan: { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.3)', text: '#06B6D4' },
      orange: { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)', text: '#F97316' }
    };
    return colors[color] || colors.amber;
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 mb-4 shadow-glow">
          <BookOpenIcon className="w-8 h-8 text-cinema-black" />
        </div>
        <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('help.title')}
        </h1>
        <p className="mt-2 text-lg" style={{ color: 'var(--color-text-muted)' }}>
          {t('help.subtitle')}
        </p>
      </div>

      {/* Introduction */}
      <div className="cinema-card p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-accent-subtle)' }}>
            <SparklesIcon className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {t('help.intro.title')}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              {t('help.intro.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Steps Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-display font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <PlayIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          {t('help.stepsTitle')}
        </h2>

        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-8 top-0 bottom-0 w-0.5"
            style={{ backgroundColor: 'var(--color-border-subtle)' }}
          />

          {steps.map((step, index) => {
            const Icon = step.icon;
            const colors = getColorClasses(step.color);
            const isExpanded = expandedStep === step.id;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="relative">
                {/* Step card */}
                <div
                  className="ml-16 cinema-card overflow-hidden transition-all duration-300"
                  style={{
                    marginBottom: isLast ? 0 : '1rem',
                    border: isExpanded ? `1px solid ${colors.border}` : undefined
                  }}
                >
                  {/* Step header */}
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="w-full p-4 flex items-center gap-4 text-left transition-colors"
                    style={{
                      backgroundColor: isExpanded ? colors.bg : 'transparent'
                    }}
                  >
                    {/* Step number circle */}
                    <div
                      className="absolute left-0 w-16 flex justify-center"
                      style={{ transform: 'translateX(-100%)' }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10"
                        style={{
                          backgroundColor: colors.bg,
                          border: `2px solid ${colors.text}`,
                          color: colors.text
                        }}
                      >
                        {step.id}
                      </div>
                    </div>

                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: colors.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: colors.text }} />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {t(`help.steps.${step.key}.title`)}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {t(`help.steps.${step.key}.summary`)}
                      </p>
                    </div>

                    {isExpanded ? (
                      <ChevronUpIcon className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                    )}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div
                      className="px-4 pb-4 space-y-4 animate-fade-in"
                      style={{ borderTop: `1px solid ${colors.border}` }}
                    >
                      <div className="pt-4">
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                          {t(`help.steps.${step.key}.description`)}
                        </p>
                      </div>

                      {/* Instructions list */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {t('help.howTo')}:
                        </h4>
                        <ul className="space-y-2">
                          {[1, 2, 3, 4].map((num) => {
                            const instructionKey = `help.steps.${step.key}.instructions.${num}`;
                            const instruction = t(instructionKey);
                            // Only render if translation exists (not the key itself)
                            if (instruction === instructionKey) return null;
                            return (
                              <li key={num} className="flex items-start gap-2">
                                <CheckCircleIcon
                                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                                  style={{ color: colors.text }}
                                />
                                <span style={{ color: 'var(--color-text-secondary)' }}>
                                  {instruction}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      {/* Tips */}
                      <div
                        className="p-3 rounded-lg flex items-start gap-3"
                        style={{ backgroundColor: 'var(--color-bg-surface)' }}
                      >
                        <LightBulbIcon className="w-5 h-5 flex-shrink-0 text-amber-500" />
                        <div>
                          <span className="text-sm font-medium text-amber-500">{t('help.tip')}:</span>
                          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                            {t(`help.steps.${step.key}.tip`)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* External Editors Section */}
      <div className="cinema-card p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
            <ScissorsIcon className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              {t('help.editors.title')}
            </h2>
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              {t('help.editors.description')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['capcut', 'davinci', 'premiere', 'filmora'].map((editor) => (
                <div
                  key={editor}
                  className="p-4 rounded-lg flex items-center gap-3"
                  style={{ backgroundColor: 'var(--color-bg-surface)' }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-bg-elevated)' }}>
                    <VideoCameraIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <div>
                    <h4 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {t(`help.editors.${editor}.name`)}
                    </h4>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {t(`help.editors.${editor}.desc`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Summary */}
      <div className="cinema-card p-6" style={{ backgroundColor: 'var(--color-accent-subtle)' }}>
        <div className="text-center">
          <h3 className="text-lg font-display font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {t('help.workflow.title')}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {['project', 'characters', 'content', 'images', 'videos', 'audio', 'edit'].map((item, index, arr) => (
              <React.Fragment key={item}>
                <span
                  className="px-3 py-1.5 rounded-full font-medium"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  {t(`help.workflow.${item}`)}
                </span>
                {index < arr.length - 1 && (
                  <ArrowRightIcon className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ or Tips */}
      <div className="cinema-card p-6">
        <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <LightBulbIcon className="w-5 h-5 text-amber-500" />
          {t('help.tips.title')}
        </h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((num) => (
            <div
              key={num}
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg-surface)' }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  backgroundColor: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)'
                }}
              >
                {num}
              </span>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {t(`help.tips.${num}`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
