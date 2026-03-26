import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider } from '@clerk/react'
import GlobalStyles from './styles/GlobalStyles'

import Gallery from './pages/public/Gallery'
import ItemDetail from './pages/public/ItemDetail'
import Contact from './pages/public/Contact'

import Dashboard from './pages/admin/Dashboard'
import ItemList from './pages/admin/ItemList'
import ItemEditor from './pages/admin/ItemEditor'
import PsaSync from './pages/admin/PsaSync'
import { AdminGuard } from './components/admin/AdminGuard'
import { Layout } from './components/layout/Layout'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider afterSignOutUrl="/">
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Gallery />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Admin routes — all protected by AdminGuard */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/*" element={<AdminGuard />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="items" element={<ItemList />} />
            <Route path="items/new" element={<ItemEditor />} />
            <Route path="items/:id" element={<ItemEditor />} />
            <Route path="psa-sync" element={<PsaSync />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
)
