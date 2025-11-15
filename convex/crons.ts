import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Clean up expired export tokens every hour
crons.interval(
	'cleanup expired tokens',
	{ hours: 1 },
	internal.export.cleanupExpiredTokens,
	{}
)

export default crons
