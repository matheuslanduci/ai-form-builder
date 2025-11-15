import { v } from 'convex/values'
import { internalMutation, internalQuery, mutation } from './_generated/server'
import { resolveIdentity, resolveMembership } from './auth'
import { notFound } from './error'

export const generateExportToken = mutation({
	args: {
		formId: v.id('form'),
		businessId: v.string()
	},
	returns: v.object({
		token: v.string(),
		expiresAt: v.number()
	}),
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

		// Generate a cryptographically secure random token
		const tokenBytes = new Uint8Array(32)
		crypto.getRandomValues(tokenBytes)
		const token = Array.from(tokenBytes)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('')

		const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

		// Store the token in the database
		await ctx.db.insert('exportToken', {
			formId: args.formId,
			businessId: args.businessId,
			token,
			expiresAt
		})

		return {
			token,
			expiresAt
		}
	}
})

/**
 * Internal query to validate and retrieve export token data
 */
export const validateExportToken = internalQuery({
	args: {
		token: v.string()
	},
	returns: v.union(
		v.object({
			formId: v.id('form'),
			businessId: v.string(),
			expiresAt: v.number()
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		const tokenDoc = await ctx.db
			.query('exportToken')
			.withIndex('byToken', (q) => q.eq('token', args.token))
			.unique()

		if (!tokenDoc) {
			return null
		}

		// Check if token is expired
		if (Date.now() > tokenDoc.expiresAt) {
			return null
		}

		return {
			formId: tokenDoc.formId,
			businessId: tokenDoc.businessId,
			expiresAt: tokenDoc.expiresAt
		}
	}
})

/**
 * Internal mutation to clean up expired export tokens
 */
export const cleanupExpiredTokens = internalMutation({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const now = Date.now()

		// Query expired tokens
		const expiredTokens = await ctx.db
			.query('exportToken')
			.withIndex('byExpiresAt')
			.filter((q) => q.lt(q.field('expiresAt'), now))
			.collect()

		// Delete all expired tokens
		for (const token of expiredTokens) {
			await ctx.db.delete(token._id)
		}

		console.log(`Cleaned up ${expiredTokens.length} expired export tokens`)

		return null
	}
})
