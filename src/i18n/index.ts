import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    throw new Error('Locale is required');
  }
  
  // Load messages for the requested locale
  return {
    locale, 
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
