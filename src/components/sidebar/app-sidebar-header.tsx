import { OrganizationSwitcher } from '@clerk/tanstack-react-start'
import { Link, useLocation } from '@tanstack/react-router'
import { SidebarHeader } from '../ui/sidebar'

export function AppSidebarHeader() {
	const location = useLocation()

	return (
		<SidebarHeader>
			<div className="w-full flex flex-col gap-4 overflow-hidden">
				<div className="w-full flex items-center justify-center">
					<Link from="/" to="/">
						<span className="font-bold text-lg">AI Form Builder</span>
					</Link>
				</div>
				<OrganizationSwitcher
					afterSelectOrganizationUrl={`/redirect?to=${encodeURIComponent(location.pathname)}`}
					afterSelectPersonalUrl={`/redirect?to=${encodeURIComponent(location.pathname)}`}
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
