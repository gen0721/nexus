import React, { useState, useEffect, useRef, useCallback } from 'react'

// ── CONSTANTS ────────────────────────────────────────────────────
const CATS = [
  { id:'all',     icon:'⚡', label:'ВСЕ',        color:'#00f5ff' },
  { id:'account', icon:'👤', label:'АККАУНТЫ',   color:'#ff0080' },
  { id:'item',    icon:'⚔️', label:'ПРЕДМЕТЫ',   color:'#00ff88' },
  { id:'game',    icon:'🎮', label:'ИГРЫ',        color:'#8b5cf6' },
  { id:'service', icon:'🛠', label:'УСЛУГИ',      color:'#ffe500' },
  { id:'key',     icon:'🔑', label:'КЛЮЧИ',       color:'#ff6b00' },
]

const GAMES = ['Все игры','CS2','Dota 2','GTA V','Valorant','Minecraft','Roblox','PUBG','Fortnite','FIFA 25','WoT']

const SORT_OPTIONS = [
  { id:'new',    label:'НОВЫЕ' },
  { id:'price_asc',  label:'ДЕШЕВЛЕ' },
  { id:'price_desc', label:'ДОРОЖЕ' },
  { id:'rating', label:'РЕЙТИНГ' },
  { id:'popular',label:'ПОПУЛЯРНЫЕ' },
]

// ── Mock products ────────────────────────────────────────────────
const MOCK = [
  { id:1,  title:'CS2 Global Elite Account', desc:'Ранг GE, 1200+ часов, чистый VAC', price:18.99, category:'account', game:'CS2',       seller:'NightSeller', sellerRating:4.9, icon:'🔫', hot:true,  views:423, sales:28 },
  { id:2,  title:'Dota 2 Immortal Items x5', desc:'Сет редких предметов TI2024',        price:6.50,  category:'item',    game:'Dota 2',    seller:'ProTrader',   sellerRating:4.8, icon:'⚔️', hot:false, views:211, sales:45 },
  { id:3,  title:'CS2 Rank S1→GE Boost',     desc:'Буст до Global Elite за 3-5 дней',  price:24.99, category:'service', game:'CS2',       seller:'BoostMaster', sellerRating:5.0, icon:'🏆', hot:true,  views:891, sales:67 },
  { id:4,  title:'Steam Gift Card $20',       desc:'Код активации, доставка мгновенно', price:19.50, category:'key',     game:'',          seller:'KeyStore',    sellerRating:4.7, icon:'🎁', hot:false, views:156, sales:312 },
  { id:5,  title:'Minecraft Java Edition',    desc:'Лицензионный аккаунт, личная почта',price:6.99,  category:'game',    game:'Minecraft', seller:'GameHub',     sellerRating:4.9, icon:'⛏️', hot:false, views:334, sales:89 },
  { id:6,  title:'Valorant Radiant Account',  desc:'Скины нож + Phantom + агенты',      price:45.00, category:'account', game:'Valorant',  seller:'ValoPlayer',  sellerRating:4.8, icon:'🔫', hot:true,  views:672, sales:14 },
  { id:7,  title:'GTA V Shark Card $1M',      desc:'Карта акулы 1 000 000$, GTA Online',price:8.99,  category:'key',     game:'GTA V',     seller:'GtaSeller',   sellerRating:4.6, icon:'🦈', hot:false, views:288, sales:201 },
  { id:8,  title:'Dota 2 Calibration Boost',  desc:'Калибровка Immortal ранг гарантия', price:29.99, category:'service', game:'Dota 2',    seller:'DotaPro',     sellerRating:5.0, icon:'🎯', hot:true,  views:445, sales:32 },
  { id:9,  title:'PUBG UC 600 кристаллов',    desc:'Пополнение UC напрямую',            price:7.99,  category:'key',     game:'PUBG',      seller:'UCSeller',    sellerRating:4.7, icon:'💎', hot:false, views:178, sales:156 },
  { id:10, title:'Roblox 1000 Robux',         desc:'Пополнение Robux на аккаунт',       price:9.99,  category:'key',     game:'Roblox',    seller:'RbxShop',     sellerRating:4.8, icon:'🟥', hot:false, views:521, sales:432 },
  { id:11, title:'FIFA 25 Coins 100K',        desc:'Монеты FIFA 25 UT, быстрая передача',price:4.99, category:'item',    game:'FIFA 25',   seller:'FifaCoins',   sellerRating:4.6, icon:'⚽', hot:false, views:234, sales:678 },
  { id:12, title:'WoT Gold 2500',             desc:'2500 золота World of Tanks',         price:11.99, category:'key',     game:'WoT',       seller:'WotShop',     sellerRating:4.9, icon:'🏰', hot:false, views:167, sales:94 },
]

