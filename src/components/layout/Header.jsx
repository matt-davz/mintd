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

export function Header() {
  return (
    <HeaderWrapper>
      <Inner>
        <Logo to="/">Mintd</Logo>
        <Nav>
          <NavItem to="/" end>Gallery</NavItem>
          <NavItem to="/contact">Contact</NavItem>
        </Nav>
      </Inner>
    </HeaderWrapper>
  )
}
