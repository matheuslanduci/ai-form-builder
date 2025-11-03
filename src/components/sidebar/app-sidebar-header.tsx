import { OrganizationSwitcher } from '@clerk/tanstack-react-start'
import { Link, useLocation, useParams } from '@tanstack/react-router'
import { SidebarHeader } from '../ui/sidebar'

export function AppSidebarHeader() {
	const { slug } = useParams({
		from: '/_platform/{-$slug}'
	})
	const location = useLocation()
	const pathname = slug
		? `/${location.pathname.split('/').slice(2).join('/')}`
		: location.pathname

	return (
		<SidebarHeader>
			<div className="w-full flex flex-col gap-4 overflow-hidden">
				<div className="w-full flex items-center justify-center">
					<Link from="/{-$slug}" to="/{-$slug}">
						<span className="font-bold text-lg">AI Form Builder</span>
					</Link>
				</div>
				<OrganizationSwitcher
					afterSelectOrganizationUrl={`/redirect?to=${encodeURIComponent(pathname)}`}
					afterSelectPersonalUrl={`/redirect?to=${encodeURIComponent(pathname)}`}
					appearance={{
						elements: {
							organizationPreviewMainIdentifier: '!truncate',
							organizationSwitcherTrigger: '!w-full !justify-between',
							rootBox: '!w-full',
							userPreviewMainIdentifier: '!truncate'
						}
					}}
				/>
			</div>
		</SidebarHeader>
	)
}
