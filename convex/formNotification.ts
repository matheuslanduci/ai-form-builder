import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { resolveIdentity, resolveMembership } from './auth'
import { notFound } from './error'

export const list = query({
	args: {
		formId: v.id('form'),
		businessId: v.string()
	},
	returns: v.array(
		v.object({
			_id: v.id('formNotification'),
			_creationTime: v.number(),
			formId: v.id('form'),
			businessId: v.string(),
			email: v.string(),
			enabled: v.boolean()
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

		const form = await ctx.db.get(args.formId)
		if (!form || form.businessId !== args.businessId) throw notFound()

		const notifications = await ctx.db
			.query('formNotification')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		return notifications
	}
})

export const create = mutation({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		email: v.string(),
		enabled: v.optional(v.boolean())
	},
	returns: v.id('formNotification'),
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

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(args.email)) {
			throw new Error('Invalid email address')
		}

		// Check if email already exists for this form
		const existing = await ctx.db
			.query('formNotification')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		if (existing.some((n) => n.email === args.email)) {
			throw new Error('This email is already configured for notifications')
		}

		const notificationId = await ctx.db.insert('formNotification', {
			formId: args.formId,
			businessId: args.businessId,
			email: args.email,
			enabled: args.enabled ?? true
		})

		return notificationId
	}
})

export const update = mutation({
	args: {
		notificationId: v.id('formNotification'),
		businessId: v.string(),
		email: v.string()
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

		const notification = await ctx.db.get(args.notificationId)
		if (!notification || notification.businessId !== args.businessId)
			throw notFound()

		const form = await ctx.db.get(notification.formId)
		if (!form || form.businessId !== args.businessId) throw notFound()

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(args.email)) {
			throw new Error('Invalid email address')
		}

		// Check if email already exists for this form (excluding current notification)
		const existing = await ctx.db
			.query('formNotification')
			.withIndex('byFormId', (q) => q.eq('formId', notification.formId))
			.collect()

		if (
			existing.some(
				(n) => n.email === args.email && n._id !== args.notificationId
			)
		) {
			throw new Error('This email is already configured for notifications')
		}

		await ctx.db.patch(args.notificationId, {
			email: args.email
		})

		return null
	}
})

export const toggleEnabled = mutation({
	args: {
		notificationId: v.id('formNotification'),
		businessId: v.string(),
		enabled: v.boolean()
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

		const notification = await ctx.db.get(args.notificationId)
		if (!notification || notification.businessId !== args.businessId)
			throw notFound()

		const form = await ctx.db.get(notification.formId)
		if (!form || form.businessId !== args.businessId) throw notFound()

		await ctx.db.patch(args.notificationId, {
			enabled: args.enabled
		})

		return null
	}
})

export const remove = mutation({
	args: {
		notificationId: v.id('formNotification'),
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

		const notification = await ctx.db.get(args.notificationId)
		if (!notification || notification.businessId !== args.businessId)
			throw notFound()

		const form = await ctx.db.get(notification.formId)
		if (!form || form.businessId !== args.businessId) throw notFound()

		await ctx.db.delete(args.notificationId)

		return null
	}
})

export const listEnabledByForm = query({
	args: {
		formId: v.id('form')
	},
	returns: v.array(v.string()),
	handler: async (ctx, args) => {
		const notifications = await ctx.db
			.query('formNotification')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.filter((q) => q.eq(q.field('enabled'), true))
			.collect()

		return notifications.map((n) => n.email)
	}
})
