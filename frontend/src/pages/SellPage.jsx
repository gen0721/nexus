import React, { useState, useRef } from 'react'

// ── Constants ────────────────────────────────────────────────────
const CATS = [
  { id:'account', icon:'👤', label:'Аккаунт',  color:'#ff0080', desc:'Игровые аккаунты с прогрессом' },
  { id:'item',    icon:'⚔️', label:'Предмет',  color:'#00ff88', desc:'Скины, предметы, инвентарь' },
  { id:'game',    icon:'🎮', label:'Игра',      color:'#8b5cf6', desc:'Лицензионные ключи на игры' },
  { id:'service', icon:'🛠', label:'Услуга',    color:'#ffe500', desc:'Буст, прокачка, помощь' },
  { id:'key',     icon:'🔑', label:'Ключ/Код', color:'#ff6b00', desc:'Подарочные карты, коды' },
]

const GAMES = ['CS2','Dota 2','GTA V','Valorant','Minecraft','Roblox','PUBG','Fortnite','FIFA 25','World of Tanks','Steam','PlayStation','Xbox','Nintendo','Другое']

const DELIVERY = [
  { id:'auto',   icon:'⚡', label:'Авто',         desc:'Покупатель получит товар мгновенно после оплаты' },
  { id:'manual', icon:'👤', label:'Вручную',       desc:'Вы передаёте товар покупателю в чате сделки' },
]

const STEPS = ['КАТЕГОРИЯ','ОПИСАНИЕ','ЦЕНА И ДОСТАВКА','ПОДТВЕРЖДЕНИЕ']

// ── Step indicator ────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div style={{ display:'flex', alignItems:'center', marginBottom:36 }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{
              width:36, height:36, borderRadius:'50%',
              background: i < current ? 'linear-gradient(135deg,#00cc6a,#00ff88)'
                        : i === current ? 'linear-gradient(135deg,#00c8d4,#00f5ff)'
                        : 'rgba(255,255,255,0.06)',
              border: i === current ? '2px solid rgba(0,245,255,0.5)' : '2px solid transparent',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-display)', fontWeight:700, fontSize:13,
              color: i <= current ? '#000' : 'var(--t3)',
              boxShadow: i === current ? '0 0 15px rgba(0,245,255,0.4)' : i < current ? '0 0 10px rgba(0,255,136,0.3)' : 'none',
              transition:'all 0.3s',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{ fontFamily:'var(--font-display)', fontSize:9, letterSpacing:'0.1em', color: i <= current ? (i < current ? 'var(--green)' : 'var(--cyan)') : 'var(--t4)', whiteSpace:'nowrap' }}>
              {s}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex:1, height:2, margin:'0 8px', marginBottom:22, background: i < current ? 'linear-gradient(90deg,#00ff88,#00f5ff)' : 'rgba(255,255,255,0.06)', borderRadius:1, transition:'background 0.5s' }}/>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ── Image upload zone ─────────────────────────────────────────────
