import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'es'
});

export type Locale = (typeof routing.locales)[number]

export function isValidLocale(locale: string): locale is Locale {
  return routing.locales.includes(locale as Locale)
}

export const {Link, redirect, usePathname, useRouter} =
  createNavigation(routing);

