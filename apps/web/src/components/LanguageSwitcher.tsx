'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
] as const;

export default function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchLanguage = (newLocale: string) => {
    // Set cookie for locale preference
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`; // 1 year
    // Update HTML lang attribute
    document.documentElement.lang = newLocale;
    // Reload to apply new locale
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="btn-lift flex items-center gap-2 min-w-[110px] sm:min-w-[130px] bg-white/80 backdrop-blur-sm hover:bg-white"
        aria-label={t('select')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe size={16} className="flex-shrink-0 text-primary" />
        <span className="font-medium text-xs sm:text-sm truncate">
          {currentLanguage.nativeName}
        </span>
        <ChevronDown 
          size={14} 
          className={`flex-shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 md:hidden" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div 
            className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in-0 zoom-in-95 duration-200"
            role="listbox"
            aria-label={t('select')}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLanguage(lang.code)}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors duration-150 touch-manipulation
                  ${locale === lang.code 
                    ? 'bg-primary/10 text-primary font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }`}
                role="option"
                aria-selected={locale === lang.code}
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className={`text-sm ${lang.code === 'ml' ? 'font-malayalam' : ''}`}>
                    {lang.nativeName}
                  </span>
                  {lang.code !== 'en' && (
                    <span className="text-xs text-gray-500">{lang.name}</span>
                  )}
                </div>
                {locale === lang.code && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
