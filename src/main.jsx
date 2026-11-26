import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider } from '@clerk/react'
import GlobalStyles from './styles/GlobalStyles'

import Gallery from './pages/public/Gallery'
import ItemDetail from './pages/public/ItemDetail'
import Contact from './pages/public/Contact'
import Timeline from './pages/public/Timeline'

import Dashboard from './pages/admin/Dashboard'
import ItemList from './pages/admin/ItemList'
import PsaSync from './pages/admin/PsaSync'
import GalleryOrder from './pages/admin/GalleryOrder'
import AuctionWatchlist from './pages/admin/AuctionWatchlist'
import WantList from './pages/admin/WantList'
import { AdminGuard } from './components/admin/AdminGuard'
import { AdminLayout } from './components/admin/AdminLayout'
import { Layout } from './components/layout/Layout'
import NotFound from './pages/NotFound'
import SignInPage from './pages/SignInPage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signInFallbackRedirectUrl="/admin/dashboard"
    >
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Gallery />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/museum" element={<Timeline />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Clerk sign-in (path routing needs the /* splat for sub-steps) */}
          <Route path="/sign-in/*" element={<SignInPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

          {/* Admin routes — all protected by AdminGuard, all wrapped in AdminLayout */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/*" element={<AdminGuard />}>
            <Route element={<AdminLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="items" element={<ItemList />} />
              <Route path="psa-sync" element={<PsaSync />} />
              <Route path="gallery-order" element={<GalleryOrder />} />
              <Route path="auction-watchlist" element={<AuctionWatchlist />} />
              <Route path="want-list" element={<WantList />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
