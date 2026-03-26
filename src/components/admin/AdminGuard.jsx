import { useAuth, RedirectToSignIn } from '@clerk/react'
import { Outlet } from 'react-router-dom'

export function AdminGuard() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return null

  if (!isSignedIn) return <RedirectToSignIn />

  return <Outlet />
}
