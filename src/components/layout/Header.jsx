import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth, useClerk } from '@clerk/react'
import { ItemViewerModal } from '../admin/ItemViewerModal'

const HeaderWrapper = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`

const Inner = styled.div`
  max-width: 1536px;
  margin: 0 auto;
  padding: 0 2rem;
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Logo = styled(Link)`
  font-family: var(--font-headline);
  font-weight: 900;
  font-size: 1.5rem;
  letter-spacing: -0.05em;
  text-transform: uppercase;
  color: var(--color-on-background);
`

const Nav = styled.nav`
  display: none;
  align-items: center;
  gap: 2rem;

  @media (min-width: 768px) {
    display: flex;
  }
`

const NavItem = styled(NavLink)`
  font-family: var(--font-headline);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #9ca3af;
  transition: color 0.2s ease;

  &:hover,
  &.active {
    color: var(--color-on-background);
  }
`

const AdminSeparator = styled.div`
  width: 1px;
  height: 1rem;
  background: rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
`

const AdminNavItem = styled(NavLink)`
  font-family: var(--font-headline);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-primary);
  opacity: 0.65;
  transition: opacity 0.2s ease;

  &:hover,
  &.active {
    opacity: 1;
  }
`

const AddAssetBtn = styled.button`
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: 0.5625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-on-primary);
  background: var(--color-primary);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  white-space: nowrap;
  transition: opacity var(--transition-base);

  &:hover { opacity: 0.85; }
  &:active { transform: scale(0.97); }
`

const SignOutBtn = styled.button`
  font-family: var(--font-headline);
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.3);
  transition: color 0.2s ease;

  &:hover { color: var(--color-error); }
`

const BurgerBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-md);
  color: var(--color-outline);
  transition: background-color var(--transition-base), color var(--transition-base);

  .material-symbols-outlined { font-size: 1.375rem; }

  &:hover {
    background-color: var(--color-surface-low);
    color: var(--color-on-surface);
  }

  @media (min-width: 768px) {
    display: none;
  }
`

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 60;
  opacity: ${({ $open }) => $open ? 1 : 0};
  pointer-events: ${({ $open }) => $open ? 'auto' : 'none'};
  transition: opacity 0.25s ease;
`

const Drawer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 14rem;
  background: var(--color-surface-lowest);
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 70;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1.25rem;
  transform: ${({ $open }) => $open ? 'translateX(0)' : 'translateX(100%)'};
  transition: transform 0.25s ease;
  box-shadow: ${({ $open }) => $open ? '-8px 0 32px rgba(0,0,0,0.5)' : 'none'};
  overflow-y: auto;
`

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`

const DrawerLogo = styled(Link)`
  font-family: var(--font-headline);
  font-weight: 900;
  font-size: 1rem;
  letter-spacing: -0.04em;
  text-transform: uppercase;
  color: var(--color-on-background);
`

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  color: var(--color-outline);
  transition: background-color var(--transition-base), color var(--transition-base);

  .material-symbols-outlined { font-size: 1.25rem; }

  &:hover {
    background-color: var(--color-surface-low);
    color: var(--color-on-surface);
  }
`

const DrawerNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const DrawerLink = styled(NavLink)`
  font-family: var(--font-headline);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.5);
  padding: 0.75rem 0.75rem;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-base), color var(--transition-base);

  &:hover,
  &.active {
    color: var(--color-on-background);
    background-color: var(--color-surface-low);
  }
`

const DrawerDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 0.5rem 0;
`

const DrawerSectionLabel = styled.p`
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.3);
  padding: 0.25rem 0.75rem 0.125rem;
`

const DrawerAdminLink = styled(NavLink)`
  font-family: var(--font-headline);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-primary);
  opacity: 0.7;
  padding: 0.75rem 0.75rem;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-base), opacity var(--transition-base);

  &:hover,
  &.active {
    opacity: 1;
    background-color: var(--color-surface-low);
  }
`

