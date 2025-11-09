import { v } from 'convex/values'
import { internalMutation, query } from './_generated/server'
import { resolveIdentity, resolveMembership } from './auth'
import { notFound } from './error'

export const list = query({
	args: {
		webhookId: v.id('webhook'),
		businessId: v.string(),
		paginationOpts: v.object({
			numItems: v.number(),
			cursor: v.union(v.string(), v.null())
		})
	},
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		// Verify webhook belongs to this business
		const webhook = await ctx.db.get(args.webhookId)
		if (!webhook) throw notFound()
		if (webhook.businessId !== args.businessId) throw notFound()

		const entries = await ctx.db
			.query('webhookEntry')
			.withIndex('byWebhookId', (q) => q.eq('webhookId', args.webhookId))
			.order('desc')
			.paginate(args.paginationOpts)

		return entries
	}
})

export const createEntry = internalMutation({
	args: {
		webhookId: v.id('webhook'),
		businessId: v.string(),
		event: v.literal('submission.created'),
		triggeredAt: v.number(),
		status: v.union(v.literal('success'), v.literal('failed')),
		statusCode: v.optional(v.number()),
		responseBody: v.optional(v.string()),
		errorMessage: v.optional(v.string()),
		payload: v.any()
	},
	handler: async (ctx, args) => {
		await ctx.db.insert('webhookEntry', {
			webhookId: args.webhookId,
			businessId: args.businessId,
			event: args.event,
			triggeredAt: args.triggeredAt,
			status: args.status,
			statusCode: args.statusCode,
			responseBody: args.responseBody,
			errorMessage: args.errorMessage,
			payload: args.payload
		})
	}
})
