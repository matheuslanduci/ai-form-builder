import { Link, useParams } from '@tanstack/react-router'
import { HomeIcon, NotebookTextIcon } from 'lucide-react'
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem
} from '../ui/sidebar'

const items = [
	{
		to: '/{-$slug}',
		icon: <HomeIcon />,
		label: 'Home'
	},
	{
		to: '/{-$slug}/forms',
		icon: <NotebookTextIcon />,
		label: 'Forms'
	}
]

export function AppSidebarContent() {
	const { slug } = useParams({ from: '/_platform/{-$slug}' })

	return (
		<SidebarContent className="flex flex-col">
			<SidebarGroup>
				<SidebarGroupLabel>Application</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						{items.map(({ to, icon, label }) => (
							<SidebarMenuItem key={to}>
								<SidebarMenuButton asChild>
									<Link
										activeOptions={{
											exact: to === '/{-$slug}'
										}}
										activeProps={{
											'data-active': true
										}}
										from="/{-$slug}"
										params={{ slug }}
										to={to}
									>
										{icon}
										<span>{label}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
	)
}
