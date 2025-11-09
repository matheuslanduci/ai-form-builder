import { useOrganization, useUser } from '@clerk/tanstack-react-start'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Layout } from '~/components/layout/layout'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
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
	const [formId, setFormId] = useState<Id<'form'> | 'all'>('all')

	const businessId = organization?.id ?? (user?.id as string)

	const { data: formsData, isLoading: isFormsLoading } = useQuery(
		convexQuery(
			api.form.list,
			isOrgLoaded
				? {
						businessId,
						paginationOpts: {
							numItems: 100,
							cursor: null
						}
					}
				: 'skip'
		)
	)

	const forms = formsData?.page

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
			formId: formId === 'all' ? undefined : formId,
			url: url.trim(),
			secret: secret.trim(),
			enabled
		})
	}

	const generateSecret = () => {
		// Generate a random secret
		const array = new Uint8Array(32)
		crypto.getRandomValues(array)
		const secret = Array.from(array, (byte) =>
			byte.toString(16).padStart(2, '0')
		).join('')
		setSecret(secret)
	}

	if (!isOrgLoaded || isFormsLoading) {
		return (
			<Layout title="Create Webhook">
				<div className="flex h-full items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
				</div>
			</Layout>
		)
	}

	return (
		<Layout
			actions={
				<Button onClick={() => navigate({ to: '/webhooks' })} variant="outline">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to Webhooks
				</Button>
			}
			title="Create Webhook"
		>
			<form className="max-w-2xl space-y-6" onSubmit={handleSubmit}>
				<div className="rounded-lg border bg-white p-6 space-y-6">
					<div>
						<h3 className="text-lg font-semibold text-gray-900 mb-1">
							Webhook Configuration
						</h3>
						<p className="text-sm text-gray-500">
							Configure your webhook to receive real-time notifications when
							submissions are created.
						</p>
					</div>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="form">Apply to Form</Label>
							<Select
								onValueChange={(value) =>
									setFormId(value === 'all' ? 'all' : (value as Id<'form'>))
								}
								value={formId === 'all' ? 'all' : formId}
							>
								<SelectTrigger id="form">
									<SelectValue placeholder="Select a form" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Forms</SelectItem>
									{forms?.map((form) => (
										<SelectItem key={form._id} value={form._id}>
											{form.title}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-gray-500">
								Choose which form this webhook applies to, or select "All Forms"
								to receive events from all forms
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="url">Webhook URL</Label>
							<Input
								id="url"
								onChange={(e) => setUrl(e.target.value)}
								placeholder="https://example.com/webhook"
								type="url"
								value={url}
							/>
							<p className="text-xs text-gray-500">
								The URL where webhook events will be sent via POST request
							</p>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="secret">Webhook Secret</Label>
								<Button
									onClick={generateSecret}
									size="sm"
									type="button"
									variant="outline"
								>
									Generate Secret
								</Button>
							</div>
							<Input
								id="secret"
								onChange={(e) => setSecret(e.target.value)}
								placeholder="Enter a secret key"
								type="text"
								value={secret}
							/>
							<p className="text-xs text-gray-500">
								This secret will be sent in the X-Webhook-Secret header for
								verification
							</p>
						</div>

						<div className="space-y-2">
							<Label>Event</Label>
							<div className="rounded-lg bg-gray-50 p-3">
								<span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
									submission.created
								</span>
								<p className="text-xs text-gray-500 mt-2">
									Triggered when a new submission is created
								</p>
							</div>
						</div>

						<div className="flex items-center justify-between rounded-lg border p-4">
							<div className="space-y-0.5">
								<Label htmlFor="enabled">Enable Webhook</Label>
								<p className="text-xs text-gray-500">
									Start receiving webhook events immediately
								</p>
							</div>
							<Switch
								checked={enabled}
								id="enabled"
								onCheckedChange={setEnabled}
							/>
						</div>
					</div>
				</div>

				<div className="flex gap-3">
					<Button
						disabled={createWebhookMutation.isPending}
						size="lg"
						type="submit"
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
			</form>
		</Layout>
	)
}
