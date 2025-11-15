import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { httpAction, internalQuery, mutation, query } from './_generated/server'
import { requireAdmin, resolveIdentity, resolveMembership } from './auth'
import { notFound } from './error'

export const list = query({
	args: {
		formId: v.id('form'),
		businessId: v.string(),
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

		const form = await ctx.db.get(args.formId)

		if (!form || form.businessId !== args.businessId) throw notFound()

		return await ctx.db
			.query('formSubmission')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.order('desc')
			.paginate(args.paginationOpts)
	}
})

export const deleteSubmission = mutation({
	args: {
		submissionId: v.id('formSubmission'),
		businessId: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		// Require admin for submission deletion
		await requireAdmin(ctx, {
			businessId: args.businessId,
			userId: user.subject
		})

		const submission = await ctx.db.get(args.submissionId)

		if (!submission) throw notFound()

		const form = await ctx.db.get(submission.formId)

		if (!form || form.businessId !== args.businessId) throw notFound()

		await ctx.db.patch(form._id, {
			submissionCount: Math.max(0, form.submissionCount - 1)
		})
		await ctx.db.delete(args.submissionId)

		return null
	}
})

export const deleteAllSubmissions = mutation({
	args: {
		formId: v.id('form'),
		businessId: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const user = await resolveIdentity(ctx)

		if (user.subject !== args.businessId) {
			await resolveMembership(ctx, {
				organizationId: args.businessId,
				userId: user.subject
			})
		}

		// Require admin for bulk submission deletion
		await requireAdmin(ctx, {
			businessId: args.businessId,
			userId: user.subject
		})

		const form = await ctx.db.get(args.formId)

		if (!form || form.businessId !== args.businessId) throw notFound()

		// Get all submissions for this form
		const submissions = await ctx.db
			.query('formSubmission')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()

		// Delete all submissions
		await Promise.all(submissions.map((s) => ctx.db.delete(s._id)))

		// Reset submission count
		await ctx.db.patch(form._id, {
			submissionCount: 0
		})

		return null
	}
})

/**
 * Internal query to get form data for export (bypasses auth since token is already validated)
 */
export const getFormForExport = internalQuery({
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
		const form = await ctx.db.get(args.formId)

		if (!form || form.businessId !== args.businessId) {
			return null
		}

		return form
	}
})

/**
 * Internal query to get form fields for export (bypasses auth since token is already validated)
 */
export const getFieldsForExport = internalQuery({
	args: {
		formId: v.id('form')
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
		return await ctx.db
			.query('formField')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.collect()
	}
})

/**
 * Internal query to get submissions for export (bypasses auth since token is already validated)
 */
export const getSubmissionsForExport = internalQuery({
	args: {
		formId: v.id('form'),
		paginationOpts: paginationOptsValidator
	},
	returns: v.object({
		page: v.array(
			v.object({
				_id: v.id('formSubmission'),
				_creationTime: v.number(),
				formId: v.id('form'),
				submittedAt: v.number(),
				data: v.any()
			})
		),
		isDone: v.boolean(),
		continueCursor: v.string(),
		splitCursor: v.optional(v.union(v.string(), v.null())),
		pageStatus: v.optional(v.union(v.string(), v.null()))
	}),
	handler: async (ctx, args) => {
		return await ctx.db
			.query('formSubmission')
			.withIndex('byFormId', (q) => q.eq('formId', args.formId))
			.order('desc')
			.paginate(args.paginationOpts)
	}
})

/**
 * HTTP action to export form submissions as CSV
 */
export const exportToCSV = httpAction(async (ctx, req) => {
	try {
		// Parse query parameters
		const url = new URL(req.url)
		const token = url.searchParams.get('token')

		if (!token) {
			return new Response(JSON.stringify({ error: 'Missing required token' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			})
		}

		// Validate token from database
		const tokenData = await ctx.runQuery(internal.export.validateExportToken, {
			token
		})

		if (!tokenData) {
			return new Response(
				JSON.stringify({ error: 'Invalid or expired token' }),
				{
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				}
			)
		}

		const { formId, businessId } = tokenData

		// Get form to verify access (using internal query to bypass auth)
		const form = await ctx.runQuery(internal.formSubmission.getFormForExport, {
			formId: formId as Id<'form'>,
			businessId: businessId
		})

		if (!form) {
			return new Response(JSON.stringify({ error: 'Form not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			})
		}

		// Get all form fields (using internal query)
		const fields = await ctx.runQuery(
			internal.formSubmission.getFieldsForExport,
			{
				formId: formId as Id<'form'>
			}
		)

		const sortedFields =
			fields?.sort(
				(a: (typeof fields)[number], b: (typeof fields)[number]) =>
					a.order - b.order
			) || []

		// Get all submissions (paginate through all)
		const allSubmissions: Array<{
			_id: Id<'formSubmission'>
			_creationTime: number
			formId: Id<'form'>
			submittedAt: number
			data: Record<string, string | string[]>
		}> = []

		let cursor: string | null = null
		let isDone = false

		while (!isDone) {
			const result: {
				page: Array<{
					_id: Id<'formSubmission'>
					_creationTime: number
					formId: Id<'form'>
					submittedAt: number
					data: Record<string, string | string[]>
				}>
				isDone: boolean
				continueCursor: string
			} = await ctx.runQuery(internal.formSubmission.getSubmissionsForExport, {
				formId: formId as Id<'form'>,
				paginationOpts: { numItems: 100, cursor }
			})

			allSubmissions.push(...result.page)
			isDone = result.isDone
			cursor = result.continueCursor
		}

		// Generate CSV content
		const csvRows: string[] = []

		// Header row
		const headers = [
			'Submission ID',
			...sortedFields.map(
				(field: (typeof sortedFields)[number]) => field.title
			),
			'Submitted At'
		]
		csvRows.push(headers.map((h) => escapeCSVField(h)).join(','))

		// Data rows
		for (const submission of allSubmissions) {
			const row = [
				submission._id,
				...sortedFields.map((field: (typeof sortedFields)[number]) => {
					const value = submission.data[field._id]
					if (value === undefined || value === null || value === '') {
						return ''
					}
					if (Array.isArray(value)) {
						return value.join('; ')
					}
					return String(value)
				}),
				new Date(submission.submittedAt).toISOString()
			]
			csvRows.push(row.map((cell) => escapeCSVField(String(cell))).join(','))
		}

		const csvContent = csvRows.join('\n')

		// Return CSV file
		return new Response(csvContent, {
			status: 200,
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="form-${formId}-submissions-${Date.now()}.csv"`,
				'Cache-Control': 'no-cache'
			}
		})
	} catch (error) {
		console.error('CSV export error:', error)
		return new Response(
			JSON.stringify({
				error: 'Failed to export submissions',
				message: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		)
	}
})

/**
 * Helper function to escape CSV fields
 */
function escapeCSVField(field: string): string {
	// If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
	if (field.includes(',') || field.includes('"') || field.includes('\n')) {
		return `"${field.replace(/"/g, '""')}"`
	}
	return field
}
