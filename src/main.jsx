import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'

import Gallery from './pages/public/Gallery'
import ItemDetail from './pages/public/ItemDetail'
import Contact from './pages/public/Contact'

import Dashboard from './pages/admin/Dashboard'
import ItemList from './pages/admin/ItemList'
import ItemEditor from './pages/admin/ItemEditor'
import PsaSync from './pages/admin/PsaSync'
import { AdminGuard } from './components/admin/AdminGuard'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Gallery />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/contact" element={<Contact />} />

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
