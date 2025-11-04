import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
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
		if (!form) {
			return null
		}

		// Verify the form belongs to the business
		if (form.businessId !== args.businessId) {
			return null
		}

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

		return await ctx.db.insert('form', {
			businessId: args.businessId,
			title: args.title,
			description: args.description,
			submissionCount: 0,
			status: 'draft',
			tags: [],
			lastUpdatedAt: Date.now()
		})
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

		if (args.title !== undefined) updates.title = args.title
		if (args.description !== undefined) updates.description = args.description

		await ctx.db.patch(args.formId, updates)

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

		await ctx.db.patch(args.formId, {
			status: args.status,
			lastUpdatedAt: Date.now()
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
