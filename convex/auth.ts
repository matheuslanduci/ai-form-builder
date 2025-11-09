import type { QueryCtx } from './_generated/server'
import { forbidden, unauthorized } from './error'

export async function resolveIdentity(ctx: QueryCtx) {
	const user = await ctx.auth.getUserIdentity()

	if (!user) throw unauthorized()

	return user
}

export async function resolveMembership(
	ctx: QueryCtx,
	args: { organizationId: string; userId: string }
) {
	const clerkOrg = await ctx.db
		.query('clerkOrg')
		.withIndex('byClerkId', (q) => q.eq('clerkId', args.organizationId))
		.unique()

	if (!clerkOrg) throw forbidden()

	const membership = clerkOrg.members.find((m) => m.clerkId === args.userId)

	if (!membership) throw forbidden()

	return {
		membership,
		clerkOrg
	}
}
