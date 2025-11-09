import { Link } from '@tanstack/react-router'
import { HomeIcon, NotebookTextIcon, TagsIcon, WebhookIcon } from 'lucide-react'
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
		to: '/',
		icon: <HomeIcon />,
		label: 'Home'
	},
	{
		to: '/forms',
		icon: <NotebookTextIcon />,
		label: 'Forms'
	},
	{
		to: '/tags',
		icon: <TagsIcon />,
		label: 'Tags'
	},
	{
		to: '/webhooks',
		icon: <WebhookIcon />,
		label: 'Webhooks'
	}
]

export function AppSidebarContent() {
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
											exact: to === '/'
										}}
										activeProps={{
											'data-active': true
										}}
										from="/"
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
