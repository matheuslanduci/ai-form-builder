import { AlertCircle, Check } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'

interface StatusSectionProps {
	status: 'draft' | 'published' | 'archived'
	onStatusChange: (status: string) => void
}

export function StatusSection({ status, onStatusChange }: StatusSectionProps) {
	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-gray-900">Status</h2>
				<p className="text-sm text-gray-500 mt-1">
					Control the visibility and accessibility of your form
				</p>
			</div>

			<Tabs onValueChange={onStatusChange} value={status}>
				<TabsList>
					<TabsTrigger value="draft">Draft</TabsTrigger>
					<TabsTrigger value="published">Published</TabsTrigger>
					<TabsTrigger value="archived">Archived</TabsTrigger>
				</TabsList>
			</Tabs>

			{status === 'draft' && (
				<div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 border">
					<AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
					<p>
						This form is in draft mode and not publicly accessible. Publish it
						to make it available for submissions.
					</p>
				</div>
			)}

			{status === 'published' && (
				<div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-900 border border-green-200">
					<Check className="h-4 w-4 mt-0.5 shrink-0" />
					<p>
						This form is published and accepting submissions. You can share the
						public link with others.
					</p>
				</div>
			)}

			{status === 'archived' && (
				<div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 border border-amber-200">
					<AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
					<p>
						This form is archived and not accepting new submissions. You can
						still view existing submissions.
					</p>
				</div>
			)}
		</div>
	)
}
