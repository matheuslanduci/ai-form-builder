import type { Id } from 'convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

interface FormMetadataSectionProps {
	formId: Id<'form'>
	submissionCount: number
	createdAt: number
	lastUpdatedAt?: number
	onCopyFormId: () => void
}

export function FormMetadataSection({
	formId,
	submissionCount,
	createdAt,
	lastUpdatedAt,
	onCopyFormId
}: FormMetadataSectionProps) {
	const formatDate = (timestamp?: number) => {
		if (!timestamp) return 'Never'
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		}).format(new Date(timestamp))
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-gray-900">Metadata</h2>
				<p className="text-sm text-gray-500 mt-1">
					Read-only information about your form
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="rounded-lg border p-4">
					<div className="text-sm text-gray-500">Submissions</div>
					<div className="text-sm font-semibold mt-1">{submissionCount}</div>
				</div>
				<div className="rounded-lg border p-4">
					<div className="text-sm text-gray-500">Created</div>
					<div className="text-sm font-medium mt-1">
						{formatDate(createdAt)}
					</div>
				</div>
				<div className="rounded-lg border p-4">
					<div className="text-sm text-gray-500">Last Updated</div>
					<div className="text-sm font-medium mt-1">
						{formatDate(lastUpdatedAt)}
					</div>
				</div>
			</div>

			<div className="space-y-2">
				<Label>Form ID</Label>
				<div className="flex gap-2">
					<Input
						className="font-mono text-sm"
						onClick={(e) => e.currentTarget.select()}
						readOnly
						value={formId}
					/>
					<Button onClick={onCopyFormId} variant="outline">
						Copy
					</Button>
				</div>
			</div>
		</div>
	)
}
