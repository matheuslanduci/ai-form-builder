import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate
} from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { Calendar, Edit, Eye, Loader2, Send, Share2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ShareFormDialog } from '~/components/forms/share-form-dialog'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Textarea } from '~/components/ui/textarea'

export const Route = createFileRoute('/forms/$id/preview')({
	component: RouteComponent,
	beforeLoad({ context }) {
		if (!context.auth.userId) {
			throw redirect({
				to: '/sign-in/$',
				params: {
					_splat: undefined
				}
			})
		}
	}
})

function RouteComponent() {
	const { id: formId } = Route.useParams()
	const navigate = useNavigate()
	const { user } = useUser()
	const { organization, isLoaded } = useOrganization()
	const [formData, setFormData] = useState<Record<string, string | string[]>>(
		{}
	)
	const [shareDialogOpen, setShareDialogOpen] = useState(false)

	const updateStatusMutation = useMutation({
		mutationFn: useConvexMutation(api.form.updateStatus),
		onSuccess: () => {
			toast.success('Form published successfully!')
		},
		onError: () => {
			toast.error('Failed to publish form')
		}
	})

	const { data: form, isLoading: isFormLoading } = useQuery(
		convexQuery(
			api.form.get,
			isLoaded
				? {
						formId: formId as Id<'form'>,
						businessId: organization?.id ?? (user?.id as string)
					}
				: 'skip'
		)
	)

	const { data: fields, isLoading: isFieldsLoading } = useQuery(
		convexQuery(
			api.formField.list,
			isLoaded
				? {
						formId: formId as Id<'form'>,
						businessId: organization?.id ?? (user?.id as string)
					}
				: 'skip'
		)
	)

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		// Validate required fields
		const missingFields = fields?.filter(
			(field) => field.required && !formData[field._id]
		)

		if (missingFields && missingFields.length > 0) {
			toast.error(
				`Please fill in all required fields: ${missingFields.map((f) => f.title).join(', ')}`
			)
			return
		}

		console.log('Form submitted:', formData)
		// TODO: Implement form submission
		toast.success('Form submitted successfully!')
		setFormData({})
	}

	const handleFieldChange = (fieldId: string, value: string | string[]) => {
		setFormData((prev) => ({
			...prev,
			[fieldId]: value
		}))
	}

	const handleCheckboxChange = (
		fieldId: string,
		option: string,
		checked: boolean
	) => {
		setFormData((prev) => {
			const currentValues = (prev[fieldId] as string[]) || []
			if (checked) {
				return {
					...prev,
					[fieldId]: [...currentValues, option]
				}
			}
			return {
				...prev,
				[fieldId]: currentValues.filter((v) => v !== option)
			}
		})
	}

	if (isFormLoading || isFieldsLoading || !isLoaded) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
			</div>
		)
	}

	if (!form) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-semibold text-gray-900">
						Form not found
					</h1>
					<p className="text-muted-foreground mt-2">
						The form you're looking for doesn't exist or you don't have access
						to it.
					</p>
				</div>
			</div>
		)
	}

	const sortedFields = fields?.sort((a, b) => a.order - b.order) || []

	const handlePublish = () => {
		updateStatusMutation.mutate({
			formId: formId as Id<'form'>,
			status: 'published'
		})
	}

	const handleShare = () => {
		setShareDialogOpen(true)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Figma-style Header */}
			<header className="bg-background sticky top-0 z-50 border-b border-gray-200">
				<div className="flex h-14 items-center justify-between px-4">
					{/* Left Section */}
					<div className="flex items-center gap-3">
						<Button
							onClick={() =>
								navigate({ to: '/forms/$id', params: { id: formId } })
							}
							size="icon"
							variant="ghost"
						>
							<X className="h-4 w-4" />
						</Button>
						<Separator className="h-6" orientation="vertical" />
						<div className="flex items-center gap-2">
							<Eye className="h-4 w-4 text-gray-500" />
							<span className="text-sm font-medium text-gray-700">
								Preview Mode
							</span>
						</div>
						<Separator className="h-6" orientation="vertical" />
						<span className="text-sm text-gray-600 max-w-[200px] truncate">
							{form.title}
						</span>
					</div>

					{/* Right Section */}
					<div className="flex items-center gap-2">
						<Button onClick={handleShare} size="sm" variant="ghost">
							<Share2 className="mr-2 h-4 w-4" />
							Share
						</Button>

						<Button asChild size="sm" variant="ghost">
							<Link params={{ id: formId }} to="/forms/$id">
								<Edit className="mr-2 h-4 w-4" />
								Edit
							</Link>
						</Button>

						{form.status !== 'published' && (
							<Button
								disabled={updateStatusMutation.isPending}
								onClick={handlePublish}
								size="sm"
							>
								<Send className="mr-2 h-4 w-4" />
								{updateStatusMutation.isPending ? 'Publishing...' : 'Publish'}
							</Button>
						)}
					</div>
				</div>
			</header>

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
				<form className="space-y-6" onSubmit={handleSubmit}>
					{sortedFields.map((field) => (
						<div
							className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
							key={field._id}
						>
							<Label className="mb-3 block text-base font-medium text-gray-900">
								{field.title}
								{field.required && (
									<span className="text-destructive ml-1">*</span>
								)}
							</Label>

							{field.type === 'singleline' && (
								<Input
									className="text-base"
									onChange={(e) => handleFieldChange(field._id, e.target.value)}
									placeholder={field.placeholder || 'Your answer'}
									required={field.required}
									value={(formData[field._id] as string) || ''}
								/>
							)}

							{field.type === 'multiline' && (
								<Textarea
									className="min-h-[120px] resize-y text-base"
									onChange={(e) => handleFieldChange(field._id, e.target.value)}
									placeholder={field.placeholder || 'Your answer'}
									required={field.required}
									rows={4}
									value={(formData[field._id] as string) || ''}
								/>
							)}

							{field.type === 'number' && (
								<Input
									className="text-base"
									onChange={(e) => handleFieldChange(field._id, e.target.value)}
									placeholder={field.placeholder || '0'}
									required={field.required}
									type="number"
									value={(formData[field._id] as string) || ''}
								/>
							)}

							{field.type === 'select' && (
								<Select
									onValueChange={(value) => handleFieldChange(field._id, value)}
									required={field.required}
									value={(formData[field._id] as string) || ''}
								>
									<SelectTrigger className="text-base">
										<SelectValue placeholder="Select an option" />
									</SelectTrigger>
									<SelectContent>
										{field.options?.map((option) => (
											<SelectItem key={option} value={option}>
												{option}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}

							{field.type === 'checkbox' && (
								<div className="space-y-3">
									{field.options?.map((option) => (
										<div className="flex items-center space-x-2" key={option}>
											<Checkbox
												checked={(
													(formData[field._id] as string[]) || []
												).includes(option)}
												id={`${field._id}-${option}`}
												onCheckedChange={(checked) =>
													handleCheckboxChange(field._id, option, !!checked)
												}
											/>
											<label
												className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
												htmlFor={`${field._id}-${option}`}
											>
												{option}
											</label>
										</div>
									))}
								</div>
							)}

							{field.type === 'date' && (
								<div className="relative">
									<Input
										className="text-base"
										onChange={(e) =>
											handleFieldChange(field._id, e.target.value)
										}
										required={field.required}
										type="date"
										value={(formData[field._id] as string) || ''}
									/>
									<Calendar className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
								</div>
							)}
						</div>
					))}

					{/* Submit Buttons - Only show if there are fields */}
					{sortedFields.length > 0 && (
						<div className="flex justify-between pt-4">
							<Button
								className="px-8 py-6 text-base"
								size="lg"
								type="submit"
								variant="default"
							>
								Submit
							</Button>
							<Button
								className="px-8 py-6 text-base"
								onClick={() => setFormData({})}
								size="lg"
								type="button"
								variant="outline"
							>
								Clear form
							</Button>
						</div>
					)}
				</form>

				{/* Empty State */}
				{sortedFields.length === 0 && (
					<div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
						<p className="text-muted-foreground text-lg">
							This form doesn't have any fields yet.
						</p>
					</div>
				)}
			</div>

			{/* Share Dialog */}
			<ShareFormDialog
				formId={formId}
				formTitle={form.title}
				isUpdatingStatus={updateStatusMutation.isPending}
				onOpenChange={setShareDialogOpen}
				onStatusChange={(status) => {
					updateStatusMutation.mutate({
						formId: formId as Id<'form'>,
						status
					})
				}}
				open={shareDialogOpen}
				status={form.status}
			/>
		</div>
	)
}
