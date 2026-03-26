import { useAuth } from '@clerk/react'
import { Navigate, Outlet } from 'react-router-dom'

export function AdminGuard() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return null

  if (!isSignedIn) return <Navigate to="/sign-in" replace />

  return <Outlet />
}
