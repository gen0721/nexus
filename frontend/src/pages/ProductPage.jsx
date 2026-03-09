import React, { useState } from 'react'

const MOCK = { id:'p1', title:'CS2 Global Elite Account', category:'account', game:'CS2', price:18.99, comparePrice:29.99, desc:`Продаю аккаунт CS2 с рангом Global Elite.\n\n✅ Что включено:\n• Ранг Global Elite (топ 1% игроков)\n• 1200+ часов в игре\n• Prime статус активирован\n• Без VAC банов — чистая история\n• Несколько скинов в инвентаре (~$30)\n• Привязан к email (передам доступ)\n\n📦 Передача:\nПередаю логин/пароль + email для смены данных. Отвечаю в течение 1 часа.`, icon:'🔫', hot:true, delivery:'manual', stock:1, views:423, sales:28, rating:4.9, reviewCount:16, seller:{ id:'s1', username:'NightSeller', firstName:'Николай', rating:4.9, reviewCount:68, totalSales:134, createdAt:'2023-06-01', isVerified:true, isOnline:true }, tags:['cs2','global-elite','prime'], createdAt:'2026-03-08' }
const REVIEWS = [
  { id:1, from:'ProGamer77', text:'Всё как описано. Аккаунт пришёл быстро, продавец на связи. Рекомендую!', rating:5, date:'07.03.2026' },
  { id:2, from:'CsPlayer22', text:'Отличная покупка. Ранг реальный, инвентарь на месте. Спасибо!',          rating:5, date:'05.03.2026' },
  { id:3, from:'GamingBro',  text:'Чуть долго ждал ответа, но в итоге всё хорошо.',                        rating:4, date:'01.03.2026' },
]
const SIMILAR = [
  { id:2, icon:'🔫', title:'CS2 Supreme Account',    price:9.99,  color:'#ff0080' },
  { id:3, icon:'🏆', title:'CS2 Rank Boost S1→GE',   price:24.99, color:'#ffe500' },
  { id:4, icon:'💎', title:'CS2 Knife Karambit',      price:39.90, color:'#00ff88' },
]
const CAT_COLORS = { account:'#ff0080', item:'#00ff88', game:'#8b5cf6', service:'#ffe500', key:'#ff6b00' }

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display:'flex', gap:4 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => onChange(s)}
          style={{ fontSize:28, cursor:'pointer', color:(hover||value)>=s?'#ffe500':'rgba(255,255,255,0.15)', transition:'color 0.1s', textShadow:(hover||value)>=s?'0 0 10px rgba(255,229,0,0.6)':'none' }}>★</span>
      ))}
    </div>
  )
}

