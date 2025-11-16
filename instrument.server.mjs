import * as Sentry from '@sentry/tanstackstart-react'

// Get Sentry DSN from environment variable
const sentryDsn = process.env.VITE_SENTRY_DSN

if (sentryDsn) {
	Sentry.init({
		dsn: sentryDsn,
		sendDefaultPii: true
	})

	console.log('[Sentry] Server instrumentation initialized')
} else {
	console.warn('[Sentry] No DSN provided, skipping server instrumentation')
}
