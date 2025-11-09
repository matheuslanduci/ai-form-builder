import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	pixelBasedPreset,
	Section,
	Tailwind,
	Text
} from '@react-email/components'

interface NewSubmissionEmailProps {
	formTitle?: string
	submissionId?: string
	submittedAt?: string
	fields?: Array<{
		title: string
		type: string
		value: string | string[]
	}>
	viewUrl?: string
}

export function NewSubmissionEmail({
	formTitle = 'Your Form',
	submissionId,
	submittedAt = new Date().toLocaleString(),
	fields = [],
	viewUrl
}: NewSubmissionEmailProps) {
	const previewText = `New submission received for ${formTitle}!`

	return (
		<Html>
			<Tailwind
				config={{
					presets: [pixelBasedPreset]
				}}
			>
				<Head />
				<Body className="mx-auto my-auto bg-white px-2 font-sans">
					<Preview>{previewText}</Preview>
					<Container className="mx-auto my-10 max-w-[465px] rounded border border-[#eaeaea] border-solid p-5">
						<Section className="mt-8">
							<Heading className="text-center text-2xl font-bold text-black">
								AI Form Builder
							</Heading>
						</Section>

						<Heading className="mx-0 my-[30px] p-0 text-center font-normal text-xl text-black">
							New submission received for <strong>{formTitle}</strong>!
						</Heading>

						<Text className="text-sm text-black leading-6">
							You've received a new submission for your form.
						</Text>

						{submissionId && (
							<Section className="my-6 rounded-lg bg-gray-50 p-4 border border-gray-200">
								<Text className="m-0 text-xs text-gray-600 uppercase font-semibold mb-2">
									Submission Details
								</Text>
								<Text className="m-0 text-sm text-gray-700 leading-5">
									<strong>Submitted:</strong> {submittedAt}
								</Text>
								<Text className="m-0 text-sm text-gray-700 leading-5 mt-1">
									<strong>ID:</strong>{' '}
									<span className="font-mono text-xs">{submissionId}</span>
								</Text>
							</Section>
						)}

						{fields.length > 0 && (
							<>
								<Hr className="mx-0 my-5 w-full border border-[#eaeaea] border-solid" />

								<Section>
									<Text className="text-sm font-semibold text-black mb-3">
										Submitted Data:
									</Text>

									{fields.map((field, index) => (
										<div className="mb-4" key={field.title || index}>
											<Text className="m-0 text-xs text-gray-600 font-medium mb-1">
												{field.title}
												{field.type && (
													<span className="ml-2 text-gray-400">
														({field.type})
													</span>
												)}
											</Text>
											<div className="rounded bg-white border border-gray-200 p-3">
												{Array.isArray(field.value) ? (
													<ul className="m-0 p-0 list-none">
														{field.value.map((val, i) => (
															<li
																className="text-sm text-gray-900 leading-5 mb-1 last:mb-0"
																key={val || i}
															>
																• {val}
															</li>
														))}
													</ul>
												) : (
													<Text className="m-0 text-sm text-gray-900 leading-5 whitespace-pre-wrap">
														{field.value || '(empty)'}
													</Text>
												)}
											</div>
										</div>
									))}
								</Section>
							</>
						)}

						{viewUrl && (
							<>
								<Hr className="mx-0 my-6 w-full border border-[#eaeaea] border-solid" />

								<Section className="text-center">
									<Button
										className="rounded bg-black px-5 py-3 text-center font-semibold text-sm text-white no-underline"
										href={viewUrl}
									>
										View Submission in Dashboard
									</Button>
								</Section>
							</>
						)}

						<Hr className="mx-0 my-6 w-full border border-[#eaeaea] border-solid" />

						<Text className="text-gray-500 text-xs leading-6">
							This email was sent because you have notifications enabled for
							this form. You can manage your notification settings in the form
							settings page.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	)
}

NewSubmissionEmail.PreviewProps = {
	formTitle: 'Contact Form',
	submissionId: 'k987654321',
	submittedAt: 'November 8, 2025 at 2:30 PM',
	fields: [
		{
			title: 'Full Name',
			type: 'singleline',
			value: 'John Doe'
		},
		{
			title: 'Email Address',
			type: 'singleline',
			value: 'john.doe@example.com'
		},
		{
			title: 'Message',
			type: 'multiline',
			value:
				"Hello! I'm interested in learning more about your services. Could you please provide more information about pricing and availability?"
		},
		{
			title: 'Preferred Contact Method',
			type: 'select',
			value: 'Email'
		},
		{
			title: 'Interests',
			type: 'checkbox',
			value: ['Web Development', 'Mobile Apps', 'Consulting']
		},
		{
			title: 'Preferred Date',
			type: 'date',
			value: '2025-11-15'
		}
	],
	viewUrl: 'http://localhost:3000/forms/j123456789/submissions'
} as NewSubmissionEmailProps

export default NewSubmissionEmail
