import type { Id } from 'convex/_generated/dataModel'
import { Check, Loader2, Mail, Plus, Trash2, X } from 'lucide-react'
import { Admin } from '~/components/admin'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

interface Notification {
	_id: Id<'formNotification'>
	email: string
	enabled: boolean
}

interface EmailNotificationsSectionProps {
	notifications: Notification[] | undefined
	isLoading: boolean
	newEmail: string
	editingNotification: { id: string; email: string } | null
	isCreating: boolean
	isUpdating: boolean
	onNewEmailChange: (email: string) => void
	onAddNotification: () => void
	onStartEdit: (id: string, email: string) => void
	onCancelEdit: () => void
	onUpdateNotification: () => void
	onEditEmailChange: (email: string) => void
	onToggleEnabled: (id: Id<'formNotification'>, enabled: boolean) => void
	onRemove: (id: Id<'formNotification'>) => void
}

export function EmailNotificationsSection({
	notifications,
	isLoading,
	newEmail,
	editingNotification,
	isCreating,
	isUpdating,
	onNewEmailChange,
	onAddNotification,
	onStartEdit,
	onCancelEdit,
	onUpdateNotification,
	onEditEmailChange,
	onToggleEnabled,
	onRemove
}: EmailNotificationsSectionProps) {
	return (
		<Admin
			fallback={
				<div className="space-y-6">
					<div>
						<h2 className="text-lg font-semibold text-gray-900">
							Email Notifications
						</h2>
						<p className="text-sm text-gray-500 mt-1">
							Only admins can manage email notifications
						</p>
					</div>
				</div>
			}
		>
			<div className="space-y-6">
				<div>
					<h2 className="text-lg font-semibold text-gray-900">
						Email Notifications
					</h2>
					<p className="text-sm text-gray-500 mt-1">
						Get notified when someone submits this form
					</p>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
					</div>
				) : (
					<>
						<div className="space-y-2">
							<Label htmlFor="notification-email">Add Email Address</Label>
							<div className="flex gap-2">
								<Input
									id="notification-email"
									onChange={(e) => onNewEmailChange(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											onAddNotification()
										}
									}}
									placeholder="email@example.com"
									type="email"
									value={newEmail}
								/>
								<Button
									disabled={!newEmail.trim() || isCreating}
									onClick={onAddNotification}
								>
									<Plus className="mr-2 h-4 w-4" />
									Add
								</Button>
							</div>
						</div>

						{/* Notifications List */}
						{notifications && notifications.length > 0 ? (
							<div className="space-y-2">
								{notifications.map((notification) => (
									<div
										className="flex items-center justify-between rounded-lg border p-3 bg-white"
										key={notification._id}
									>
										{editingNotification?.id === notification._id ? (
											<>
												<Input
													className="flex-1 mr-2"
													onChange={(e) => onEditEmailChange(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === 'Enter') {
															onUpdateNotification()
														} else if (e.key === 'Escape') {
															onCancelEdit()
														}
													}}
													type="email"
													value={editingNotification.email}
												/>
												<div className="flex gap-2">
													<Button
														disabled={
															!editingNotification.email.trim() || isUpdating
														}
														onClick={onUpdateNotification}
														size="sm"
														variant="outline"
													>
														<Check className="h-4 w-4" />
													</Button>
													<Button
														onClick={onCancelEdit}
														size="sm"
														variant="outline"
													>
														<X className="h-4 w-4" />
													</Button>
												</div>
											</>
										) : (
											<>
												<div className="flex items-center gap-3 flex-1">
													<span
														className={`text-sm font-medium ${notification.enabled ? 'text-gray-900' : 'text-gray-500'}`}
													>
														{notification.email}
													</span>
													{!notification.enabled && (
														<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
															Disabled
														</span>
													)}
												</div>
												<div className="flex gap-2">
													<Button
														onClick={() =>
															onStartEdit(notification._id, notification.email)
														}
														size="sm"
														variant="outline"
													>
														Edit
													</Button>
													<Button
														onClick={() =>
															onToggleEnabled(
																notification._id,
																!notification.enabled
															)
														}
														size="sm"
														variant="outline"
													>
														{notification.enabled ? 'Disable' : 'Enable'}
													</Button>
													<Button
														onClick={() => onRemove(notification._id)}
														size="sm"
														variant="destructive-outline"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</>
										)}
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 border rounded-lg bg-gray-50">
								<Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
								<p className="text-sm text-gray-600">
									No notification emails configured
								</p>
								<p className="text-xs text-gray-500 mt-1">
									Add an email address above to receive notifications when this
									form is submitted
								</p>
							</div>
						)}
					</>
				)}
			</div>
		</Admin>
	)
}
