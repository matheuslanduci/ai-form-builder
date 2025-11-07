import { v } from 'convex/values'
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

		return submissionId
	}
})
