import { Admin } from '~/components/admin'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'

interface DangerZoneSectionProps {
	submissionCount: number
	onDeleteAllSubmissions: () => void
	onDeleteForm: () => void
}

export function DangerZoneSection({
	submissionCount,
	onDeleteAllSubmissions,
	onDeleteForm
}: DangerZoneSectionProps) {
	return (
		<Admin
			fallback={
				<div className="space-y-6">
					<div>
						<h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
						<p className="text-sm text-gray-600 mt-1">
							Only admins can perform destructive actions
						</p>
					</div>
				</div>
			}
		>
			<div className="space-y-6">
				<div>
					<h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
					<p className="text-sm text-gray-600 mt-1">
						Irreversible and destructive actions
					</p>
				</div>

				<div className="rounded-lg border border-destructive p-6 space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-medium text-gray-900">
								Delete All Submissions
							</h3>
							<p className="text-sm text-gray-700 mt-1">
								Permanently delete all {submissionCount} submissions. This
								action cannot be undone.
							</p>
						</div>
						<Button
							disabled={submissionCount === 0}
							onClick={onDeleteAllSubmissions}
							variant="destructive-outline"
						>
							Delete Submissions
						</Button>
					</div>

					<Separator className="bg-red-200" />

					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-medium text-gray-900">Delete Form</h3>
							<p className="text-sm text-gray-700 mt-1">
								Permanently delete this form, all fields, and submissions. This
								action cannot be undone.
							</p>
						</div>
						<Button onClick={onDeleteForm} variant="destructive-outline">
							Delete Form
						</Button>
					</div>
				</div>
			</div>
		</Admin>
	)
}
