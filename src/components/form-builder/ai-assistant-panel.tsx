import type { Id } from 'convex/_generated/dataModel'
import { ArrowUp, Paperclip, Sparkles, Undo2 } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '~/components/ui/button'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupText,
	InputGroupTextarea
} from '~/components/ui/input-group'
import { Separator } from '~/components/ui/separator'
import { cn } from '~/lib/utils'
import type { ChatMessage } from './types'

interface AIAssistantPanelProps {
	messages: ChatMessage[]
	chatMessage: string
	attachments: File[]
	userName: string
	userImage: string
	onChatMessageChange: (message: string) => void
	onSendMessage: () => void
	onUndoMessage: (messageId: Id<'chatMessage'>) => void
	onAttachmentsChange: (files: File[]) => void
}

export function AIAssistantPanel({
	messages,
	chatMessage,
	attachments,
	userName,
	userImage,
	onChatMessageChange,
	onSendMessage,
	onUndoMessage,
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
			<div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatScrollRef}>
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
										<p className="whitespace-pre-wrap wrap-break-word">
											{message.content}
										</p>
									</div>

									{/* Message Actions */}
									<div className="flex items-center gap-2 mt-1.5">
										<span className="text-xs text-gray-400">
											{new Date(message._creationTime).toLocaleTimeString([], {
												hour: '2-digit',
												minute: '2-digit'
											})}
										</span>
										{isAssistant && (
											<Button
												className="h-6 px-2 text-xs"
												onClick={() => onUndoMessage(message._id)}
												size="sm"
												variant="ghost"
											>
												<Undo2 className="h-3 w-3 mr-1" />
												Undo
											</Button>
										)}
									</div>
								</div>
							</div>
						)
					})
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
							disabled={!chatMessage.trim()}
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
