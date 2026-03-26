import { NavLink, Outlet, Link } from 'react-router-dom'
import styled from 'styled-components'
import { useClerk } from '@clerk/react'

const Sidebar = styled.aside`
  width: 16rem;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background-color: var(--color-surface-lowest);
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 50;
`

const Logo = styled.div`
  font-family: var(--font-headline);
  font-size: 1.125rem;
  font-weight: 900;
  color: var(--color-primary);
  margin-bottom: var(--space-8);
  padding: var(--space-2) var(--space-4);
`

const NavSection = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.4);
  font-weight: 700;
  padding: 0 var(--space-4);
  margin-bottom: var(--space-2);
`

const Nav = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-4);
`

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-headline);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  border-radius: var(--radius-md);
  color: rgba(229, 226, 225, 0.5);
  border-right: 2px solid transparent;
  transition: background-color var(--transition-base), color var(--transition-base), border-color var(--transition-base);

  .material-symbols-outlined { font-size: 1.25rem; }

  &:hover {
    color: var(--color-on-surface);
    background-color: var(--color-surface-low);
  }

  &.active {
    color: var(--color-primary);
    background-color: var(--color-surface-low);
    border-right-color: var(--color-primary);
  }
`

const SidebarBottom = styled.div`
  margin-top: auto;
  padding-top: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`

const SignOutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-headline);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  border-radius: var(--radius-md);
  color: rgba(229, 226, 225, 0.5);
  transition: background-color var(--transition-base), color var(--transition-base);

  .material-symbols-outlined {
    font-size: 1.25rem;
    color: var(--color-error);
  }

  &:hover {
    color: var(--color-on-surface);
    background-color: var(--color-surface-low);
  }
`

const MainCanvas = styled.div`
  margin-left: 16rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  flex: 1;
`

const TopBar = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-8);
  background-color: var(--color-background);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  z-index: 40;
`

const VaultLabel = styled.div`
  font-family: var(--font-headline);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-primary);
`

const AddBtn = styled(Link)`
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
  color: var(--color-on-primary);
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: var(--space-2) var(--space-6);
  border-radius: var(--radius-md);
  transition: opacity var(--transition-base);

  &:hover { opacity: 0.9; }
  &:active { transform: scale(0.97); }
`

const Content = styled.div`
  flex: 1;
  padding: var(--space-10);
  max-width: 90rem;
  width: 100%;
  margin: 0 auto;
`

export function AdminLayout() {
  const { signOut } = useClerk()

  return (
    <>
      <Sidebar>
        <Logo>Mintd Vault</Logo>
        <NavSection>Management Suite</NavSection>
        <Nav>
          <NavItem to="/admin/dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            Overview
          </NavItem>
          <NavItem to="/admin/items">
            <span className="material-symbols-outlined">table_view</span>
            Table View
          </NavItem>
        </Nav>
        <SidebarBottom>
          <SignOutBtn onClick={() => signOut({ redirectUrl: '/' })}>
            <span className="material-symbols-outlined">logout</span>
            Sign Out
          </SignOutBtn>
        </SidebarBottom>
      </Sidebar>

      <MainCanvas>
        <TopBar>
          <VaultLabel>Vault Admin</VaultLabel>
          <AddBtn to="/admin/items/new">Add New Asset</AddBtn>
        </TopBar>
        <Content>
          <Outlet />
        </Content>
      </MainCanvas>
    </>
  )
}
