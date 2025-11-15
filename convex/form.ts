import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { internalQuery, mutation, query } from './_generated/server'
import { requireAdmin, resolveIdentity, resolveMembership } from './auth'
import { notFound } from './error'

export const list = query({
	args: {
		businessId: v.string(),
		tags: v.optional(v.array(v.id('tag'))),
		paginationOpts: paginationOptsValidator
	},
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		// If no tag filters, return all forms for the business
		if (!args.tags || args.tags.length === 0) {
			return await ctx.db
				.query('form')
				.withIndex('byBusinessId', (q) => q.eq('businessId', args.businessId))
				.paginate(args.paginationOpts)
		}

		// Use the join table to find forms with the specified tags
		// Get all formIds that have ALL the specified tags
		const formTagsByTag = await Promise.all(
			args.tags.map((tagId) =>
				ctx.db
					.query('formTag')
					.withIndex('byTagId', (q) => q.eq('tagId', tagId))
					.collect()
			)
		)

		// Find formIds that appear in all tag results (intersection)
		const formIdCounts = new Map<string, number>()
		for (const formTags of formTagsByTag) {
			for (const ft of formTags) {
				const count = (formIdCounts.get(ft.formId) || 0) + 1
				formIdCounts.set(ft.formId, count)
			}
		}

		// Only keep formIds that have all tags
		const requiredTagCount = args.tags.length
		const filteredFormIds = Array.from(formIdCounts.entries())
			.filter(([_, count]) => count === requiredTagCount)
			.map(([formId]) => formId)

		// Fetch the forms and filter by businessId
		const formPromises = filteredFormIds.map((formId) =>
			ctx.db.get(formId as Id<'form'>)
		)
		const forms = await Promise.all(formPromises)

		const businessForms = forms.filter(
			(form): form is Extract<typeof form, { businessId: string }> =>
				form !== null &&
				'businessId' in form &&
				form.businessId === args.businessId
		)

		// Sort by creation time descending
		businessForms.sort((a, b) => b._creationTime - a._creationTime)

		// No pagination when filtering - return all results
		return {
			page: businessForms,
			isDone: true,
			continueCursor: '',
			splitCursor: null,
			pageStatus: null
		}
	}
})

export const get = query({
	args: {
		formId: v.id('form'),
		businessId: v.string()
	},
	returns: v.union(
		v.object({
			_id: v.id('form'),
			_creationTime: v.number(),
			businessId: v.string(),
			title: v.string(),
			description: v.optional(v.string()),
			successMessage: v.optional(v.string()),
			submissionCount: v.number(),
			status: v.union(
				v.literal('draft'),
				v.literal('published'),
				v.literal('archived')
			),
			tags: v.array(v.id('tag')),
			lastUpdatedAt: v.optional(v.number())
		}),
		v.null()
	),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		const form = await ctx.db.get(args.formId)

		if (!form) throw notFound()

		if (form.businessId !== args.businessId) throw notFound()

		return form
	}
})

// Internal query for AI form builder
export const getInternal = internalQuery({
	args: {
		formId: v.id('form'),
		businessId: v.string()
	},
	handler: async (ctx, args) => {
		const form = await ctx.db.get(args.formId)
		if (!form) return null
		if (form.businessId !== args.businessId) return null
		return form
	}
})

export const getById = internalQuery({
	args: {
		formId: v.id('form')
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.formId)
	}
})

export const create = mutation({
	args: {
		businessId: v.string(),
		title: v.string(),
		description: v.optional(v.string())
	},
	returns: v.id('form'),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		let emailAddress: string[] = []

		if (user.subject !== args.businessId) {
			const { clerkOrg } = await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})

			const promises = []

			for (const member of clerkOrg.members) {
				if (member.role === 'org:admin') {
					promises.push(
						ctx.db
							.query('clerkUser')
							.withIndex('byClerkId', (q) => q.eq('clerkId', member.clerkId))
							.unique()
					)
				}

				const admins = await Promise.all(promises)

				emailAddress = admins
					.filter((admin) => admin !== null && admin.emailAddress.length > 0)
					// biome-ignore lint/style/noNonNullAssertion: Filtering nulls above
					.flatMap((admin) => admin!.emailAddress)
			}
		} else {
			const clerkUser = await ctx.db
				.query('clerkUser')
				.withIndex('byClerkId', (q) => q.eq('clerkId', user.subject))
				.unique()

			emailAddress = clerkUser ? clerkUser.emailAddress : []
		}

		const formId = await ctx.db.insert('form', {
			businessId: args.businessId,
			title: args.title,
			description: args.description,
			submissionCount: 0,
			status: 'draft',
			tags: [],
			lastUpdatedAt: Date.now()
		})

		// No formTag entries to create since tags array is empty initially

		for (const email of emailAddress) {
			await ctx.db.insert('formNotification', {
				formId,
				businessId: args.businessId,
				email,
				enabled: true
			})
		}

		await ctx.scheduler.runAfter(0, internal.formEditHistory.recordEdit, {
			formId,
			userId: user.subject,
			editType: 'form_created' as const,
			changeDetails: {
				newTitle: args.title,
				newDescription: args.description
			}
		})

		return formId
	}
})