// ── Product card with 3D tilt effect ─────────────────────────────
function ProductCard({ p, delay=0, onBuy, onView }) {
  const ref   = useRef(null)
  const [tilt, setTilt] = useState({ x:0, y:0, gx:50, gy:50 })

  const colors = { account:'#ff0080', item:'#00ff88', game:'#8b5cf6', service:'#ffe500', key:'#ff6b00' }
  const c = colors[p.category] || '#00f5ff'

  const onMove = e => {
    const r  = ref.current.getBoundingClientRect()
    const mx = e.clientX - r.left
    const my = e.clientY - r.top
    const x  = ((mx/r.width)  - 0.5) * 18
    const y  = ((my/r.height) - 0.5) * -18
    setTilt({ x, y, gx:(mx/r.width)*100, gy:(my/r.height)*100 })
  }
  const onLeave = () => setTilt({ x:0, y:0, gx:50, gy:50 })

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={() => onView?.(p)}
      className="anim-up"
      style={{
        animationDelay:`${delay}ms`,
        borderRadius:20,
        background:`linear-gradient(135deg, ${c}22 0%, rgba(13,20,32,0) 60%)`,
        border:`1px solid ${c}25`,
        padding:'1.5px',
        cursor:'pointer',
        transition:'border-color 0.3s, box-shadow 0.3s',
        transform:`perspective(800px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        willChange:'transform',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=`${c}55`; e.currentTarget.style.boxShadow=`0 12px 40px ${c}15, 0 0 0 1px ${c}15` }}
    >
      <div style={{
        borderRadius:18.5,
        background:'linear-gradient(145deg, rgba(10,14,22,0.98), rgba(6,8,17,0.99))',
        padding:'18px',
        height:'100%',
        position:'relative', overflow:'hidden',
      }}>
        {/* Holographic shimmer */}
        <div style={{
          position:'absolute', inset:0, borderRadius:18,
          background:`radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, ${c}08 0%, transparent 60%)`,
          pointerEvents:'none', transition:'opacity 0.3s',
        }}/>

        {/* Top row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <span style={{
            padding:'3px 9px', borderRadius:20, fontSize:10,
            fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
            background:`${c}15`, color:c, border:`1px solid ${c}30`,
          }}>{p.category}</span>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {p.hot && <span style={{ fontSize:10, color:'#ff6b00', fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'0.06em' }}>🔥HOT</span>}
            <span style={{ fontSize:11, color:'var(--t3)', fontFamily:'var(--font-mono)' }}>👁{p.views}</span>
          </div>
        </div>

        {/* Icon */}
        <div style={{
          width:50, height:50, borderRadius:14, marginBottom:14,
          background:`linear-gradient(135deg, ${c}20, ${c}08)`,
          border:`1px solid ${c}20`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:24,
          boxShadow:`0 4px 15px ${c}15`,
        }}>{p.icon}</div>

        {/* Title */}
        <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.92)', marginBottom:5, lineHeight:1.3, fontFamily:'var(--font-body)' }}>
          {p.title}
        </div>
        <div style={{ fontSize:12, color:'var(--t3)', marginBottom:16, lineHeight:1.5, minHeight:36 }}>
          {p.desc}
        </div>

        {/* Game tag */}
        {p.game && (
          <div style={{ marginBottom:14 }}>
            <span style={{ fontSize:10, color:'var(--t3)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'2px 8px', fontFamily:'var(--font-display)', letterSpacing:'0.06em' }}>
              {p.game}
            </span>
          </div>
        )}

        {/* Price + Buy */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color:c, textShadow:`0 0 12px ${c}60`, lineHeight:1 }}>
              ${p.price.toFixed(2)}
            </div>
            <div style={{ fontSize:10, color:'var(--t4)', fontFamily:'var(--font-mono)', marginTop:2 }}>
              ≈{(p.price*90).toFixed(0)}₽
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onBuy?.(p) }}
            style={{
              padding:'9px 18px', borderRadius:10, cursor:'pointer',
              background:`linear-gradient(135deg, ${c}25, ${c}12)`,
              border:`1.5px solid ${c}40`,
              color:c, fontFamily:'var(--font-display)', fontSize:12, fontWeight:700,
              letterSpacing:'0.06em', transition:'all 0.2s',
              boxShadow:`0 2px 12px ${c}20, inset 0 1px 0 ${c}20`,
            }}
            onMouseEnter={e => { e.currentTarget.style.background=`${c}35`; e.currentTarget.style.boxShadow=`0 4px 20px ${c}40, inset 0 1px 0 ${c}30`; e.currentTarget.style.transform='translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background=`linear-gradient(135deg, ${c}25, ${c}12)`; e.currentTarget.style.boxShadow=`0 2px 12px ${c}20, inset 0 1px 0 ${c}20`; e.currentTarget.style.transform='none' }}
          >
            КУПИТЬ →
          </button>
        </div>

        {/* Seller */}
        <div style={{ paddingTop:12, borderTop:`1px solid rgba(255,255,255,0.06)`, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{
            width:24, height:24, borderRadius:'50%', flexShrink:0,
            background:`linear-gradient(135deg, ${c}40, ${c}18)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, fontWeight:700, color:c, fontFamily:'var(--font-display)',
          }}>{p.seller[0]}</div>
          <span style={{ fontSize:11, color:'var(--t3)', fontFamily:'var(--font-display)', letterSpacing:'0.04em', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {p.seller}
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
            <span style={{ color:'#ffe500', fontSize:11 }}>★</span>
            <span style={{ fontSize:11, color:'var(--t2)', fontFamily:'var(--font-display)', fontWeight:700 }}>{p.sellerRating}</span>
          </div>
          <span style={{ fontSize:10, color:'var(--t4)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{p.sales}✓</span>
        </div>
      </div>
    </div>
  )
}

// ── Filter sidebar / drawer ───────────────────────────────────────
function FilterPanel({ filters, onChange, onClose, isMobile }) {
  const [local, setLocal] = useState(filters)
  const upd = (k, v) => setLocal(f => ({ ...f, [k]:v }))

  return (
    <div style={{
      width: isMobile ? '100%' : 240,
      background:'rgba(8,12,18,0.97)',
      border:'1px solid rgba(255,255,255,0.07)',
      borderRadius:20, padding:'20px',
      flexShrink:0,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13, letterSpacing:'0.1em', color:'var(--cyan)' }}>ФИЛЬТРЫ</span>
        {isMobile && (
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--t3)', fontSize:20 }}>✕</button>
        )}
      </div>

      {/* Price range */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.12em', marginBottom:10 }}>ЦЕНА (USD)</div>
        <div style={{ display:'flex', gap:8 }}>
          <input
            className="inp" type="number" placeholder="От"
            value={local.priceMin} onChange={e => upd('priceMin', e.target.value)}
            style={{ fontSize:13 }}
          />
          <input
            className="inp" type="number" placeholder="До"
            value={local.priceMax} onChange={e => upd('priceMax', e.target.value)}
            style={{ fontSize:13 }}
          />
        </div>
      </div>

      {/* Game filter */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.12em', marginBottom:10 }}>ИГРА</div>
        <select
          value={local.game}
          onChange={e => upd('game', e.target.value)}
          style={{
            width:'100%', padding:'10px 12px', background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.1)', borderRadius:10,
            color:'var(--t1)', fontFamily:'var(--font-display)', fontSize:13, outline:'none',
          }}
        >
          {GAMES.map(g => <option key={g} value={g === 'Все игры' ? '' : g} style={{ background:'#0d1420' }}>{g}</option>)}
        </select>
      </div>

      {/* Seller rating */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.12em', marginBottom:10 }}>МИН. РЕЙТИНГ ПРОДАВЦА</div>
        <div style={{ display:'flex', gap:6 }}>
          {[0,4,4.5,4.8].map(v => (
            <button key={v} onClick={() => upd('minRating', v)} style={{
              flex:1, padding:'7px 4px', borderRadius:8, cursor:'pointer', fontSize:11,
              fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'0.04em',
              background: local.minRating===v ? 'rgba(255,229,0,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${local.minRating===v ? 'rgba(255,229,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: local.minRating===v ? '#ffe500' : 'var(--t3)',
              transition:'all 0.2s',
            }}>
              {v === 0 ? 'ВСЕ' : `${v}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Only hot */}
      <div style={{ marginBottom:24 }}>
        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
          <div onClick={() => upd('onlyHot', !local.onlyHot)} style={{
            width:40, height:22, borderRadius:11, position:'relative',
            background: local.onlyHot ? 'rgba(255,107,0,0.3)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${local.onlyHot ? 'rgba(255,107,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
            transition:'all 0.2s', cursor:'pointer',
          }}>
            <div style={{
              position:'absolute', top:2, left: local.onlyHot ? 20 : 2,
              width:16, height:16, borderRadius:'50%',
              background: local.onlyHot ? '#ff6b00' : 'rgba(255,255,255,0.2)',
              boxShadow: local.onlyHot ? '0 0 8px rgba(255,107,0,0.6)' : 'none',
              transition:'all 0.2s',
            }}/>
          </div>
          <span style={{ fontFamily:'var(--font-display)', fontSize:12, color:'var(--t2)', letterSpacing:'0.06em' }}>
            🔥 ТОЛЬКО HOT
          </span>
        </label>
      </div>

      <button className="btn btn-cyan btn-full btn-sm" onClick={() => { onChange(local); onClose?.() }}>
        ПРИМЕНИТЬ
      </button>
      <button onClick={() => { const d={priceMin:'',priceMax:'',game:'',minRating:0,onlyHot:false}; setLocal(d); onChange(d); }} style={{
        width:'100%', marginTop:8, padding:'8px', background:'none', border:'none',
        color:'var(--t3)', fontFamily:'var(--font-display)', fontSize:11, letterSpacing:'0.08em', cursor:'pointer',
      }}>
        СБРОСИТЬ ВСЁ
      </button>
    </div>
  )
}

// ── Product detail modal ──────────────────────────────────────────
function ProductModal({ p, onClose, onBuy }) {
  const colors = { account:'#ff0080', item:'#00ff88', game:'#8b5cf6', service:'#ffe500', key:'#ff6b00' }
  const c = colors[p.category] || '#00f5ff'

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.85)', backdropFilter:'blur(12px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="anim-up" style={{
        width:'100%', maxWidth:520, borderRadius:24,
        background:'linear-gradient(145deg, rgba(10,14,22,0.99), rgba(6,8,17,0.98))',
        border:`1px solid ${c}30`,
        boxShadow:`0 30px 100px rgba(0,0,0,0.8), 0 0 0 1px ${c}10, 0 0 60px ${c}08`,
        overflow:'hidden', position:'relative',
      }}>
        {/* Top accent */}
        <div style={{ height:3, background:`linear-gradient(90deg, transparent, ${c}, transparent)` }}/>

        <div style={{ padding:'28px' }}>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
            <div style={{ display:'flex', gap:14, alignItems:'center' }}>
              <div style={{ width:56, height:56, borderRadius:16, background:`linear-gradient(135deg, ${c}25, ${c}10)`, border:`1px solid ${c}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, boxShadow:`0 0 20px ${c}15` }}>
                {p.icon}
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, marginBottom:4 }}>{p.title}</div>
                <span style={{ padding:'3px 9px', borderRadius:20, fontSize:10, fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'0.1em', background:`${c}15`, color:c, border:`1px solid ${c}30` }}>{p.category}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, width:36, height:36, cursor:'pointer', color:'var(--t2)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
          </div>

          <p style={{ color:'var(--t2)', lineHeight:1.7, marginBottom:20, fontSize:14 }}>{p.desc}</p>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
            {[
              { label:'ПРОСМОТРОВ', val:p.views, icon:'👁' },
              { label:'ПРОДАЖ',     val:p.sales, icon:'✓' },
              { label:'РЕЙТИНГ',    val:p.sellerRating, icon:'★' },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center', padding:'12px 8px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:16, marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16, color:'var(--t1)' }}>{s.val}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--t3)', letterSpacing:'0.1em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Seller */}
          <div style={{ padding:'14px 16px', borderRadius:14, background:`${c}08`, border:`1px solid ${c}15`, marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg, ${c}40, ${c}18)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:c, fontFamily:'var(--font-display)' }}>{p.seller[0]}</div>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13 }}>{p.seller}</div>
              <div style={{ fontSize:11, color:'var(--t3)' }}>★ {p.sellerRating} · {p.sales} продаж</div>
            </div>
            <div style={{ marginLeft:'auto', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--green)', background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.15)', padding:'4px 10px', borderRadius:8 }}>ONLINE</div>
          </div>

          {/* Price + CTA */}
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:700, color:c, textShadow:`0 0 15px ${c}60`, lineHeight:1 }}>${p.price.toFixed(2)}</div>
              <div style={{ fontSize:11, color:'var(--t3)', fontFamily:'var(--font-mono)' }}>≈{(p.price*90).toFixed(0)} ₽</div>
            </div>
            <button className="btn btn-cyan" onClick={() => onBuy?.(p)} style={{ flex:1, fontSize:15 }}>
              ⚡ КУПИТЬ СЕЙЧАС
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN CATALOG PAGE ────────────────────────────────────────────
export default function CatalogPage({ navigate, user }) {
  const [cat,     setCat]     = useState('all')
  const [search,  setSearch]  = useState('')
  const [sort,    setSort]    = useState('new')
  const [filters, setFilters] = useState({ priceMin:'', priceMax:'', game:'', minRating:0, onlyHot:false })
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [page, setPage]       = useState(1)
  const PER_PAGE = 9

  // Filter + sort
  const filtered = MOCK.filter(p => {
    if (cat !== 'all' && p.category !== cat) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.game.toLowerCase().includes(search.toLowerCase())) return false
    if (filters.priceMin && p.price < parseFloat(filters.priceMin)) return false
    if (filters.priceMax && p.price > parseFloat(filters.priceMax)) return false
    if (filters.game && p.game !== filters.game) return false
    if (filters.minRating && p.sellerRating < filters.minRating) return false
    if (filters.onlyHot && !p.hot) return false
    return true
  }).sort((a,b) => {
    if (sort === 'price_asc')  return a.price - b.price
    if (sort === 'price_desc') return b.price - a.price
    if (sort === 'rating')     return b.sellerRating - a.sellerRating
    if (sort === 'popular')    return b.views - a.views
    return b.id - a.id
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged      = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const handleBuy = p => {
    if (!user) { navigate?.('/auth'); return }
    // open deal flow
    setSelected(null)
  }

  return (
    <div style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{
        position:'sticky', top:0, zIndex:50,
        background:'rgba(4,6,8,0.92)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        padding:'14px 20px',
      }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          {/* Logo */}
          <button onClick={() => navigate?.('/')} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, letterSpacing:'0.08em', marginRight:8, flexShrink:0 }}>
            <span style={{ color:'var(--cyan)', textShadow:'0 0 15px rgba(0,245,255,0.5)' }}>NX</span>
            <span style={{ color:'rgba(255,255,255,0.3)' }}>/</span>
          </button>

          {/* Search */}
          <div style={{ flex:1, minWidth:180, position:'relative' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, pointerEvents:'none', opacity:0.5 }}>🔍</span>
            <input
              className="inp"
              placeholder="Поиск по каталогу..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              style={{ paddingLeft:36, height:40, fontSize:13 }}
            />
          </div>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)} style={{
            padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:10, color:'var(--t1)', fontFamily:'var(--font-display)', fontSize:12,
            letterSpacing:'0.06em', outline:'none', cursor:'pointer', flexShrink:0,
          }}>
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id} style={{ background:'#0d1420' }}>{o.label}</option>)}
          </select>

          {/* View toggle */}
          <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'4px', flexShrink:0 }}>
            {[['grid','⊞'],['list','☰']].map(([v,icon]) => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                width:32, height:32, borderRadius:7, cursor:'pointer',
                background: viewMode===v ? 'rgba(0,245,255,0.15)' : 'transparent',
                border: viewMode===v ? '1px solid rgba(0,245,255,0.3)' : '1px solid transparent',
                color: viewMode===v ? 'var(--cyan)' : 'var(--t3)',
                fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 0.15s',
              }}>{icon}</button>
            ))}
          </div>

          {/* Filter toggle */}
          <button className={`btn btn-sm ${showFilters ? 'btn-cyan' : 'btn-ghost'}`} onClick={() => setShowFilters(!showFilters)} style={{ flexShrink:0 }}>
            ⚙ ФИЛЬТРЫ
          </button>

          {/* Auth */}
          {!user ? (
            <button className="btn btn-pink btn-sm" onClick={() => navigate?.('/auth')} style={{ flexShrink:0 }}>ВОЙТИ</button>
          ) : (
            <button onClick={() => navigate?.('/profile')} style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,rgba(0,245,255,0.3),rgba(255,0,128,0.2))', border:'1px solid rgba(0,245,255,0.3)', cursor:'pointer', fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, color:'var(--cyan)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {user.username?.[0]?.toUpperCase() || 'U'}
            </button>
          )}
        </div>
      </div>

      {/* ── CATEGORY TABS ──────────────────────────────────────── */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', overflowX:'auto', scrollbarWidth:'none' }}>
        <div style={{ display:'flex', gap:0, minWidth:'max-content', maxWidth:1200, margin:'0 auto', padding:'0 20px' }}>
          {CATS.map(c => (
            <button key={c.id} onClick={() => { setCat(c.id); setPage(1) }} style={{
              padding:'14px 20px', background:'none', border:'none', borderBottom:`2px solid ${cat===c.id ? c.color : 'transparent'}`,
              cursor:'pointer', color: cat===c.id ? c.color : 'var(--t3)',
              fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, letterSpacing:'0.1em',
              transition:'all 0.2s', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6,
              textShadow: cat===c.id ? `0 0 10px ${c.color}60` : 'none',
            }}>
              <span>{c.icon}</span>{c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'20px', display:'flex', gap:20, alignItems:'flex-start' }}>

        {/* Filter panel (desktop) */}
        {showFilters && (
          <div className="anim-up" style={{ display:'none', '@media (min-width: 768px)':{ display:'block' } }}>
            <FilterPanel filters={filters} onChange={f => { setFilters(f); setPage(1) }} onClose={() => setShowFilters(false)}/>
          </div>
        )}

        {/* Main content */}
        <div style={{ flex:1 }}>
          {/* Results bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t3)', letterSpacing:'0.08em' }}>
              НАЙДЕНО: <span style={{ color:'var(--cyan)' }}>{filtered.length}</span> ТОВАРОВ
            </div>
            {showFilters && (
              <FilterPanel filters={filters} onChange={f => { setFilters(f); setPage(1) }} onClose={() => setShowFilters(false)} isMobile/>
            )}
          </div>

          {/* Grid / List */}
          {paged.length === 0 ? (
            <div style={{ textAlign:'center', padding:'80px 20px' }}>
              <div style={{ fontSize:64, marginBottom:16 }}>🔍</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:16, color:'var(--t3)', letterSpacing:'0.1em' }}>НИЧЕГО НЕ НАЙДЕНО</div>
              <button onClick={() => { setCat('all'); setSearch(''); setFilters({ priceMin:'',priceMax:'',game:'',minRating:0,onlyHot:false }); setPage(1) }}
                className="btn btn-ghost btn-sm" style={{ marginTop:16 }}>
                СБРОСИТЬ ФИЛЬТРЫ
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:14 }}>
              {paged.map((p,i) => (
                <ProductCard key={p.id} p={p} delay={i*60} onBuy={handleBuy} onView={setSelected}/>
              ))}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {paged.map((p,i) => {
                const colors = { account:'#ff0080', item:'#00ff88', game:'#8b5cf6', service:'#ffe500', key:'#ff6b00' }
                const c = colors[p.category] || '#00f5ff'
                return (
                  <div key={p.id} className="anim-up" onClick={() => setSelected(p)} style={{
                    animationDelay:`${i*40}ms`,
                    display:'flex', alignItems:'center', gap:16, padding:'14px 18px',
                    borderRadius:14, cursor:'pointer',
                    background:'rgba(255,255,255,0.02)', border:`1px solid rgba(255,255,255,0.06)`,
                    transition:'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=`${c}30`; e.currentTarget.style.background=`${c}06` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.background='rgba(255,255,255,0.02)' }}
                  >
                    <div style={{ width:44, height:44, borderRadius:12, background:`${c}18`, border:`1px solid ${c}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{p.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:'var(--t1)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</div>
                      <div style={{ fontSize:11, color:'var(--t3)' }}>{p.seller} · ★{p.sellerRating} · {p.sales} продаж{p.game ? ` · ${p.game}` : ''}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:c }}>${p.price.toFixed(2)}</div>
                      <div style={{ fontSize:10, color:'var(--t4)', fontFamily:'var(--font-mono)' }}>≈{(p.price*90).toFixed(0)}₽</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleBuy(p) }} className="btn btn-sm" style={{ background:`${c}18`, border:`1px solid ${c}35`, color:c, fontFamily:'var(--font-display)', fontSize:11, flexShrink:0 }}>
                      КУПИТЬ
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:32, flexWrap:'wrap' }}>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="btn btn-ghost btn-sm">← НАЗАД</button>
              {Array.from({length:totalPages}).map((_,i) => (
                <button key={i} onClick={() => setPage(i+1)} style={{
                  width:36, height:36, borderRadius:8, cursor:'pointer',
                  background: page===i+1 ? 'rgba(0,245,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${page===i+1 ? 'rgba(0,245,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: page===i+1 ? 'var(--cyan)' : 'var(--t3)',
                  fontFamily:'var(--font-display)', fontWeight:700, fontSize:13,
                  boxShadow: page===i+1 ? '0 0 10px rgba(0,245,255,0.2)' : 'none',
                }}>{i+1}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="btn btn-ghost btn-sm">ВПЕРЁД →</button>
            </div>
          )}
        </div>
      </div>

      {/* ── PRODUCT MODAL ──────────────────────────────────────── */}
      {selected && (
        <ProductModal p={selected} onClose={() => setSelected(null)} onBuy={handleBuy}/>
      )}
    </div>
  )
}
