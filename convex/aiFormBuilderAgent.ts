import { Agent } from '@convex-dev/agent'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { v } from 'convex/values'
import { components, internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import { action, internalMutation } from './_generated/server'
import {
	createField as createFieldTool,
	deleteField as deleteFieldTool,
	type FormBuilderToolCtx,
	updateField as updateFieldTool,
	updateFormMetadata as updateFormMetadataTool
} from './agentTools'

const MODEL = 'google/gemini-2.0-flash-lite-001'

const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY
})

const formBuilderAgent = new Agent<FormBuilderToolCtx>(components.agent, {
	name: 'Form Builder Assistant',
	languageModel: openrouter.chat(MODEL),
	instructions: `You are an expert form builder assistant helping users EDIT an existing form. 

🎯 CONTEXT: The user is already in the form builder editing a form. Your job is to MODIFY the current form - update its title/description and add/edit/delete fields.

⚠️ IMPORTANT: Do NOT try to create a new form. The form already exists. Use the tools to:
- Update form title and description (updateFormMetadata)
- Add fields to the form (createField)
- Modify existing fields (updateField)
- Remove fields (deleteField)

⚠️ CRITICAL: When a user requests multiple fields (e.g., "add Name and Email"), call createField MULTIPLE TIMES - once per field.

📋 FIELD TYPE SELECTION GUIDE:
- **singleline**: Use for short text inputs (name, email, phone, single-line answers)
- **multiline**: Use for long text (comments, descriptions, addresses, paragraphs)
- **number**: Use for numeric values (age, quantity, price)
- **date**: Use for dates (birthday, event date, deadline)
- **select**: Use for dropdown menus with multiple options (country, state, preference)
- **checkbox**: Use for Yes/No questions, boolean choices, or multi-select options

Examples:
- "add Name and Email" → Call createField twice (both singleline)
- "Add a question 'Are you going?'" → Call createField once (type: checkbox, options: ["Yes", "No"])
- "Add Name, Email, Phone" → Call createField three times (all singleline)
- "Add a comments field" → Call createField once (type: multiline)
- "Create a form with Name, Email, Phone" → Update title/description + Call createField three times`,,
	tools: {
		updateFormMetadata: updateFormMetadataTool,
		createField: createFieldTool,
		updateField: updateFieldTool,
		deleteField: deleteFieldTool
	},
	maxSteps: 10 // Allow up to 10 tool execution steps
})

