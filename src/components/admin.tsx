import {
	useOrganization,
	useOrganizationList,
	useUser
} from '@clerk/tanstack-react-start'
import type { ReactNode } from 'react'

interface AdminProps {
	children: ReactNode
	fallback?: ReactNode
}

/**
 * Admin component that only renders children if:
 * - User is in a personal account (no organization), OR
 * - User has org:admin role in the current organization
 *
 * This component should be used to wrap UI elements that require admin permissions,
 * such as delete buttons, webhook management, notification settings, etc.
 */
export function Admin({ children, fallback = null }: AdminProps) {
	const { organization, isLoaded: isOrgLoaded } = useOrganization()
	const { user, isLoaded: isUserLoaded } = useUser()
	const { userMemberships, isLoaded: isMembershipsLoaded } =
		useOrganizationList({
			userMemberships: {
				infinite: true
			}
		})

	// Wait for all to load
	if (!isOrgLoaded || !isUserLoaded || !isMembershipsLoaded) {
		return <>{fallback}</>
	}

	// Personal account: user owns the business, they're always admin
	if (!organization && user) {
		return <>{children}</>
	}

	// Organization account: check if user has org:admin role
	if (organization && user) {
		const membership = userMemberships.data?.find(
			(m) => m.organization.id === organization.id
		)

		if (membership?.role === 'org:admin') {
			return <>{children}</>
		}
	}

	// Not an admin, render fallback (usually null to hide the element)
	return <>{fallback}</>
}
