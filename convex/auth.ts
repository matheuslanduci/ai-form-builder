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

export async function requireAdmin(
	ctx: QueryCtx,
	args: { businessId: string; userId: string }
) {
	// Personal accounts: user owns the business, so they're always admin
	if (args.businessId === args.userId) {
		return
	}

	// Organization accounts: check if user has org:admin role
	const { membership } = await resolveMembership(ctx, {
		organizationId: args.businessId,
		userId: args.userId
	})

	if (membership.role !== 'org:admin') {
		throw forbidden()
	}
}
