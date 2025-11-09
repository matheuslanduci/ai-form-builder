import type { Id } from 'convex/_generated/dataModel'
import { Loader2 } from 'lucide-react'
import { Pagination } from '~/components/ui/pagination'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table'

type WebhookEntry = {
	_id: Id<'webhookEntry'>
	_creationTime: number
	triggeredAt: number
	status: 'success' | 'failed'
	statusCode?: number
	errorMessage?: string
}

interface WebhookEntriesTableProps {
	entries: WebhookEntry[]
	isLoading: boolean
	hasMore: boolean
	cursorStack: (string | null)[]
	onNextPage: () => void
	onPrevPage: () => void
}

export function WebhookEntriesTable({
	entries,
	isLoading,
	hasMore,
	cursorStack,
	onNextPage,
	onPrevPage
}: WebhookEntriesTableProps) {
	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		})
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-gray-900">Webhook History</h2>
				<p className="text-sm text-gray-500">
					View all webhook trigger attempts and their results
				</p>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Triggered At</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Status Code</TableHead>
							<TableHead>Error Message</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{entries.length > 0 ? (
							entries.map((entry) => (
								<TableRow
									className="cursor-pointer hover:bg-gray-50"
									key={entry._id}
								>
									<TableCell className="text-sm text-gray-900">
										{formatDate(entry.triggeredAt)}
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
												entry.status === 'success'
													? 'bg-green-100 text-green-700'
													: 'bg-red-100 text-red-700'
											}`}
										>
											{entry.status}
										</span>
									</TableCell>
									<TableCell className="text-sm text-gray-500">
										{entry.statusCode || '-'}
									</TableCell>
									<TableCell className="max-w-md truncate text-sm text-gray-500">
										{entry.errorMessage || '-'}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell className="h-24 text-center" colSpan={4}>
									No webhook triggers yet.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{(hasMore || cursorStack.length > 0) && (
				<Pagination
					hasNext={hasMore}
					hasPrevious={cursorStack.length > 0}
					onNext={onNextPage}
					onPrevious={onPrevPage}
				/>
			)}
		</div>
	)
}