// New agent-based chat (simplified - no threads, just generateText with tools)
export const chatWithAgent = action({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		content: v.string()
	},
	returns: v.object({
		messageId: v.id('chatMessage'),
		response: v.string()
	}),
	handler: async (
		ctx,
		args
	): Promise<{ messageId: Id<'chatMessage'>; response: string }> => {
		try {
			const user = await ctx.auth.getUserIdentity()
			if (!user) {
				console.error('[Agent] Not authenticated')
				throw new Error('Not authenticated')
			}

			console.log('[Agent] Starting chat', {
				formId: args.formId,
				businessId: args.businessId,
				userId: user.subject
			})

			// Verify form access and permissions using internal query
			const form = await ctx.runQuery(internal.form.getById, {
				formId: args.formId
			})
			if (!form) {
				console.error('[Agent] Form not found', { formId: args.formId })
				throw new Error('Form not found')
			}
			if (form.businessId !== args.businessId) {
				console.error('[Agent] Form businessId mismatch', {
					formBusinessId: form.businessId,
					requestedBusinessId: args.businessId
				})
				throw new Error('Form does not belong to this business')
			}

			console.log('[Agent] Form access verified')

			// Permission check is handled by internal.form.getById which uses resolveMembership

			// Get current form state
			const fields = await ctx.runQuery(internal.formField.listInternal, {
				formId: args.formId,
				businessId: args.businessId,
				pageId: undefined
			})

			console.log('[Agent] Loaded form state', {
				title: form.title,
				fieldsCount: fields.length
			})

			const formContext = `Current Form:
- Title: ${form.title}
- Description: ${form.description || 'None'}
- Fields: ${fields.length > 0 ? fields.map((f) => `${f.title} (${f.type})`).join(', ') : 'None yet'}

User: ${args.content}`

			// Create thread and generate response
			// Note: Agent context is complex, using type assertion to add custom properties
			const toolContext = {
				...ctx,
				formId: args.formId,
				businessId: args.businessId,
				userId: user.subject
			} as typeof ctx & FormBuilderToolCtx

			console.log('[Agent] Tool context prepared:', {
				formId: toolContext.formId,
				businessId: toolContext.businessId,
				userId: toolContext.userId,
				userIdType: typeof toolContext.userId,
				userIdFromArgs: user.subject
			})

			const createThreadResult =
				await formBuilderAgent.createThread(toolContext)
			const threadId = createThreadResult.threadId

			console.log('[Agent] Thread created', { threadId })

			const result = await formBuilderAgent.generateText(
				toolContext,
				{
					threadId
				},
				{
					prompt: formContext
				}
			)

			console.log('[Agent] Generated text', {
				stepsCount: result.steps?.length || 0,
				responseLength: result.text.length
			})

			// Log tool execution details
			if (result.steps && result.steps.length > 0) {
				console.log('[Agent] Tool execution summary:')
				result.steps.forEach((step, i) => {
					const toolCalls = step.content.filter(
						(c) => 'toolName' in c && c.type === 'tool-call'
					)
					const toolResults = step.content.filter(
						(c) =>
							'toolName' in c &&
							(c.type === 'tool-result' || c.type === 'tool-error')
					)

					if (toolCalls.length > 0) {
						console.log(`  Step ${i + 1}: ${toolCalls.length} tool(s) called`)
						toolCalls.forEach((tc) => {
							if ('toolName' in tc && 'toolCallId' in tc) {
								const result = toolResults.find(
									(tr) => 'toolCallId' in tr && tr.toolCallId === tc.toolCallId
								)
								const isError =
									result && 'type' in result && result.type === 'tool-error'
								const status = isError ? '❌ ERROR' : '✅ SUCCESS'
								console.log(
									`    ${status} ${tc.toolName}:`,
									'input' in tc ? tc.input : {}
								)
								if (isError && 'error' in result) {
									console.log(`      Error:`, result.error)
								}
							}
						})
					}
				})
			}

			// Save user message to chat history
			await ctx.runMutation(internal.chat.createInternal, {
				formId: args.formId,
				businessId: args.businessId,
				userId: user.subject,
				role: 'user' as const,
				content: args.content
			})

			// Save assistant response to chat table
			const assistantMessageId: Id<'chatMessage'> = await ctx.runMutation(
				internal.chat.createInternal,
				{
					formId: args.formId,
					businessId: args.businessId,
					userId: user.subject,
					role: 'assistant' as const,
					content: result.text
				}
			)

			console.log('[Agent] Chat complete', {
				messageId: assistantMessageId,
				steps: result.steps?.length || 0
			})

			return {
				messageId: assistantMessageId,
				response: result.text
			}
		} catch (error) {
			console.error('[Agent] Error in chatWithAgent:', error)
			throw error
		}
	}
})

// Keep existing internal mutations (unchanged)
export const updateFormMetadata = internalMutation({
	args: {
		formId: v.id('form'),
		userId: v.string(),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		successMessage: v.optional(v.string())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const form = await ctx.db.get(args.formId)
		if (!form) throw new Error('Form not found')

		const updateData: Partial<Doc<'form'>> = {}
		if (args.title !== undefined) updateData.title = args.title
		if (args.description !== undefined)
			updateData.description = args.description
		if (args.successMessage !== undefined)
			updateData.successMessage = args.successMessage

		await ctx.db.patch(args.formId, updateData)

		if (args.title !== undefined || args.description !== undefined) {
			await ctx.db.insert('formEditHistory', {
				formId: args.formId,
				userId: args.userId,
				editType: 'form_updated',
				changeDetails: {
					oldTitle: form.title,
					newTitle: args.title,
					oldDescription: form.description,
					newDescription: args.description
				}
			})
		}
		return null
	}
})

