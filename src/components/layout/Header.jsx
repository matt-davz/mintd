import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import styled from 'styled-components'

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
`

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`

const DrawerLogo = styled.span`
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

export function Header() {
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <>
      <HeaderWrapper>
        <Inner>
          <Logo to="/">Mintd</Logo>
          <Nav>
            <NavItem to="/" end>Gallery</NavItem>
            <NavItem to="/museum">Museum</NavItem>
            <NavItem to="/contact">Contact</NavItem>
          </Nav>
          <BurgerBtn onClick={() => setOpen(true)} aria-label="Open menu">
            <span className="material-symbols-outlined">menu</span>
          </BurgerBtn>
        </Inner>
      </HeaderWrapper>

      <Backdrop $open={open} onClick={close} />

      <Drawer $open={open}>
        <DrawerHeader>
          <DrawerLogo>Mintd</DrawerLogo>
          <CloseBtn onClick={close} aria-label="Close menu">
            <span className="material-symbols-outlined">close</span>
          </CloseBtn>
        </DrawerHeader>
        <DrawerNav>
          <DrawerLink to="/" end onClick={close}>Gallery</DrawerLink>
          <DrawerLink to="/museum" onClick={close}>Museum</DrawerLink>
          <DrawerLink to="/contact" onClick={close}>Contact</DrawerLink>
        </DrawerNav>
      </Drawer>
    </>
  )
}
