import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { internalQuery, mutation, query } from './_generated/server'
import { resolveIdentity, resolveMembership } from './auth'
import { notFound } from './error'

export const list = query({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		pageId: v.optional(v.string())
	},
	returns: v.array(
		v.object({
			_id: v.id('formField'),
			_creationTime: v.number(),
			formId: v.id('form'),
			pageId: v.optional(v.string()),
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
		const user = await resolveIdentity(ctx)

		// Verify user has access to the form
		const form = await ctx.db.get(args.formId)
		if (!form) throw notFound()

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		// Verify form belongs to business
		if (form.businessId !== args.businessId) throw notFound()

		// Query fields for this form/page
		const fieldsQuery = ctx.db
			.query('formField')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))

		// Filter by pageId if provided
		const fields = await fieldsQuery.collect()
		const filteredFields =
			args.pageId !== undefined
				? fields.filter((f) => f.pageId === args.pageId)
				: fields.filter((f) => f.pageId === undefined)

		// Sort by order
		return filteredFields.sort((a, b) => a.order - b.order)
	}
})

// Internal query for AI form builder
export const listInternal = internalQuery({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		pageId: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const form = await ctx.db.get(args.formId)
		if (!form) return []
		if (form.businessId !== args.businessId) return []

		const fieldsQuery = ctx.db
			.query('formField')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))

		const fields = await fieldsQuery.collect()
		const filteredFields =
			args.pageId !== undefined
				? fields.filter((f) => f.pageId === args.pageId)
				: fields.filter((f) => f.pageId === undefined)

		return filteredFields.sort((a, b) => a.order - b.order)
	}
})

export const create = mutation({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		pageId: v.optional(v.string()),
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
	},
	returns: v.id('formField'),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		// Verify user has access to the form
		const form = await ctx.db.get(args.formId)
		if (!form) throw notFound()

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		// Verify form belongs to business
		if (form.businessId !== args.businessId) throw notFound()

		const fieldId = await ctx.db.insert('formField', {
			formId: args.formId,
			pageId: args.pageId,
			type: args.type,
			title: args.title,
			placeholder: args.placeholder,
			required: args.required,
			order: args.order,
			options: args.options
		})

		// Record the field creation in edit history
		await ctx.scheduler.runAfter(0, internal.formEditHistory.recordEdit, {
			formId: args.formId,
			userId: user.subject,
			editType: 'field_created' as const,
			changeDetails: {
				fieldId,
				fieldTitle: args.title,
				fieldType: args.type
			}
		})

		return fieldId
	}
})

export const update = mutation({
	args: {
		fieldId: v.id('formField'),
		businessId: v.string(),
		title: v.optional(v.string()),
		placeholder: v.optional(v.string()),
		required: v.optional(v.boolean()),
		options: v.optional(v.array(v.string()))
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		// Get field and form
		const field = await ctx.db.get(args.fieldId)
		if (!field) throw notFound()

		const form = await ctx.db.get(field.formId)
		if (!form) throw notFound()

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		// Verify form belongs to business
		if (form.businessId !== args.businessId) throw notFound()

		const updates: {
			title?: string
			placeholder?: string
			required?: boolean
			options?: string[]
		} = {}

		const changeDetails: {
			fieldId: Id<'formField'>
			fieldTitle: string
			fieldType:
				| 'singleline'
				| 'multiline'
				| 'number'
				| 'select'
				| 'checkbox'
				| 'date'
			oldFieldTitle?: string
			newFieldTitle?: string
			oldFieldPlaceholder?: string
			newFieldPlaceholder?: string
			oldFieldRequired?: boolean
			newFieldRequired?: boolean
			oldFieldOptions?: string[]
			newFieldOptions?: string[]
		} = {
			fieldId: args.fieldId,
			fieldTitle: field.title,
			fieldType: field.type
		}

		if (args.title !== undefined) {
			updates.title = args.title
			changeDetails.oldFieldTitle = field.title
			changeDetails.newFieldTitle = args.title
		}
		if (args.placeholder !== undefined) {
			updates.placeholder = args.placeholder
			changeDetails.oldFieldPlaceholder = field.placeholder
			changeDetails.newFieldPlaceholder = args.placeholder
		}
		if (args.required !== undefined) {
			updates.required = args.required
			changeDetails.oldFieldRequired = field.required
			changeDetails.newFieldRequired = args.required
		}
		if (args.options !== undefined) {
			updates.options = args.options
			changeDetails.oldFieldOptions = field.options
			changeDetails.newFieldOptions = args.options
		}

		await ctx.db.patch(args.fieldId, updates)

		// Record the field update in edit history
		await ctx.scheduler.runAfter(0, internal.formEditHistory.recordEdit, {
			formId: field.formId,
			userId: user.subject,
			editType: 'field_updated' as const,
			changeDetails
		})

		return null
	}
})

export const remove = mutation({
	args: {
		fieldId: v.id('formField'),
		businessId: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		// Get field and form
		const field = await ctx.db.get(args.fieldId)
		if (!field) throw notFound()

		const form = await ctx.db.get(field.formId)
		if (!form) throw notFound()

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		// Verify form belongs to business
		if (form.businessId !== args.businessId) throw notFound()

		await ctx.db.delete(args.fieldId)

		// Record the field deletion in edit history
		await ctx.scheduler.runAfter(0, internal.formEditHistory.recordEdit, {
			formId: field.formId,
			userId: user.subject,
			editType: 'field_deleted' as const,
			changeDetails: {
				fieldId: args.fieldId,
				fieldTitle: field.title,
				fieldType: field.type,
				oldFieldTitle: field.title,
				oldFieldPlaceholder: field.placeholder,
				oldFieldRequired: field.required,
				oldFieldOptions: field.options
			}
		})

		return null
	}
})

export const reorder = mutation({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		pageId: v.optional(v.string()),
		fieldIds: v.array(v.id('formField'))
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		// Verify user has access to the form
		const form = await ctx.db.get(args.formId)
		if (!form) throw notFound()

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		// Verify form belongs to business
		if (form.businessId !== args.businessId) throw notFound()

		// Update order for each field
		for (let i = 0; i < args.fieldIds.length; i++) {
			await ctx.db.patch(args.fieldIds[i], { order: i })
		}

		// Record the field reordering in edit history
		await ctx.scheduler.runAfter(0, internal.formEditHistory.recordEdit, {
			formId: args.formId,
			userId: user.subject,
			editType: 'fields_reordered' as const,
			changeDetails: {}
		})

		return null
	}
})
