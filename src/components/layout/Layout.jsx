import { Outlet } from 'react-router-dom'
import styled from 'styled-components'
import { Header } from './Header'
import { Footer } from './Footer'

const Main = styled.main`
  padding-top: 5rem; /* offset for fixed header */
  min-height: 10rem;
  flex: 1;
`

export function Layout() {
  return (
    <>
      <Header />
      <Main>
        <Outlet />
      </Main>
      <Footer />
    </>
  )
}