export default function ProductPage({ navigate, user, productId }) {
  const product = MOCK
  const c       = CAT_COLORS[product.category] || '#00f5ff'

  const [buyStep, setBuyStep]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [isFav,   setIsFav]     = useState(false)
  const [showRev, setShowRev]   = useState(false)
  const [revForm, setRevForm]   = useState({ rating:5, text:'' })

  const userBalance = user?.balance || 0
  const canAfford   = userBalance >= product.price
  const discount    = product.comparePrice ? Math.round((1-product.price/product.comparePrice)*100) : null

  const handleBuy = () => { if (!user) { navigate?.('/auth'); return }; setBuyStep('confirm') }
  const confirmBuy = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r,1400))
    setLoading(false)
    setBuyStep('success')
  }

  return (
    <div style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>
      {/* NAV */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(4,6,8,0.92)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'12px 20px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate?.('/')} style={{ background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-display)',fontWeight:700,fontSize:18 }}>
            <span style={{ color:'var(--cyan)',textShadow:'0 0 15px rgba(0,245,255,0.5)' }}>NX</span><span style={{ color:'rgba(255,255,255,0.25)' }}>/</span>
          </button>
          <button onClick={() => navigate?.('/catalog')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--t3)',fontFamily:'var(--font-display)',fontSize:12,letterSpacing:'0.06em' }}>КАТАЛОГ</button>
          <span style={{ color:'rgba(255,255,255,0.15)' }}>/</span>
          <span style={{ fontFamily:'var(--font-display)',fontSize:12,color:'var(--t2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:200 }}>{product.title}</span>
          <div style={{ flex:1 }}/>
          {user
            ? <button onClick={() => navigate?.('/profile')} style={{ width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,rgba(0,245,255,0.3),rgba(255,0,128,0.2))',border:'1px solid rgba(0,245,255,0.3)',cursor:'pointer',fontFamily:'var(--font-display)',fontWeight:700,color:'var(--cyan)',display:'flex',alignItems:'center',justifyContent:'center' }}>{user.username?.[0]?.toUpperCase()||'U'}</button>
            : <button className="btn btn-cyan btn-sm" onClick={() => navigate?.('/auth')}>ВОЙТИ</button>}
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:28, alignItems:'start' }}>

          {/* LEFT */}
          <div>
            {/* Hero image area */}
            <div className="anim-up" style={{ borderRadius:20, aspectRatio:'16/9', background:`linear-gradient(135deg,${c}12,rgba(8,12,18,0.95))`, border:`1px solid ${c}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:100, marginBottom:24, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at 30% 50%, ${c}10, transparent 60%)` }}/>
              {product.icon}
            </div>

            {/* Badges + title */}
            <div className="anim-up" style={{ animationDelay:'60ms', marginBottom:20 }}>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                <span style={{ padding:'4px 12px',borderRadius:20,fontSize:11,fontFamily:'var(--font-display)',fontWeight:700,letterSpacing:'0.1em',background:`${c}15`,color:c,border:`1px solid ${c}30` }}>{product.category}</span>
                {product.game && <span style={{ padding:'4px 12px',borderRadius:20,fontSize:11,fontFamily:'var(--font-display)',fontWeight:700,background:'rgba(255,255,255,0.05)',color:'var(--t2)',border:'1px solid rgba(255,255,255,0.1)' }}>{product.game}</span>}
                {product.hot && <span style={{ padding:'4px 12px',borderRadius:20,fontSize:11,fontFamily:'var(--font-display)',fontWeight:700,color:'#ff6b00',background:'rgba(255,107,0,0.1)',border:'1px solid rgba(255,107,0,0.25)' }}>🔥 HOT</span>}
                {discount && <span style={{ padding:'4px 12px',borderRadius:20,fontSize:11,fontFamily:'var(--font-display)',fontWeight:700,color:'var(--green)',background:'rgba(0,255,136,0.1)',border:'1px solid rgba(0,255,136,0.25)' }}>-{discount}%</span>}
              </div>
              <h1 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(22px,4vw,30px)',fontWeight:700,lineHeight:1.2,marginBottom:12 }}>{product.title}</h1>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'var(--font-mono)',fontSize:12,color:'#ffe500' }}>★ {product.rating} ({product.reviewCount} отзывов)</span>
                <span style={{ fontFamily:'var(--font-mono)',fontSize:12,color:'var(--t3)' }}>👁 {product.views}</span>
                <span style={{ fontFamily:'var(--font-mono)',fontSize:12,color:'var(--t3)' }}>✓ {product.sales} продаж</span>
              </div>
            </div>

            {/* Description */}
            <div className="anim-up" style={{ animationDelay:'120ms', marginBottom:24 }}>
              <div className="section-title" style={{ marginBottom:14 }}>ОПИСАНИЕ</div>
              <div style={{ fontSize:14,color:'var(--t2)',lineHeight:1.9,whiteSpace:'pre-line',padding:'16px',borderRadius:16,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)' }}>
                {product.desc}
              </div>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="anim-up" style={{ animationDelay:'160ms', display:'flex', gap:6, flexWrap:'wrap', marginBottom:28 }}>
                {product.tags.map(t => <span key={t} style={{ padding:'4px 10px',borderRadius:20,fontSize:11,background:'rgba(255,255,255,0.04)',color:'var(--t3)',border:'1px solid rgba(255,255,255,0.08)',fontFamily:'var(--font-display)' }}>#{t}</span>)}
              </div>
            )}

            {/* Reviews */}
            <div className="anim-up" style={{ animationDelay:'200ms' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div className="section-title" style={{ flex:1 }}>ОТЗЫВЫ ({product.reviewCount})</div>
                {user && <button onClick={() => setShowRev(!showRev)} className="btn btn-ghost btn-sm">{showRev?'ОТМЕНА':'+ ОТЗЫВ'}</button>}
              </div>
              {showRev && (
                <div className="anim-up" style={{ padding:'18px',borderRadius:16,background:'rgba(255,229,0,0.04)',border:'1px solid rgba(255,229,0,0.15)',marginBottom:14 }}>
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontFamily:'var(--font-display)',fontSize:11,color:'var(--t3)',letterSpacing:'0.1em',marginBottom:8 }}>ОЦЕНКА</div>
                    <StarInput value={revForm.rating} onChange={v => setRevForm(f=>({...f,rating:v}))}/>
                  </div>
                  <textarea className="inp" placeholder="Расскажите о покупке..." value={revForm.text} onChange={e=>setRevForm(f=>({...f,text:e.target.value}))} rows={3} style={{ resize:'none',marginBottom:10 }}/>
                  <button className="btn btn-cyan btn-sm" onClick={()=>setShowRev(false)}>ОТПРАВИТЬ</button>
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {REVIEWS.map((r,i) => (
                  <div key={r.id} className="anim-up" style={{ animationDelay:`${i*60}ms`,padding:'14px 16px',borderRadius:14,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                        <div style={{ width:30,height:30,borderRadius:'50%',background:`${c}20`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontWeight:700,fontSize:12,color:c }}>{r.from[0]}</div>
                        <span style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:13 }}>{r.from}</span>
                      </div>
                      <div style={{ display:'flex',gap:2 }}>{Array.from({length:5}).map((_,j)=><span key={j} style={{ color:j<r.rating?'#ffe500':'rgba(255,255,255,0.12)',fontSize:12 }}>★</span>)}</div>
                    </div>
                    <p style={{ fontSize:13,color:'var(--t2)',lineHeight:1.6 }}>{r.text}</p>
                    <div style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--t4)',marginTop:6 }}>{r.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ position:'sticky', top:80 }}>
            {/* Buy card */}
            <div className="anim-up" style={{ borderRadius:24,overflow:'hidden',marginBottom:14,background:'linear-gradient(145deg,rgba(10,14,22,0.98),rgba(6,8,17,0.98))',border:`1px solid ${c}20` }}>
              <div style={{ height:2,background:`linear-gradient(90deg,transparent,${c},transparent)` }}/>
              <div style={{ padding:'20px' }}>
                <div style={{ display:'flex',alignItems:'flex-end',gap:10,marginBottom:6 }}>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:36,fontWeight:700,color:c,textShadow:`0 0 15px ${c}60`,lineHeight:1 }}>${product.price.toFixed(2)}</div>
                  {product.comparePrice && <div style={{ fontFamily:'var(--font-display)',fontSize:16,color:'var(--t4)',textDecoration:'line-through',marginBottom:4 }}>${product.comparePrice.toFixed(2)}</div>}
                </div>
                <div style={{ fontFamily:'var(--font-mono)',fontSize:11,color:'var(--t3)',marginBottom:14 }}>≈ {(product.price*90).toFixed(0)} ₽</div>

                <div style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:10,background:'rgba(0,255,136,0.06)',border:'1px solid rgba(0,255,136,0.12)',marginBottom:12 }}>
                  <span style={{ fontSize:14 }}>{product.delivery==='auto'?'⚡':'👤'}</span>
                  <span style={{ fontFamily:'var(--font-display)',fontSize:12,color:'var(--green)',fontWeight:700,letterSpacing:'0.04em' }}>{product.delivery==='auto'?'Автодоставка':'Ручная передача'}</span>
                </div>

                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:14,fontSize:12,color:'var(--t3)',fontFamily:'var(--font-mono)' }}>
                  <span>Наличие:</span>
                  <span style={{ color:product.stock>0?'var(--green)':'var(--pink)',fontWeight:700 }}>{product.stock>0?`✓ ${product.stock} шт.`:'✗ Нет в наличии'}</span>
                </div>

                {user && <div style={{ padding:'8px 12px',borderRadius:10,background:canAfford?'rgba(0,255,136,0.05)':'rgba(255,0,128,0.05)',border:`1px solid ${canAfford?'rgba(0,255,136,0.12)':'rgba(255,0,128,0.12)'}`,marginBottom:12,fontFamily:'var(--font-mono)',fontSize:11,color:'var(--t2)' }}>
                  Баланс: <span style={{ color:canAfford?'var(--green)':'var(--pink)',fontWeight:700 }}>${userBalance.toFixed(2)}</span>{!canAfford&&<span style={{ color:'var(--pink)' }}> · Мало</span>}
                </div>}

                <button className="btn btn-cyan btn-full" onClick={handleBuy} style={{ fontSize:15,marginBottom:8 }}>⚡ КУПИТЬ СЕЙЧАС</button>
                {user && !canAfford && <button className="btn btn-ghost btn-full btn-sm" onClick={()=>navigate?.('/profile')}>+ ПОПОЛНИТЬ БАЛАНС</button>}

                <div style={{ display:'flex',gap:8,marginTop:10 }}>
                  <button onClick={()=>setIsFav(!isFav)} style={{ flex:1,padding:'9px',borderRadius:10,cursor:'pointer',background:isFav?'rgba(255,0,128,0.08)':'rgba(255,255,255,0.03)',border:`1px solid ${isFav?'rgba(255,0,128,0.25)':'rgba(255,255,255,0.08)'}`,color:isFav?'var(--pink)':'var(--t3)',fontFamily:'var(--font-display)',fontSize:11,fontWeight:700,transition:'all 0.2s' }}>
                    {isFav?'❤️ ИЗБРАННОЕ':'🤍 В ИЗБРАННОЕ'}
                  </button>
                  <button style={{ width:38,height:38,borderRadius:10,cursor:'pointer',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',color:'var(--t3)',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>↗</button>
                </div>
              </div>
            </div>

            {/* Seller */}
            <div className="anim-up" style={{ animationDelay:'80ms',borderRadius:20,padding:'18px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',marginBottom:12 }}>
              <div className="section-title" style={{ marginBottom:14 }}>ПРОДАВЕЦ</div>
              <div style={{ display:'flex',gap:12,alignItems:'center',marginBottom:14 }}>
                <div style={{ position:'relative' }}>
                  <div style={{ width:44,height:44,borderRadius:14,background:`${c}30`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontWeight:700,fontSize:18,color:c }}>{product.seller.firstName[0]}</div>
                  {product.seller.isOnline && <div style={{ position:'absolute',bottom:-2,right:-2,width:12,height:12,borderRadius:'50%',background:'var(--green)',border:'2px solid #040608',boxShadow:'0 0 6px rgba(0,255,136,0.6)' }}/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:14,marginBottom:2 }}>{product.seller.firstName}</div>
                  <div style={{ fontFamily:'var(--font-mono)',fontSize:11,color:'var(--t3)' }}>@{product.seller.username}</div>
                </div>
                {product.seller.isVerified && <span style={{ fontSize:16 }}>✅</span>}
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12 }}>
                {[['★ '+product.seller.rating,'#ffe500','Рейтинг'],[product.seller.totalSales,'var(--green)','Продаж'],[product.seller.reviewCount,'var(--cyan)','Отзывов']].map(([v,col,l])=>(
                  <div key={l} style={{ textAlign:'center',padding:'8px 4px',borderRadius:10,background:'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:13,color:col }}>{v}</div>
                    <div style={{ fontFamily:'var(--font-mono)',fontSize:9,color:'var(--t4)',marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost btn-full btn-sm">ПРОФИЛЬ ПРОДАВЦА</button>
            </div>

            {/* Safety */}
            <div style={{ padding:'14px 16px',borderRadius:14,background:'rgba(0,245,255,0.03)',border:'1px solid rgba(0,245,255,0.1)',fontSize:12,color:'var(--t3)',lineHeight:1.7 }}>
              🛡 <strong style={{ color:'var(--cyan)' }}>Защита покупателя:</strong> деньги заморожены до подтверждения получения. Гарантия возврата при споре.
            </div>
          </div>
        </div>

        {/* Similar */}
        <div style={{ marginTop:40 }}>
          <div className="section-title" style={{ marginBottom:16 }}>ПОХОЖИЕ ТОВАРЫ</div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12 }}>
            {SIMILAR.map((p,i)=>(
              <div key={p.id} className="anim-up" onClick={()=>navigate?.(`/product/${p.id}`)} style={{ animationDelay:`${i*60}ms`,padding:'16px',borderRadius:16,cursor:'pointer',background:`linear-gradient(135deg,${p.color}08,rgba(8,12,18,0.95))`,border:`1px solid ${p.color}20`,transition:'all 0.3s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=`${p.color}45`;e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=`${p.color}20`;e.currentTarget.style.transform='none'}}
              >
                <div style={{ fontSize:28,marginBottom:10 }}>{p.icon}</div>
                <div style={{ fontSize:13,fontWeight:600,color:'var(--t1)',marginBottom:8 }}>{p.title}</div>
                <div style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:700,color:p.color }}>${p.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BUY CONFIRM */}
      {buyStep==='confirm' && (
        <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }} onClick={()=>setBuyStep(null)}>
          <div onClick={e=>e.stopPropagation()} className="anim-up" style={{ width:'100%',maxWidth:420,borderRadius:24,background:'linear-gradient(145deg,rgba(10,14,22,0.99),rgba(6,8,17,0.99))',border:`1px solid ${c}25`,overflow:'hidden' }}>
            <div style={{ height:2,background:`linear-gradient(90deg,transparent,${c},transparent)` }}/>
            <div style={{ padding:'28px' }}>
              <h3 style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:700,marginBottom:20 }}>⚡ ПОДТВЕРЖДЕНИЕ ПОКУПКИ</h3>
              <div style={{ padding:'14px 16px',borderRadius:14,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',marginBottom:20 }}>
                <div style={{ fontSize:14,fontWeight:600,marginBottom:12 }}>{product.title}</div>
                {[['Стоимость',`$${product.price.toFixed(2)}`,c],['Ваш баланс',`$${userBalance.toFixed(2)}`,'var(--t1)'],['После оплаты',`$${Math.max(0,userBalance-product.price).toFixed(2)}`,'var(--green)']].map(([l,v,col],i)=>(
                  <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:i<2?'1px solid rgba(255,255,255,0.04)':'none' }}>
                    <span style={{ color:'var(--t3)',fontSize:13 }}>{l}</span>
                    <span style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:14,color:col }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:12,color:'var(--t3)',lineHeight:1.7,marginBottom:20 }}>
                🔒 Средства <strong style={{ color:'var(--cyan)' }}>заморожены</strong> до получения товара. Продавец получит деньги после вашего подтверждения.
              </div>
              <div style={{ display:'flex',gap:10 }}>
                <button className="btn btn-ghost" onClick={()=>setBuyStep(null)} style={{ flex:1 }}>ОТМЕНА</button>
                <button className="btn btn-cyan" onClick={confirmBuy} disabled={loading||!canAfford} style={{ flex:2 }}>
                  {loading?<span style={{ display:'inline-block',width:16,height:16,borderRadius:'50%',border:'2px solid transparent',borderTopColor:'#000',animation:'spin 0.8s linear infinite' }}/>:'✓ ПОДТВЕРДИТЬ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {buyStep==='success' && (
        <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
          <div className="anim-up" style={{ width:'100%',maxWidth:360,borderRadius:24,background:'linear-gradient(145deg,rgba(10,14,22,0.99),rgba(6,8,17,0.99))',border:'1px solid rgba(0,255,136,0.25)',overflow:'hidden',textAlign:'center' }}>
            <div style={{ height:2,background:'linear-gradient(90deg,transparent,#00ff88,transparent)' }}/>
            <div style={{ padding:'36px 28px' }}>
              <div style={{ fontSize:64,marginBottom:16,animation:'float 2s ease-in-out infinite' }}>🎉</div>
              <h3 style={{ fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,color:'var(--green)',marginBottom:8,letterSpacing:'0.04em' }}>СДЕЛКА СОЗДАНА!</h3>
              <p style={{ color:'var(--t2)',fontSize:13,lineHeight:1.7,marginBottom:24 }}>Средства заморожены. Продавец получил уведомление и передаст товар в ближайшее время.</p>
              <button className="btn btn-green btn-full" onClick={()=>navigate?.('/profile')}>ПЕРЕЙТИ К СДЕЛКЕ →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
