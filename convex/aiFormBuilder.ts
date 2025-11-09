import type { StreamId } from '@convex-dev/persistent-text-streaming'
import { PersistentTextStreaming } from '@convex-dev/persistent-text-streaming'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { streamText } from 'ai'
import { v } from 'convex/values'
import { z } from 'zod'
import { components, internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import {
	httpAction,
	internalMutation,
	mutation,
	query
} from './_generated/server'
import { resolveIdentity } from './auth'

const MODEL = 'google/gemini-2.0-flash-lite-001'

const persistentTextStreaming = new PersistentTextStreaming(
	components.persistentTextStreaming,
	{
		httpPath: '/ai-stream'
	}
)

// Query to get stream body (for persistent text streaming React hook)
export const getStreamBody = query({
	args: {
		streamId: v.string()
	},
	handler: async (ctx, args) => {
		return await persistentTextStreaming.getStreamBody(
			ctx,
			args.streamId as StreamId
		)
	}
})

// Create a chat message with a stream
export const createChatWithStream = mutation({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		content: v.string()
	},
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		console.log('[AI Form Builder] Creating chat with stream', {
			formId: args.formId,
			contentLength: args.content.length,
			userId: user.subject
		})

		// Create stream
		const streamId = await persistentTextStreaming.createStream(ctx)
		console.log('[AI Form Builder] Stream created', { streamId })

		// Insert user message
		const userMessageId = await ctx.db.insert('chatMessage', {
			formId: args.formId,
			userId: user.subject,
			role: 'user',
			content: args.content
		})

		// Insert assistant message placeholder with stream
		const assistantMessageId = await ctx.db.insert('chatMessage', {
			formId: args.formId,
			userId: user.subject,
			role: 'assistant',
			content: '',
			streamId
		})

		console.log('[AI Form Builder] Messages created', {
			userMessageId,
			assistantMessageId,
			streamId
		})

		return { assistantMessageId, streamId }
	}
})

