import { v } from 'convex/values'
import { query } from './_generated/server'
import { resolveIdentity, resolveMembership } from './auth'

export const list = query({
	args: v.object({
		businessId: v.string()
	}),
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
			.collect()
	}
})
