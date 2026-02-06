"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Languages } from 'lucide-react';

// Locale display configuration
const LOCALE_CONFIG: Record<string, { native: string; english: string; flag: string }> = {
  en: { native: 'English', english: 'English', flag: '🇺🇸' },
  es: { native: 'Español', english: 'Spanish', flag: '🇵🇪' },
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const currentLocale = LOCALE_CONFIG[locale];

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger 
        className="gap-2" 
        aria-label="Select language"
      >
        <Languages className="h-4 w-4 shrink-0 opacity-70" />
        <SelectValue>
          <span className="text-base">{currentLocale?.flag}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" align='end'>
        {routing.locales.map((localeCode) => {
          const config = LOCALE_CONFIG[localeCode];
          if (!config) return null;

          return (
            <SelectItem 
              key={localeCode} 
              value={localeCode}
              className="cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{config.flag}</span>
                <span className="flex flex-col gap-1">
                  <span className="font-medium">{config.native}</span>
                  <span className="text-xs text-muted-foreground">
                    {config.english}
                  </span>
                </span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}