import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { Separator } from '~/components/ui/separator'
import { WebhookConfigSection } from '~/components/webhooks/webhook-config-section'
import { WebhookEntriesTable } from '~/components/webhooks/webhook-entries-table'
import { seo } from '~/lib/seo'

const webhookSearchSchema = z.object({
	cursor: z.string().nullable().catch(null).default(null)
})

export const Route = createFileRoute('/_platform/webhooks/$id/')({
	component: RouteComponent,
	validateSearch: webhookSearchSchema,
	head: () => ({
		meta: seo({
			title: 'Webhook Details - AI Form Builder',
			description: 'View and manage webhook configuration'
		})
	})
})

function RouteComponent() {
	const { id: webhookId } = Route.useParams()
	const search = Route.useSearch()
	const navigate = Route.useNavigate()
	const { organization, isLoaded: isOrgLoaded } = useOrganization()
	const { user } = useUser()
	const [cursorStack, setCursorStack] = useState<(string | null)[]>([])

	const [url, setUrl] = useState('')
	const [secret, setSecret] = useState('')
	const [enabled, setEnabled] = useState(true)
	const [isSaving, setIsSaving] = useState(false)

	const businessId = organization?.id ?? (user?.id as string)

	const { data: webhook, isLoading: isWebhookLoading } = useQuery(
		convexQuery(
			api.webhook.get,
			isOrgLoaded
				? {
						webhookId: webhookId as Id<'webhook'>,
						businessId
					}
				: 'skip'
		)
	)

	const { data: entriesResult, isLoading: isEntriesLoading } = useQuery(
		convexQuery(
			api.webhookEntry.list,
			isOrgLoaded && webhookId
				? {
						webhookId: webhookId as Id<'webhook'>,
						businessId,
						paginationOpts: { numItems: 20, cursor: search.cursor }
					}
				: 'skip'
		)
	)

	useEffect(() => {
		if (webhook) {
			setUrl(webhook.url)
			setSecret(webhook.secret)
			setEnabled(webhook.enabled)
		}
	}, [webhook])

	const updateWebhookMutation = useMutation({
		mutationFn: useConvexMutation(api.webhook.update),
		onSuccess: () => {
			toast.success('Webhook updated successfully')
			setIsSaving(false)
		},
		onError: () => {
			toast.error('Failed to update webhook')
			setIsSaving(false)
		}
	})

	const handleSave = (field: 'url' | 'secret' | 'enabled') => {
		if (field === 'url' && !url.trim()) {
			toast.error('Please enter a webhook URL')
			return
		}

		if (field === 'url') {
			try {
				new URL(url)
			} catch {
				toast.error('Please enter a valid URL')
				return
			}
		}

		if (field === 'secret' && !secret.trim()) {
			toast.error('Please enter a webhook secret')
			return
		}

		setIsSaving(true)
		updateWebhookMutation.mutate({
			webhookId: webhookId as Id<'webhook'>,
			businessId,
			url: url.trim(),
			secret: secret.trim(),
			enabled
		})
	}

	if (!isOrgLoaded || isWebhookLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
			</div>
		)
	}

	if (!webhook) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center">
					<h2 className="text-lg font-semibold">Webhook not found</h2>
				</div>
			</div>
		)
	}

	const entries = entriesResult?.page || []
	const hasMore = entriesResult?.isDone === false

	const handleNextPage = () => {
		if (!entriesResult?.continueCursor || entriesResult.isDone) return
		setCursorStack((prev) => [...prev, search.cursor])
		navigate({
			search: { cursor: entriesResult.continueCursor }
		})
	}

	const handlePrevPage = () => {
		const newStack = [...cursorStack]
		const prevCursor = newStack.pop()
		setCursorStack(newStack)
		navigate({
			search: { cursor: prevCursor ?? null }
		})
	}

	return (
		<div className="mx-auto max-w-5xl space-y-8 p-8">
			<WebhookConfigSection
				enabled={enabled}
				isSaving={isSaving}
				onEnabledChange={setEnabled}
				onSecretBlur={() => handleSave('secret')}
				onSecretChange={setSecret}
				onUrlBlur={() => handleSave('url')}
				onUrlChange={setUrl}
				secret={secret}
				url={url}
			/>

			<Separator />

			<WebhookEntriesTable
				cursorStack={cursorStack}
				entries={entries}
				hasMore={hasMore}
				isLoading={isEntriesLoading}
				onNextPage={handleNextPage}
				onPrevPage={handlePrevPage}
			/>
		</div>
	)
}