const DrawerAddAssetBtn = styled.button`
  font-family: var(--font-headline);
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-on-primary);
  background: var(--color-primary);
  padding: 0.75rem 0.75rem;
  border-radius: var(--radius-md);
  text-align: left;
  margin-top: 0.25rem;
  transition: opacity var(--transition-base);

  &:hover { opacity: 0.85; }
`

const DrawerSignOutBtn = styled.button`
  font-family: var(--font-headline);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(229, 226, 225, 0.35);
  padding: 0.75rem 0.75rem;
  border-radius: var(--radius-md);
  text-align: left;
  transition: background-color var(--transition-base), color var(--transition-base);

  &:hover {
    color: var(--color-error);
    background-color: var(--color-surface-low);
  }
`

export function Header() {
  const [open, setOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const navigate = useNavigate()
  const { isLoaded, isSignedIn } = useAuth()
  const { signOut } = useClerk()

  const close = () => setOpen(false)

  const handleLogoClick = (e) => {
    e.preventDefault()
    navigate('/')
  }

  const handleSignOut = () => {
    close()
    signOut({ redirectUrl: '/' })
  }

  const handleAddAsset = () => {
    close()
    setShowCreateModal(true)
  }

  return (
    <>
      <HeaderWrapper>
        <Inner>
          <Logo to="/" onClick={handleLogoClick}>Mintd</Logo>
          <Nav>
            <NavItem to="/" end>Gallery</NavItem>
            <NavItem to="/museum">Museum</NavItem>
            <NavItem to="/contact">Contact</NavItem>
            {isLoaded && isSignedIn && (
              <>
                <AdminSeparator />
                <AdminNavItem to="/admin/dashboard">Overview</AdminNavItem>
                <AdminNavItem to="/admin/items">Table View</AdminNavItem>
                <AdminNavItem to="/admin/gallery-order">Gallery Order</AdminNavItem>
                <AdminNavItem to="/admin/psa-sync">PSA Sync</AdminNavItem>
                <AdminSeparator />
                <AddAssetBtn onClick={handleAddAsset}>+ Add Asset</AddAssetBtn>
                <SignOutBtn onClick={() => signOut({ redirectUrl: '/' })}>Sign Out</SignOutBtn>
              </>
            )}
          </Nav>
          <BurgerBtn onClick={() => setOpen(true)} aria-label="Open menu">
            <span className="material-symbols-outlined">menu</span>
          </BurgerBtn>
        </Inner>
      </HeaderWrapper>

      <Backdrop $open={open} onClick={close} />

      <Drawer $open={open}>
        <DrawerHeader>
          <DrawerLogo to="/" onClick={(e) => { close(); handleLogoClick(e) }}>Mintd</DrawerLogo>
          <CloseBtn onClick={close} aria-label="Close menu">
            <span className="material-symbols-outlined">close</span>
          </CloseBtn>
        </DrawerHeader>
        <DrawerNav>
          <DrawerLink to="/" end onClick={close}>Gallery</DrawerLink>
          <DrawerLink to="/museum" onClick={close}>Museum</DrawerLink>
          <DrawerLink to="/contact" onClick={close}>Contact</DrawerLink>
          {isLoaded && isSignedIn && (
            <>
              <DrawerDivider />
              <DrawerSectionLabel>Admin</DrawerSectionLabel>
              <DrawerAdminLink to="/admin/dashboard" onClick={close}>Overview</DrawerAdminLink>
              <DrawerAdminLink to="/admin/items" onClick={close}>Table View</DrawerAdminLink>
              <DrawerAdminLink to="/admin/gallery-order" onClick={close}>Gallery Order</DrawerAdminLink>
              <DrawerAdminLink to="/admin/psa-sync" onClick={close}>PSA Sync</DrawerAdminLink>
              <DrawerAddAssetBtn onClick={handleAddAsset}>+ Add Asset</DrawerAddAssetBtn>
              <DrawerSignOutBtn onClick={handleSignOut}>Sign Out</DrawerSignOutBtn>
            </>
          )}
        </DrawerNav>
      </Drawer>

      {showCreateModal && (
        <ItemViewerModal itemId={null} onClose={() => setShowCreateModal(false)} />
      )}
    </>
  )
}
