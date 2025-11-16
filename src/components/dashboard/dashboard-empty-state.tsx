import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { FileText, Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'

export function DashboardEmptyState() {
	const { organization } = useOrganization()
	const { user } = useUser()
	const navigate = useNavigate()

	const businessId = organization?.id ?? (user?.id as string)

	const createFormMutation = useMutation({
		mutationFn: useConvexMutation(api.form.create),
		onSuccess: (formId: Id<'form'>) => {
			navigate({
				to: '/forms/$id',
				params: { id: formId }
			})
		}
	})

	const handleCreateForm = () => {
		createFormMutation.mutate({
			businessId,
			title: 'Untitled Form'
		})
	}

	return (
		<div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
			<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
				<FileText className="h-6 w-6 text-gray-600" />
			</div>
			<h3 className="mt-4 text-lg font-semibold text-gray-900">No forms yet</h3>
			<p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
				Get started by creating your first form. Use our AI-powered form editor
				to create beautiful forms in minutes.
			</p>
			<Button
				className="mt-6"
				disabled={createFormMutation.isPending}
				onClick={handleCreateForm}
				size="lg"
			>
				<Plus className="mr-2 h-5 w-5" />
				{createFormMutation.isPending
					? 'Creating...'
					: 'Create Your First Form'}
			</Button>
		</div>
	)
}
