import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { resolveIdentity, resolveMembership } from './auth'
import { notFound } from './error'

export const list = query({
	args: {
		businessId: v.string()
	},
	returns: v.array(
		v.object({
			_id: v.id('tag'),
			_creationTime: v.number(),
			businessId: v.string(),
			name: v.string(),
			color: v.optional(v.string())
		})
	),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		return await ctx.db
			.query('tag')
			.withIndex('byBusinessId', (q) => q.eq('businessId', args.businessId))
			.collect()
	}
})

export const create = mutation({
	args: {
		businessId: v.string(),
		name: v.string(),
		color: v.optional(v.string())
	},
	returns: v.id('tag'),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		return await ctx.db.insert('tag', {
			businessId: args.businessId,
			name: args.name,
			color: args.color
		})
	}
})

export const update = mutation({
	args: {
		id: v.id('tag'),
		name: v.optional(v.string()),
		color: v.optional(v.string())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const tag = await ctx.db.get(args.id)

		if (!tag) throw notFound()

		const user = await resolveIdentity(ctx)

		if (user.subject !== tag.businessId) {
			await resolveMembership(ctx, {
				organizationId: tag.businessId,
				userId: user.subject
			})
		}

		const updates: { name?: string; color?: string } = {}
		if (args.name !== undefined) updates.name = args.name
		if (args.color !== undefined) updates.color = args.color

		await ctx.db.patch(args.id, updates)

		return null
	}
})

export const remove = mutation({
	args: {
		id: v.id('tag')
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const tag = await ctx.db.get(args.id)

		if (!tag) throw notFound()

		const user = await resolveIdentity(ctx)

		if (user.subject !== tag.businessId) {
			await resolveMembership(ctx, {
				organizationId: tag.businessId,
				userId: user.subject
			})
		}

		const forms = await ctx.db
			.query('form')
			.withIndex('byBusinessId', (q) => q.eq('businessId', tag.businessId))
			.collect()

		for (const form of forms) {
			if (form.tags.includes(args.id)) {
				await ctx.db.patch(form._id, {
					tags: form.tags.filter((tagId) => tagId !== args.id)
				})
			}
		}

		await ctx.db.delete(args.id)
		return null
	}
})
