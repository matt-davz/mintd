import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import styled from 'styled-components'
import { useClerk } from '@clerk/react'

const EXPANDED_W = '16rem'
const COLLAPSED_W = '4rem'

const Sidebar = styled.aside`
  width: ${({ $collapsed }) => $collapsed ? COLLAPSED_W : EXPANDED_W};
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background-color: var(--color-surface-lowest);
  display: flex;
  flex-direction: column;
  padding: var(--space-4) var(--space-2);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 50;
  transition: width 250ms ease;
  overflow: hidden;
`

const SidebarTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => $collapsed ? 'center' : 'space-between'};
  padding: var(--space-2) ${({ $collapsed }) => $collapsed ? 0 : 'var(--space-2)'};
  margin-bottom: var(--space-6);
`

const Logo = styled.div`
  font-family: var(--font-headline);
  font-size: 1.125rem;
  font-weight: 900;
  color: var(--color-primary);
  white-space: nowrap;
  overflow: hidden;
  opacity: ${({ $collapsed }) => $collapsed ? 0 : 1};
  width: ${({ $collapsed }) => $collapsed ? 0 : 'auto'};
  transition: opacity 200ms ease, width 200ms ease;
`

const ToggleBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  color: var(--color-outline);
  flex-shrink: 0;
  transition: background-color var(--transition-base), color var(--transition-base);

  .material-symbols-outlined { font-size: 1.25rem; }

  &:hover {
    background-color: var(--color-surface-low);
    color: var(--color-on-surface);
  }
`

const NavSection = styled.p`
  font-family: var(--font-mono);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.4);
  font-weight: 700;
  padding: 0 var(--space-2);
  margin-bottom: var(--space-2);
  white-space: nowrap;
  overflow: hidden;
  opacity: ${({ $collapsed }) => $collapsed ? 0 : 1};
  transition: opacity 150ms ease;
`

const Nav = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-2);
  justify-content: ${({ $collapsed }) => $collapsed ? 'center' : 'flex-start'};
  font-family: var(--font-headline);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  border-radius: var(--radius-md);
  color: rgba(229, 226, 225, 0.5);
  border-right: 2px solid transparent;
  transition: background-color var(--transition-base), color var(--transition-base), border-color var(--transition-base);
  white-space: nowrap;
  overflow: hidden;
  title: ${({ $label }) => $label};

  .material-symbols-outlined {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

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

const NavLabel = styled.span`
  opacity: ${({ $collapsed }) => $collapsed ? 0 : 1};
  width: ${({ $collapsed }) => $collapsed ? 0 : 'auto'};
  overflow: hidden;
  transition: opacity 150ms ease, width 200ms ease;
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
  justify-content: ${({ $collapsed }) => $collapsed ? 'center' : 'flex-start'};
  width: 100%;
  padding: var(--space-3) var(--space-2);
  font-family: var(--font-headline);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  border-radius: var(--radius-md);
  color: rgba(229, 226, 225, 0.5);
  transition: background-color var(--transition-base), color var(--transition-base);
  white-space: nowrap;
  overflow: hidden;

  .material-symbols-outlined {
    font-size: 1.25rem;
    color: var(--color-error);
    flex-shrink: 0;
  }

  &:hover {
    color: var(--color-on-surface);
    background-color: var(--color-surface-low);
  }
`

const MainCanvas = styled.div`
  margin-left: ${({ $collapsed }) => $collapsed ? COLLAPSED_W : EXPANDED_W};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  flex: 1;
  transition: margin-left 250ms ease;
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
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <Sidebar $collapsed={collapsed}>
        <SidebarTop $collapsed={collapsed}>
          <Logo $collapsed={collapsed}>Mintd Vault</Logo>
          <ToggleBtn onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <span className="material-symbols-outlined">
              {collapsed ? 'menu' : 'menu_open'}
            </span>
          </ToggleBtn>
        </SidebarTop>

        <NavSection $collapsed={collapsed}>Management Suite</NavSection>
        <Nav>
          <NavItem to="/admin/dashboard" $collapsed={collapsed} title="Overview">
            <span className="material-symbols-outlined">dashboard</span>
            <NavLabel $collapsed={collapsed}>Overview</NavLabel>
          </NavItem>
          <NavItem to="/admin/items" $collapsed={collapsed} title="Table View">
            <span className="material-symbols-outlined">table_view</span>
            <NavLabel $collapsed={collapsed}>Table View</NavLabel>
          </NavItem>
        </Nav>

        <SidebarBottom>
          <SignOutBtn $collapsed={collapsed} onClick={() => signOut({ redirectUrl: '/' })} title="Sign Out">
            <span className="material-symbols-outlined">logout</span>
            <NavLabel $collapsed={collapsed}>Sign Out</NavLabel>
          </SignOutBtn>
        </SidebarBottom>
      </Sidebar>

      <MainCanvas $collapsed={collapsed}>
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
