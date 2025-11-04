import { Link, useParams } from '@tanstack/react-router'
import type { ColumnDef } from '@tanstack/react-table'
import {
	flexRender,
	getCoreRowModel,
	useReactTable
} from '@tanstack/react-table'
import * as React from 'react'
import { type Form, FormMenuItems } from '~/components/forms/columns'
import { Button } from '~/components/ui/button'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuTrigger
} from '~/components/ui/context-menu'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '~/components/ui/table'

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
	const { slug } = useParams({ strict: false })

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
							table.getRowModel().rows.map((row) => {
								const form = row.original as Form
								return (
									<ContextMenu key={row.id}>
										<ContextMenuTrigger asChild>
											<TableRow
												className="cursor-pointer"
												data-state={row.getIsSelected() && 'selected'}
											>
												{row.getVisibleCells().map((cell) => (
													<TableCell
														key={cell.id}
														style={{ width: cell.column.getSize() }}
													>
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
																	target.closest(
																		'[data-radix-popper-content-wrapper]'
																	)
																) {
																	e.preventDefault()
																}
															}}
															params={{ slug: slug ?? '', id: form._id }}
															to="/{-$slug}/forms/$id"
														>
															{flexRender(
																cell.column.columnDef.cell,
																cell.getContext()
															)}
														</Link>
													</TableCell>
												))}
											</TableRow>
										</ContextMenuTrigger>
										<ContextMenuContent className="w-52">
											<FormMenuItems
												form={form}
												slug={slug ?? ''}
												variant="context"
											/>
										</ContextMenuContent>
									</ContextMenu>
								)
							})
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
			<div className="flex items-center justify-end space-x-2 py-4">
				<div className="text-muted-foreground flex-1 text-sm">
					{table.getSelectedRowModel().rows.length} of {data.length} row(s)
					selected.
				</div>
				<div className="space-x-2">
					<Button
						disabled={!hasPrev}
						onClick={() => onPrev?.()}
						size="sm"
						variant="outline"
					>
						Previous
					</Button>
					<Button
						disabled={!hasNext}
						onClick={() => onNext?.()}
						size="sm"
						variant="outline"
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	)
}
