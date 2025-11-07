import { AlertCircle, Check, Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '../ui/select'

interface ShareFormDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	formId: string
	formTitle: string
	status: 'draft' | 'published' | 'archived'
	onStatusChange: (status: 'draft' | 'published' | 'archived') => void
	isUpdatingStatus?: boolean
}

export function ShareFormDialog({
	open,
	onOpenChange,
	formId,
	formTitle,
	status,
	onStatusChange,
	isUpdatingStatus = false
}: ShareFormDialogProps) {
	const [copied, setCopied] = useState(false)

	const publicFormUrl = `${window.location.origin}/f/${formId}`

	const handleCopy = () => {
		navigator.clipboard.writeText(publicFormUrl)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Share "{formTitle}"</DialogTitle>
					<DialogDescription>
						Anyone with this link can view and submit the form.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Status Selector */}
					<div className="space-y-2">
						<Label htmlFor="status">Form Status</Label>
						<Select
							disabled={isUpdatingStatus}
							onValueChange={(value) =>
								onStatusChange(value as 'draft' | 'published' | 'archived')
							}
							value={status}
						>
							<SelectTrigger id="status">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="draft">Draft</SelectItem>
								<SelectItem value="published">Published</SelectItem>
								<SelectItem value="archived">Archived</SelectItem>
							</SelectContent>
						</Select>

						{/* Warning for non-published forms */}
						{status !== 'published' && (
							<div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 border border-amber-200">
								<AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
								<p>
									<strong>Warning:</strong> Only published forms can be accessed
									publicly. Change the status to "Published" to make this form
									available.
								</p>
							</div>
						)}
					</div>

					{/* URL Input */}
					<div className="space-y-2">
						<Label htmlFor="url">Public Form URL</Label>
						<div className="flex gap-2">
							<Input
								className="flex-1 font-mono text-sm"
								id="url"
								onClick={(e) => e.currentTarget.select()}
								readOnly
								value={publicFormUrl}
							/>
							<Button
								className="shrink-0"
								onClick={handleCopy}
								size="icon"
								type="button"
								variant="outline"
							>
								{copied ? (
									<Check className="h-4 w-4 text-green-600" />
								) : (
									<Copy className="h-4 w-4" />
								)}
							</Button>
							<Button
								asChild
								className="shrink-0"
								size="icon"
								type="button"
								variant="outline"
							>
								<a
									href={publicFormUrl}
									rel="noopener noreferrer"
									target="_blank"
								>
									<ExternalLink className="h-4 w-4" />
								</a>
							</Button>
						</div>
					</div>

					{/* Info message */}
					<p className="text-xs text-muted-foreground">
						Tip: You can also preview the form before sharing by clicking the
						Preview button.
					</p>
				</div>
			</DialogContent>
		</Dialog>
	)
}
