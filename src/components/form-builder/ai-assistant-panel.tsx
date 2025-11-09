import type { StreamId } from '@convex-dev/persistent-text-streaming'
import { useStream } from '@convex-dev/persistent-text-streaming/react'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { ArrowUp, Paperclip, Sparkles } from 'lucide-react'
import { useRef } from 'react'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupText,
	InputGroupTextarea
} from '~/components/ui/input-group'
import { Separator } from '~/components/ui/separator'
import { envClient } from '~/env/env.client'
import { cn } from '~/lib/utils'
import type { ChatMessage } from './types'

// Component to render message content with streaming support
function MessageContent({
	content,
	streamId,
	isNewMessage
}: {
	content: string
	streamId?: string
	isNewMessage: boolean
}) {
	// Get the Convex URL from environment
	const streamUrl = new URL(`${envClient.VITE_CONVEX_SITE}/ai-stream`)

	// Use the stream hook to get real-time updates if streamId exists
	// driven = true means this client created the stream
	// driven = false means this is a reload/other client viewing the stream
	const streamBody = useStream(
		api.aiFormBuilder.getStreamBody,
		streamUrl,
		isNewMessage, // Only drive if this is a new message in this session
		streamId as StreamId
	)

	// Use stream content if available and has text, otherwise use stored content
	const displayContent = streamBody?.text || content

	return <p className="whitespace-pre-wrap wrap-break-word">{displayContent}</p>
}

interface AIAssistantPanelProps {
	messages: ChatMessage[]
	chatMessage: string
	attachments: File[]
	userName: string
	userImage: string
	isProcessing?: boolean
	newMessageIds?: Set<Id<'chatMessage'>> // IDs of messages created in this session
	onChatMessageChange: (message: string) => void
	onSendMessage: () => void
	onAttachmentsChange: (files: File[]) => void
}

export function AIAssistantPanel({
	messages,
	chatMessage,
	attachments,
	userName,
	userImage,
	isProcessing = false,
	newMessageIds = new Set(),
	onChatMessageChange,
	onSendMessage,
	onAttachmentsChange
}: AIAssistantPanelProps) {
	const chatScrollRef = useRef<HTMLDivElement>(null)

	return (
		<div className="flex flex-col h-full">
			{/* Chat Header */}
			<div className="p-4 border-b border-gray-200">
				<h3 className="font-semibold text-lg">AI Assistant</h3>
			</div>

			{/* Chat Messages */}
			<div
				className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-4"
				ref={chatScrollRef}
			>
				{messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
						<Sparkles className="h-12 w-12 mb-3 opacity-50" />
						<p className="text-sm">Start a conversation with AI</p>
						<p className="text-xs mt-1">Ask questions or request form fields</p>
					</div>
				) : (
					messages.map((message) => {
						const isAssistant = message.role === 'assistant'
						const displayName = isAssistant ? 'AI' : userName
						const displayImage = isAssistant
							? undefined
							: userImage ||
								`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`

						return (
							<div
								className={cn(
									'flex gap-3',
									isAssistant ? 'flex-row' : 'flex-row-reverse'
								)}
								key={message._id}
							>
								{/* Avatar */}
								<div className="shrink-0">
									{isAssistant ? (
										<div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
											<Sparkles className="h-4 w-4 text-white" />
										</div>
									) : (
										<img
											alt={displayName}
											className="w-8 h-8 rounded-full"
											src={displayImage}
										/>
									)}
								</div>

								{/* Message Content */}
								<div
									className={cn(
										'flex-1 min-w-0',
										isAssistant ? 'mr-8' : 'ml-8'
									)}
								>
									<div
										className={cn(
											'rounded-lg px-3 py-2 text-sm',
											isAssistant
												? 'bg-gray-100 text-gray-900'
												: 'bg-blue-500 text-white'
										)}
									>
										<MessageContent
											content={message.content}
											isNewMessage={newMessageIds.has(message._id)}
											streamId={message.streamId}
										/>
									</div>

									{/* Message timestamp */}
									<div className="flex items-center gap-2 mt-1.5">
										<span className="text-xs text-gray-400">
											{new Date(message._creationTime).toLocaleTimeString([], {
												hour: '2-digit',
												minute: '2-digit'
											})}
										</span>
									</div>
								</div>
							</div>
						)
					})
				)}{' '}
				{/* Show loading indicator when AI is processing */}
				{isProcessing && (
					<div className="flex gap-3">
						<div className="shrink-0">
							<div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
								<Sparkles className="h-4 w-4 text-white" />
							</div>
						</div>
						<div className="flex-1 min-w-0 mr-8">
							<div className="rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-900">
								<p className="text-gray-400 italic">AI is thinking...</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Chat Input */}
			<div className="p-4 border-t border-gray-200">
				<InputGroup>
					<InputGroupTextarea
						onChange={(e) => onChatMessageChange(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault()
								onSendMessage()
							}
						}}
						placeholder="Type your message..."
						rows={2}
						value={chatMessage}
					/>
					<InputGroupAddon align="block-end">
						<input
							accept="*/*"
							className="hidden"
							id="chat-file-upload"
							multiple
							onChange={(e) => {
								if (e.target.files) {
									onAttachmentsChange(Array.from(e.target.files))
								}
							}}
							type="file"
						/>
						<label htmlFor="chat-file-upload">
							<InputGroupButton
								className="rounded-full"
								size="icon-xs"
								type="button"
								variant="outline"
							>
								<Paperclip className="h-3.5 w-3.5" />
							</InputGroupButton>
						</label>
						{attachments.length > 0 && (
							<InputGroupText className="text-xs">
								{attachments.length} file(s)
							</InputGroupText>
						)}
						<Separator className="h-4!" orientation="vertical" />
						<InputGroupButton
							className="rounded-full"
							disabled={!chatMessage.trim() || isProcessing}
							onClick={onSendMessage}
							size="icon-xs"
							type="button"
							variant="default"
						>
							<ArrowUp className="h-3.5 w-3.5" />
							<span className="sr-only">Send</span>
						</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			</div>
		</div>
	)
}
