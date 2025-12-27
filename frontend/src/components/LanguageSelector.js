import React from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageIcon } from '@heroicons/react/24/outline';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' }
];

export default function LanguageSelector({ className = '', compact = false }) {
  const { i18n } = useTranslation();

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const handleChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('cinegen-language', langCode);
  };

  if (compact) {
    return (
      <div className={`relative group ${className}`}>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            color: 'var(--color-text-secondary)'
          }}
        >
          <span className="text-lg">{currentLang.flag}</span>
          <span className="text-sm font-medium">{currentLang.code.toUpperCase()}</span>
        </button>

        {/* Dropdown */}
        <div
          className="absolute right-0 mt-2 py-1 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[140px]"
          style={{
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                lang.code === i18n.language ? 'font-medium' : ''
              }`}
              style={{
                color: lang.code === i18n.language ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                backgroundColor: lang.code === i18n.language ? 'var(--color-accent-subtle)' : 'transparent'
              }}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LanguageIcon className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
      <select
        value={i18n.language}
        onChange={(e) => handleChange(e.target.value)}
        className="cinema-input py-1.5 pr-8 cursor-pointer"
        style={{ minWidth: '140px' }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
