import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ColumnDef, Row } from '@tanstack/react-table'
import {
	flexRender,
	getCoreRowModel,
	useReactTable
} from '@tanstack/react-table'
import { api } from 'convex/_generated/api'
import * as React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
	DeleteFormDialog,
	type Form,
	FormMenuItems
} from '~/components/forms/columns'
import { ShareFormDialog } from '~/components/forms/share-form-dialog'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuTrigger
} from '~/components/ui/context-menu'
import { Pagination } from '~/components/ui/pagination'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table'

function FormTableRow({ row }: { row: Row<Form> }) {
	const form = row.original
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [shareDialogOpen, setShareDialogOpen] = useState(false)

	const updateStatusMutation = useMutation({
		mutationFn: useConvexMutation(api.form.updateStatus),
		onSuccess: () => {
			toast.success('Status updated successfully')
		}
	})

	return (
		<React.Fragment>
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<TableRow
						className="cursor-pointer"
						data-state={row.getIsSelected() && 'selected'}
					>
						{row.getVisibleCells().map((cell) => (
							<TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
								<Link
									className="block w-full"
									onClick={(e) => {
										const target = e.target as HTMLElement
										if (
											target.closest('button') ||
											target.closest('input[type="checkbox"]') ||
											target.closest('[role="menuitem"]') ||
											target.closest('[role="dialog"]') ||
											target.closest('[role="combobox"]') ||
											target.closest('[data-radix-popper-content-wrapper]')
										) {
											e.preventDefault()
										}
									}}
									params={{ id: form._id }}
									to="/forms/$id"
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</Link>
							</TableCell>
						))}
					</TableRow>
				</ContextMenuTrigger>
				<ContextMenuContent className="w-52">
					<FormMenuItems
						form={form}
						onDeleteClick={() => setDeleteDialogOpen(true)}
						onShareClick={() => setShareDialogOpen(true)}
						variant="context"
					/>
				</ContextMenuContent>
			</ContextMenu>

			<DeleteFormDialog
				form={form}
				onOpenChange={setDeleteDialogOpen}
				open={deleteDialogOpen}
			/>

			<ShareFormDialog
				formId={form._id}
				formTitle={form.title}
				isUpdatingStatus={updateStatusMutation.isPending}
				onOpenChange={setShareDialogOpen}
				onStatusChange={(status) => {
					updateStatusMutation.mutate({
						formId: form._id,
						status
					})
				}}
				open={shareDialogOpen}
				status={form.status}
			/>
		</React.Fragment>
	)
}

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	onNext?: () => void
	onPrev?: () => void
	hasNext?: boolean
	hasPrev?: boolean
	isLoading?: boolean
}

export function DataTable<TData, TValue>({
	columns,
	data,
	onNext,
	onPrev,
	hasNext,
	hasPrev,
	isLoading
}: DataTableProps<TData, TValue>) {
	const [rowSelection, setRowSelection] = React.useState({})

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection
		}
	})

	return (
		<div className="w-full">
			<div className="overflow-hidden rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead
											key={header.id}
											style={{ width: header.getSize() }}
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell
									className="h-24 text-center"
									colSpan={columns.length}
								>
									<p className="text-muted-foreground">Loading forms...</p>
								</TableCell>
							</TableRow>
						) : table.getRowModel().rows?.length ? (
							table
								.getRowModel()
								.rows.map((row) => (
									<FormTableRow key={row.id} row={row as Row<Form>} />
								))
						) : (
							<TableRow>
								<TableCell
									className="h-24 text-center"
									colSpan={columns.length}
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end py-4">
				<Pagination
					className="flex items-center gap-2"
					hasNext={!!hasNext}
					hasPrevious={!!hasPrev}
					onNext={() => onNext?.()}
					onPrevious={() => onPrev?.()}
				/>
			</div>
		</div>
	)
}
