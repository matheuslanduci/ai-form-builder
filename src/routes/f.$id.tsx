import {
	queryOptions,
	useMutation,
	useSuspenseQuery
} from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import type { Id } from 'convex/_generated/dataModel'
import { useState } from 'react'
import { toast } from 'sonner'
import { seo } from '~/lib/seo'
import {
	getPublicFormData,
	submitPublicForm
} from '~/server/public-form.server'
import { FormRenderer } from '../components/forms/form-renderer'
import { FormSuccess } from '../components/forms/form-success'

const formQueryOptions = (formId: Id<'form'>) =>
	queryOptions({
		queryKey: ['public-form', formId],
		queryFn: () => getPublicFormData({ data: { formId } })
	})

export const Route = createFileRoute('/f/$id')({
	loader: async ({ context, params }) => {
		const formId = params.id as Id<'form'>

		const { form, fields } = await context.queryClient.ensureQueryData(
			formQueryOptions(formId)
		)

		if (!form) {
			throw notFound()
		}

		return { form, fields }
	},
	component: RouteComponent,
	head: ({ loaderData }) => ({
		meta: loaderData
			? seo({
					title: loaderData.form.title,
					description: loaderData.form.description || 'Fill out this form'
				})
			: undefined
	})
})

function RouteComponent() {
	const { id } = Route.useParams()
	const formId = id as Id<'form'>

	const { data: formData, isLoading: isFormLoading } = useSuspenseQuery(
		formQueryOptions(formId)
	)

	const [submissionData, setSubmissionData] = useState<
		Record<string, string | string[]>
	>({})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isSubmitted, setIsSubmitted] = useState(false)

	const submitMutation = useMutation({
		mutationFn: (data: {
			formId: string
			formData: Record<string, string | string[]>
		}) => submitPublicForm({ data }),
		onSuccess: () => {
			setIsSubmitted(true)
		},
		onError: (error) => {
			toast.error('Failed to submit form')
			console.error(error)
		}
	})

	const handleFieldChange = (fieldId: string, value: string | string[]) => {
		setSubmissionData((prev) => ({
			...prev,
			[fieldId]: value
		}))
		// Clear error for this field
		if (errors[fieldId]) {
			setErrors((prev) => {
				const newErrors = { ...prev }
				delete newErrors[fieldId]
				return newErrors
			})
		}
	}

	const handleClear = () => {
		setSubmissionData({})
		setErrors({})
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		// Validate required fields
		const newErrors: Record<string, string> = {}
		formData.fields.forEach((field) => {
			const fieldValue = submissionData[field._id]
			if (field.required) {
				// Check if field is empty (string) or has no selections (array)
				if (
					!fieldValue ||
					(Array.isArray(fieldValue) && fieldValue.length === 0)
				) {
					newErrors[field._id] = 'This field is required'
				}
			}
		})

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors)
			toast.error('Please fill in all required fields')
			return
		}

		// Submit the form
		submitMutation.mutate({
			formId,
			formData: submissionData
		})
	}

	if (isFormLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
					<p className="mt-4 text-muted-foreground">Loading form...</p>
				</div>
			</div>
		)
	}

	if (!formData.form) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold">Form not found</h1>
					<p className="mt-2 text-muted-foreground">
						This form is not available or has been unpublished.
					</p>
				</div>
			</div>
		)
	}

	// Show success page after submission
	if (isSubmitted) {
		return (
			<FormSuccess
				formTitle={formData.form.title}
				successMessage={formData.form.successMessage}
			/>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<FormRenderer
				errors={errors}
				fields={formData.fields}
				form={formData.form}
				formData={submissionData}
				isSubmitting={submitMutation.isPending}
				onClear={handleClear}
				onFieldChange={handleFieldChange}
				onSubmit={handleSubmit}
				submitButtonText="Submit"
			/>
		</div>
	)
}
