import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { useState } from 'react'
import { toast } from 'sonner'
import { FormField } from '../components/form-fields/form-field'
import { Button } from '../components/ui/button'

// Query options for SSR
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

		// Prefetch both queries
		const [form] = await Promise.all([
			context.queryClient.ensureQueryData(formQueryOptions(formId)),
			context.queryClient.ensureQueryData(fieldsQueryOptions(formId))
		])

		// If form is null (not found or not published), throw notFound
		if (!form) {
			throw notFound()
		}
	},
	component: PublicFormPage
})

function PublicFormPage() {
	const { id } = Route.useParams()
	const formId = id as Id<'form'>

	const { data: form, isLoading: isFormLoading } = useQuery(
		formQueryOptions(formId)
	)
	const { data: fields = [], isLoading: isFieldsLoading } = useQuery(
		fieldsQueryOptions(formId)
	)

	const [formData, setFormData] = useState<Record<string, string | string[]>>(
		{}
	)
	const [errors, setErrors] = useState<Record<string, string>>({})

	const submitFormFn = useConvexMutation(api.publicForm.submitForm)

	const submitMutation = useMutation({
		mutationFn: submitFormFn,
		onSuccess: () => {
			toast.success('Form submitted successfully!')
			// Reset form
			setFormData({})
			setErrors({})
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

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
				{/* Form Header */}
				<div className="mb-8 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
					<h1 className="text-3xl font-bold text-gray-900">{form.title}</h1>
					{form.description && (
						<p className="text-muted-foreground mt-2 text-lg">
							{form.description}
						</p>
					)}
					<div className="mt-4 flex items-center gap-2">
						<span className="text-destructive text-sm">* Required fields</span>
					</div>
				</div>

				{/* Form Fields */}
				{fields.length === 0 ? (
					<div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
						<p className="text-muted-foreground text-lg">
							This form doesn't have any fields yet.
						</p>
					</div>
				) : (
					<form className="space-y-6" onSubmit={handleSubmit}>
						{fields.map((field) => (
							<div
								className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
								key={field._id}
							>
								<FormField
									error={errors[field._id]}
									field={field}
									onChange={(value: string | string[]) =>
										handleFieldChange(field._id, value)
									}
									value={
										formData[field._id] || (field.type === 'checkbox' ? [] : '')
									}
								/>
							</div>
						))}

						{/* Submit Buttons */}
						<div className="flex justify-between pt-4">
							<Button
								className="px-8 py-6 text-base"
								disabled={submitMutation.isPending}
								size="lg"
								type="submit"
							>
								{submitMutation.isPending ? 'Submitting...' : 'Submit'}
							</Button>
							<Button
								className="px-8 py-6 text-base"
								disabled={submitMutation.isPending}
								onClick={() => {
									setFormData({})
									setErrors({})
								}}
								size="lg"
								type="button"
								variant="outline"
							>
								Clear form
							</Button>
						</div>
					</form>
				)}
			</div>
		</div>
	)
}
