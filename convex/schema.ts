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
		successMessage: v.optional(v.string()),
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
		.index('byFormIdAndPageId', ['formId', 'pageId']),
	chatMessage: defineTable({
		formId: v.id('form'),
		userId: v.string(), // Clerk user ID
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
	}).index('byFormId', ['formId']),
	formEditHistory: defineTable({
		formId: v.id('form'),
		userId: v.string(), // Clerk user ID of the person who made the change
		editType: v.union(
			v.literal('form_created'),
			v.literal('form_updated'),
			v.literal('form_status_changed'),
			v.literal('field_created'),
			v.literal('field_updated'),
			v.literal('field_deleted'),
			v.literal('fields_reordered'),
			v.literal('restored')
		),
		changeDetails: v.object({
			// For form updates - store old and new values
			oldTitle: v.optional(v.string()),
			newTitle: v.optional(v.string()),
			oldDescription: v.optional(v.string()),
			newDescription: v.optional(v.string()),
			// For status changes
			oldStatus: v.optional(
				v.union(
					v.literal('draft'),
					v.literal('published'),
					v.literal('archived')
				)
			),
			newStatus: v.optional(
				v.union(
					v.literal('draft'),
					v.literal('published'),
					v.literal('archived')
				)
			),
			// For field operations
			fieldId: v.optional(v.id('formField')),
			fieldTitle: v.optional(v.string()),
			fieldType: v.optional(
				v.union(
					v.literal('singleline'),
					v.literal('multiline'),
					v.literal('number'),
					v.literal('select'),
					v.literal('checkbox'),
					v.literal('date')
				)
			),
			// For field updates - store old and new values
			oldFieldTitle: v.optional(v.string()),
			newFieldTitle: v.optional(v.string()),
			oldFieldPlaceholder: v.optional(v.string()),
			newFieldPlaceholder: v.optional(v.string()),
			oldFieldRequired: v.optional(v.boolean()),
			newFieldRequired: v.optional(v.boolean()),
			oldFieldOptions: v.optional(v.array(v.string())),
			newFieldOptions: v.optional(v.array(v.string())),
			// For restore operations - reference to the original entry
			restoredFromId: v.optional(v.id('formEditHistory')),
			restoredAction: v.optional(v.string())
		})
	}).index('byFormId', ['formId']),
	formSubmission: defineTable({
		formId: v.id('form'),
		submittedAt: v.number(),
		data: v.any() // Dynamic object containing field IDs as keys and their values
	}).index('byFormId', ['formId']),
	formNotification: defineTable({
		formId: v.id('form'),
		businessId: v.string(),
		email: v.string(),
		enabled: v.boolean()
	})
		.index('byFormId', ['formId'])
		.index('byBusinessId', ['businessId']),
	webhook: defineTable({
		businessId: v.string(),
		formId: v.optional(v.id('form')),
		url: v.string(),
		secret: v.string(),
		event: v.literal('submission.created'),
		enabled: v.boolean(),
		lastTriggeredAt: v.optional(v.number()),
		lastStatus: v.optional(v.union(v.literal('success'), v.literal('failed')))
	})
		.index('byBusinessId', ['businessId'])
		.index('byFormId', ['formId']),
	webhookEntry: defineTable({
		webhookId: v.id('webhook'),
		businessId: v.string(),
		event: v.literal('submission.created'),
		triggeredAt: v.number(),
		status: v.union(v.literal('success'), v.literal('failed')),
		statusCode: v.optional(v.number()),
		responseBody: v.optional(v.string()),
		errorMessage: v.optional(v.string()),
		payload: v.any() // The webhook payload that was sent
	})
		.index('byWebhookId', ['webhookId'])
		.index('byBusinessId', ['businessId'])
})