export const update = mutation({
	args: {
		formId: v.id('form'),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		successMessage: v.optional(v.string())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		const form = await ctx.db.get(args.formId)

		if (!form) throw notFound()

		if (user.subject !== form.businessId) {
			await resolveMembership(ctx, {
				organizationId: form.businessId,
				userId: user.subject
			})
		}

		const updates: {
			title?: string
			description?: string
			successMessage?: string
			lastUpdatedAt: number
		} = {
			lastUpdatedAt: Date.now()
		}

		const changeDetails: {
			oldTitle?: string
			newTitle?: string
			oldDescription?: string
			newDescription?: string
		} = {}

		if (args.title !== undefined) {
			updates.title = args.title
			changeDetails.oldTitle = form.title
			changeDetails.newTitle = args.title
		}
		if (args.description !== undefined) {
			updates.description = args.description
			changeDetails.oldDescription = form.description
			changeDetails.newDescription = args.description
		}
		if (args.successMessage !== undefined) {
			updates.successMessage = args.successMessage
		}

		await ctx.db.patch(args.formId, updates)

		// Record the form update in edit history
		await ctx.scheduler.runAfter(0, internal.formEditHistory.recordEdit, {
			formId: args.formId,
			userId: user.subject,
			editType: 'form_updated' as const,
			changeDetails
		})

		return null
	}
})

export const updateStatus = mutation({
	args: {
		formId: v.id('form'),
		status: v.union(
			v.literal('draft'),
			v.literal('published'),
			v.literal('archived')
		)
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		const form = await ctx.db.get(args.formId)
		if (!form) {
			throw new Error('Form not found')
		}

		if (user.subject !== form.businessId) {
			await resolveMembership(ctx, {
				organizationId: form.businessId,
				userId: user.subject
			})
		}

		const oldStatus = form.status

		await ctx.db.patch(args.formId, {
			status: args.status,
			lastUpdatedAt: Date.now()
		})

		// Record the status change in edit history
		await ctx.scheduler.runAfter(0, internal.formEditHistory.recordEdit, {
			formId: args.formId,
			userId: user.subject,
			editType: 'form_status_changed' as const,
			changeDetails: {
				oldStatus,
				newStatus: args.status
			}
		})

		return null
	}
})

export const updateTags = mutation({
	args: {
		formId: v.id('form'),
		tags: v.array(v.id('tag'))
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		const form = await ctx.db.get(args.formId)
		if (!form) {
			throw new Error('Form not found')
		}

		if (user.subject !== form.businessId) {
			await resolveMembership(ctx, {
				organizationId: form.businessId,
				userId: user.subject
			})
		}

		// Get current formTag entries
		const currentFormTags = await ctx.db
			.query('formTag')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		// Delete all current formTag entries
		await Promise.all(currentFormTags.map((ft) => ctx.db.delete(ft._id)))

		// Create new formTag entries
		await Promise.all(
			args.tags.map((tagId) =>
				ctx.db.insert('formTag', {
					formId: args.formId,
					tagId
				})
			)
		)

		await ctx.db.patch(args.formId, {
			tags: args.tags,
			lastUpdatedAt: Date.now()
		})

		return null
	}
})

export const remove = mutation({
	args: {
		formId: v.id('form'),
		businessId: v.string()
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

		// Require admin for form deletion
		await requireAdmin(ctx, {
			businessId: args.businessId,
			userId: user.subject
		})

		// Fetch all related data
		const fields = await ctx.db
			.query('formField')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		const history = await ctx.db
			.query('formEditHistory')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		const chatMessages = await ctx.db
			.query('chatMessage')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		const formTags = await ctx.db
			.query('formTag')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		// Delete all related data in parallel
		await Promise.all([
			...fields.map((field) => ctx.db.delete(field._id)),
			...history.map((entry) => ctx.db.delete(entry._id)),
			...chatMessages.map((message) => ctx.db.delete(message._id)),
			...formTags.map((ft) => ctx.db.delete(ft._id))
		])

		// Delete the form itself
		await ctx.db.delete(args.formId)

		return null
	}
})
