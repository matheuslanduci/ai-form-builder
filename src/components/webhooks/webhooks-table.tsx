import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { Edit, MoreHorizontal, Power, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DeleteWebhookDialog } from '~/components/webhooks/delete-webhook-dialog'
import { Button } from '../ui/button'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuTrigger
} from '../ui/context-menu'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger
} from '../ui/dropdown-menu'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '../ui/table'

const MENU_COMPONENTS = {
	dropdown: {
		Item: DropdownMenuItem,
		Label: DropdownMenuLabel
	},
	context: {
		Item: ContextMenuItem,
		Label: ContextMenuLabel
	}
} as const

interface Webhook {
	_id: Id<'webhook'>
	_creationTime: number
	formId?: Id<'form'>
	url: string
	event: 'submission.created'
	enabled: boolean
	lastTriggeredAt?: number
	lastStatus?: 'success' | 'failed'
}

function WebhookMenuItems({
	variant,
	webhook,
	onEditClick,
	onToggleEnabled,
	onDeleteClick
}: {
	variant: 'dropdown' | 'context'
	webhook: Webhook
	onEditClick: () => void
	onToggleEnabled: () => void
	onDeleteClick: () => void
}) {
	const { Item, Label } = MENU_COMPONENTS[variant]

	return (
		<>
			<Label>Actions</Label>
			<Item onClick={onEditClick}>
				<Edit className="mr-2 h-4 w-4" />
				Edit
			</Item>
			<Item onClick={onToggleEnabled}>
				<Power className="mr-2 h-4 w-4" />
				{webhook.enabled ? 'Disable' : 'Enable'}
			</Item>
			<Item className="text-destructive" onClick={onDeleteClick}>
				<Trash className="mr-2 h-4 w-4 text-destructive" />
				Delete
			</Item>
		</>
	)
}

interface WebhooksTableProps {
	webhooks: Webhook[]
	businessId: string
}

export function WebhooksTable({ webhooks, businessId }: WebhooksTableProps) {
	const navigate = useNavigate()
	const [deleteWebhook, setDeleteWebhook] = useState<Webhook | null>(null)

	const toggleEnabledMutation = useMutation({
		mutationFn: useConvexMutation(api.webhook.toggleEnabled),
		onSuccess: () => {
			toast.success('Webhook status updated')
		},
		onError: () => {
			toast.error('Failed to update webhook status')
		}
	})

	const handleToggleEnabled = (webhook: Webhook) => {
		toggleEnabledMutation.mutate({
			webhookId: webhook._id,
			businessId,
			enabled: !webhook.enabled
		})
	}

	const handleEditWebhook = (webhookId: Id<'webhook'>) => {
		navigate({ to: '/webhooks/$id', params: { id: webhookId } })
	}

	const formatDate = (timestamp?: number) => {
		if (!timestamp) return 'Never'
		return new Date(timestamp).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	return (
		<>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>URL</TableHead>
							<TableHead>Applies To</TableHead>
							<TableHead>Event</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Last Triggered</TableHead>
							<TableHead>Last Status</TableHead>
							<TableHead className="w-[70px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{webhooks.length > 0 ? (
							webhooks.map((webhook: Webhook) => (
								<ContextMenu key={webhook._id}>
									<ContextMenuTrigger asChild>
										<TableRow
											className="cursor-pointer"
											onClick={() => handleEditWebhook(webhook._id)}
										>
											<TableCell className="font-mono text-sm max-w-[300px] truncate">
												{webhook.url}
											</TableCell>
											<TableCell>
												<span className="text-sm text-gray-500">
													{webhook.formId ? (
														<span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
															Specific Form
														</span>
													) : (
														<span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700">
															All Forms
														</span>
													)}
												</span>
											</TableCell>
											<TableCell>
												<span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
													{webhook.event}
												</span>
											</TableCell>
											<TableCell>
												<span
													className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
														webhook.enabled
															? 'bg-green-100 text-green-700'
															: 'bg-gray-100 text-gray-700'
													}`}
												>
													{webhook.enabled ? 'Enabled' : 'Disabled'}
												</span>
											</TableCell>
											<TableCell className="text-sm text-gray-500">
												{formatDate(webhook.lastTriggeredAt)}
											</TableCell>
											<TableCell>
												{webhook.lastStatus && (
													<span
														className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
															webhook.lastStatus === 'success'
																? 'bg-green-100 text-green-700'
																: 'bg-red-100 text-red-700'
														}`}
													>
														{webhook.lastStatus}
													</span>
												)}
											</TableCell>
											<TableCell onClick={(e) => e.stopPropagation()}>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button size="icon" variant="ghost">
															<MoreHorizontal className="h-4 w-4" />
															<span className="sr-only">Open menu</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<WebhookMenuItems
															onDeleteClick={() => setDeleteWebhook(webhook)}
															onEditClick={() => handleEditWebhook(webhook._id)}
															onToggleEnabled={() =>
																handleToggleEnabled(webhook)
															}
															variant="dropdown"
															webhook={webhook}
														/>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									</ContextMenuTrigger>
									<ContextMenuContent>
										<WebhookMenuItems
											onDeleteClick={() => setDeleteWebhook(webhook)}
											onEditClick={() => handleEditWebhook(webhook._id)}
											onToggleEnabled={() => handleToggleEnabled(webhook)}
											variant="context"
											webhook={webhook}
										/>
									</ContextMenuContent>
								</ContextMenu>
							))
						) : (
							<TableRow>
								<TableCell className="h-24 text-center" colSpan={7}>
									No webhooks found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{deleteWebhook && (
				<DeleteWebhookDialog
					businessId={businessId}
					onClose={() => setDeleteWebhook(null)}
					open={!!deleteWebhook}
					webhook={deleteWebhook}
				/>
			)}
		</>
	)
}
