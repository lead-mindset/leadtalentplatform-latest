/**
 * Simple structured logger for server-side code.
 * In production, this should be replaced with a real logging service
 * (e.g., Sentry, Datadog, CloudWatch).
 */

type LogContext = Record<string, unknown>

function formatLog(level: string, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const ctx = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level}] ${message}${ctx}`
}

export const logger = {
  error: (context: LogContext | string, message?: string) => {
    if (typeof context === 'string') {
      console.error(formatLog('ERROR', context))
    } else {
      console.error(formatLog('ERROR', message ?? 'Error', context))
    }
  },

  warn: (context: LogContext | string, message?: string) => {
    if (typeof context === 'string') {
      console.warn(formatLog('WARN', context))
    } else {
      console.warn(formatLog('WARN', message ?? 'Warning', context))
    }
  },

  info: (context: LogContext | string, message?: string) => {
    if (typeof context === 'string') {
      console.log(formatLog('INFO', context))
    } else {
      console.log(formatLog('INFO', message ?? 'Info', context))
    }
  },

  debug: (context: LogContext | string, message?: string) => {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof context === 'string') {
        console.log(formatLog('DEBUG', context))
      } else {
        console.log(formatLog('DEBUG', message ?? 'Debug', context))
      }
    }
  },
}
