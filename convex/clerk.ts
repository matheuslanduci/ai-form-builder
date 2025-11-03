import { verifyWebhook } from '@clerk/tanstack-react-start/webhooks'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import { httpAction, internalMutation } from './_generated/server'

export const upsertClerkUser = internalMutation({
	args: v.object({
		clerkId: v.string(),
		avatarUrl: v.optional(v.string()),
		emailAddress: v.array(v.string()),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string())
	}),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('clerkUser')
			.withIndex('byClerkId', (q) => q.eq('clerkId', args.clerkId))
			.unique()

		if (existing) {
			await ctx.db.patch(existing._id, {
				emailAddress: args.emailAddress,
				firstName: args.firstName,
				lastName: args.lastName,
				avatarUrl: args.avatarUrl
			})
		} else {
			await ctx.db.insert('clerkUser', {
				clerkId: args.clerkId,
				emailAddress: args.emailAddress,
				firstName: args.firstName,
				lastName: args.lastName,
				avatarUrl: args.avatarUrl
			})
		}
	}
})

export const deleteClerkUser = internalMutation({
	args: v.object({
		clerkId: v.string()
	}),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('clerkUser')
			.withIndex('byClerkId', (q) => q.eq('clerkId', args.clerkId))
			.unique()

		if (existing) {
			await ctx.db.delete(existing._id)
		}
	}
})

export const upsertClerkOrg = internalMutation({
	args: v.object({
		clerkId: v.string(),
		avatarUrl: v.optional(v.string()),
		name: v.string(),
		slug: v.string()
	}),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('clerkOrg')
			.withIndex('byClerkId', (q) => q.eq('clerkId', args.clerkId))
			.unique()

		if (existing) {
			await ctx.db.patch(existing._id, {
				name: args.name,
				slug: args.slug,
				avatarUrl: args.avatarUrl
			})
		} else {
			await ctx.db.insert('clerkOrg', {
				clerkId: args.clerkId,
				name: args.name,
				slug: args.slug,
				avatarUrl: args.avatarUrl,
				members: []
			})
		}
	}
})

export const deleteClerkOrg = internalMutation({
	args: v.object({
		clerkId: v.string()
	}),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('clerkOrg')
			.withIndex('byClerkId', (q) => q.eq('clerkId', args.clerkId))
			.unique()

		if (existing) {
			await ctx.db.delete(existing._id)
		}
	}
})

export const upsertMemberToClerkOrg = internalMutation({
	args: v.object({
		clerkOrgId: v.string(),
		avatarUrl: v.optional(v.string()),
		name: v.string(),
		slug: v.string(),
		role: v.union(v.literal('org:admin'), v.literal('org:member')),
		clerkUserId: v.string()
	}),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('clerkOrg')
			.withIndex('byClerkId', (q) => q.eq('clerkId', args.clerkOrgId))
			.unique()

		if (existing) {
			const updatedMembers = existing.members.filter(
				(member) => member.clerkId !== args.clerkUserId
			)

			updatedMembers.push({
				clerkId: args.clerkUserId,
				role: args.role
			})

			await ctx.db.patch(existing._id, {
				members: updatedMembers
			})
		} else {
			await ctx.db.insert('clerkOrg', {
				clerkId: args.clerkOrgId,
				name: args.name,
				slug: args.slug,
				avatarUrl: args.avatarUrl,
				members: [
					{
						clerkId: args.clerkUserId,
						role: args.role
					}
				]
			})
		}
	}
})

export const deleteMemberFromClerkOrg = internalMutation({
	args: v.object({
		clerkOrgId: v.string(),
		clerkUserId: v.string()
	}),
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('clerkOrg')
			.withIndex('byClerkId', (q) => q.eq('clerkId', args.clerkOrgId))
			.unique()

		if (existing) {
			const updatedMembers = existing.members.filter(
				(member) => member.clerkId !== args.clerkUserId
			)

			await ctx.db.patch(existing._id, {
				members: updatedMembers
			})
		}
	}
})

export const handleClerkWebhook = httpAction(async (ctx, req) => {
	try {
		const event = await verifyWebhook(req)

		switch (event.type) {
			case 'user.created':
			case 'user.updated': {
				await ctx.runMutation(internal.clerk.upsertClerkUser, {
					clerkId: event.data.id,
					emailAddress: event.data.email_addresses.map(
						(email) => email.email_address
					),
					firstName: event.data.first_name ?? undefined,
					lastName: event.data.last_name ?? undefined,
					avatarUrl: event.data.image_url
				})
				break
			}
			case 'user.deleted': {
				if (!event.data.id) {
					return new Response('No user ID provided', { status: 400 })
				}

				await ctx.runMutation(internal.clerk.deleteClerkUser, {
					clerkId: event.data.id
				})

				break
			}
			case 'organization.created':
			case 'organization.updated': {
				await ctx.runMutation(internal.clerk.upsertClerkOrg, {
					clerkId: event.data.id,
					name: event.data.name,
					slug: event.data.slug,
					avatarUrl: event.data.image_url
				})
				break
			}
			case 'organization.deleted': {
				if (!event.data.id) {
					return new Response('No organization ID provided', { status: 400 })
				}

				await ctx.runMutation(internal.clerk.deleteClerkOrg, {
					clerkId: event.data.id
				})

				break
			}
			case 'organizationMembership.created':
			case 'organizationMembership.updated': {
				await ctx.runMutation(internal.clerk.upsertMemberToClerkOrg, {
					clerkOrgId: event.data.organization.id,
					clerkUserId: event.data.public_user_data.user_id,
					name: event.data.organization.name,
					slug: event.data.organization.slug,
					avatarUrl: event.data.organization.image_url,
					role: event.data.role as 'org:admin' | 'org:member'
				})
				break
			}
			case 'organizationMembership.deleted': {
				await ctx.runMutation(internal.clerk.deleteMemberFromClerkOrg, {
					clerkOrgId: event.data.organization.id,
					clerkUserId: event.data.public_user_data.user_id
				})
				break
			}
			default: {
				return new Response('Event type not handled', { status: 200 })
			}
		}

		return new Response('Success', { status: 200 })
	} catch (error) {
		console.error('Failed to verify Clerk webhook:', error)
		return new Response('Error', { status: 400 })
	}
})
