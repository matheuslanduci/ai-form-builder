import type { Id } from 'convex/_generated/dataModel'
import {
	FileText,
	GitBranch,
	ListPlus,
	Pencil,
	RotateCcw,
	Settings,
	Trash2
} from 'lucide-react'
import { Button } from '~/components/ui/button'

type EditType =
	| 'form_created'
	| 'form_updated'
	| 'form_status_changed'
	| 'field_created'
	| 'field_updated'
	| 'field_deleted'
	| 'fields_reordered'
	| 'restored'

interface TimelineEntry {
	_id: Id<'formEditHistory'>
	_creationTime: number
	formId: Id<'form'>
	userId: string
	editType: EditType
	changeDetails: {
		oldTitle?: string
		newTitle?: string
		oldDescription?: string
		newDescription?: string
		oldStatus?: 'draft' | 'published' | 'archived'
		newStatus?: 'draft' | 'published' | 'archived'
		fieldId?: Id<'formField'>
		fieldTitle?: string
		fieldType?:
			| 'singleline'
			| 'multiline'
			| 'number'
			| 'select'
			| 'checkbox'
			| 'date'
		oldFieldTitle?: string
		newFieldTitle?: string
		oldFieldPlaceholder?: string
		newFieldPlaceholder?: string
		oldFieldRequired?: boolean
		newFieldRequired?: boolean
		oldFieldOptions?: string[]
		newFieldOptions?: string[]
		restoredFromId?: Id<'formEditHistory'>
		restoredAction?: string
	}
	user: {
		firstName?: string
		lastName?: string
		avatarUrl?: string
	} | null
}

interface TimelineEntryCardProps {
	entry: TimelineEntry
	isLast: boolean
	onRestore: (historyId: Id<'formEditHistory'>) => void
	isRestoring: boolean
}

function getEditIcon(editType: EditType) {
	switch (editType) {
		case 'form_created':
			return FileText
		case 'form_updated':
			return Pencil
		case 'form_status_changed':
			return Settings
		case 'field_created':
			return ListPlus
		case 'field_updated':
			return Pencil
		case 'field_deleted':
			return Trash2
		case 'fields_reordered':
			return GitBranch
		case 'restored':
			return RotateCcw
	}
}

function getEditDescription(entry: TimelineEntry) {
	const { editType, changeDetails } = entry

	switch (editType) {
		case 'form_created':
			return `Created form "${changeDetails.newTitle}"`
		case 'form_updated': {
			const changes = []
			if (
				changeDetails.oldTitle !== undefined &&
				changeDetails.newTitle !== undefined
			) {
				changes.push(
					`title from "${changeDetails.oldTitle}" to "${changeDetails.newTitle}"`
				)
			}
			if (
				changeDetails.oldDescription !== undefined &&
				changeDetails.newDescription !== undefined
			) {
				const oldDesc = changeDetails.oldDescription || '(empty)'
				const newDesc = changeDetails.newDescription || '(empty)'
				changes.push(`description from "${oldDesc}" to "${newDesc}"`)
			}
			return changes.length > 0
				? `Updated ${changes.join(' and ')}`
				: 'Updated form'
		}
		case 'form_status_changed':
			return `Changed status from "${changeDetails.oldStatus}" to "${changeDetails.newStatus}"`
		case 'field_created':
			return `Added field "${changeDetails.fieldTitle}" (${changeDetails.fieldType})`
		case 'field_updated': {
			const changes = []
			if (
				changeDetails.oldFieldTitle !== undefined &&
				changeDetails.newFieldTitle !== undefined
			) {
				changes.push(
					`title from "${changeDetails.oldFieldTitle}" to "${changeDetails.newFieldTitle}"`
				)
			}
			if (
				changeDetails.oldFieldPlaceholder !== undefined &&
				changeDetails.newFieldPlaceholder !== undefined
			) {
				changes.push(
					`placeholder from "${changeDetails.oldFieldPlaceholder || '(empty)'}" to "${changeDetails.newFieldPlaceholder || '(empty)'}"`
				)
			}
			if (
				changeDetails.oldFieldRequired !== undefined &&
				changeDetails.newFieldRequired !== undefined
			) {
				changes.push(
					`required from ${changeDetails.oldFieldRequired} to ${changeDetails.newFieldRequired}`
				)
			}
			if (
				changeDetails.oldFieldOptions !== undefined &&
				changeDetails.newFieldOptions !== undefined
			) {
				changes.push(
					`options from [${changeDetails.oldFieldOptions.join(', ')}] to [${changeDetails.newFieldOptions.join(', ')}]`
				)
			}
			return changes.length > 0
				? `Updated field "${changeDetails.fieldTitle}": ${changes.join(', ')}`
				: `Updated field "${changeDetails.fieldTitle}"`
		}
		case 'field_deleted':
			return `Deleted field "${changeDetails.fieldTitle}"`
		case 'fields_reordered':
			return 'Reordered form fields'
		case 'restored': {
			const action = changeDetails.restoredAction || 'a previous change'
			const changes = []

			if (
				changeDetails.oldTitle !== undefined &&
				changeDetails.newTitle !== undefined
			) {
				changes.push(
					`title from "${changeDetails.oldTitle}" to "${changeDetails.newTitle}"`
				)
			}
			if (
				changeDetails.oldDescription !== undefined &&
				changeDetails.newDescription !== undefined
			) {
				const oldDesc = changeDetails.oldDescription || '(empty)'
				const newDesc = changeDetails.newDescription || '(empty)'
				changes.push(`description from "${oldDesc}" to "${newDesc}"`)
			}
			if (
				changeDetails.oldStatus !== undefined &&
				changeDetails.newStatus !== undefined
			) {
				changes.push(
					`status from "${changeDetails.oldStatus}" to "${changeDetails.newStatus}"`
				)
			}
			if (
				changeDetails.oldFieldTitle !== undefined &&
				changeDetails.newFieldTitle !== undefined
			) {
				changes.push(
					`field title from "${changeDetails.oldFieldTitle}" to "${changeDetails.newFieldTitle}"`
				)
			}
			if (
				changeDetails.oldFieldRequired !== undefined &&
				changeDetails.newFieldRequired !== undefined
			) {
				changes.push(
					`required from ${changeDetails.oldFieldRequired} to ${changeDetails.newFieldRequired}`
				)
			}

			return changes.length > 0
				? `Restored ${action}: ${changes.join(', ')}`
				: `Restored ${action}`
		}
	}
}

