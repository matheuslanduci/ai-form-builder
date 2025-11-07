import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'
import { resolveIdentity, resolveMembership } from './auth'
import { notFound } from './error'

export const recordEdit = internalMutation({
	args: {
		formId: v.id('form'),
		userId: v.string(),
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
			// For restore operations
			restoredFromId: v.optional(v.id('formEditHistory')),
			restoredAction: v.optional(v.string())
		})
	},
	returns: v.id('formEditHistory'),
	handler: async (ctx, args) => {
		return await ctx.db.insert('formEditHistory', {
			formId: args.formId,
			userId: args.userId,
			editType: args.editType,
			changeDetails: args.changeDetails
		})
	}
})

export const list = query({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
		paginationOpts: paginationOptsValidator
	},
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

		// Get edit history in descending order
		const history = await ctx.db
			.query('formEditHistory')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.order('desc')
			.paginate(args.paginationOpts)

		// Enrich with user data
		const enrichedPage = await Promise.all(
			history.page.map(async (entry) => {
				const clerkUser = await ctx.db
					.query('clerkUser')
					.withIndex('byClerkId', (q) => q.eq('clerkId', entry.userId))
					.unique()

				return {
					...entry,
					user: clerkUser
						? {
								firstName: clerkUser.firstName,
								lastName: clerkUser.lastName,
								avatarUrl: clerkUser.avatarUrl
							}
						: null
				}
			})
		)

		return {
			...history,
			page: enrichedPage
		}
	}
})

export const restore = mutation({
	args: {
		historyId: v.id('formEditHistory'),
		businessId: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		// Get the history entry to restore
		const historyEntry = await ctx.db.get(args.historyId)
		if (!historyEntry) throw notFound()

		// Verify user has access to the form
		const form = await ctx.db.get(historyEntry.formId)
		if (!form) throw notFound()

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		// Verify form belongs to business
		if (form.businessId !== args.businessId) throw notFound()

		const { editType, changeDetails } = historyEntry
		let restoredAction = ''
		const newChangeDetails: typeof changeDetails = {
			restoredFromId: args.historyId
		}

		// Restore based on edit type and capture what we're restoring
		switch (editType) {
			case 'form_updated': {
				const updates: {
					title?: string
					description?: string
					lastUpdatedAt: number
				} = {
					lastUpdatedAt: Date.now()
				}

				// Store current values as "old" and restored values as "new"
				if (changeDetails.oldTitle !== undefined) {
					newChangeDetails.oldTitle = form.title
					newChangeDetails.newTitle = changeDetails.oldTitle
					updates.title = changeDetails.oldTitle
				}
				if (changeDetails.oldDescription !== undefined) {
					newChangeDetails.oldDescription = form.description
					newChangeDetails.newDescription = changeDetails.oldDescription
					updates.description = changeDetails.oldDescription
				}

				await ctx.db.patch(historyEntry.formId, updates)
				restoredAction = 'form update'
				break
			}

			case 'form_status_changed': {
				if (changeDetails.oldStatus) {
					newChangeDetails.oldStatus = form.status
					newChangeDetails.newStatus = changeDetails.oldStatus

					await ctx.db.patch(historyEntry.formId, {
						status: changeDetails.oldStatus,
						lastUpdatedAt: Date.now()
					})
					restoredAction = 'status change'
				}
				break
			}

			case 'field_updated': {
				if (!changeDetails.fieldId) break

				const field = await ctx.db.get(changeDetails.fieldId)
				if (!field) break

				const updates: {
					title?: string
					placeholder?: string
					required?: boolean
					options?: string[]
				} = {}

				newChangeDetails.fieldId = changeDetails.fieldId
				newChangeDetails.fieldTitle = field.title
				newChangeDetails.fieldType = field.type

				if (changeDetails.oldFieldTitle !== undefined) {
					newChangeDetails.oldFieldTitle = field.title
					newChangeDetails.newFieldTitle = changeDetails.oldFieldTitle
					updates.title = changeDetails.oldFieldTitle
				}
				if (changeDetails.oldFieldPlaceholder !== undefined) {
					newChangeDetails.oldFieldPlaceholder = field.placeholder
					newChangeDetails.newFieldPlaceholder =
						changeDetails.oldFieldPlaceholder
					updates.placeholder = changeDetails.oldFieldPlaceholder
				}
				if (changeDetails.oldFieldRequired !== undefined) {
					newChangeDetails.oldFieldRequired = field.required
					newChangeDetails.newFieldRequired = changeDetails.oldFieldRequired
					updates.required = changeDetails.oldFieldRequired
				}
				if (changeDetails.oldFieldOptions !== undefined) {
					newChangeDetails.oldFieldOptions = field.options
					newChangeDetails.newFieldOptions = changeDetails.oldFieldOptions
					updates.options = changeDetails.oldFieldOptions
				}

				await ctx.db.patch(changeDetails.fieldId, updates)
				restoredAction = `field update for "${field.title}"`
				break
			}

			case 'field_deleted': {
				// Re-create the deleted field
				if (changeDetails.fieldTitle && changeDetails.fieldType) {
					const newFieldId = await ctx.db.insert('formField', {
						formId: historyEntry.formId,
						type: changeDetails.fieldType,
						title: changeDetails.fieldTitle,
						required: changeDetails.oldFieldRequired ?? false,
						order: 999,
						placeholder: changeDetails.oldFieldPlaceholder,
						options: changeDetails.oldFieldOptions
					})

					newChangeDetails.fieldId = newFieldId
					newChangeDetails.fieldTitle = changeDetails.fieldTitle
					newChangeDetails.fieldType = changeDetails.fieldType
					restoredAction = `field deletion of "${changeDetails.fieldTitle}"`
				}
				break
			}

			case 'field_created': {
				// Delete the created field
				if (changeDetails.fieldId) {
					const field = await ctx.db.get(changeDetails.fieldId)
					if (field) {
						newChangeDetails.fieldId = changeDetails.fieldId
						newChangeDetails.fieldTitle = field.title
						newChangeDetails.fieldType = field.type

						await ctx.db.delete(changeDetails.fieldId)
						restoredAction = `field creation of "${field.title}"`
					}
				}
				break
			}

			// form_created and fields_reordered cannot be restored
			case 'form_created':
			case 'fields_reordered':
			case 'restored':
				throw new Error('This action cannot be restored')
		}

		// Create a new history entry for the restore action
		if (restoredAction) {
			newChangeDetails.restoredAction = restoredAction

			await ctx.db.insert('formEditHistory', {
				formId: historyEntry.formId,
				userId: user.subject,
				editType: 'restored' as const,
				changeDetails: newChangeDetails
			})
		}

		return null
	}
})
