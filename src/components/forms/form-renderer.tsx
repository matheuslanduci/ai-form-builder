import type { Id } from 'convex/_generated/dataModel'
import { Calendar } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'

type FormFieldType = {
	_id: Id<'formField'>
	formId?: Id<'form'>
	title: string
	type: 'singleline' | 'multiline' | 'number' | 'select' | 'checkbox' | 'date'
	placeholder?: string
	required: boolean
	options?: string[]
	order: number
}

type FormType = {
	_id: Id<'form'>
	title: string
	description?: string
	status: 'draft' | 'published' | 'archived'
}

interface FormRendererProps {
	form: FormType
	fields: FormFieldType[]
	formData: Record<string, string | string[]>
	errors?: Record<string, string>
	onFieldChange: (fieldId: string, value: string | string[]) => void
	onSubmit: (e: React.FormEvent) => void
	onClear: () => void
	isSubmitting?: boolean
	submitButtonText?: string
	showClearButton?: boolean
}

export function FormRenderer({
	form,
	fields,
	formData,
	errors = {},
	onFieldChange,
	onSubmit,
	onClear,
	isSubmitting = false,
	submitButtonText = 'Submit',
	showClearButton = true
}: FormRendererProps) {
	const sortedFields = [...fields].sort((a, b) => a.order - b.order)

	const handleCheckboxChange = (
		fieldId: string,
		option: string,
		checked: boolean
	) => {
		const currentValues = (formData[fieldId] as string[]) || []
		if (checked) {
			onFieldChange(fieldId, [...currentValues, option])
		} else {
			onFieldChange(
				fieldId,
				currentValues.filter((v) => v !== option)
			)
		}
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="mb-8 rounded-lg border border-gray-200 bg-white p-8">
				<h1 className="text-3xl font-bold text-gray-900">{form.title}</h1>
				{form.description && (
					<p className="text-muted-foreground mt-2 text-lg">
						{form.description}
					</p>
				)}
				<div className="mt-4 flex items-center gap-2">
					<span className="text-destructive text-sm">* Required fields</span>
				</div>
			</div>

			{sortedFields.length === 0 ? (
				<div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
					<p className="text-muted-foreground text-lg">
						This form doesn't have any fields yet.
					</p>
				</div>
			) : (
				<form className="space-y-6" onSubmit={onSubmit}>
					{sortedFields.map((field) => (
						<div
							className="rounded-lg border border-gray-200 bg-white p-6"
							key={field._id}
						>
							<Label className="mb-3 block text-base font-medium text-gray-900">
								{field.title}
								{field.required && (
									<span className="text-destructive ml-1">*</span>
								)}
							</Label>

							{field.type === 'singleline' && (
								<>
									<Input
										className="text-base"
										onChange={(e) => onFieldChange(field._id, e.target.value)}
										placeholder={field.placeholder || 'Your answer'}
										required={field.required}
										value={(formData[field._id] as string) || ''}
									/>
									{errors[field._id] && (
										<p className="text-destructive mt-1 text-sm">
											{errors[field._id]}
										</p>
									)}
								</>
							)}

							{field.type === 'multiline' && (
								<>
									<Textarea
										className="min-h-[120px] resize-y text-base"
										onChange={(e) => onFieldChange(field._id, e.target.value)}
										placeholder={field.placeholder || 'Your answer'}
										required={field.required}
										rows={4}
										value={(formData[field._id] as string) || ''}
									/>
									{errors[field._id] && (
										<p className="text-destructive mt-1 text-sm">
											{errors[field._id]}
										</p>
									)}
								</>
							)}

							{field.type === 'number' && (
								<>
									<Input
										className="text-base"
										onChange={(e) => onFieldChange(field._id, e.target.value)}
										placeholder={field.placeholder || '0'}
										required={field.required}
										type="number"
										value={(formData[field._id] as string) || ''}
									/>
									{errors[field._id] && (
										<p className="text-destructive mt-1 text-sm">
											{errors[field._id]}
										</p>
									)}
								</>
							)}

							{field.type === 'select' && (
								<>
									<Select
										onValueChange={(value) => onFieldChange(field._id, value)}
										required={field.required}
										value={(formData[field._id] as string) || ''}
									>
										<SelectTrigger className="text-base">
											<SelectValue placeholder="Select an option" />
										</SelectTrigger>
										<SelectContent>
											{field.options?.map((option) => (
												<SelectItem key={option} value={option}>
													{option}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{errors[field._id] && (
										<p className="text-destructive mt-1 text-sm">
											{errors[field._id]}
										</p>
									)}
								</>
							)}

							{field.type === 'checkbox' && (
								<>
									<div className="space-y-3">
										{field.options?.map((option) => (
											<div className="flex items-center space-x-2" key={option}>
												<Checkbox
													checked={(
														(formData[field._id] as string[]) || []
													).includes(option)}
													id={`${field._id}-${option}`}
													onCheckedChange={(checked) =>
														handleCheckboxChange(field._id, option, !!checked)
													}
												/>
												<label
													className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
													htmlFor={`${field._id}-${option}`}
												>
													{option}
												</label>
											</div>
										))}
									</div>
									{errors[field._id] && (
										<p className="text-destructive mt-1 text-sm">
											{errors[field._id]}
										</p>
									)}
								</>
							)}

							{field.type === 'date' && (
								<>
									<div className="relative">
										<Input
											className="text-base"
											onChange={(e) => onFieldChange(field._id, e.target.value)}
											required={field.required}
											type="date"
											value={(formData[field._id] as string) || ''}
										/>
										<Calendar className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
									</div>
									{errors[field._id] && (
										<p className="text-destructive mt-1 text-sm">
											{errors[field._id]}
										</p>
									)}
								</>
							)}
						</div>
					))}

					{/* Submit Buttons */}
					<div className="flex justify-between pt-4">
						<Button
							className="px-8 py-6 text-base"
							disabled={isSubmitting}
							size="lg"
							type="submit"
						>
							{isSubmitting ? 'Submitting...' : submitButtonText}
						</Button>
						{showClearButton && (
							<Button
								className="px-8 py-6 text-base"
								disabled={isSubmitting}
								onClick={onClear}
								size="lg"
								type="button"
								variant="outline"
							>
								Clear form
							</Button>
						)}
					</div>
				</form>
			)}
		</div>
	)
}
