import { v } from 'convex/values'
import { internal } from './_generated/api'
import { mutation, query } from './_generated/server'
import { notFound } from './error'

export const getPublicForm = query({
	args: {
		formId: v.id('form')
	},
	returns: v.union(
		v.object({
			_id: v.id('form'),
			title: v.string(),
			description: v.optional(v.string()),
			successMessage: v.optional(v.string()),
			status: v.union(
				v.literal('draft'),
				v.literal('published'),
				v.literal('archived')
			)
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		const form = await ctx.db.get(args.formId)

		// Only return published forms
		if (!form || form.status !== 'published') {
			return null
		}

		return {
			_id: form._id,
			title: form.title,
			description: form.description,
			successMessage: form.successMessage,
			status: form.status
		}
	}
})

export const getPublicFormFields = query({
	args: {
		formId: v.id('form')
	},
	returns: v.array(
		v.object({
			_id: v.id('formField'),
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
			order: v.number(),
			options: v.optional(v.array(v.string()))
		})
	),
	handler: async (ctx, args) => {
		// Verify form exists and is published
		const form = await ctx.db.get(args.formId)
		if (!form || form.status !== 'published') {
			throw notFound()
		}

		// Get all fields for this form
		const fields = await ctx.db
			.query('formField')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		return fields
			.sort((a, b) => a.order - b.order)
			.map((field) => ({
				_id: field._id,
				type: field.type,
				title: field.title,
				placeholder: field.placeholder,
				required: field.required,
				order: field.order,
				options: field.options
			}))
	}
})

export const submitForm = mutation({
	args: {
		formId: v.id('form'),
		data: v.any() // Dynamic object with field IDs as keys
	},
	returns: v.id('formSubmission'),
	handler: async (ctx, args) => {
		// Verify form exists and is published
		const form = await ctx.db.get(args.formId)
		if (!form || form.status !== 'published') {
			throw notFound()
		}

		// Create the submission
		const submissionId = await ctx.db.insert('formSubmission', {
			formId: args.formId,
			submittedAt: Date.now(),
			data: args.data
		})

		// Increment submission count
		await ctx.db.patch(args.formId, {
			submissionCount: form.submissionCount + 1
		})

		// Get enabled notification emails
		const notifications = await ctx.db
			.query('formNotification')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.filter((q) => q.eq(q.field('enabled'), true))
			.collect()

		// If there are notifications enabled, prepare and send emails
		if (notifications.length > 0) {
			// Get form fields to format the submission data
			const fields = await ctx.db
				.query('formField')
				.withIndex('byFormId', (q) => q.eq('formId', args.formId))
				.collect()

			// Format the submission data for the email
			const formattedFields = fields
				.sort((a, b) => a.order - b.order)
				.map((field) => {
					const value = args.data[field._id]
					let formattedValue: string | string[]

					if (Array.isArray(value)) {
						formattedValue = value
					} else if (value !== undefined && value !== null) {
						formattedValue = String(value)
					} else {
						formattedValue = ''
					}

					return {
						title: field.title,
						type: field.type,
						value: formattedValue
					}
				})

			// Schedule the email notification action
			await ctx.scheduler.runAfter(
				0,
				internal.email.sendSubmissionNotifications,
				{
					formId: args.formId,
					submissionId,
					formTitle: form.title,
					submittedAt: Date.now(),
					fields: formattedFields,
					recipientEmails: notifications.map((n) => n.email)
				}
			)
		}

		// Get enabled webhooks (both form-specific and global)
		const webhooks = await ctx.db
			.query('webhook')
			.withIndex('byBusinessId', (q) => q.eq('businessId', form.businessId))
			.filter((q) => q.eq(q.field('enabled'), true))
			.collect()

		// Filter webhooks that apply to this form (formId matches or is null for global webhooks)
		const applicableWebhooks = webhooks.filter(
			(webhook) =>
				webhook.formId === undefined || webhook.formId === args.formId
		)

		if (applicableWebhooks.length > 0) {
			// Get form fields to include in webhook payload
			const fields = await ctx.db
				.query('formField')
				.withIndex('byFormId', (q) => q.eq('formId', args.formId))
				.collect()

			const formattedFields = fields
				.sort((a, b) => a.order - b.order)
				.map((field) => ({
					id: field._id,
					title: field.title,
					type: field.type,
					value: args.data[field._id]
				}))

			// Schedule webhook triggers
			for (const webhook of applicableWebhooks) {
				await ctx.scheduler.runAfter(0, internal.webhook.triggerWebhook, {
					webhookId: webhook._id,
					payload: {
						event: 'submission.created',
						timestamp: Date.now(),
						form: {
							id: form._id,
							title: form.title,
							description: form.description
						},
						submission: {
							id: submissionId,
							submittedAt: Date.now(),
							fields: formattedFields
						}
					}
				})
			}
		}

		return submissionId
	}
})
