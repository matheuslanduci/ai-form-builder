import { v } from 'convex/values'
import { query } from './_generated/server'
import { resolveIdentity, resolveMembership } from './auth'

export const getSubmissionsOverTime = query({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		startDate: v.optional(v.number()), // timestamp
		endDate: v.optional(v.number()) // timestamp
	},
	handler: async (ctx, args) => {
		// Auth check
		const identity = await resolveIdentity(ctx)

		if (identity.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: identity.subject
			})
		}

		// Verify form ownership
		const form = await ctx.db.get(args.formId)
		if (!form || form.businessId !== args.businessId) {
			throw new Error('Form not found')
		}

		// Get all submissions for this form
		const submissions = await ctx.db
			.query('formSubmission')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		// Filter by date range if provided
		const filteredSubmissions = submissions.filter((submission) => {
			if (args.startDate && submission.submittedAt < args.startDate) {
				return false
			}
			if (args.endDate && submission.submittedAt > args.endDate) {
				return false
			}
			return true
		})

		// Group submissions by day
		const submissionsByDay = new Map<string, number>()

		for (const submission of filteredSubmissions) {
			const date = new Date(submission.submittedAt)
			// Format as YYYY-MM-DD
			const dateKey = date.toISOString().split('T')[0]

			submissionsByDay.set(dateKey, (submissionsByDay.get(dateKey) || 0) + 1)
		}

		// Convert to array and sort by date
		const dailyData = Array.from(submissionsByDay.entries())
			.map(([date, count]) => ({
				date,
				count
			}))
			.sort((a, b) => a.date.localeCompare(b.date))

		// Calculate metrics
		const totalSubmissions = filteredSubmissions.length

		// Calculate average submissions per day
		const daysInRange = dailyData.length || 1
		const averagePerDay = totalSubmissions / daysInRange

		// Find peak day
		const peakDay = dailyData.reduce(
			(max, current) => (current.count > max.count ? current : max),
			{ date: '', count: 0 }
		)

		// Calculate growth percentage (compare first half vs second half)
		let growthPercentage = 0
		if (dailyData.length >= 2) {
			const midpoint = Math.floor(dailyData.length / 2)
			const firstHalf = dailyData.slice(0, midpoint)
			const secondHalf = dailyData.slice(midpoint)

			const firstHalfTotal = firstHalf.reduce((sum, d) => sum + d.count, 0)
			const secondHalfTotal = secondHalf.reduce((sum, d) => sum + d.count, 0)

			const firstHalfAvg = firstHalfTotal / firstHalf.length
			const secondHalfAvg = secondHalfTotal / secondHalf.length

			if (firstHalfAvg > 0) {
				growthPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
			}
		}

		return {
			dailyData,
			metrics: {
				totalSubmissions,
				averagePerDay: Math.round(averagePerDay * 10) / 10,
				peakDay: peakDay.date,
				peakDayCount: peakDay.count,
				growthPercentage: Math.round(growthPercentage * 10) / 10
			}
		}
	}
})
