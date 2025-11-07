import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import { mutation, query } from './_generated/server'
import { resolveIdentity, resolveMembership } from './auth'
import { notFound } from './error'

export const list = query({
	args: {
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

		return await ctx.db
			.query('form')
			.withIndex('byBusinessId', (q) => q.eq('businessId', args.businessId))
			.paginate(args.paginationOpts)
	}
})

export const get = query({
	args: {
		formId: v.id('form'),
		businessId: v.string()
	},
	returns: v.union(
		v.object({
			_id: v.id('form'),
			_creationTime: v.number(),
			businessId: v.string(),
			title: v.string(),
			description: v.optional(v.string()),
			submissionCount: v.number(),
			status: v.union(
				v.literal('draft'),
				v.literal('published'),
				v.literal('archived')
			),
			tags: v.array(v.id('tag')),
			lastUpdatedAt: v.optional(v.number())
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		const form = await ctx.db.get(args.formId)

		if (!form) throw notFound()

		if (form.businessId !== args.businessId) throw notFound()

		return form
	}
})

export const create = mutation({
	args: {
		businessId: v.string(),
		title: v.string(),
		description: v.optional(v.string())
	},
	returns: v.id('form'),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		const formId = await ctx.db.insert('form', {
			businessId: args.businessId,
			title: args.title,
			description: args.description,
			submissionCount: 0,
			status: 'draft',
			tags: [],
			lastUpdatedAt: Date.now()
		})

		// Record the form creation in edit history
		await ctx.scheduler.runAfter(0, internal.formEditHistory.recordEdit, {
			formId,
			userId: user.subject,
			editType: 'form_created' as const,
			changeDetails: {
				newTitle: args.title,
				newDescription: args.description
			}
		})

		return formId
	}
})

export const update = mutation({
	args: {
		formId: v.id('form'),
		title: v.optional(v.string()),
		description: v.optional(v.string())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		const form = await ctx.db.get(args.formId)

		if (!form) throw notFound()

		if (user.subject !== form.businessId) {
			await resolveMembership(ctx, {
				organizationId: form.businessId,
				userId: user.subject
			})
		}

		const updates: {
			title?: string
			description?: string
			lastUpdatedAt: number
		} = {
			lastUpdatedAt: Date.now()
		}

		const changeDetails: {
			oldTitle?: string
			newTitle?: string
			oldDescription?: string
			newDescription?: string
		} = {}

		if (args.title !== undefined) {
			updates.title = args.title
			changeDetails.oldTitle = form.title
			changeDetails.newTitle = args.title
		}
		if (args.description !== undefined) {
			updates.description = args.description
			changeDetails.oldDescription = form.description
			changeDetails.newDescription = args.description
		}

		await ctx.db.patch(args.formId, updates)

		// Record the form update in edit history
		await ctx.scheduler.runAfter(0, internal.formEditHistory.recordEdit, {
			formId: args.formId,
			userId: user.subject,
			editType: 'form_updated' as const,
			changeDetails
		})

		return null
	}
})

export const updateStatus = mutation({
	args: {
		formId: v.id('form'),
		status: v.union(
			v.literal('draft'),
			v.literal('published'),
			v.literal('archived')
		)
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		const form = await ctx.db.get(args.formId)
		if (!form) {
			throw new Error('Form not found')
		}

		if (user.subject !== form.businessId) {
			await resolveMembership(ctx, {
				organizationId: form.businessId,
				userId: user.subject
			})
		}

		const oldStatus = form.status

		await ctx.db.patch(args.formId, {
			status: args.status,
			lastUpdatedAt: Date.now()
		})

		// Record the status change in edit history
		await ctx.scheduler.runAfter(0, internal.formEditHistory.recordEdit, {
			formId: args.formId,
			userId: user.subject,
			editType: 'form_status_changed' as const,
			changeDetails: {
				oldStatus,
				newStatus: args.status
			}
		})

		return null
	}
})

export const updateTags = mutation({
	args: {
		formId: v.id('form'),
		tags: v.array(v.id('tag'))
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		const form = await ctx.db.get(args.formId)
		if (!form) {
			throw new Error('Form not found')
		}

		if (user.subject !== form.businessId) {
			await resolveMembership(ctx, {
				organizationId: form.businessId,
				userId: user.subject
			})
		}

		await ctx.db.patch(args.formId, {
			tags: args.tags,
			lastUpdatedAt: Date.now()
		})

		return null
	}
})

export const remove = mutation({
	args: {
		formId: v.id('form'),
		businessId: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		// Verify user has access to the form
		const form = await ctx.db.get(args.formId)
		if (!form) throw notFound()

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		// Verify form belongs to business
		if (form.businessId !== args.businessId) throw notFound()

		// Fetch all related data
		const fields = await ctx.db
			.query('formField')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		const history = await ctx.db
			.query('formEditHistory')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		const chatMessages = await ctx.db
			.query('chatMessage')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		// Delete all related data in parallel
		await Promise.all([
			...fields.map((field) => ctx.db.delete(field._id)),
			...history.map((entry) => ctx.db.delete(entry._id)),
			...chatMessages.map((message) => ctx.db.delete(message._id))
		])

		// Delete the form itself
		await ctx.db.delete(args.formId)

		return null
	}
})
