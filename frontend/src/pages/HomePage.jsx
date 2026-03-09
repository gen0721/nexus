import React, { useState, useEffect, useRef } from 'react'

// ── Animated particle background ────────────────────────────────
function ParticleField() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = canvas.width  = window.innerWidth
    let H = canvas.height = window.innerHeight
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.3,
      color: ['#00f5ff','#ff0080','#00ff88'][Math.floor(Math.random()*3)],
      alpha: Math.random() * 0.6 + 0.2,
    }))
    let raf
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.shadowBlur = 8; ctx.shadowColor = p.color
        ctx.fill()
      })
      // Draw connections
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
      for (let i = 0; i < particles.length; i++) {
        for (let j = i+1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d  = Math.sqrt(dx*dx+dy*dy)
          if (d < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = particles[i].color
            ctx.globalAlpha = (1-d/100)*0.12
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    const resize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', opacity:0.6 }}/>
}

// ── Animated counter ────────────────────────────────────────────
function Counter({ to, duration=2000, suffix='' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      const start = Date.now()
      const tick = () => {
        const p = Math.min((Date.now()-start)/duration, 1)
        setVal(Math.floor(p * to))
        if (p < 1) requestAnimationFrame(tick)
      }
      tick()
      obs.disconnect()
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to, duration])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

// ── 3D Product Card ──────────────────────────────────────────────
function ProductCard({ product, delay=0 }) {
  const [tilt, setTilt] = useState({ x:0, y:0 })
  const cardRef = useRef(null)

  const onMove = e => {
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 20
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -20
    setTilt({ x, y })
  }
  const onLeave = () => setTilt({ x:0, y:0 })

  const colors = { game:'#00f5ff', account:'#ff0080', item:'#00ff88', service:'#8b5cf6', key:'#ffe500' }
  const color  = colors[product.category] || '#00f5ff'

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="anim-up"
      style={{
        animationDelay: `${delay}ms`,
        borderRadius: 20,
        padding: '1.5px',
        background: `linear-gradient(135deg, ${color}33, transparent, ${color}22)`,
        cursor: 'pointer',
        transition: 'transform 0.1s ease',
        transform: `perspective(600px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateZ(0)`,
      }}
    >
      <div style={{
        borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(8,12,18,0.98), rgba(13,20,32,0.95))',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow corner */}
        <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:`radial-gradient(circle, ${color}22, transparent)`, pointerEvents:'none' }}/>

        {/* Category badge */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <span style={{
            padding:'3px 10px', borderRadius:20, fontSize:10, fontFamily:'var(--font-display)',
            fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
            background:`${color}18`, color, border:`1px solid ${color}33`,
          }}>
            {product.category}
          </span>
          {product.hot && (
            <span style={{ fontSize:11, color:'#ff6b00', fontFamily:'var(--font-display)', fontWeight:700 }}>🔥 HOT</span>
          )}
        </div>

        {/* Game icon area */}
        <div style={{
          width:48, height:48, borderRadius:14,
          background:`linear-gradient(135deg, ${color}22, ${color}08)`,
          border:`1px solid ${color}22`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:24, marginBottom:14,
          boxShadow:`0 0 15px ${color}20`,
        }}>
          {product.icon}
        </div>

        <div style={{ fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.9)', marginBottom:6, lineHeight:1.3 }}>
          {product.title}
        </div>
        <div style={{ fontSize:12, color:'var(--t3)', marginBottom:16, lineHeight:1.5 }}>
          {product.desc}
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color, textShadow:`0 0 10px ${color}80` }}>
              ${product.price}
            </div>
            <div style={{ fontSize:10, color:'var(--t3)', fontFamily:'var(--font-mono)' }}>≈ {(product.price*90).toFixed(0)} ₽</div>
          </div>
          <button style={{
            padding:'8px 16px', borderRadius:10,
            background:`linear-gradient(135deg, ${color}22, ${color}11)`,
            border:`1px solid ${color}44`,
            color, fontFamily:'var(--font-display)', fontSize:12, fontWeight:700,
            cursor:'pointer', letterSpacing:'0.06em',
            transition:'all 0.2s',
            boxShadow:`0 2px 10px ${color}20`,
          }}
          onMouseEnter={e => { e.currentTarget.style.background=`${color}33`; e.currentTarget.style.boxShadow=`0 4px 20px ${color}40` }}
          onMouseLeave={e => { e.currentTarget.style.background=`linear-gradient(135deg, ${color}22, ${color}11)`; e.currentTarget.style.boxShadow=`0 2px 10px ${color}20` }}
          >
            КУПИТЬ →
          </button>
        </div>

        {/* Bottom seller */}
        <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:22, height:22, borderRadius:'50%', background:`linear-gradient(135deg, ${color}44, ${color}22)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color }}>
            {product.seller[0]}
          </div>
          <span style={{ fontSize:11, color:'var(--t3)', fontFamily:'var(--font-display)' }}>{product.seller}</span>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ color:'#ffe500', fontSize:11 }}>★</span>
            <span style={{ fontSize:11, color:'var(--t2)', fontFamily:'var(--font-display)', fontWeight:700 }}>{product.rating}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Category Pill ────────────────────────────────────────────────
function CatPill({ icon, label, color, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'10px 18px', borderRadius:30,
      background: active ? `${color}18` : 'rgba(255,255,255,0.03)',
      border: `1.5px solid ${active ? color+'55' : 'rgba(255,255,255,0.08)'}`,
      cursor:'pointer', color: active ? color : 'var(--t3)',
      fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, letterSpacing:'0.06em',
      transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      boxShadow: active ? `0 0 15px ${color}25` : 'none',
      whiteSpace:'nowrap',
      transform: active ? 'scale(1.05)' : 'scale(1)',
    }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      {label}
      <span style={{ fontSize:10, background:'rgba(255,255,255,0.08)', padding:'2px 6px', borderRadius:10 }}>{count}</span>
    </button>
  )
}

// ── MOCK DATA ────────────────────────────────────────────────────
const PRODUCTS = [
  { id:1, title:'GTA V Premium Account', desc:'Все DLC, деньги, ранг 500+', price:12.99, category:'account', icon:'🎮', seller:'NightSeller', rating:4.9, hot:true },
  { id:2, title:'Dota 2 Immortal Items', desc:'Набор редких предметов TI', price:8.50, category:'item', icon:'⚔️', seller:'ProTrader', rating:4.8, hot:false },
  { id:3, title:'CS2 Rank Boost', desc:'До Global Elite за 3 дня', price:24.99, category:'service', icon:'🏆', seller:'BoostMaster', rating:5.0, hot:true },
  { id:4, title:'Steam Gift Card $20', desc:'Код активации Steam', price:19.99, category:'key', icon:'🎁', seller:'KeyStore', rating:4.7, hot:false },
  { id:5, title:'Minecraft Java Edition', desc:'Лицензионный аккаунт', price:6.99, category:'game', icon:'⛏️', seller:'GameHub', rating:4.9, hot:false },
  { id:6, title:'Valorant Account Radiant', desc:'Скины нож + агент коллекция', price:45.00, category:'account', icon:'🔫', seller:'ValoPlayer', rating:4.8, hot:true },
]

const CATS = [
  { id:'all',     icon:'⚡', label:'ВСЕ',      color:'#00f5ff', count:'2.4k' },
  { id:'game',    icon:'🎮', label:'ИГРЫ',     color:'#8b5cf6', count:'430' },
  { id:'account', icon:'👤', label:'АККАУНТЫ', color:'#ff0080', count:'820' },
  { id:'item',    icon:'⚔️', label:'ПРЕДМЕТЫ', color:'#00ff88', count:'610' },
  { id:'service', icon:'🛠', label:'УСЛУГИ',   color:'#ffe500', count:'190' },
  { id:'key',     icon:'🔑', label:'КЛЮЧИ',    color:'#ff6b00', count:'350' },
]

// ── MAIN PAGE ────────────────────────────────────────────────────
export default function HomePage({ navigate }) {
  const [cat, setCat]       = useState('all')
  const [search, setSearch] = useState('')
  const [tick, setTick]     = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t+1), 2000)
    return () => clearInterval(id)
  }, [])

  const filtered = PRODUCTS.filter(p =>
    (cat === 'all' || p.category === cat) &&
    (!search || p.title.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>
      <ParticleField/>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div style={{ position:'relative', padding:'80px 20px 60px', textAlign:'center', overflow:'hidden' }}>
        {/* Big glow behind title */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:300, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(0,245,255,0.07) 0%, rgba(255,0,128,0.04) 40%, transparent 70%)', pointerEvents:'none' }}/>

        {/* Live badge */}
        <div className="anim-up" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:30, background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.2)', marginBottom:24 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#00ff88', boxShadow:'0 0 8px #00ff88', animation:'blink 1.2s infinite' }}/>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'#00ff88', letterSpacing:'0.15em' }}>LIVE · {2418+tick} СДЕЛОК СЕГОДНЯ</span>
        </div>

        {/* Main title */}
        <h1 className="anim-up" style={{ animationDelay:'100ms', fontSize:'clamp(42px,8vw,80px)', fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'-0.01em', lineHeight:1, marginBottom:16 }}>
          <span style={{ color:'#fff' }}>NEXUS</span>
          <br/>
          <span style={{
            background:'linear-gradient(90deg, #00f5ff 0%, #ff0080 50%, #00ff88 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            backgroundClip:'text',
            filter:'drop-shadow(0 0 20px rgba(0,245,255,0.3))',
          }}>MARKET</span>
        </h1>

        <p className="anim-up" style={{ animationDelay:'200ms', fontSize:17, color:'var(--t2)', maxWidth:480, margin:'0 auto 36px', lineHeight:1.6 }}>
          Безопасный маркетплейс цифровых товаров.<br/>
          <span style={{ color:'var(--cyan)', fontFamily:'var(--font-mono)', fontSize:14 }}>Сделки защищены · Вывод мгновенно</span>
        </p>

        {/* CTA buttons */}
        <div className="anim-up" style={{ animationDelay:'300ms', display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button className="btn btn-cyan btn-lg" onClick={() => navigate?.('/catalog')}>
            <span>⚡</span> КАТАЛОГ
          </button>
          <button className="btn btn-pink btn-lg" onClick={() => navigate?.('/sell')}>
            <span>💰</span> ПРОДАТЬ
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate?.('/auth')}>
            <span>→</span> ВОЙТИ
          </button>
        </div>

        {/* Stats row */}
        <div className="anim-up" style={{ animationDelay:'400ms', display:'flex', gap:40, justifyContent:'center', marginTop:48, flexWrap:'wrap' }}>
          {[
            { val:12400, suffix:'+', label:'ПРОДАВЦОВ', color:'#00f5ff' },
            { val:84200, suffix:'+', label:'СДЕЛОК',    color:'#ff0080' },
            { val:98,    suffix:'%', label:'ДОВОЛЬНЫХ', color:'#00ff88' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color:s.color, textShadow:`0 0 15px ${s.color}60`, lineHeight:1 }}>
                <Counter to={s.val} suffix={s.suffix}/>
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--t3)', letterSpacing:'0.15em', marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEARCH ─────────────────────────────────────────────── */}
      <div style={{ padding:'0 20px 32px', maxWidth:700, margin:'0 auto' }}>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', fontSize:18, pointerEvents:'none' }}>🔍</span>
          <input
            className="inp"
            placeholder="Поиск по товарам, играм, услугам..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft:48, fontSize:15, height:52, borderRadius:16 }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--t3)', fontSize:18 }}>✕</button>
          )}
        </div>
      </div>

      {/* ── CATEGORIES ─────────────────────────────────────────── */}
      <div style={{ padding:'0 20px 28px', overflowX:'auto', scrollbarWidth:'none' }}>
        <div style={{ display:'flex', gap:8, width:'max-content', padding:'4px 0' }}>
          {CATS.map(c => (
            <CatPill key={c.id} {...c} active={cat===c.id} onClick={() => setCat(c.id)}/>
          ))}
        </div>
      </div>

      {/* ── PRODUCTS GRID ──────────────────────────────────────── */}
      <div style={{ padding:'0 16px 40px', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div className="section-title" style={{ flex:1 }}>
            АКТУАЛЬНЫЕ ПРЕДЛОЖЕНИЯ
          </div>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--t3)' }}>{filtered.length} товаров</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i*80}/>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--t3)', fontFamily:'var(--font-display)', fontSize:14, letterSpacing:'0.1em' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
            НИЧЕГО НЕ НАЙДЕНО
          </div>
        )}
      </div>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <div style={{ padding:'40px 20px 60px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <h2 className="anim-up" style={{ textAlign:'center', fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, marginBottom:8, letterSpacing:'0.04em' }}>
            КАК ЭТО <span style={{ color:'var(--cyan)' }}>РАБОТАЕТ</span>
          </h2>
          <p style={{ textAlign:'center', color:'var(--t3)', marginBottom:40, fontFamily:'var(--font-mono)', fontSize:12, letterSpacing:'0.1em' }}>
            БЕЗОПАСНО · БЫСТРО · БЕЗ РИСКА
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16 }}>
            {[
              { step:'01', icon:'🤖', title:'ВОЙДИ ЧЕРЕЗ BOT', desc:'Получи код в Telegram боте и зарегистрируйся за 30 секунд', color:'#00f5ff' },
              { step:'02', icon:'🛒', title:'ВЫБЕРИ ТОВАР',    desc:'Тысячи проверенных продавцов. Рейтинг и отзывы на каждом', color:'#ff0080' },
              { step:'03', icon:'🔒', title:'ОПЛАТИ СДЕЛКУ',   desc:'Деньги заморожены на платформе до подтверждения получения', color:'#00ff88' },
              { step:'04', icon:'⚡', title:'ПОЛУЧИ ТОВАР',    desc:'Продавец передаёт товар. Ты подтверждаешь — деньги ему', color:'#ffe500' },
            ].map((s, i) => (
              <div key={s.step} className="anim-up" style={{ animationDelay:`${i*100}ms` }}>
                <div style={{
                  borderRadius:20, padding:'24px 20px',
                  background:`linear-gradient(135deg, ${s.color}08, rgba(8,12,18,0.95))`,
                  border:`1px solid ${s.color}22`,
                  position:'relative', overflow:'hidden',
                  transition:'all 0.3s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=`${s.color}55`; e.currentTarget.style.boxShadow=`0 8px 30px ${s.color}15` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=`${s.color}22`; e.currentTarget.style.boxShadow='none' }}
                >
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:`${s.color}60`, letterSpacing:'0.2em', marginBottom:12 }}>STEP {s.step}</div>
                  <div style={{ fontSize:32, marginBottom:12 }}>{s.icon}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, letterSpacing:'0.06em', marginBottom:8, color:s.color }}>{s.title}</div>
                  <div style={{ fontSize:13, color:'var(--t3)', lineHeight:1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'30px 20px', textAlign:'center' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, letterSpacing:'0.1em', marginBottom:8 }}>
          <span style={{ color:'var(--cyan)' }}>NEXUS</span>
          <span style={{ color:'var(--t3)' }}> MARKET</span>
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--t4)', letterSpacing:'0.15em' }}>
          © 2026 · БЕЗОПАСНЫЕ СДЕЛКИ · ПОДДЕРЖКА 24/7
        </div>
      </div>
    </div>
  )
}