export const createField = internalMutation({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		userId: v.string(),
		title: v.string(),
		type: v.union(
			v.literal('singleline'),
			v.literal('multiline'),
			v.literal('number'),
			v.literal('select'),
			v.literal('checkbox'),
			v.literal('date')
		),
		placeholder: v.optional(v.string()),
		required: v.boolean(),
		options: v.optional(v.array(v.string()))
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const fields = await ctx.db
			.query('formField')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		// Shift all existing fields down by 1 to make room at the top
		for (const field of fields) {
			await ctx.db.patch(field._id, { order: field.order + 1 })
		}

		// Insert new field at order 0 (top of the form)
		const fieldId = await ctx.db.insert('formField', {
			formId: args.formId,
			type: args.type,
			title: args.title,
			placeholder: args.placeholder,
			required: args.required,
			order: 0,
			options: args.options
		})

		await ctx.db.insert('formEditHistory', {
			formId: args.formId,
			userId: args.userId,
			editType: 'field_created',
			changeDetails: {
				fieldId,
				fieldTitle: args.title,
				fieldType: args.type
			}
		})
		return null
	}
})

export const updateField = internalMutation({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		userId: v.string(),
		fieldTitle: v.string(),
		newTitle: v.optional(v.string()),
		type: v.optional(
			v.union(
				v.literal('singleline'),
				v.literal('multiline'),
				v.literal('number'),
				v.literal('select'),
				v.literal('checkbox'),
				v.literal('date')
			)
		),
		placeholder: v.optional(v.string()),
		required: v.optional(v.boolean()),
		options: v.optional(v.array(v.string()))
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const fields = await ctx.db
			.query('formField')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		const field = fields.find(
			(f) => f.title.toLowerCase() === args.fieldTitle.toLowerCase()
		)

		if (!field) throw new Error(`Field "${args.fieldTitle}" not found`)

		const updateData: Partial<Doc<'formField'>> = {}
		if (args.newTitle !== undefined) updateData.title = args.newTitle
		if (args.type !== undefined) updateData.type = args.type
		if (args.placeholder !== undefined)
			updateData.placeholder = args.placeholder
		if (args.required !== undefined) updateData.required = args.required
		if (args.options !== undefined) updateData.options = args.options

		await ctx.db.patch(field._id, updateData)

		await ctx.db.insert('formEditHistory', {
			formId: args.formId,
			userId: args.userId,
			editType: 'field_updated',
			changeDetails: {
				fieldId: field._id,
				oldFieldTitle: field.title,
				newFieldTitle: args.newTitle,
				oldFieldRequired: field.required,
				newFieldRequired: args.required,
				oldFieldPlaceholder: field.placeholder,
				newFieldPlaceholder: args.placeholder,
				oldFieldOptions: field.options,
				newFieldOptions: args.options
			}
		})
		return null
	}
})

export const deleteField = internalMutation({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		userId: v.string(),
		fieldTitle: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const fields = await ctx.db
			.query('formField')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		const field = fields.find(
			(f) => f.title.toLowerCase() === args.fieldTitle.toLowerCase()
		)

		if (!field) throw new Error(`Field "${args.fieldTitle}" not found`)

		await ctx.db.delete(field._id)

		await ctx.db.insert('formEditHistory', {
			formId: args.formId,
			userId: args.userId,
			editType: 'field_deleted',
			changeDetails: {
				fieldId: field._id,
				fieldTitle: field.title,
				fieldType: field.type
			}
		})
		return null
	}
})
