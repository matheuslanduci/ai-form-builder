import { UserButton } from '@clerk/tanstack-react-start'
import { SidebarFooter } from '../ui/sidebar'

export function AppSidebarFooter() {
	return (
		<SidebarFooter>
			<UserButton
				appearance={{
					elements: {
						rootBox: '!w-full',
						userButtonBox: '!flex-row-reverse !w-full',
						userButtonOuterIdentifier: '!flex-1 !text-left !pl-0',
						userButtonTrigger: '!w-full'
					}
				}}
				showName
			/>
		</SidebarFooter>
	)
}
