import { Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'

interface WebhookConfigSectionProps {
	url: string
	secret: string
	enabled: boolean
	isSaving: boolean
	onUrlChange: (value: string) => void
	onUrlBlur: () => void
	onSecretChange: (value: string) => void
	onSecretBlur: () => void
	onEnabledChange: (value: boolean) => void
}

export function WebhookConfigSection({
	url,
	secret,
	enabled,
	isSaving,
	onUrlChange,
	onUrlBlur,
	onSecretChange,
	onSecretBlur,
	onEnabledChange
}: WebhookConfigSectionProps) {
	const generateSecret = () => {
		// Generate a random secret
		const array = new Uint8Array(32)
		crypto.getRandomValues(array)
		const newSecret = Array.from(array, (byte) =>
			byte.toString(16).padStart(2, '0')
		).join('')
		onSecretChange(newSecret)
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-gray-900">
					Webhook Configuration
				</h2>
				<p className="text-sm text-gray-500">
					Configure your webhook to receive real-time notifications
				</p>
			</div>

			<div className="space-y-4 rounded-lg border bg-white p-6">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<Label>Status</Label>
						<p className="text-sm text-gray-500">
							Enable or disable this webhook
						</p>
					</div>
					<div className="flex items-center gap-2">
						{isSaving && (
							<Loader2 className="h-4 w-4 animate-spin text-gray-400" />
						)}
						<Switch checked={enabled} onCheckedChange={onEnabledChange} />
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="url">Webhook URL</Label>
					<Input
						id="url"
						onBlur={onUrlBlur}
						onChange={(e) => onUrlChange(e.target.value)}
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
							Generate
						</Button>
					</div>
					<Input
						id="secret"
						onBlur={onSecretBlur}
						onChange={(e) => onSecretChange(e.target.value)}
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
					<Label>Event Type</Label>
					<div className="rounded-lg bg-gray-50 p-3">
						<span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
							submission.created
						</span>
						<p className="mt-2 text-xs text-gray-500">
							Triggered when a new submission is created
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
