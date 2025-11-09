import type { Id } from 'convex/_generated/dataModel'

export type FormFieldType =
	| 'singleline'
	| 'multiline'
	| 'number'
	| 'select'
	| 'checkbox'
	| 'date'

export type FormField = {
	_id: Id<'formField'>
	formId: Id<'form'>
	pageId?: string
	type: FormFieldType
	title: string
	placeholder?: string
	required: boolean
	order: number
	options?: string[]
}

export type ChatMessage = {
	streamId: string | undefined
	_id: Id<'chatMessage'>
	_creationTime: number
	formId: Id<'form'>
	userId: string
	role: 'user' | 'assistant'
	content: string
	attachments?: {
		fileId: Id<'_storage'>
		fileName: string
		fileType: string
		fileSize: number
	}[]
}
