import {getRequestConfig} from 'next-intl/server';
import {isValidLocale, routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  if (!locale || !isValidLocale(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: locale === 'es' 
      ? (await import('../messages/es.json')).default
      : (await import('../messages/en.json')).default
  };
});
