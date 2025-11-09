import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '~/components/ui/dialog'
import { Button } from '../ui/button'

interface DeleteWebhookDialogProps {
	webhook: {
		_id: Id<'webhook'>
		url: string
	}
	businessId: string
	open: boolean
	onClose: () => void
}

export function DeleteWebhookDialog({
	webhook,
	businessId,
	open,
	onClose
}: DeleteWebhookDialogProps) {
	const deleteWebhookMutation = useMutation({
		mutationFn: useConvexMutation(api.webhook.remove),
		onSuccess: () => {
			toast.success('Webhook deleted successfully')
			onClose()
		},
		onError: () => {
			toast.error('Failed to delete webhook')
		}
	})

	const handleDelete = () => {
		deleteWebhookMutation.mutate({
			webhookId: webhook._id,
			businessId
		})
	}

	return (
		<Dialog onOpenChange={onClose} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Webhook</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete this webhook? This action cannot be
						undone.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<div className="rounded-lg bg-gray-50 p-4">
						<p className="text-sm font-medium text-gray-700 mb-1">URL:</p>
						<p className="text-sm font-mono text-gray-900 break-all">
							{webhook.url}
						</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						disabled={deleteWebhookMutation.isPending}
						onClick={onClose}
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						disabled={deleteWebhookMutation.isPending}
						onClick={handleDelete}
						variant="destructive"
					>
						{deleteWebhookMutation.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Delete Webhook
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
