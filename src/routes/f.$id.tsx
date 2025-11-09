import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import {
	queryOptions,
	useMutation,
	useSuspenseQuery
} from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { useState } from 'react'
import { toast } from 'sonner'
import { seo } from '~/lib/seo'
import { FormRenderer } from '../components/forms/form-renderer'
import { FormSuccess } from '../components/forms/form-success'

const formQueryOptions = (formId: Id<'form'>) =>
	queryOptions(
		convexQuery(api.publicForm.getPublicForm, {
			formId
		})
	)

const fieldsQueryOptions = (formId: Id<'form'>) =>
	queryOptions(
		convexQuery(api.publicForm.getPublicFormFields, {
			formId
		})
	)

export const Route = createFileRoute('/f/$id')({
	loader: async ({ context, params }) => {
		const formId = params.id as Id<'form'>

		const [form] = await Promise.all([
			context.queryClient.ensureQueryData(formQueryOptions(formId)),
			context.queryClient.ensureQueryData(fieldsQueryOptions(formId))
		])

		if (!form) {
			throw notFound()
		}

		return { form }
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

	const { data: form, isLoading: isFormLoading } = useSuspenseQuery(
		formQueryOptions(formId)
	)
	const { data: fields = [], isLoading: isFieldsLoading } = useSuspenseQuery(
		fieldsQueryOptions(formId)
	)

	const [formData, setFormData] = useState<Record<string, string | string[]>>(
		{}
	)
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isSubmitted, setIsSubmitted] = useState(false)

	const submitFormFn = useConvexMutation(api.publicForm.submitForm)

	const submitMutation = useMutation({
		mutationFn: submitFormFn,
		onSuccess: () => {
			setIsSubmitted(true)
		},
		onError: (error) => {
			toast.error('Failed to submit form')
			console.error(error)
		}
	})

	const handleFieldChange = (fieldId: string, value: string | string[]) => {
		setFormData((prev) => ({
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
		setFormData({})
		setErrors({})
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		// Validate required fields
		const newErrors: Record<string, string> = {}
		fields.forEach((field) => {
			const fieldValue = formData[field._id]
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
			data: formData
		})
	}

	if (isFormLoading || isFieldsLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
					<p className="mt-4 text-muted-foreground">Loading form...</p>
				</div>
			</div>
		)
	}

	if (!form) {
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
				formTitle={form.title}
				successMessage={form.successMessage}
			/>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<FormRenderer
				errors={errors}
				fields={fields}
				form={form}
				formData={formData}
				isSubmitting={submitMutation.isPending}
				onClear={handleClear}
				onFieldChange={handleFieldChange}
				onSubmit={handleSubmit}
				submitButtonText="Submit"
			/>
		</div>
	)
}
