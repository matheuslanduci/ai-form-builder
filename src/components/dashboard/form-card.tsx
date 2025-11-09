import { Link } from '@tanstack/react-router'
import type { Id } from 'convex/_generated/dataModel'
import { ArrowRight } from 'lucide-react'
import { cn } from '~/lib/utils'

const STATUS_CONFIG = {
	draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
	published: { label: 'Published', className: 'bg-green-100 text-green-700' },
	archived: { label: 'Archived', className: 'bg-orange-100 text-orange-700' }
} as const

interface FormCardProps {
	form: {
		_id: Id<'form'>
		title: string
		description?: string
		status: 'draft' | 'published' | 'archived'
		submissionCount: number
		lastUpdatedAt?: number
	}
}

export function FormCard({ form }: FormCardProps) {
	const statusConfig = STATUS_CONFIG[form.status]
	const lastUpdated = form.lastUpdatedAt
		? new Date(form.lastUpdatedAt).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			})
		: 'Never'

	return (
		<Link
			className="group rounded-lg border bg-white p-6 hover:border-gray-400 transition-colors block"
			params={{ id: form._id }}
			to="/forms/$id"
		>
			<div className="flex items-start justify-between mb-3">
				<div className="flex-1 min-w-0">
					<h3 className="font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
						{form.title}
					</h3>

					<p className="text-sm text-gray-500 mt-1 line-clamp-2">
						{form.description || 'No description provided.'}
					</p>
				</div>
				<ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors ml-2 shrink-0" />
			</div>

			<div className="flex items-center justify-between mt-4 pt-4 border-t">
				<div className="flex items-center gap-3">
					<span
						className={cn(
							'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
							statusConfig.className
						)}
					>
						{statusConfig.label}
					</span>
					<span className="text-sm text-gray-500">
						{form.submissionCount}{' '}
						{form.submissionCount === 1 ? 'submission' : 'submissions'}
					</span>
				</div>
			</div>
			<div className="text-xs text-gray-400 mt-2">Updated {lastUpdated}</div>
		</Link>
	)
}
