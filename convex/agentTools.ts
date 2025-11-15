import { createTool, type ToolCtx } from '@convex-dev/agent'
import { z } from 'zod'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'

// Custom context type for form builder tools
export type FormBuilderToolCtx = ToolCtx & {
	formId: Id<'form'>
	businessId: string
	userId: string
}

export const updateFormMetadata = createTool({
	description:
		'Update form metadata like title, description, or success message',
	args: z.object({
		title: z.string().optional().describe('The new title for the form'),
		description: z
			.string()
			.optional()
			.describe('The new description for the form'),
		successMessage: z
			.string()
			.optional()
			.describe('The message shown after successful form submission')
	}),
	handler: async (ctx: FormBuilderToolCtx, args): Promise<string> => {
		// Try to get userId from ctx - if not available, get from auth
		let userId = ctx.userId

		console.log('[Tool:updateFormMetadata] Context check:', {
			hasUserId: !!userId,
			userId: userId,
			hasAuth: !!ctx.auth
		})

		// Fallback: try to get user from auth context
		if (!userId && ctx.auth) {
			const user = await ctx.auth.getUserIdentity()
			if (user) {
				userId = user.subject
				console.log('[Tool:updateFormMetadata] Got userId from auth:', userId)
			}
		}

		const { formId } = ctx

		if (!userId) {
			throw new Error('User not authenticated')
		}

		try {
			await ctx.runMutation(internal.aiFormBuilderAgent.updateFormMetadata, {
				formId,
				userId,
				title: args.title,
				description: args.description,
				successMessage: args.successMessage
			})

			const updated = Object.keys(args).filter(
				(k) => args[k as keyof typeof args] !== undefined
			)
			return `✅ Updated form metadata: ${updated.join(', ')}`
		} catch (error) {
			console.error('[Tool:updateFormMetadata] Error:', error)
			throw error
		}
	}
})

export const createField = createTool({
	description:
		'Create a new field in the form. IMPORTANT: Call this tool ONCE for EACH field you need to create. If the user asks for multiple fields, you MUST call this tool multiple times - once per field.',
	args: z.object({
		title: z.string().describe('The field label/title'),
		type: z
			.enum(['singleline', 'multiline', 'number', 'select', 'checkbox', 'date'])
			.describe('The field type'),
		placeholder: z
			.string()
			.optional()
			.describe('Placeholder text for the field'),
		required: z
			.boolean()
			.default(false)
			.describe('Whether the field is required'),
		options: z
			.array(z.string())
			.optional()
			.describe('Options for select/checkbox fields')
	}),
	handler: async (ctx: FormBuilderToolCtx, args): Promise<string> => {
		// Try to get userId from ctx - if not available, get from auth
		let userId = ctx.userId
		if (!userId && ctx.auth) {
			const user = await ctx.auth.getUserIdentity()
			if (user) {
				userId = user.subject
			}
		}

		const { formId, businessId } = ctx

		if (!userId) {
			throw new Error('User not authenticated')
		}

		try {
			await ctx.runMutation(internal.aiFormBuilderAgent.createField, {
				formId,
				userId,
				businessId,
				title: args.title,
				type: args.type,
				placeholder: args.placeholder,
				required: args.required ?? false,
				options: args.options
			})

			return `✅ Created field: ${args.title} (${args.type})`
		} catch (error) {
			console.error('[Tool:createField] Error:', error)
			throw error
		}
	}
})

export const updateField = createTool({
	description: 'Update an existing field in the form',
	args: z.object({
		fieldTitle: z.string().describe('The current title of the field to update'),
		newTitle: z.string().optional().describe('The new field title'),
		type: z
			.enum(['singleline', 'multiline', 'number', 'select', 'checkbox', 'date'])
			.optional()
			.describe('The new field type'),
		placeholder: z
			.string()
			.optional()
			.describe('New placeholder text for the field'),
		required: z.boolean().optional().describe('Whether the field is required'),
		options: z
			.array(z.string())
			.optional()
			.describe('New options for select/checkbox fields')
	}),
	handler: async (ctx: FormBuilderToolCtx, args): Promise<string> => {
		// Try to get userId from ctx - if not available, get from auth
		let userId = ctx.userId
		if (!userId && ctx.auth) {
			const user = await ctx.auth.getUserIdentity()
			if (user) {
				userId = user.subject
			}
		}

		const { formId, businessId } = ctx

		if (!userId) {
			throw new Error('User not authenticated')
		}

		try {
			await ctx.runMutation(internal.aiFormBuilderAgent.updateField, {
				formId,
				userId,
				businessId,
				fieldTitle: args.fieldTitle,
				newTitle: args.newTitle,
				type: args.type,
				placeholder: args.placeholder,
				required: args.required,
				options: args.options
			})

			return `✅ Updated field: ${args.fieldTitle}`
		} catch (error) {
			console.error('[Tool:updateField] Error:', error)
			throw error
		}
	}
})

export const deleteField = createTool({
	description: 'Delete a field from the form',
	args: z.object({
		fieldTitle: z.string().describe('The title of the field to delete')
	}),
	handler: async (ctx: FormBuilderToolCtx, args): Promise<string> => {
		// Try to get userId from ctx - if not available, get from auth
		let userId = ctx.userId
		if (!userId && ctx.auth) {
			const user = await ctx.auth.getUserIdentity()
			if (user) {
				userId = user.subject
			}
		}

		const { formId, businessId } = ctx

		if (!userId) {
			throw new Error('User not authenticated')
		}

		try {
			await ctx.runMutation(internal.aiFormBuilderAgent.deleteField, {
				formId,
				userId,
				businessId,
				fieldTitle: args.fieldTitle
			})

			return `✅ Deleted field: ${args.fieldTitle}`
		} catch (error) {
			console.error('[Tool:deleteField] Error:', error)
			throw error
		}
	}
})
