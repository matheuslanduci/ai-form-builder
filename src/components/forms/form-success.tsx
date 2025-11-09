import { CheckCircle } from 'lucide-react'

interface FormSuccessProps {
	formTitle?: string
	successMessage?: string
}

export function FormSuccess({ successMessage }: FormSuccessProps) {
	const defaultMessage =
		'Thank you for your submission! We have received your response and will get back to you soon.'

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="max-w-2xl w-full">
				<div className="bg-white rounded-lg shadow-sm border p-8 md:p-12 text-center">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
						<CheckCircle className="h-10 w-10 text-green-600" />
					</div>

					<h1 className="text-3xl font-bold text-gray-900 mb-4">
						Submission Successful!
					</h1>

					<div className="space-y-4">
						<p className="text-lg text-gray-700">
							{successMessage || defaultMessage}
						</p>

						<div className="pt-6 border-t">
							<p className="text-sm text-gray-500">
								You can now close this page
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
