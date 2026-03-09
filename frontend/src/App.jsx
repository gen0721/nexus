import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import HomePage    from './pages/HomePage'
import AuthPage    from './pages/AuthPage'
import CatalogPage from './pages/CatalogPage'
import ProfilePage from './pages/ProfilePage'
import ProductPage  from './pages/ProductPage'
import SellPage     from './pages/SellPage'
import './styles/global.css'

const API = import.meta.env.VITE_API_URL || ''

function AppInner() {
  const navigate          = useNavigate()
  const [user, setUser]   = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setReady(true); return }
    fetch(`${API}/api/auth/me`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) setUser(d.user) })
      .catch(() => {})
      .finally(() => setReady(true))
  }, [])

  if (!ready) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid rgba(0,245,255,0.2)', borderTopColor:'var(--cyan)', animation:'spin 0.8s linear infinite' }}/>
    </div>
  )

  return (
    <>
      <Routes>
        <Route path="/"        element={<HomePage navigate={navigate} user={user}/>}/>
        <Route path="/catalog" element={<CatalogPage navigate={navigate} user={user}/>}/>
        <Route path="/auth"    element={!user ? <AuthPage navigate={navigate} onAuth={setUser}/> : <Navigate to="/" replace/>}/>
        <Route path="/profile"      element={user ? <ProfilePage navigate={navigate} user={user}/> : <Navigate to="/auth" replace/>}/>
        <Route path="/sell"         element={user ? <SellPage    navigate={navigate} user={user}/> : <Navigate to="/auth" replace/>}/>
        <Route path="/product/:id"  element={<ProductPage navigate={navigate} user={user}/>}/>
        <Route path="*"        element={<Navigate to="/" replace/>}/>
      </Routes>
      <Toaster position="top-center" toastOptions={{
        style:{ background:'#0d1420', color:'#fff', border:'1px solid rgba(0,245,255,0.2)', fontFamily:'var(--font-display)', fontSize:13, letterSpacing:'0.04em' },
        success:{ iconTheme:{ primary:'#00ff88', secondary:'#000' } },
        error:  { iconTheme:{ primary:'#ff0080', secondary:'#fff' } },
      }}/>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner/>
    </BrowserRouter>
  )
}