// HTTP Action to handle streaming
export const streamAIResponse = httpAction(async (ctx, request) => {
	// Handle CORS preflight
	if (request.method === 'OPTIONS') {
		// Make sure the necessary headers are present for this to be a valid pre-flight request
		const headers = request.headers
		if (
			headers.get('Origin') !== null &&
			headers.get('Access-Control-Request-Method') !== null &&
			headers.get('Access-Control-Request-Headers') !== null
		) {
			return new Response(null, {
				headers: new Headers({
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST',
					'Access-Control-Allow-Headers': 'Content-Type',
					'Access-Control-Max-Age': '86400'
				})
			})
		}
		return new Response()
	}

	const body = await request.json()

	if (!body.streamId) {
		return new Response('Missing streamId', {
			status: 400,
			headers: new Headers({
				'Access-Control-Allow-Origin': '*',
				Vary: 'origin'
			})
		})
	}

	console.log('[AI Form Builder] Stream request received', {
		streamId: body.streamId
	})

	// Look up the chat message with this streamId to get formId and businessId
	const chatMessage = await ctx.runQuery(internal.chat.getByStreamId, {
		streamId: body.streamId
	})

	if (!chatMessage) {
		return new Response('Chat message not found for streamId', {
			status: 404,
			headers: new Headers({
				'Access-Control-Allow-Origin': '*',
				Vary: 'origin'
			})
		})
	}

	console.log('[AI Form Builder] Found chat message', {
		streamId: body.streamId,
		formId: chatMessage.formId,
		messageId: chatMessage._id
	})

	const generateChat = async (
		_ctx: unknown,
		_request: Request,
		_streamId: StreamId,
		chunkAppender: (chunk: string) => Promise<void>
	) => {
		try {
			// Get form and fields
			const form = await ctx.runQuery(internal.form.getInternal, {
				formId: chatMessage.formId,
				businessId: chatMessage.userId
			})

			if (!form) {
				await chunkAppender('Error: Form not found')
				return
			}

			const fields = await ctx.runQuery(internal.formField.listInternal, {
				formId: chatMessage.formId,
				businessId: chatMessage.userId,
				pageId: undefined
			})

			// Get last 6 messages
			const allMessages = await ctx.runQuery(internal.chat.listInternal, {
				formId: chatMessage.formId,
				businessId: chatMessage.userId
			})
			const recentMessages = allMessages.slice(-7, -1) // Exclude the empty assistant message we just created

			console.log('[AI Form Builder] Context loaded', {
				formTitle: form.title,
				fieldCount: fields.length,
				messageCount: recentMessages.length
			})

			// Build context
			const formContext = `
Current Form State:
- Title: ${form.title}
- Description: ${form.description || 'No description'}
- Success Message: ${form.successMessage || 'No custom success message'}
- Fields: ${fields.length > 0 ? fields.map((f: { title: string; type: string; required: boolean }) => `\n  • ${f.title} (${f.type}, ${f.required ? 'required' : 'optional'})`).join('') : '\n  No fields yet'}
			`.trim()

			// Build messages
			const messages: Array<{
				role: 'system' | 'user' | 'assistant'
				content: string
			}> = [
				{
					role: 'system',
					content: `You are an expert form builder assistant. You help users create and modify forms through conversation.

${formContext}

Your role is to:
1. Help users create, update, and delete form fields using the provided tools
2. Update form metadata (title, description, success message)
3. Execute tool calls to make actual changes to the form
4. BE SMART: Before creating a field, CHECK if a similar field already exists in the form
5. If the user asks to create fields that already exist, acknowledge them and explain they already exist

IMPORTANT RULES:
- ALWAYS check the "Current Form State" section above to see existing fields
- If a user requests a field that already exists (same or similar title), DO NOT create it again
- Instead, respond naturally: "We already have that field!" or "Those fields already exist in the form"
- Only create fields that are genuinely new or different from existing ones
- Be conversational and helpful, not robotic

CRITICAL: You MUST provide ALL required parameters when calling ANY tool. Never call a tool with empty {} parameters.

=== TOOL CALLING EXAMPLES ===

**Updating Form Metadata:**
User: "change the title to Gilda House"
Tool Call: updateFormMetadata with {title: "Gilda House"}

User: "update the description to Welcome to our form"
Tool Call: updateFormMetadata with {description: "Welcome to our form"}

User: "change success message to Thank you for submitting"
Tool Call: updateFormMetadata with {successMessage: "Thank you for submitting"}

**Creating Fields:**
User: "add a name field"
Tool Call: createField with {title: "Name", type: "singleline", required: true}

User: "criar um campo de idade"
Tool Call: createField with {title: "Idade", type: "number", required: false}

User: "add email field"
Tool Call: createField with {title: "Email", type: "singleline", required: true}

**Field Type Guidelines:**
- "singleline" for: name, email, address, short text (nome, email, endereço)
- "number" for: age, quantity, price, year, count (idade, quantidade, preço, ano, número favorito)
- "date" for: birth date, event date (data de nascimento, data do evento)
- "multiline" for: comments, descriptions, long text (comentários, descrição)
- "select" for: choosing from options with options array (escolha de opções)
- "checkbox" for: yes/no, agreements (sim/não, acordos)

REMEMBER: ALWAYS include the actual values in your tool calls. NEVER call a tool with empty {} parameters.`
				}
			]

			// Add recent messages
			for (const msg of recentMessages) {
				messages.push({
					role: msg.role,
					content: msg.content
				})
			}

			console.log('[AI Form Builder] Calling OpenRouter with streamText', {
				messageCount: messages.length
			}) // Call AI with streaming
			const openrouter = createOpenRouter({
				apiKey: process.env.OPENROUTER_API_KEY
			})

			// Define tools for AI - direct object notation
			const toolDefinitions = {
				updateFormMetadata: {
					description:
						'Update form metadata like title, description, or success message',
					parameters: z.object({
						title: z.string().optional().describe('The new title for the form'),
						description: z
							.string()
							.optional()
							.describe('The new description for the form'),
						successMessage: z
							.string()
							.optional()
							.describe('The message shown after successful form submission')
					})
				},
				createField: {
					description: 'Create a new field in the form',
					parameters: z.object({
						title: z.string().describe('The field label/title'),
						type: z
							.enum([
								'singleline',
								'multiline',
								'number',
								'select',
								'checkbox',
								'date'
							])
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
					})
				},
				updateField: {
					description: 'Update an existing field in the form',
					parameters: z.object({
						fieldTitle: z
							.string()
							.describe('The current title of the field to update'),
						newTitle: z.string().optional().describe('The new field title'),
						type: z
							.enum([
								'singleline',
								'multiline',
								'number',
								'select',
								'checkbox',
								'date'
							])
							.optional()
							.describe('The new field type'),
						placeholder: z
							.string()
							.optional()
							.describe('New placeholder text for the field'),
						required: z
							.boolean()
							.optional()
							.describe('Whether the field is required'),
						options: z
							.array(z.string())
							.optional()
							.describe('New options for select/checkbox fields')
					})
				},
				deleteField: {
					description: 'Delete a field from the form',
					parameters: z.object({
						fieldTitle: z.string().describe('The title of the field to delete')
					})
				}
			}

			const result = await streamText({
				model: openrouter(MODEL),
				messages,
				// biome-ignore lint/suspicious/noExplicitAny: AI SDK v5 runtime supports {description, parameters} despite type mismatch
				tools: toolDefinitions as any
			})

			console.log('[AI Form Builder] Stream started, processing chunks')

			// Stream text chunks
			for await (const chunk of result.textStream) {
				await chunkAppender(chunk)
			}

			// Get the full text and tool calls
			const finalText = await result.text
			const toolCalls = await result.toolCalls

			console.log('[AI Form Builder] Stream complete, processing tool calls', {
				toolCallsCount: toolCalls.length,
				hasText: finalText.length > 0
			}) // Execute tool calls
			const toolResults: string[] = []
			if (toolCalls && toolCalls.length > 0) {
				for (const toolCall of toolCalls) {
					console.log('[AI Form Builder] Executing tool', {
						name: toolCall.toolName,
						input: toolCall.input,
						fullToolCall: JSON.stringify(toolCall, null, 2)
					})

					try {
						if (toolCall.toolName === 'updateFormMetadata') {
							const params = toolCall.input as {
								title?: string
								description?: string
								successMessage?: string
							}
							console.log('[AI Form Builder] updateFormMetadata params', params)
							await ctx.runMutation(internal.aiFormBuilder.updateFormMetadata, {
								formId: chatMessage.formId,
								userId: chatMessage.userId,
								title: params.title,
								description: params.description,
								successMessage: params.successMessage
							})
							const result = `✅ Updated form metadata: ${Object.keys(params).join(', ')}`
							toolResults.push(result)
							await chunkAppender(`\n\n${result}`)
						} else if (toolCall.toolName === 'createField') {
							const params = toolCall.input as {
								title?: string
								name?: string // AI sometimes uses 'name' instead of 'title'
								type:
									| 'singleline'
									| 'multiline'
									| 'number'
									| 'select'
									| 'checkbox'
									| 'date'
								placeholder?: string
								required?: boolean
								options?: string[]
							}
							console.log('[AI Form Builder] createField params', params)

							// Handle both 'title' and 'name' properties
							const fieldTitle = params.title || params.name
							if (!fieldTitle) {
								throw new Error('Field title/name is required')
							}

							await ctx.runMutation(internal.aiFormBuilder.createField, {
								formId: chatMessage.formId,
								userId: chatMessage.userId,
								businessId: chatMessage.userId,
								title: fieldTitle,
								type: params.type,
								placeholder: params.placeholder,
								required: params.required ?? false,
								options: params.options
							})
							const result = `✅ Created field: ${fieldTitle}`
							toolResults.push(result)
							await chunkAppender(`\n\n${result}`)
						} else if (toolCall.toolName === 'updateField') {
							const params = toolCall.input as {
								fieldTitle: string
								newTitle?: string
								type?:
									| 'singleline'
									| 'multiline'
									| 'number'
									| 'select'
									| 'checkbox'
									| 'date'
								placeholder?: string
								required?: boolean
								options?: string[]
							}
							await ctx.runMutation(internal.aiFormBuilder.updateField, {
								formId: chatMessage.formId,
								userId: chatMessage.userId,
								businessId: chatMessage.userId,
								fieldTitle: params.fieldTitle,
								newTitle: params.newTitle,
								type: params.type,
								placeholder: params.placeholder,
								required: params.required,
								options: params.options
							})
							const result = `✅ Updated field: ${params.fieldTitle}`
							toolResults.push(result)
							await chunkAppender(`\n\n${result}`)
						} else if (toolCall.toolName === 'deleteField') {
							const params = toolCall.input as { fieldTitle: string }
							await ctx.runMutation(internal.aiFormBuilder.deleteField, {
								formId: chatMessage.formId,
								userId: chatMessage.userId,
								businessId: chatMessage.userId,
								fieldTitle: params.fieldTitle
							})
							const result = `✅ Deleted field: ${params.fieldTitle}`
							toolResults.push(result)
							await chunkAppender(`\n\n${result}`)
						}

						console.log('[AI Form Builder] Tool executed successfully', {
							toolName: toolCall.toolName
						})
					} catch (error) {
						const errorMsg = `❌ Error executing ${toolCall.toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`
						console.error('[AI Form Builder] Tool execution failed', {
							toolName: toolCall.toolName,
							error: error instanceof Error ? error.message : error
						})
						toolResults.push(errorMsg)
						await chunkAppender(`\n\n${errorMsg}`)
					}
				}
			}

			console.log('[AI Form Builder] All operations complete', {
				toolResults: toolResults.length
			})
		} catch (error) {
			console.error('[AI Form Builder] Fatal error in generateChat', {
				error: error instanceof Error ? error.message : error
			})
			await chunkAppender(
				`\n\nError: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
			)
		}
	}

	const response = await persistentTextStreaming.stream(
		ctx,
		request,
		body.streamId as StreamId,
		generateChat
	)

	// Set CORS headers
	response.headers.set('Access-Control-Allow-Origin', '*')
	response.headers.set('Vary', 'Origin')

	return response
})

// Internal mutations for tool execution
export const updateFormMetadata = internalMutation({
	args: {
		formId: v.id('form'),
		userId: v.string(),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		successMessage: v.optional(v.string())
	},
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

		// Log to edit history
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
	handler: async (ctx, args) => {
		// Get max order
		const fields = await ctx.db
			.query('formField')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		const maxOrder = fields.reduce((max, f) => Math.max(max, f.order), 0)

		const fieldId = await ctx.db.insert('formField', {
			formId: args.formId,
			type: args.type,
			title: args.title,
			placeholder: args.placeholder,
			required: args.required,
			order: maxOrder + 1,
			options: args.options
		})

		// Log to edit history
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
	handler: async (ctx, args) => {
		// Find field by title
		const fields = await ctx.db
			.query('formField')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		const field = fields.find(
			(f) => f.title.toLowerCase() === args.fieldTitle.toLowerCase()
		)

		if (!field) {
			throw new Error(`Field "${args.fieldTitle}" not found`)
		}

		const updateData: Partial<Doc<'formField'>> = {}

		if (args.newTitle !== undefined) updateData.title = args.newTitle
		if (args.type !== undefined) updateData.type = args.type
		if (args.placeholder !== undefined)
			updateData.placeholder = args.placeholder
		if (args.required !== undefined) updateData.required = args.required
		if (args.options !== undefined) updateData.options = args.options

		await ctx.db.patch(field._id, updateData)

		// Log to edit history
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
	}
})

export const deleteField = internalMutation({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		userId: v.string(),
		fieldTitle: v.string()
	},
	handler: async (ctx, args) => {
		// Find field by title
		const fields = await ctx.db
			.query('formField')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		const field = fields.find(
			(f) => f.title.toLowerCase() === args.fieldTitle.toLowerCase()
		)

		if (!field) {
			throw new Error(`Field "${args.fieldTitle}" not found`)
		}

		await ctx.db.delete(field._id)

		// Log to edit history
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
	}
})
