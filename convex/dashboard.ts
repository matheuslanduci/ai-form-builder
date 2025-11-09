import { v } from 'convex/values'
import { query } from './_generated/server'
import { resolveIdentity, resolveMembership } from './auth'

export const getDashboardData = query({
	args: {
		businessId: v.string()
	},
	async handler(ctx, args) {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		const allForms = await ctx.db
			.query('form')
			.withIndex('byBusinessId', (q) => q.eq('businessId', args.businessId))
			.order('desc')
			.collect()

		const totalForms = allForms.length
		const draftForms = allForms.filter((f) => f.status === 'draft').length
		const publishedForms = allForms.filter(
			(f) => f.status === 'published'
		).length
		const archivedForms = allForms.filter((f) => f.status === 'archived').length
		const totalSubmissions = allForms.reduce(
			(sum, form) => sum + form.submissionCount,
			0
		)

		const recentForms = allForms
			.sort((a, b) => {
				const aTime = a.lastUpdatedAt ?? a._creationTime
				const bTime = b.lastUpdatedAt ?? b._creationTime
				return bTime - aTime
			})
			.slice(0, 4)
			.map((form) => ({
				_id: form._id,
				_creationTime: form._creationTime,
				title: form.title,
				description: form.description,
				status: form.status,
				submissionCount: form.submissionCount,
				lastUpdatedAt: form.lastUpdatedAt,
				tags: form.tags
			}))

		const tags = await ctx.db
			.query('tag')
			.withIndex('byBusinessId', (q) => q.eq('businessId', args.businessId))
			.collect()

		const tagsCount = tags.length

		const allActivity = await ctx.db
			.query('formEditHistory')
			.order('desc')
			.collect()

		const recentActivity = []
		for (const activity of allActivity) {
			if (recentActivity.length >= 10) break
			const form = await ctx.db.get(activity.formId)
			if (form && form.businessId === args.businessId) {
				recentActivity.push(activity)
			}
		}

		// Enrich activity with form titles
		const activityWithFormData = await Promise.all(
			recentActivity.map(async (activity) => {
				const form = await ctx.db.get(activity.formId)
				return {
					_id: activity._id,
					_creationTime: activity._creationTime,
					formId: activity.formId,
					formTitle: form?.title ?? 'Unknown Form',
					editType: activity.editType,
					changeDetails: activity.changeDetails,
					userId: activity.userId
				}
			})
		)

		return {
			stats: {
				totalForms,
				draftForms,
				publishedForms,
				archivedForms,
				totalSubmissions,
				tagsCount
			},
			recentForms,
			recentActivity: activityWithFormData
		}
	}
})

export const getTopPerformingForms = query({
	args: {
		businessId: v.string(),
		limit: v.optional(v.number())
	},
	async handler(ctx, args) {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		const limit = args.limit ?? 5

		// Get all forms and sort by submission count
		const forms = await ctx.db
			.query('form')
			.withIndex('byBusinessId', (q) => q.eq('businessId', args.businessId))
			.collect()

		const topForms = forms
			.filter((f) => f.submissionCount > 0)
			.sort((a, b) => b.submissionCount - a.submissionCount)
			.slice(0, limit)
			.map((form) => ({
				_id: form._id,
				title: form.title,
				submissionCount: form.submissionCount,
				status: form.status
			}))

		return topForms
	}
})
