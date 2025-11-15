import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import {
	internalAction,
	internalMutation,
	internalQuery,
	mutation,
	query
} from './_generated/server'
import { requireAdmin, resolveIdentity, resolveMembership } from './auth'
import { notFound } from './error'

export const list = query({
	args: {
		businessId: v.string()
	},
	returns: v.array(
		v.object({
			_id: v.id('webhook'),
			_creationTime: v.number(),
			formId: v.optional(v.id('form')),
			businessId: v.string(),
			url: v.string(),
			event: v.literal('submission.created'),
			enabled: v.boolean(),
			lastTriggeredAt: v.optional(v.number()),
			lastStatus: v.optional(v.union(v.literal('success'), v.literal('failed')))
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

		const webhooks = await ctx.db
			.query('webhook')
			.withIndex('byBusinessId', (q) => q.eq('businessId', args.businessId))
			.collect()

		return webhooks.map((webhook) => ({
			_id: webhook._id,
			_creationTime: webhook._creationTime,
			formId: webhook.formId,
			businessId: webhook.businessId,
			url: webhook.url,
			event: webhook.event,
			enabled: webhook.enabled,
			lastTriggeredAt: webhook.lastTriggeredAt,
			lastStatus: webhook.lastStatus
		}))
	}
})

export const get = query({
	args: {
		webhookId: v.id('webhook'),
		businessId: v.string()
	},
	returns: v.union(
		v.object({
			_id: v.id('webhook'),
			_creationTime: v.number(),
			formId: v.optional(v.id('form')),
			businessId: v.string(),
			url: v.string(),
			secret: v.string(),
			event: v.literal('submission.created'),
			enabled: v.boolean(),
			lastTriggeredAt: v.optional(v.number()),
			lastStatus: v.optional(v.union(v.literal('success'), v.literal('failed')))
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

		const webhook = await ctx.db.get(args.webhookId)
		if (!webhook) return null
		if (webhook.businessId !== args.businessId) return null

		return webhook
	}
})

export const create = mutation({
	args: {
		businessId: v.string(),
		formId: v.optional(v.id('form')),
		url: v.string(),
		secret: v.string(),
		enabled: v.optional(v.boolean())
	},
	returns: v.id('webhook'),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		// Require admin for webhook creation
		await requireAdmin(ctx, {
			businessId: args.businessId,
			userId: user.subject
		})

		// If formId is provided, verify it belongs to this business
		if (args.formId) {
			const form = await ctx.db.get(args.formId)
			if (!form) throw notFound()
			if (form.businessId !== args.businessId) throw notFound()
		}

		const webhookId = await ctx.db.insert('webhook', {
			businessId: args.businessId,
			formId: args.formId,
			url: args.url,
			secret: args.secret,
			event: 'submission.created',
			enabled: args.enabled ?? true
		})

		return webhookId
	}
})

export const update = mutation({
	args: {
		webhookId: v.id('webhook'),
		businessId: v.string(),
		formId: v.optional(v.id('form')),
		url: v.optional(v.string()),
		secret: v.optional(v.string()),
		enabled: v.optional(v.boolean())
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

		// Require admin for webhook updates
		await requireAdmin(ctx, {
			businessId: args.businessId,
			userId: user.subject
		})

		const webhook = await ctx.db.get(args.webhookId)
		if (!webhook) throw notFound()
		if (webhook.businessId !== args.businessId) throw notFound()

		// If formId is provided, verify it belongs to this business
		if (args.formId !== undefined && args.formId !== null) {
			const form = await ctx.db.get(args.formId)
			if (!form) throw notFound()
			if (form.businessId !== args.businessId) throw notFound()
		}

		const updates: Partial<{
			formId: Id<'form'> | undefined
			url: string
			secret: string
			enabled: boolean
		}> = {}

		if (args.formId !== undefined) updates.formId = args.formId
		if (args.url !== undefined) updates.url = args.url
		if (args.secret !== undefined) updates.secret = args.secret
		if (args.enabled !== undefined) updates.enabled = args.enabled

		await ctx.db.patch(args.webhookId, updates)

		return null
	}
})

export const remove = mutation({
	args: {
		webhookId: v.id('webhook'),
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

		// Require admin for webhook deletion
		await requireAdmin(ctx, {
			businessId: args.businessId,
			userId: user.subject
		})

		const webhook = await ctx.db.get(args.webhookId)
		if (!webhook) throw notFound()
		if (webhook.businessId !== args.businessId) throw notFound()

		await ctx.db.delete(args.webhookId)

		return null
	}
})

export const toggleEnabled = mutation({
	args: {
		webhookId: v.id('webhook'),
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

		const webhook = await ctx.db.get(args.webhookId)
		if (!webhook) throw notFound()
		if (webhook.businessId !== args.businessId) throw notFound()

		await ctx.db.patch(args.webhookId, { enabled: args.enabled })

		return null
	}
})

// Internal action to trigger webhook
export const triggerWebhook = internalAction({
	args: {
		webhookId: v.id('webhook'),
		payload: v.any()
	},
	returns: v.union(v.literal('success'), v.literal('failed')),
	handler: async (ctx, args): Promise<'success' | 'failed'> => {
		// Get webhook details
		const webhook: {
			url: string
			secret: string
			enabled: boolean
			businessId: string
		} | null = await ctx.runQuery(internal.webhook.getWebhookForTrigger, {
			webhookId: args.webhookId
		})

		if (!webhook || !webhook.enabled) {
			return 'failed'
		}

		const triggeredAt = Date.now()

		try {
			// Make HTTP request to webhook URL
			const response: Response = await fetch(webhook.url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Webhook-Secret': webhook.secret,
					'X-Webhook-Event': 'submission.created'
				},
				body: JSON.stringify(args.payload)
			})

			const status: 'success' | 'failed' = response.ok ? 'success' : 'failed'
			const statusCode = response.status
			let responseBody: string | undefined

			try {
				responseBody = await response.text()
				// Limit response body size
				if (responseBody.length > 1000) {
					responseBody = responseBody.substring(0, 1000) + '...'
				}
			} catch {
				responseBody = undefined
			}

			// Update webhook status
			await ctx.runMutation(internal.webhook.updateWebhookStatus, {
				webhookId: args.webhookId,
				status,
				triggeredAt
			})

			// Create webhook entry
			await ctx.runMutation(internal.webhookEntry.createEntry, {
				webhookId: args.webhookId,
				businessId: webhook.businessId,
				event: 'submission.created',
				triggeredAt,
				status,
				statusCode,
				responseBody,
				payload: args.payload
			})

			return status
		} catch (error) {
			console.error('Webhook trigger failed:', error)

			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error'

			// Update webhook status
			await ctx.runMutation(internal.webhook.updateWebhookStatus, {
				webhookId: args.webhookId,
				status: 'failed',
				triggeredAt
			})

			// Create webhook entry for the failure
			await ctx.runMutation(internal.webhookEntry.createEntry, {
				webhookId: args.webhookId,
				businessId: webhook.businessId,
				event: 'submission.created',
				triggeredAt,
				status: 'failed',
				errorMessage,
				payload: args.payload
			})

			return 'failed'
		}
	}
})

// Internal query to get webhook for triggering (no auth needed for internal)
export const getWebhookForTrigger = internalQuery({
	args: {
		webhookId: v.id('webhook')
	},
	returns: v.union(
		v.object({
			url: v.string(),
			secret: v.string(),
			enabled: v.boolean(),
			businessId: v.string()
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		const webhook = await ctx.db.get(args.webhookId)
		if (!webhook) return null

		return {
			url: webhook.url,
			secret: webhook.secret,
			enabled: webhook.enabled,
			businessId: webhook.businessId
		}
	}
})

// Internal mutation to update webhook status
export const updateWebhookStatus = internalMutation({
	args: {
		webhookId: v.id('webhook'),
		status: v.union(v.literal('success'), v.literal('failed')),
		triggeredAt: v.number()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await ctx.db.patch(args.webhookId, {
			lastTriggeredAt: args.triggeredAt,
			lastStatus: args.status
		})

		return null
	}
})
