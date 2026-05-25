const SUPABASE_ERROR_MAP: Record<string, string> = {
  'invalid login credentials': 'invalidCredentials',
  'email not confirmed': 'emailNotConfirmed',
  'user already registered': 'userAlreadyRegistered',
  'password should be at least 6 characters': 'passwordTooShort',
  'too many requests': 'tooManyRequests',
  'network request failed': 'networkError',
  'user not found': 'userNotFound',
  'email already in use': 'emailAlreadyInUse',
  'email_address_invalid': 'invalidEmailAddress',
  'email address': 'invalidEmailAddress',
  'invalid email': 'invalidEmailAddress',
};

export function getAuthErrorKey(error: unknown): string {
  const message = error instanceof Error 
    ? error.message.toLowerCase() 
    : '';
  
  for (const [key, translationKey] of Object.entries(SUPABASE_ERROR_MAP)) {
    if (message.includes(key)) return translationKey;
  }
  
  return 'anErrorOccurred';
}
