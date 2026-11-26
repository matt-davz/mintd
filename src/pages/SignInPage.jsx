import { SignIn } from '@clerk/react'
import styled from 'styled-components'

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
`

// Hosted on this origin so AdminGuard's <RedirectToSignIn /> lands here
// (with ?redirect_url=<requested admin URL>) instead of 404ing.
// Clerk honours redirect_url after sign-in; the fallback only applies
// when someone opens /sign-in directly.
export default function SignInPage() {
  return (
    <Page>
      <SignIn
        routing="path"
        path="/sign-in"
        fallbackRedirectUrl="/admin/dashboard"
      />
    </Page>
  )
}
