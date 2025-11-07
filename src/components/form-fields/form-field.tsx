import { Checkbox } from '../ui/checkbox'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '../ui/select'
import { Textarea } from '../ui/textarea'

interface FormFieldProps {
	field: {
		_id: string
		type: 'singleline' | 'multiline' | 'number' | 'select' | 'checkbox' | 'date'
		title: string
		placeholder?: string
		required: boolean
		options?: string[]
	}
	value: string | string[]
	onChange: (value: string | string[]) => void
	error?: string
}

export function FormField({ field, value, onChange, error }: FormFieldProps) {
	const fieldId = `field-${field._id}`

	const renderInput = () => {
		switch (field.type) {
			case 'singleline':
				return (
					<Input
						aria-describedby={error ? `${fieldId}-error` : undefined}
						aria-invalid={!!error}
						className="text-base"
						id={fieldId}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							onChange(e.target.value)
						}
						placeholder={field.placeholder || 'Your answer'}
						type="text"
						value={typeof value === 'string' ? value : ''}
					/>
				)

			case 'multiline':
				return (
					<Textarea
						aria-describedby={error ? `${fieldId}-error` : undefined}
						aria-invalid={!!error}
						className="min-h-[120px] resize-y text-base"
						id={fieldId}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
							onChange(e.target.value)
						}
						placeholder={field.placeholder || 'Your answer'}
						rows={4}
						value={typeof value === 'string' ? value : ''}
					/>
				)

			case 'number':
				return (
					<Input
						aria-describedby={error ? `${fieldId}-error` : undefined}
						aria-invalid={!!error}
						className="text-base"
						id={fieldId}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							onChange(e.target.value)
						}
						placeholder={field.placeholder || '0'}
						type="number"
						value={typeof value === 'string' ? value : ''}
					/>
				)

			case 'select':
				return (
					<Select
						onValueChange={(val) => onChange(val)}
						value={typeof value === 'string' ? value : ''}
					>
						<SelectTrigger
							aria-describedby={error ? `${fieldId}-error` : undefined}
							aria-invalid={!!error}
							className="text-base"
							id={fieldId}
						>
							<SelectValue
								placeholder={field.placeholder || 'Select an option'}
							/>
						</SelectTrigger>
						<SelectContent>
							{field.options?.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)

			case 'checkbox':
				return (
					<div className="space-y-3">
						{field.options?.map((option) => (
							<div className="flex items-center space-x-2" key={option}>
								<Checkbox
									checked={
										Array.isArray(value) ? value.includes(option) : false
									}
									id={`${field._id}-${option}`}
									onCheckedChange={(checked: boolean) => {
										const currentValues = Array.isArray(value) ? value : []
										if (checked) {
											onChange([...currentValues, option])
										} else {
											onChange(currentValues.filter((v) => v !== option))
										}
									}}
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
				)

			case 'date':
				return (
					<Input
						aria-describedby={error ? `${fieldId}-error` : undefined}
						aria-invalid={!!error}
						className="text-base"
						id={fieldId}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							onChange(e.target.value)
						}
						type="date"
						value={typeof value === 'string' ? value : ''}
					/>
				)

			default:
				return null
		}
	}

	return (
		<div className="space-y-3">
			<Label
				className="block text-base font-medium text-gray-900"
				htmlFor={fieldId}
			>
				{field.title}
				{field.required && <span className="text-destructive ml-1">*</span>}
			</Label>
			{renderInput()}
			{error && (
				<p className="text-sm text-destructive" id={`${fieldId}-error`}>
					{error}
				</p>
			)}
		</div>
	)
}
