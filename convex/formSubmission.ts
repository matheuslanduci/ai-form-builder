import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { resolveIdentity, resolveMembership } from './auth'
import { notFound } from './error'

export const list = query({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		paginationOpts: paginationOptsValidator
	},
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		const form = await ctx.db.get(args.formId)

		if (!form || form.businessId !== args.businessId) throw notFound()

		return await ctx.db
			.query('formSubmission')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.order('desc')
			.paginate(args.paginationOpts)
	}
})

export const deleteSubmission = mutation({
	args: {
		submissionId: v.id('formSubmission'),
		businessId: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		const submission = await ctx.db.get(args.submissionId)

		if (!submission) throw notFound()

		const form = await ctx.db.get(submission.formId)

		if (!form || form.businessId !== args.businessId) throw notFound()

		await ctx.db.patch(form._id, {
			submissionCount: Math.max(0, form.submissionCount - 1)
		})
		await ctx.db.delete(args.submissionId)

		return null
	}
})

export const deleteAllSubmissions = mutation({
	args: {
		formId: v.id('form'),
		businessId: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		const form = await ctx.db.get(args.formId)

		if (!form || form.businessId !== args.businessId) throw notFound()

		// Get all submissions for this form
		const submissions = await ctx.db
			.query('formSubmission')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		// Delete all submissions
		await Promise.all(submissions.map((s) => ctx.db.delete(s._id)))

		// Reset submission count
		await ctx.db.patch(form._id, {
			submissionCount: 0
		})

		return null
	}
})