function ImageZone({ images, onChange }) {
  const ref    = useRef(null)
  const [drag, setDrag] = useState(false)

  const addFiles = files => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 5 - images.length)
    arr.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => onChange(prev => [...prev, { url: e.target.result, name: f.name }])
      reader.readAsDataURL(f)
    })
  }

  return (
    <div>
      <div className="section-title" style={{ marginBottom:12 }}>ФОТОГРАФИИ ТОВАРА</div>

      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {/* Existing images */}
        {images.map((img, i) => (
          <div key={i} style={{ position:'relative', width:90, height:90, borderRadius:14, overflow:'hidden', border:'1px solid rgba(255,255,255,0.1)' }}>
            <img src={img.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
            {i === 0 && (
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'3px 0', background:'rgba(0,245,255,0.7)', textAlign:'center', fontFamily:'var(--font-display)', fontSize:9, letterSpacing:'0.1em', color:'#000', fontWeight:700 }}>ГЛАВНОЕ</div>
            )}
            <button onClick={() => onChange(prev => prev.filter((_,j) => j !== i))} style={{ position:'absolute', top:4, right:4, width:20, height:20, borderRadius:'50%', background:'rgba(255,0,128,0.8)', border:'none', cursor:'pointer', color:'#fff', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>✕</button>
          </div>
        ))}

        {/* Upload button */}
        {images.length < 5 && (
          <div
            onClick={() => ref.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
            style={{
              width:90, height:90, borderRadius:14, cursor:'pointer',
              border: `2px dashed ${drag ? 'rgba(0,245,255,0.6)' : 'rgba(255,255,255,0.12)'}`,
              background: drag ? 'rgba(0,245,255,0.06)' : 'rgba(255,255,255,0.02)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
              transition:'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(0,245,255,0.4)'; e.currentTarget.style.background='rgba(0,245,255,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.style.background='rgba(255,255,255,0.02)' }}
          >
            <span style={{ fontSize:24, opacity:0.4 }}>+</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--t4)', letterSpacing:'0.08em' }}>{5 - images.length} ОСТАЛОСЬ</span>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e => addFiles(e.target.files)}/>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--t4)', marginTop:8 }}>До 5 фото · JPG/PNG/WEBP · Первое фото — главное</div>
    </div>
  )
}

// ── Preview card ──────────────────────────────────────────────────
function PreviewCard({ form }) {
  const catInfo = CATS.find(c => c.id === form.category) || CATS[0]
  const c       = catInfo.color

  return (
    <div style={{ borderRadius:20, padding:'1.5px', background:`linear-gradient(135deg, ${c}33, transparent, ${c}22)` }}>
      <div style={{ borderRadius:18.5, background:'linear-gradient(145deg,rgba(10,14,22,0.98),rgba(6,8,17,0.99))', padding:'18px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:`radial-gradient(circle, ${c}20, transparent)`, pointerEvents:'none' }}/>

        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
          <span style={{ padding:'3px 9px', borderRadius:20, fontSize:10, fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'0.1em', background:`${c}15`, color:c, border:`1px solid ${c}30` }}>
            {catInfo.label}
          </span>
          {form.game && <span style={{ fontSize:10, color:'var(--t3)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'2px 8px', fontFamily:'var(--font-display)' }}>{form.game}</span>}
        </div>

        {form.images?.[0] ? (
          <img src={form.images[0].url} alt="" style={{ width:'100%', height:120, objectFit:'cover', borderRadius:12, marginBottom:12 }}/>
        ) : (
          <div style={{ width:48, height:48, borderRadius:14, background:`${c}18`, border:`1px solid ${c}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:14 }}>{catInfo.icon}</div>
        )}

        <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.9)', marginBottom:6, lineHeight:1.3 }}>{form.title || 'Название товара'}</div>
        <div style={{ fontSize:12, color:'var(--t3)', marginBottom:16, lineHeight:1.5 }}>{form.desc ? form.desc.slice(0,80)+'...' : 'Описание товара'}</div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:c, textShadow:`0 0 10px ${c}80` }}>
              ${form.price ? parseFloat(form.price).toFixed(2) : '0.00'}
            </div>
            <div style={{ fontSize:10, color:'var(--t3)', fontFamily:'var(--font-mono)' }}>
              ≈{((parseFloat(form.price)||0)*90).toFixed(0)} ₽
            </div>
          </div>
          <div style={{ padding:'7px 14px', borderRadius:10, background:`${c}20`, border:`1px solid ${c}35`, color:c, fontFamily:'var(--font-display)', fontSize:11, fontWeight:700 }}>КУПИТЬ →</div>
        </div>
      </div>
    </div>
  )
}

// ── MAIN SELL PAGE ────────────────────────────────────────────────
export default function SellPage({ navigate, user }) {
  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [form,    setForm]    = useState({
    category: '', game: '', title: '', desc: '', price: '', comparePrice: '',
    delivery: 'manual', autoContent: '', images: [], tags: [],
    minOrder: 1, stock: 1,
  })
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const canNext = () => {
    if (step === 0) return !!form.category
    if (step === 1) return form.title.trim().length >= 5 && form.desc.trim().length >= 20
    if (step === 2) return parseFloat(form.price) >= 0.5
    return true
  }

  const submit = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res   = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка публикации')
      navigate?.('/catalog')
    } catch(e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>

      {/* NAV */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(4,6,8,0.92)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 20px' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate?.('/')} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-display)', fontWeight:700, fontSize:18 }}>
            <span style={{ color:'var(--cyan)', textShadow:'0 0 15px rgba(0,245,255,0.5)' }}>NX</span><span style={{ color:'rgba(255,255,255,0.25)' }}>/</span>
          </button>
          <span style={{ color:'rgba(255,255,255,0.15)' }}>/</span>
          <span style={{ fontFamily:'var(--font-display)', fontSize:12, color:'var(--cyan)', letterSpacing:'0.08em' }}>НОВОЕ ОБЪЯВЛЕНИЕ</span>
          <div style={{ flex:1 }}/>
          <button onClick={() => navigate?.('/catalog')} className="btn btn-ghost btn-sm">← КАТАЛОГ</button>
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 20px' }}>

        {/* HEADER */}
        <div className="anim-up" style={{ marginBottom:36, textAlign:'center' }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(26px,5vw,42px)', fontWeight:700, marginBottom:8 }}>
            РАЗМЕСТИТЬ <span style={{ color:'var(--cyan)', textShadow:'0 0 20px rgba(0,245,255,0.4)' }}>ТОВАР</span>
          </h1>
          <p style={{ color:'var(--t3)', fontSize:14 }}>Заполните форму — ваш товар увидят тысячи покупателей</p>
        </div>

        {/* STEP BAR */}
        <StepBar current={step}/>

        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'start' }}>

          {/* FORM AREA */}
          <div className="anim-in" style={{ minWidth:0 }}>

            {/* ── STEP 0: Category ─────────────────────────────── */}
            {step === 0 && (
              <div>
                <div className="section-title" style={{ marginBottom:20 }}>ВЫБЕРИТЕ КАТЕГОРИЮ</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                  {CATS.map(cat => (
                    <button key={cat.id} onClick={() => upd('category', cat.id)} style={{
                      padding:'20px 18px', borderRadius:18, cursor:'pointer', textAlign:'left',
                      background: form.category === cat.id ? `${cat.color}12` : 'rgba(255,255,255,0.02)',
                      border: `2px solid ${form.category === cat.id ? cat.color+'55' : 'rgba(255,255,255,0.08)'}`,
                      transition:'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                      transform: form.category === cat.id ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: form.category === cat.id ? `0 8px 30px ${cat.color}15` : 'none',
                    }}>
                      <div style={{ fontSize:30, marginBottom:10 }}>{cat.icon}</div>
                      <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, color: form.category === cat.id ? cat.color : 'var(--t1)', marginBottom:4 }}>{cat.label}</div>
                      <div style={{ fontSize:12, color:'var(--t3)', lineHeight:1.5 }}>{cat.desc}</div>
                      {form.category === cat.id && (
                        <div style={{ position:'absolute', top:12, right:12, width:20, height:20, borderRadius:'50%', background:cat.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#000', fontWeight:700 }}>✓</div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Game select */}
                {form.category && (
                  <div className="anim-up" style={{ marginTop:24 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.12em', marginBottom:10 }}>ИГРА / ПЛАТФОРМА (необязательно)</div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {GAMES.map(g => (
                        <button key={g} onClick={() => upd('game', form.game === g ? '' : g)} style={{
                          padding:'7px 14px', borderRadius:20, cursor:'pointer',
                          background: form.game === g ? 'rgba(0,245,255,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${form.game === g ? 'rgba(0,245,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          color: form.game === g ? 'var(--cyan)' : 'var(--t3)',
                          fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, letterSpacing:'0.04em',
                          transition:'all 0.15s',
                        }}>{g}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 1: Description ──────────────────────────── */}
            {step === 1 && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.12em', marginBottom:8 }}>
                    НАЗВАНИЕ ОБЪЯВЛЕНИЯ <span style={{ color:'var(--pink)' }}>*</span>
                  </div>
                  <input
                    className="inp"
                    placeholder="Например: CS2 Global Elite Account 1200 часов"
                    value={form.title}
                    onChange={e => upd('title', e.target.value)}
                    maxLength={80}
                  />
                  <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4, fontFamily:'var(--font-mono)', fontSize:10, color:'var(--t4)' }}>
                    {form.title.length}/80
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.12em', marginBottom:8 }}>
                    ПОДРОБНОЕ ОПИСАНИЕ <span style={{ color:'var(--pink)' }}>*</span>
                  </div>
                  <textarea
                    className="inp"
                    placeholder={`Опишите товар подробно:\n• Что входит в комплект\n• Особенности и характеристики\n• Условия передачи\n• Гарантии`}
                    value={form.desc}
                    onChange={e => upd('desc', e.target.value)}
                    rows={7}
                    style={{ resize:'vertical', minHeight:140 }}
                  />
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color: form.desc.length < 20 ? 'var(--pink)' : 'var(--t4)' }}>
                      {form.desc.length < 20 ? `Ещё ${20-form.desc.length} симв.` : '✓ Достаточно'}
                    </span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--t4)' }}>{form.desc.length}/2000</span>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.12em', marginBottom:8 }}>ТЕГИ (необязательно)</div>
                  <input
                    className="inp"
                    placeholder="Введите тег и нажмите Enter..."
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const v = e.target.value.trim().toLowerCase()
                        if (v && !form.tags.includes(v) && form.tags.length < 8) {
                          upd('tags', [...form.tags, v])
                          e.target.value = ''
                        }
                        e.preventDefault()
                      }
                    }}
                  />
                  {form.tags.length > 0 && (
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
                      {form.tags.map(t => (
                        <span key={t} style={{ padding:'3px 10px', borderRadius:20, fontSize:11, background:'rgba(0,245,255,0.1)', color:'var(--cyan)', border:'1px solid rgba(0,245,255,0.2)', fontFamily:'var(--font-display)', display:'flex', alignItems:'center', gap:6 }}>
                          #{t}
                          <button onClick={() => upd('tags', form.tags.filter(x=>x!==t))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--cyan)', fontSize:12, lineHeight:1 }}>✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Images */}
                <ImageZone images={form.images} onChange={v => upd('images', typeof v === 'function' ? v(form.images) : v)}/>
              </div>
            )}

            {/* ── STEP 2: Price & Delivery ─────────────────────── */}
            {step === 2 && (
              <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

                {/* Price */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.12em', marginBottom:8 }}>
                      ЦЕНА (USD) <span style={{ color:'var(--pink)' }}>*</span>
                    </div>
                    <div style={{ position:'relative' }}>
                      <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontFamily:'var(--font-display)', fontWeight:700, color:'var(--cyan)', fontSize:16 }}>$</span>
                      <input
                        className="inp"
                        type="number"
                        step="0.01"
                        min="0.5"
                        placeholder="0.00"
                        value={form.price}
                        onChange={e => upd('price', e.target.value)}
                        style={{ paddingLeft:28, fontFamily:'var(--font-display)', fontSize:20, fontWeight:700 }}
                      />
                    </div>
                    {form.price && <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--t3)', marginTop:6 }}>≈ {(parseFloat(form.price)*90).toFixed(0)} ₽ · Ваш заработок: <span style={{ color:'var(--green)' }}>${(parseFloat(form.price)*0.95).toFixed(2)}</span></div>}
                  </div>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.12em', marginBottom:8 }}>ЦЕНА "ДО" (зачёркнутая)</div>
                    <div style={{ position:'relative' }}>
                      <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontFamily:'var(--font-display)', fontWeight:700, color:'var(--t3)', fontSize:16 }}>$</span>
                      <input
                        className="inp"
                        type="number"
                        step="0.01"
                        placeholder="Необязательно"
                        value={form.comparePrice}
                        onChange={e => upd('comparePrice', e.target.value)}
                        style={{ paddingLeft:28 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.12em', marginBottom:8 }}>КОЛИЧЕСТВО В НАЛИЧИИ</div>
                    <input className="inp" type="number" min="1" value={form.stock} onChange={e => upd('stock', e.target.value)}/>
                  </div>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.12em', marginBottom:8 }}>МИН. ЗАКАЗ</div>
                    <input className="inp" type="number" min="1" value={form.minOrder} onChange={e => upd('minOrder', e.target.value)}/>
                  </div>
                </div>

                {/* Комиссия */}
                <div style={{ padding:'14px 18px', borderRadius:14, background:'rgba(0,245,255,0.04)', border:'1px solid rgba(0,245,255,0.12)' }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:12, color:'var(--cyan)', letterSpacing:'0.08em', marginBottom:8, fontWeight:700 }}>⚡ ИНФОРМАЦИЯ О КОМИССИИ</div>
                  <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                    {[
                      { label:'Цена продажи',  val:`$${parseFloat(form.price||0).toFixed(2)}`, color:'var(--t1)' },
                      { label:'Комиссия (5%)',  val:`-$${(parseFloat(form.price||0)*0.05).toFixed(2)}`, color:'var(--pink)' },
                      { label:'Ваш заработок', val:`$${(parseFloat(form.price||0)*0.95).toFixed(2)}`, color:'var(--green)' },
                    ].map(r => (
                      <div key={r.label}>
                        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--t4)', letterSpacing:'0.1em', marginBottom:2 }}>{r.label}</div>
                        <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:16, color:r.color }}>{r.val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery method */}
                <div>
                  <div className="section-title" style={{ marginBottom:14 }}>СПОСОБ ПЕРЕДАЧИ</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {DELIVERY.map(d => (
                      <button key={d.id} onClick={() => upd('delivery', d.id)} style={{
                        padding:'16px 18px', borderRadius:14, cursor:'pointer', textAlign:'left',
                        background: form.delivery === d.id ? 'rgba(0,245,255,0.06)' : 'rgba(255,255,255,0.02)',
                        border: `1.5px solid ${form.delivery === d.id ? 'rgba(0,245,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                        transition:'all 0.2s', display:'flex', gap:14, alignItems:'center',
                      }}>
                        <span style={{ fontSize:24 }}>{d.icon}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, color: form.delivery === d.id ? 'var(--cyan)' : 'var(--t1)', marginBottom:3 }}>{d.label}</div>
                          <div style={{ fontSize:12, color:'var(--t3)', lineHeight:1.5 }}>{d.desc}</div>
                        </div>
                        <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${form.delivery === d.id ? 'var(--cyan)' : 'rgba(255,255,255,0.2)'}`, background: form.delivery === d.id ? 'var(--cyan)' : 'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#000', transition:'all 0.2s' }}>
                          {form.delivery === d.id ? '✓' : ''}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Auto content */}
                  {form.delivery === 'auto' && (
                    <div className="anim-up" style={{ marginTop:14 }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.12em', marginBottom:8 }}>ДАННЫЕ ДЛЯ АВТОДОСТАВКИ <span style={{ color:'var(--pink)' }}>*</span></div>
                      <textarea
                        className="inp"
                        placeholder="Введите данные которые получит покупатель автоматически после оплаты (логин:пароль, код и т.д.)"
                        value={form.autoContent}
                        onChange={e => upd('autoContent', e.target.value)}
                        rows={4}
                        style={{ resize:'vertical', fontFamily:'var(--font-mono)', fontSize:13 }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 3: Confirm ──────────────────────────────── */}
            {step === 3 && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ padding:'20px', borderRadius:18, background:'rgba(0,255,136,0.04)', border:'1px solid rgba(0,255,136,0.15)' }}>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, color:'var(--green)', marginBottom:14, letterSpacing:'0.06em' }}>✓ ПРОВЕРКА ДАННЫХ</div>
                  {[
                    { label:'Категория',   val: CATS.find(c=>c.id===form.category)?.label },
                    { label:'Игра',        val: form.game || 'Не указана' },
                    { label:'Название',    val: form.title },
                    { label:'Цена',        val: `$${parseFloat(form.price||0).toFixed(2)}` },
                    { label:'Наличие',     val: `${form.stock} шт.` },
                    { label:'Передача',    val: DELIVERY.find(d=>d.id===form.delivery)?.label },
                    { label:'Фотографий', val: `${form.images.length} шт.` },
                    { label:'Тегов',      val: form.tags.length || 0 },
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontFamily:'var(--font-display)', fontSize:12, color:'var(--t3)', letterSpacing:'0.06em' }}>{r.label}</span>
                      <span style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'var(--t1)' }}>{r.val}</span>
                    </div>
                  ))}
                </div>

                <div style={{ padding:'14px 18px', borderRadius:12, background:'rgba(255,229,0,0.04)', border:'1px solid rgba(255,229,0,0.12)', fontSize:12, color:'var(--t2)', lineHeight:1.7 }}>
                  ⚠️ Публикуя объявление вы соглашаетесь с правилами площадки. Товар пройдёт автопроверку — обычно это занимает несколько минут.
                </div>

                {error && <div style={{ padding:'12px', borderRadius:10, background:'rgba(255,0,128,0.08)', border:'1px solid rgba(255,0,128,0.2)', color:'#ff6b9d', fontSize:13, textAlign:'center' }}>{error}</div>}

                <button className="btn btn-green btn-full" onClick={submit} disabled={loading} style={{ fontSize:16, padding:'16px' }}>
                  {loading
                    ? <span style={{ display:'inline-block', width:18, height:18, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'#000', animation:'spin 0.8s linear infinite' }}/>
                    : '🚀 ОПУБЛИКОВАТЬ ОБЪЯВЛЕНИЕ'}
                </button>
              </div>
            )}

            {/* NAV BUTTONS */}
            <div style={{ display:'flex', gap:10, marginTop:32 }}>
              {step > 0 && (
                <button className="btn btn-ghost" onClick={() => setStep(s => s-1)}>← НАЗАД</button>
              )}
              {step < 3 && (
                <button
                  className={`btn ${canNext() ? 'btn-cyan' : 'btn-ghost'}`}
                  onClick={() => { if (canNext()) setStep(s => s+1) }}
                  disabled={!canNext()}
                  style={{ flex:1, fontSize:15 }}
                >
                  ДАЛЕЕ →
                </button>
              )}
            </div>
          </div>

          {/* PREVIEW (desktop) */}
          <div style={{ width:280, flexShrink:0, position:'sticky', top:90 }}>
            <div className="section-title" style={{ marginBottom:14 }}>ПРЕДПРОСМОТР</div>
            <PreviewCard form={form}/>
            <div style={{ marginTop:12, padding:'10px 14px', borderRadius:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--t4)', lineHeight:1.8 }}>
              📌 Так увидят ваш товар покупатели в каталоге
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
