'use node'

import { Resend } from '@convex-dev/resend'
import { render } from '@react-email/render'
import { v } from 'convex/values'
import NewSubmissionEmail from '../emails/new-submission'
import { components } from './_generated/api'
import { internalAction } from './_generated/server'

export const resend = new Resend(components.resend, {
	testMode: false
})

export const sendSubmissionNotifications = internalAction({
	args: {
		formId: v.id('form'),
		submissionId: v.id('formSubmission'),
		formTitle: v.string(),
		submittedAt: v.number(),
		fields: v.array(
			v.object({
				title: v.string(),
				type: v.string(),
				value: v.union(v.string(), v.array(v.string()))
			})
		),
		recipientEmails: v.array(v.string())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const viewUrl = `${process.env.SITE_URL || 'http://localhost:3000'}/forms/${args.formId}/submissions`

		const submittedAtFormatted = new Intl.DateTimeFormat('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}).format(new Date(args.submittedAt))

		const emailHtml = await render(
			NewSubmissionEmail({
				formTitle: args.formTitle,
				submissionId: args.submissionId,
				submittedAt: submittedAtFormatted,
				fields: args.fields,
				viewUrl
			})
		)

		for (const email of args.recipientEmails) {
			try {
				await resend.sendEmail(ctx, {
					from: process.env.RESEND_FROM || '',
					to: email,
					subject: `New submission for ${args.formTitle}`,
					html: emailHtml
				})
			} catch (error) {
				console.error(`Failed to send email to ${email}:`, error)
			}
		}

		return null
	}
})
