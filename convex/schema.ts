import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
	clerkUser: defineTable({
		clerkId: v.string(),
		avatarUrl: v.optional(v.string()),
		emailAddress: v.array(v.string()),
		firstName: v.optional(v.string()),
		lastName: v.optional(v.string())
	}).index('byClerkId', ['clerkId']),
	clerkOrg: defineTable({
		clerkId: v.string(),
		avatarUrl: v.optional(v.string()),
		name: v.string(),
		slug: v.string(),
		members: v.array(
			v.object({
				clerkId: v.string(),
				role: v.union(v.literal('org:admin'), v.literal('org:member'))
			})
		)
	}).index('byClerkId', ['clerkId']),
	tag: defineTable({
		businessId: v.string(),
		name: v.string(),
		color: v.optional(v.string())
	}).index('byBusinessId', ['businessId']),
	form: defineTable({
		// Organization or User if personal account
		businessId: v.string(),
		title: v.string(),
		description: v.optional(v.string()),
		submissionCount: v.number(),
		lastUpdatedAt: v.optional(v.number()),
		status: v.union(
			v.literal('draft'),
			v.literal('published'),
			v.literal('archived')
		),
		tags: v.array(v.id('tag'))
	}).index('byBusinessId', ['businessId']),
	formField: defineTable({
		formId: v.id('form'),
		pageId: v.optional(v.string()), // For future multi-page support
		type: v.union(
			v.literal('singleline'),
			v.literal('multiline'),
			v.literal('number'),
			v.literal('select'),
			v.literal('checkbox'),
			v.literal('date')
		),
		title: v.string(),
		placeholder: v.optional(v.string()),
		required: v.boolean(),
		order: v.number(), // For ordering fields within a page
		options: v.optional(v.array(v.string())) // For select and checkbox fields
	})
		.index('byFormId', ['formId'])
		.index('byFormIdAndPageId', ['formId', 'pageId'])
})
