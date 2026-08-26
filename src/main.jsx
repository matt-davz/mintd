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
import { AdminGuard } from './components/admin/AdminGuard'
import { Layout } from './components/layout/Layout'
import NotFound from './pages/NotFound'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider afterSignOutUrl="/">
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          {/* All routes share the public Layout (header + footer) */}
          <Route element={<Layout />}>
            <Route path="/" element={<Gallery />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/museum" element={<Timeline />} />
            <Route path="/contact" element={<Contact />} />

            {/* Admin routes — Clerk auth required; unlocks extra nav items in Header */}
            <Route element={<AdminGuard />}>
              <Route path="/admin" element={<Navigate to="/" replace />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/items" element={<ItemList />} />
              <Route path="/admin/psa-sync" element={<PsaSync />} />
              <Route path="/admin/gallery-order" element={<GalleryOrder />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
