import { createServerFn } from '@tanstack/react-start'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { ConvexHttpClient } from 'convex/browser'

// Create a stateless HTTP client for public form access
const getConvexClient = () => {
	const convexUrl = process.env.VITE_CONVEX_URL
	if (!convexUrl) {
		throw new Error('VITE_CONVEX_URL environment variable is not set')
	}
	return new ConvexHttpClient(convexUrl)
}

export const getPublicFormData = createServerFn({ method: 'GET' })
	.inputValidator((data: { formId: string }) => data)
	.handler(async ({ data }) => {
		const convex = getConvexClient()
		const formId = data.formId as Id<'form'>

		const [form, fields] = await Promise.all([
			convex.query(api.publicForm.getPublicForm, { formId }),
			convex.query(api.publicForm.getPublicFormFields, { formId })
		])

		return { form, fields }
	})

export const submitPublicForm = createServerFn({ method: 'POST' })
	.inputValidator(
		(data: { formId: string; formData: Record<string, string | string[]> }) =>
			data
	)
	.handler(async ({ data }) => {
		const convex = getConvexClient()
		const formId = data.formId as Id<'form'>

		const submissionId = await convex.mutation(api.publicForm.submitForm, {
			formId,
			data: data.formData
		})

		return { submissionId }
	})
