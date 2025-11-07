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
			_id: v.id('chatMessage'),
			_creationTime: v.number(),
			formId: v.id('form'),
			userId: v.string(),
			role: v.union(v.literal('user'), v.literal('assistant')),
			content: v.string(),
			attachments: v.optional(
				v.array(
					v.object({
						fileId: v.id('_storage'),
						fileName: v.string(),
						fileType: v.string(),
						fileSize: v.number()
					})
				)
			)
		})
	),
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

		const messages = await ctx.db
			.query('chatMessage')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		return messages.sort((a, b) => a._creationTime - b._creationTime)
	}
})

export const create = mutation({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		content: v.string(),
		attachments: v.optional(
			v.array(
				v.object({
					fileId: v.id('_storage'),
					fileName: v.string(),
					fileType: v.string(),
					fileSize: v.number()
				})
			)
		)
	},
	returns: v.id('chatMessage'),
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

		const messageId = await ctx.db.insert('chatMessage', {
			formId: args.formId,
			userId: user.subject,
			role: 'user',
			content: args.content,
			attachments: args.attachments
		})

		return messageId
	}
})

export const remove = mutation({
	args: {
		messageId: v.id('chatMessage'),
		businessId: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		// Get the message
		const message = await ctx.db.get(args.messageId)
		if (!message) throw notFound()

		// Verify user has access to the form
		const form = await ctx.db.get(message.formId)
		if (!form) throw notFound()

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		// Verify form belongs to business
		if (form.businessId !== args.businessId) throw notFound()

		await ctx.db.delete(args.messageId)

		return null
	}
})