function canRestore(editType: EditType): boolean {
	// Can restore any edit type except form_created, fields_reordered, and restored
	// These actions cannot be reversed
	return ![
		'form_created' as EditType,
		'fields_reordered' as EditType,
		'restored' as EditType
	].includes(editType)
}

function formatTimestamp(timestamp: number) {
	const date = new Date(timestamp)
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffMins = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMs / 3600000)
	const diffDays = Math.floor(diffMs / 86400000)

	if (diffMins < 1) return 'just now'
	if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
	if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
	if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})
}

function getUserDisplay(user: TimelineEntry['user']) {
	if (!user) {
		return (
			<div className="flex items-center gap-2">
				<div className="bg-muted flex h-6 w-6 items-center justify-center rounded-full text-xs">
					?
				</div>
				<span>Unknown User</span>
			</div>
		)
	}

	const displayName =
		user.firstName && user.lastName
			? `${user.firstName} ${user.lastName}`
			: user.firstName || 'Unknown User'

	const initials =
		user.firstName && user.lastName
			? `${user.firstName[0]}${user.lastName[0]}`
			: user.firstName
				? user.firstName[0]
				: '?'

	return (
		<div className="flex items-center gap-1">
			{user.avatarUrl ? (
				<img
					alt={displayName}
					className="h-6 w-6 rounded-full object-cover"
					src={user.avatarUrl}
				/>
			) : (
				<div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium">
					{initials}
				</div>
			)}
			<span>{displayName}</span>
		</div>
	)
}

export function TimelineEntryCard({
	entry,
	isLast,
	onRestore,
	isRestoring
}: TimelineEntryCardProps) {
	const Icon = getEditIcon(entry.editType)

	return (
		<div className="relative flex gap-4">
			{/* Vertical line connecting to next item (not shown for last item) */}
			{!isLast && (
				<div className="bg-border absolute left-6 top-12 h-[calc(100%+2rem)] w-px" />
			)}

			{/* Icon */}
			<div className="bg-background border-border relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2">
				<Icon className="text-muted-foreground h-5 w-5" />
			</div>

			{/* Content */}
			<div className="flex-1 pb-8">
				<div className="bg-card rounded-lg border p-4">
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1">
							<div className="mb-1 flex items-start justify-between">
								<p className="font-medium text-base">
									{getEditDescription(entry)}
								</p>
								<span className="text-muted-foreground ml-4 shrink-0 text-xs">
									{formatTimestamp(entry._creationTime)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="text-muted-foreground flex items-center gap-1 text-sm">
									{getUserDisplay(entry.user)}
								</div>
								{canRestore(entry.editType) && (
									<Button
										className="h-7 text-xs"
										disabled={isRestoring}
										onClick={() => onRestore(entry._id)}
										size="sm"
										variant="outline"
									>
										<RotateCcw className="mr-1 h-3 w-3" />
										Restore
									</Button>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
