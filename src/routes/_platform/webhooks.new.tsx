import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { WebhookConfigSection } from '~/components/webhooks/webhook-config-section'
import { seo } from '~/lib/seo'

export const Route = createFileRoute('/_platform/webhooks/new')({
	component: RouteComponent,
	head: () => ({
		meta: seo({
			title: 'Create Webhook - AI Form Builder',
			description: 'Create a new webhook'
		})
	})
})

function RouteComponent() {
	const navigate = useNavigate()
	const { organization, isLoaded: isOrgLoaded } = useOrganization()
	const { user } = useUser()

	const [url, setUrl] = useState('')
	const [secret, setSecret] = useState('')
	const [enabled, setEnabled] = useState(true)

	const businessId = organization?.id ?? (user?.id as string)

	const createWebhookMutation = useMutation({
		mutationFn: useConvexMutation(api.webhook.create),
		onSuccess: () => {
			toast.success('Webhook created successfully')
			navigate({ to: '/webhooks' })
		},
		onError: () => {
			toast.error('Failed to create webhook')
		}
	})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		if (!url.trim()) {
			toast.error('Please enter a webhook URL')
			return
		}

		if (!secret.trim()) {
			toast.error('Please enter a webhook secret')
			return
		}

		// Validate URL format
		try {
			new URL(url)
		} catch {
			toast.error('Please enter a valid URL')
			return
		}

		createWebhookMutation.mutate({
			businessId,
			url: url.trim(),
			secret: secret.trim(),
			enabled
		})
	}

	if (!isOrgLoaded) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-5xl space-y-8 p-8">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Create Webhook</h1>
				<p className="text-sm text-gray-500 mt-1">
					Configure a new webhook to receive real-time notifications
				</p>
			</div>

			<WebhookConfigSection
				enabled={enabled}
				isSaving={createWebhookMutation.isPending}
				onEnabledChange={setEnabled}
				onSecretBlur={() => {}}
				onSecretChange={setSecret}
				onUrlBlur={() => {}}
				onUrlChange={setUrl}
				secret={secret}
				url={url}
			/>

			<div className="flex gap-3">
				<Button
					disabled={createWebhookMutation.isPending}
					onClick={handleSubmit}
					size="lg"
				>
					{createWebhookMutation.isPending && (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					)}
					Create Webhook
				</Button>
				<Button
					onClick={() => navigate({ to: '/webhooks' })}
					size="lg"
					type="button"
					variant="outline"
				>
					Cancel
				</Button>
			</div>
		</div>
	)
}
