import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import {
	queryOptions,
	useMutation,
	useSuspenseQuery
} from '@tanstack/react-query'
import {
	createFileRoute,
	Link,
	notFound,
	redirect,
	useNavigate
} from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { Edit, Eye, Send, Share2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { FormRenderer } from '~/components/forms/form-renderer'
import { ShareFormDialog } from '~/components/forms/share-form-dialog'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { seo } from '~/lib/seo'

const formQueryOptions = (formId: Id<'form'>, businessId: string) =>
	queryOptions(
		convexQuery(api.form.get, {
			formId,
			businessId
		})
	)

const fieldsQueryOptions = (formId: Id<'form'>, businessId: string) =>
	queryOptions(
		convexQuery(api.formField.list, {
			formId,
			businessId,
			pageId: undefined
		})
	)

export const Route = createFileRoute('/forms/$id/preview')({
	loader: async ({ context, params }) => {
		if (!context.auth.userId) {
			throw redirect({
				to: '/sign-in/$',
				params: {
					_splat: undefined
				}
			})
		}

		const formId = params.id as Id<'form'>
		const businessId = context.auth.org.id ?? (context.auth.userId as string)

		const [form] = await Promise.all([
			context.queryClient.ensureQueryData(formQueryOptions(formId, businessId)),
			context.queryClient.ensureQueryData(
				fieldsQueryOptions(formId, businessId)
			)
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
					title: `${loaderData.form.title} - Preview`,
					description: loaderData.form.description || 'Preview your form'
				})
			: undefined
	})
})

function RouteComponent() {
	const { id: formId } = Route.useParams()
	const navigate = useNavigate()
	const { user } = useUser()
	const { organization } = useOrganization()
	const [formData, setFormData] = useState<Record<string, string | string[]>>(
		{}
	)
	const [shareDialogOpen, setShareDialogOpen] = useState(false)

	const businessId = organization?.id ?? (user?.id as string)

	const updateStatusMutation = useMutation({
		mutationFn: useConvexMutation(api.form.updateStatus),
		onSuccess: () => {
			toast.success('Form published successfully!')
		},
		onError: () => {
			toast.error('Failed to publish form')
		}
	})

	const { data: form } = useSuspenseQuery(
		formQueryOptions(formId as Id<'form'>, businessId)
	)

	const { data: fields } = useSuspenseQuery(
		fieldsQueryOptions(formId as Id<'form'>, businessId)
	)

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		const missingFields = fields?.filter(
			(field) => field.required && !formData[field._id]
		)

		if (missingFields && missingFields.length > 0) {
			toast.error(
				`Please fill in all required fields: ${missingFields.map((f) => f.title).join(', ')}`
			)
			return
		}

		toast.success('Form submitted successfully!')
		setFormData({})
	}

	const handleFieldChange = (fieldId: string, value: string | string[]) => {
		setFormData((prev) => ({
			...prev,
			[fieldId]: value
		}))
	}

	const handleClear = () => {
		setFormData({})
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
						<Separator className="h-6!" orientation="vertical" />
						<div className="flex items-center gap-2">
							<Eye className="h-4 w-4 text-gray-500" />
							<span className="text-sm font-medium text-gray-700">
								Preview Mode
							</span>
						</div>
						<Separator className="h-6!" orientation="vertical" />
						<span className="text-sm text-gray-600 max-w-[200px] truncate">
							{form.title}
						</span>
					</div>

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

			<FormRenderer
				fields={sortedFields}
				form={form}
				formData={formData}
				onClear={handleClear}
				onFieldChange={handleFieldChange}
				onSubmit={handleSubmit}
				submitButtonText="Submit"
			/>

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
