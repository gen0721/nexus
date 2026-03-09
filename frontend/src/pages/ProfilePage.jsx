import React, { useState, useEffect, useRef } from 'react'

// ── Animated ring progress ────────────────────────────────────────
function RingProgress({ value, max, size=80, stroke=6, color='#00f5ff', label, sublabel }) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct  = Math.min(value / max, 1)
  const [anim, setAnim] = useState(0)
  useEffect(() => {
    let s = null; const dur = 1200
    const tick = ts => { if (!s) s=ts; const p=Math.min((ts-s)/dur,1); setAnim((1-Math.pow(1-p,3))*pct); if(p<1) requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  }, [pct])
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ*(1-anim)} strokeLinecap="round"
          style={{ filter:`drop-shadow(0 0 4px ${color})` }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:size>70?15:12, color, lineHeight:1 }}>{label}</div>
        {sublabel && <div style={{ fontSize:9, color:'var(--t3)', fontFamily:'var(--font-mono)', marginTop:2 }}>{sublabel}</div>}
      </div>
    </div>
  )
}

// ── Transaction row ───────────────────────────────────────────────
function TxRow({ tx }) {
  const isIn   = tx.type==='deposit'||tx.type==='sale'
  const colors = { deposit:'#00ff88',sale:'#00ff88',withdraw:'#ff0080',purchase:'#ff6b00',frozen:'#ffe500' }
  const icons  = { deposit:'⬇',sale:'💰',withdraw:'⬆',purchase:'🛒',frozen:'🔒' }
  const labels = { deposit:'Пополнение',sale:'Продажа',withdraw:'Вывод',purchase:'Покупка',frozen:'Заморожено' }
  const c      = colors[tx.type]||'#00f5ff'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', transition:'background 0.2s' }}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
      onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
    >
      <div style={{ width:36,height:36,borderRadius:10,background:`${c}15`,border:`1px solid ${c}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>{icons[tx.type]}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13,fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{tx.title}</div>
        <div style={{ fontSize:11,color:'var(--t3)',fontFamily:'var(--font-mono)',marginTop:1 }}>{labels[tx.type]} · {tx.date}</div>
      </div>
      <div style={{ textAlign:'right',flexShrink:0 }}>
        <div style={{ fontFamily:'var(--font-display)',fontSize:15,fontWeight:700,color:c }}>{isIn?'+':'-'}${Math.abs(tx.amount).toFixed(2)}</div>
        <div style={{ fontSize:10,color:'var(--t4)',fontFamily:'var(--font-mono)' }}>{tx.status}</div>
      </div>
    </div>
  )
}

// ── Deal row ─────────────────────────────────────────────────────
function DealRow({ deal }) {
  const sc = { active:'#ffe500',completed:'#00ff88',cancelled:'#ff0080',dispute:'#ff6b00' }
  const sl = { active:'В процессе',completed:'Завершена',cancelled:'Отменена',dispute:'Спор' }
  const c  = sc[deal.status]||'#00f5ff'
  return (
    <div style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,background:'rgba(255,255,255,0.02)',border:`1px solid ${c}15`,transition:'all 0.2s',cursor:'pointer' }}
      onMouseEnter={e=>{e.currentTarget.style.background=`${c}06`;e.currentTarget.style.borderColor=`${c}30`}}
      onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.02)';e.currentTarget.style.borderColor=`${c}15`}}
    >
      <div style={{ fontSize:22,flexShrink:0 }}>{deal.icon}</div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:13,fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{deal.title}</div>
        <div style={{ fontSize:11,color:'var(--t3)',marginTop:1 }}>{deal.role==='buyer'?'🛒 Покупатель':'💰 Продавец'} · {deal.partner} · {deal.date}</div>
      </div>
      <div style={{ textAlign:'right',flexShrink:0 }}>
        <div style={{ fontFamily:'var(--font-display)',fontSize:15,fontWeight:700,color:'var(--t1)',marginBottom:4 }}>${deal.price.toFixed(2)}</div>
        <span style={{ fontSize:10,padding:'2px 7px',borderRadius:8,background:`${c}15`,color:c,border:`1px solid ${c}25`,fontFamily:'var(--font-display)',fontWeight:700,letterSpacing:'0.06em' }}>{sl[deal.status]}</span>
      </div>
    </div>
  )
}

// ── Mock data ────────────────────────────────────────────────────
const MOCK_USER = { id:'u1',username:'nexus_player',firstName:'Алексей',telegramId:'7750512181',email:'alex@mail.ru',balance:142.50,frozenBalance:24.99,totalDeposited:450,totalWithdrawn:280,totalSales:34,totalPurchases:12,rating:4.9,reviewCount:28,isVerified:true,isAdmin:false,createdAt:'2024-03-01' }
const MOCK_TXS  = [
  { id:1,type:'deposit',  title:'Пополнение через CryptoBot', amount:50,   date:'09.03.2026',status:'✓ ok' },
  { id:2,type:'sale',     title:'GTA V Shark Card $1M',        amount:8.99, date:'08.03.2026',status:'✓ ok' },
  { id:3,type:'purchase', title:'CS2 Global Elite Account',    amount:18.99,date:'07.03.2026',status:'✓ ok' },
  { id:4,type:'withdraw', title:'Вывод на CryptoBot (USDT)',   amount:30,   date:'06.03.2026',status:'✓ ok' },
  { id:5,type:'sale',     title:'Dota 2 Immortal Items',       amount:6.50, date:'05.03.2026',status:'✓ ok' },
  { id:6,type:'deposit',  title:'Пополнение через Lava (СБП)', amount:100,  date:'03.03.2026',status:'✓ ok' },
]
const MOCK_DEALS = [
  { id:1,icon:'🔫',title:'CS2 Global Elite Account',  role:'buyer', partner:'NightSeller',price:18.99,date:'07.03.2026',status:'completed' },
  { id:2,icon:'🦈',title:'GTA V Shark Card $1M',      role:'seller',partner:'GtaBuyer22', price:8.99, date:'08.03.2026',status:'completed' },
  { id:3,icon:'⚔️',title:'Dota 2 Calibration Boost', role:'buyer', partner:'DotaPro',    price:24.99,date:'09.03.2026',status:'active' },
  { id:4,icon:'🎁',title:'Steam Gift Card $50',       role:'seller',partner:'SteamUser',  price:49.50,date:'09.03.2026',status:'active' },
]
const TABS = [
  { id:'overview', icon:'📊',label:'ОБЗОР' },
  { id:'wallet',   icon:'💳',label:'КОШЕЛЁК' },
  { id:'deals',    icon:'🤝',label:'СДЕЛКИ' },
  { id:'listings', icon:'📦',label:'МОИ ТОВАРЫ' },
  { id:'reviews',  icon:'⭐',label:'ОТЗЫВЫ' },
  { id:'settings', icon:'⚙️',label:'НАСТРОЙКИ' },
]

// ── Deposit Modal ────────────────────────────────────────────────
function DepositModal({ onClose }) {
  const [method,setMethod]=useState('crypto')
  const [amount,setAmount]=useState('')
  const [loading,setLoading]=useState(false)
  const submit=async()=>{ if(!amount||parseFloat(amount)<1)return; setLoading(true); await new Promise(r=>setTimeout(r,1200)); setLoading(false); onClose() }
  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="anim-up" style={{ width:'100%',maxWidth:420,borderRadius:24,background:'linear-gradient(145deg,rgba(10,14,22,0.99),rgba(6,8,17,0.99))',border:'1px solid rgba(0,245,255,0.2)',boxShadow:'0 30px 80px rgba(0,0,0,0.7)',overflow:'hidden' }}>
        <div style={{ height:2,background:'linear-gradient(90deg,transparent,#00f5ff,transparent)' }}/>
        <div style={{ padding:28 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
            <h3 style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:700,letterSpacing:'0.06em',color:'var(--cyan)' }}>💳 ПОПОЛНИТЬ БАЛАНС</h3>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,width:34,height:34,cursor:'pointer',color:'var(--t2)',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
          </div>
          <div style={{ display:'flex',gap:8,marginBottom:20 }}>
            {[{id:'crypto',icon:'🤖',label:'CryptoBot',sub:'USDT/TON/BTC'},{id:'lava',icon:'🔥',label:'Lava',sub:'Карта РФ / СБП'}].map(m=>(
              <button key={m.id} onClick={()=>setMethod(m.id)} style={{ flex:1,padding:'14px 10px',borderRadius:14,cursor:'pointer',textAlign:'center',background:method===m.id?'rgba(0,245,255,0.1)':'rgba(255,255,255,0.03)',border:`1.5px solid ${method===m.id?'rgba(0,245,255,0.4)':'rgba(255,255,255,0.08)'}`,transition:'all 0.2s' }}>
                <div style={{ fontSize:24,marginBottom:4 }}>{m.icon}</div>
                <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:13,color:method===m.id?'var(--cyan)':'var(--t2)' }}>{m.label}</div>
                <div style={{ fontSize:10,color:'var(--t3)',fontFamily:'var(--font-mono)' }}>{m.sub}</div>
              </button>
            ))}
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontFamily:'var(--font-display)',fontSize:11,color:'var(--t3)',letterSpacing:'0.1em',marginBottom:8 }}>СУММА (USD)</div>
            <input className="inp" type="number" placeholder="10.00" value={amount} onChange={e=>setAmount(e.target.value)} style={{ fontSize:18,fontFamily:'var(--font-display)',fontWeight:700 }}/>
          </div>
          <div style={{ display:'flex',gap:8,marginBottom:20 }}>
            {[5,10,20,50].map(v=>(
              <button key={v} onClick={()=>setAmount(String(v))} style={{ flex:1,padding:'7px',borderRadius:8,cursor:'pointer',background:amount==v?'rgba(0,245,255,0.12)':'rgba(255,255,255,0.04)',border:`1px solid ${amount==v?'rgba(0,245,255,0.35)':'rgba(255,255,255,0.08)'}`,color:amount==v?'var(--cyan)':'var(--t3)',fontFamily:'var(--font-display)',fontSize:12,fontWeight:700 }}>${v}</button>
            ))}
          </div>
          <button className="btn btn-cyan btn-full" onClick={submit} disabled={!amount||loading}>
            {loading?<span style={{ display:'inline-block',width:16,height:16,borderRadius:'50%',border:'2px solid transparent',borderTopColor:'#000',animation:'spin 0.8s linear infinite' }}/>:`⚡ ПОПОЛНИТЬ ${amount?`$${parseFloat(amount||0).toFixed(2)}`:''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Withdraw Modal ────────────────────────────────────────────────
function WithdrawModal({ balance, onClose }) {
  const [amount,setAmount]=useState('')
  const [loading,setLoading]=useState(false)
  const max = balance - 0.5
  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="anim-up" style={{ width:'100%',maxWidth:400,borderRadius:24,background:'linear-gradient(145deg,rgba(10,14,22,0.99),rgba(6,8,17,0.99))',border:'1px solid rgba(255,0,128,0.2)',overflow:'hidden' }}>
        <div style={{ height:2,background:'linear-gradient(90deg,transparent,#ff0080,transparent)' }}/>
        <div style={{ padding:28 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
            <h3 style={{ fontFamily:'var(--font-display)',fontSize:18,fontWeight:700,letterSpacing:'0.06em',color:'var(--pink)' }}>⬆ ВЫВОД СРЕДСТВ</h3>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,width:34,height:34,cursor:'pointer',color:'var(--t2)',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
          </div>
          <div style={{ padding:'12px 16px',borderRadius:12,background:'rgba(255,0,128,0.06)',border:'1px solid rgba(255,0,128,0.15)',marginBottom:20,fontFamily:'var(--font-mono)',fontSize:12,color:'var(--t2)' }}>
            Доступно: <span style={{ color:'var(--pink)',fontWeight:700 }}>${max.toFixed(2)}</span> · Вывод через CryptoBot
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:'var(--font-display)',fontSize:11,color:'var(--t3)',letterSpacing:'0.1em',marginBottom:8 }}>СУММА (USD)</div>
            <input className="inp inp-pink" type="number" placeholder="Мин. $1" value={amount} onChange={e=>setAmount(e.target.value)} style={{ fontSize:18,fontFamily:'var(--font-display)',fontWeight:700 }}/>
          </div>
          <button className="btn btn-pink btn-full" onClick={async()=>{ setLoading(true); await new Promise(r=>setTimeout(r,1200)); setLoading(false); onClose() }} disabled={!amount||parseFloat(amount)<1||parseFloat(amount)>max||loading}>
            {loading?<span style={{ display:'inline-block',width:16,height:16,borderRadius:'50%',border:'2px solid transparent',borderTopColor:'#fff',animation:'spin 0.8s linear infinite' }}/>:`⬆ ВЫВЕСТИ`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────────
export default function ProfilePage({ navigate, user: propUser }) {
  const [tab,setTab]         = useState('overview')
  const [user,setUser]       = useState(propUser||MOCK_USER)
  const [showDep,setShowDep] = useState(false)
  const [showWd,setShowWd]   = useState(false)
  const [form,setForm]       = useState({ firstName:'',email:'',password:'',password2:'' })
  const [saveMsg,setSaveMsg] = useState('')
  const [notifs,setNotifs]   = useState([true,true,true,false])

  useEffect(() => { if(propUser) setUser(propUser) }, [propUser])

  return (
    <div style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>

      {/* NAV */}
      <div style={{ position:'sticky',top:0,zIndex:50,background:'rgba(4,6,8,0.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'12px 20px' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',gap:12 }}>
          <button onClick={()=>navigate?.('/')} style={{ background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-display)',fontWeight:700,fontSize:18,letterSpacing:'0.08em' }}>
            <span style={{ color:'var(--cyan)',textShadow:'0 0 15px rgba(0,245,255,0.5)' }}>NX</span><span style={{ color:'rgba(255,255,255,0.25)' }}>/</span>
          </button>
          <button onClick={()=>navigate?.('/catalog')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--t3)',fontFamily:'var(--font-display)',fontSize:12,letterSpacing:'0.08em' }}>КАТАЛОГ</button>
          <span style={{ color:'rgba(255,255,255,0.15)' }}>/</span>
          <span style={{ fontFamily:'var(--font-display)',fontSize:12,color:'var(--cyan)',letterSpacing:'0.08em' }}>ПРОФИЛЬ</span>
          <div style={{ flex:1 }}/>
          <button className="btn btn-green btn-sm" onClick={()=>navigate?.('/sell')}>+ ПРОДАТЬ</button>
        </div>
      </div>

      <div style={{ maxWidth:1100,margin:'0 auto',padding:'24px 20px' }}>

        {/* HEADER CARD */}
        <div className="anim-up" style={{ borderRadius:24,overflow:'hidden',marginBottom:24,background:'linear-gradient(135deg,rgba(10,14,22,0.97),rgba(6,8,17,0.98))',border:'1px solid rgba(255,255,255,0.07)' }}>
          {/* Banner */}
          <div style={{ height:110,position:'relative',overflow:'hidden',background:'#040608' }}>
            <div style={{ position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(0,245,255,0.08),rgba(255,0,128,0.06),rgba(0,255,136,0.04))' }}/>
            <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(0,245,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.04) 1px,transparent 1px)',backgroundSize:'28px 28px' }}/>
            <div style={{ position:'absolute',top:-20,left:'20%',width:120,height:120,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,245,255,0.15),transparent)' }}/>
            <div style={{ position:'absolute',top:-30,right:'15%',width:160,height:160,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,0,128,0.1),transparent)' }}/>
          </div>

          <div style={{ padding:'0 24px 24px',display:'flex',gap:20,alignItems:'flex-end',flexWrap:'wrap',marginTop:-28 }}>
            {/* Avatar */}
            <div style={{ position:'relative',flexShrink:0 }}>
              <div style={{ width:70,height:70,borderRadius:20,background:'linear-gradient(135deg,#00f5ff,#ff0080)',padding:2 }}>
                <div style={{ width:'100%',height:'100%',borderRadius:18,background:'#080c12',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontSize:26,fontWeight:700,color:'var(--cyan)' }}>
                  {user.firstName?.[0]||'U'}
                </div>
              </div>
              {user.isVerified && <div style={{ position:'absolute',bottom:-4,right:-4,width:22,height:22,borderRadius:'50%',background:'linear-gradient(135deg,#00cc6a,#00ff88)',border:'2px solid #040608',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10 }}>✓</div>}
            </div>

            {/* Info */}
            <div style={{ flex:1,minWidth:180 }}>
              <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:4 }}>
                <h1 style={{ fontFamily:'var(--font-display)',fontSize:20,fontWeight:700 }}>{user.firstName}</h1>
                <span style={{ fontFamily:'var(--font-mono)',fontSize:12,color:'var(--t3)' }}>@{user.username}</span>
                {user.isAdmin && <span style={{ padding:'2px 8px',borderRadius:8,fontSize:10,background:'rgba(255,0,128,0.15)',color:'var(--pink)',border:'1px solid rgba(255,0,128,0.3)',fontFamily:'var(--font-display)',fontWeight:700 }}>ADMIN</span>}
              </div>
              <div style={{ display:'flex',gap:16,flexWrap:'wrap' }}>
                <span style={{ fontFamily:'var(--font-mono)',fontSize:11,color:'var(--t3)' }}>📅 С {new Date(user.createdAt).toLocaleDateString('ru')}</span>
                <span style={{ fontFamily:'var(--font-mono)',fontSize:11,color:'#ffe500' }}>★ {user.rating} ({user.reviewCount} отз.)</span>
                <span style={{ fontFamily:'var(--font-mono)',fontSize:11,color:'#2ca5e0' }}>✈️ Telegram</span>
              </div>
            </div>

            {/* Balance */}
            <div style={{ padding:'14px 20px',borderRadius:16,background:'rgba(0,245,255,0.06)',border:'1px solid rgba(0,245,255,0.15)',textAlign:'right',flexShrink:0 }}>
              <div style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--t3)',letterSpacing:'0.12em',marginBottom:4 }}>БАЛАНС</div>
              <div style={{ fontFamily:'var(--font-display)',fontSize:28,fontWeight:700,color:'var(--cyan)',textShadow:'0 0 15px rgba(0,245,255,0.5)',lineHeight:1 }}>${user.balance.toFixed(2)}</div>
              {user.frozenBalance>0 && <div style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'#ffe500',marginTop:4 }}>🔒 ${user.frozenBalance.toFixed(2)} заморожено</div>}
              <div style={{ display:'flex',gap:8,marginTop:12 }}>
                <button className="btn btn-green btn-sm" onClick={()=>setShowDep(true)}>⬇ ПОПОЛНИТЬ</button>
                <button className="btn btn-pink btn-sm"  onClick={()=>setShowWd(true)}>⬆ ВЫВОД</button>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:'flex',gap:2,overflowX:'auto',scrollbarWidth:'none',marginBottom:24,background:'rgba(255,255,255,0.02)',borderRadius:16,padding:4 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:'1 1 auto',padding:'10px 14px',borderRadius:12,cursor:'pointer',background:tab===t.id?'rgba(0,245,255,0.1)':'transparent',border:tab===t.id?'1px solid rgba(0,245,255,0.25)':'1px solid transparent',color:tab===t.id?'var(--cyan)':'var(--t3)',fontFamily:'var(--font-display)',fontSize:11,fontWeight:700,letterSpacing:'0.08em',transition:'all 0.2s',whiteSpace:'nowrap' }}>
              <span style={{ marginRight:5 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab==='overview' && (
          <div className="anim-in">
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12,marginBottom:24 }}>
              {[
                { icon:'💰',label:'ПРОДАЖ',    value:user.totalSales,              color:'#00ff88',delay:0 },
                { icon:'🛒',label:'ПОКУПОК',   value:user.totalPurchases,           color:'#00f5ff',delay:60 },
                { icon:'⬇',label:'ПОПОЛНЕНО', value:`$${user.totalDeposited}`,      color:'#8b5cf6',delay:120 },
                { icon:'⬆',label:'ВЫВЕДЕНО',  value:`$${user.totalWithdrawn}`,      color:'#ff6b00',delay:180 },
              ].map(s=>(
                <div key={s.label} className="anim-up" style={{ animationDelay:`${s.delay}ms`,padding:'16px',borderRadius:16,background:`linear-gradient(135deg,${s.color}08,rgba(8,12,18,0.9))`,border:`1px solid ${s.color}20`,transition:'all 0.3s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${s.color}45`;e.currentTarget.style.boxShadow=`0 8px 30px ${s.color}12`}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=`${s.color}20`;e.currentTarget.style.boxShadow='none'}}
                >
                  <div style={{ fontSize:20,marginBottom:8 }}>{s.icon}</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:22,fontWeight:700,color:s.color,textShadow:`0 0 10px ${s.color}50`,lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:10,color:'var(--t3)',letterSpacing:'0.1em',marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16,marginBottom:24 }}>
              {/* Trust score */}
              <div className="anim-up" style={{ animationDelay:'200ms',padding:'20px',borderRadius:20,background:'linear-gradient(135deg,rgba(0,245,255,0.05),rgba(8,12,18,0.9))',border:'1px solid rgba(0,245,255,0.12)' }}>
                <div style={{ fontFamily:'var(--font-display)',fontSize:11,color:'var(--t3)',letterSpacing:'0.12em',marginBottom:16 }}>ДОВЕРИЕ АККАУНТА</div>
                <div style={{ display:'flex',alignItems:'center',gap:20 }}>
                  <RingProgress value={Math.round((user.rating/5)*100)} max={100} size={80} color="#00f5ff" label={`${Math.round((user.rating/5)*100)}%`} sublabel="TRUST"/>
                  <div>
                    {[['Telegram привязан',!!user.telegramId],['Email указан',!!user.email],['Первая продажа',user.totalSales>0],['Верифицирован',user.isVerified]].map(([l,ok])=>(
                      <div key={l} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
                        <span style={{ fontSize:12,color:ok?'#00ff88':'#ff0080' }}>{ok?'✓':'✗'}</span>
                        <span style={{ fontSize:12,color:ok?'var(--t2)':'var(--t3)',fontFamily:'var(--font-display)',letterSpacing:'0.04em' }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="anim-up" style={{ animationDelay:'260ms',padding:'20px',borderRadius:20,background:'linear-gradient(135deg,rgba(255,229,0,0.05),rgba(8,12,18,0.9))',border:'1px solid rgba(255,229,0,0.12)' }}>
                <div style={{ fontFamily:'var(--font-display)',fontSize:11,color:'var(--t3)',letterSpacing:'0.12em',marginBottom:16 }}>РЕЙТИНГ ПРОДАВЦА</div>
                <div style={{ display:'flex',alignItems:'center',gap:20 }}>
                  <RingProgress value={user.rating} max={5} size={80} color="#ffe500" label={user.rating} sublabel="★ STARS"/>
                  <div style={{ flex:1 }}>
                    {[5,4,3].map(s=>(
                      <div key={s} style={{ display:'flex',alignItems:'center',gap:6,marginBottom:5 }}>
                        <span style={{ fontSize:10,color:'#ffe500',width:14 }}>{s}★</span>
                        <div style={{ flex:1,height:4,borderRadius:2,background:'rgba(255,255,255,0.08)',overflow:'hidden' }}>
                          <div style={{ height:'100%',width:`${s===5?75:s===4?18:7}%`,background:'#ffe500',borderRadius:2,boxShadow:'0 0 6px rgba(255,229,0,0.4)' }}/>
                        </div>
                        <span style={{ fontSize:10,color:'var(--t3)',fontFamily:'var(--font-mono)',width:20 }}>{s===5?21:s===4?5:2}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="anim-up" style={{ animationDelay:'300ms' }}>
              <div className="section-title" style={{ marginBottom:14 }}>ПОСЛЕДНИЕ ОПЕРАЦИИ</div>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {MOCK_TXS.slice(0,4).map(tx=><TxRow key={tx.id} tx={tx}/>)}
              </div>
              <button onClick={()=>setTab('wallet')} style={{ width:'100%',marginTop:10,padding:'10px',background:'none',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,color:'var(--t3)',fontFamily:'var(--font-display)',fontSize:11,letterSpacing:'0.08em',cursor:'pointer',transition:'color 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--cyan)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}
              >ВСЕ ОПЕРАЦИИ →</button>
            </div>
          </div>
        )}

        {/* WALLET */}
        {tab==='wallet' && (
          <div className="anim-in">
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:20 }}>
              {[
                { label:'ДОСТУПНО',      value:`$${user.balance.toFixed(2)}`,      sub:`≈${(user.balance*90).toFixed(0)} ₽`,    color:'#00f5ff',icon:'💳' },
                { label:'ЗАМОРОЖЕНО',    value:`$${user.frozenBalance.toFixed(2)}`, sub:'В активных сделках',                    color:'#ffe500',icon:'🔒' },
                { label:'ВСЕГО ВНЕСЕНО', value:`$${user.totalDeposited}`,           sub:'За всё время',                          color:'#00ff88',icon:'⬇' },
                { label:'ВСЕГО ВЫВЕДЕНО',value:`$${user.totalWithdrawn}`,           sub:'За всё время',                          color:'#ff0080',icon:'⬆' },
              ].map((c,i)=>(
                <div key={i} className="anim-up" style={{ animationDelay:`${i*60}ms`,padding:'18px',borderRadius:18,background:`linear-gradient(135deg,${c.color}08,rgba(8,12,18,0.95))`,border:`1px solid ${c.color}20` }}>
                  <div style={{ fontSize:22,marginBottom:8 }}>{c.icon}</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:22,fontWeight:700,color:c.color,textShadow:`0 0 10px ${c.color}50` }}>{c.value}</div>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:10,color:'var(--t3)',letterSpacing:'0.1em',marginTop:4 }}>{c.label}</div>
                  <div style={{ fontSize:10,color:'var(--t4)',fontFamily:'var(--font-mono)',marginTop:2 }}>{c.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex',gap:10,marginBottom:24 }}>
              <button className="btn btn-green" onClick={()=>setShowDep(true)} style={{ flex:1 }}>⬇ ПОПОЛНИТЬ</button>
              <button className="btn btn-pink"  onClick={()=>setShowWd(true)}  style={{ flex:1 }}>⬆ ВЫВЕСТИ</button>
            </div>
            <div className="section-title" style={{ marginBottom:14 }}>ИСТОРИЯ ОПЕРАЦИЙ</div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {MOCK_TXS.map(tx=><TxRow key={tx.id} tx={tx}/>)}
            </div>
          </div>
        )}

        {/* DEALS */}
        {tab==='deals' && (
          <div className="anim-in">
            <div style={{ display:'flex',gap:10,marginBottom:20,flexWrap:'wrap' }}>
              {[['ВСЕ СДЕЛКИ',MOCK_DEALS.length,'var(--cyan)'],['АКТИВНЫЕ',MOCK_DEALS.filter(d=>d.status==='active').length,'#ffe500'],['ЗАВЕРШЁННЫЕ',MOCK_DEALS.filter(d=>d.status==='completed').length,'#00ff88']].map(([l,v,c])=>(
                <div key={l} style={{ padding:'10px 18px',borderRadius:12,background:`${c}10`,border:`1px solid ${c}25` }}>
                  <span style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:18,color:c }}>{v}</span>
                  <span style={{ fontFamily:'var(--font-display)',fontSize:11,color:'var(--t3)',letterSpacing:'0.08em',marginLeft:8 }}>{l}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {MOCK_DEALS.map(d=><DealRow key={d.id} deal={d}/>)}
            </div>
          </div>
        )}

        {/* LISTINGS */}
        {tab==='listings' && (
          <div className="anim-in" style={{ textAlign:'center',padding:'60px 20px' }}>
            <div style={{ fontSize:64,marginBottom:16 }}>📦</div>
            <div style={{ fontFamily:'var(--font-display)',fontSize:16,color:'var(--t2)',letterSpacing:'0.1em',marginBottom:8 }}>НЕТ АКТИВНЫХ ОБЪЯВЛЕНИЙ</div>
            <p style={{ color:'var(--t3)',fontSize:13,marginBottom:24 }}>Разместите первый товар и начните зарабатывать</p>
            <button className="btn btn-cyan" onClick={()=>navigate?.('/sell')}>+ РАЗМЕСТИТЬ ТОВАР</button>
          </div>
        )}

        {/* REVIEWS */}
        {tab==='reviews' && (
          <div className="anim-in">
            {[
              { id:1,from:'GtaBuyer22', text:'Быстрая доставка, товар соответствует описанию. Рекомендую!',           rating:5,date:'08.03.2026' },
              { id:2,from:'SteamUser99',text:'Всё отлично, продавец на связи, быстро ответил на вопросы.',            rating:5,date:'05.03.2026' },
              { id:3,from:'DotaFan21',  text:'Хорошо, но немного долго ждал ответа.',                                rating:4,date:'01.03.2026' },
            ].map((r,i)=>(
              <div key={r.id} className="anim-up" style={{ animationDelay:`${i*80}ms`,padding:'16px',borderRadius:14,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',marginBottom:10 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                  <span style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:13 }}>{r.from}</span>
                  <div style={{ display:'flex',gap:2 }}>
                    {Array.from({length:5}).map((_,j)=><span key={j} style={{ color:j<r.rating?'#ffe500':'rgba(255,255,255,0.15)',fontSize:12 }}>★</span>)}
                  </div>
                </div>
                <p style={{ fontSize:13,color:'var(--t2)',lineHeight:1.6,marginBottom:6 }}>"{r.text}"</p>
                <span style={{ fontFamily:'var(--font-mono)',fontSize:10,color:'var(--t4)' }}>{r.date}</span>
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS */}
        {tab==='settings' && (
          <div className="anim-in" style={{ maxWidth:500 }}>
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              {[
                { key:'firstName',label:'ИМЯ',          placeholder:user.firstName,       type:'text' },
                { key:'email',    label:'EMAIL',         placeholder:user.email||'Не указан',type:'email' },
                { key:'password', label:'НОВЫЙ ПАРОЛЬ',  placeholder:'Оставьте пустым',    type:'password' },
                { key:'password2',label:'ПОВТОР ПАРОЛЯ', placeholder:'Повторите пароль',   type:'password' },
              ].map(f=>(
                <div key={f.key}>
                  <div style={{ fontFamily:'var(--font-display)',fontSize:11,color:'var(--t3)',letterSpacing:'0.1em',marginBottom:8 }}>{f.label}</div>
                  <input className="inp" type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}/>
                </div>
              ))}

              {saveMsg && <div style={{ padding:'10px',borderRadius:10,background:'rgba(0,255,136,0.08)',border:'1px solid rgba(0,255,136,0.2)',color:'var(--green)',fontFamily:'var(--font-display)',fontSize:13,textAlign:'center' }}>{saveMsg}</div>}
              <button className="btn btn-cyan" onClick={()=>{ setSaveMsg('Сохранено ✓'); setTimeout(()=>setSaveMsg(''),2000) }}>💾 СОХРАНИТЬ</button>

              <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:16,marginTop:4 }}>
                <div style={{ fontFamily:'var(--font-display)',fontSize:11,color:'var(--t3)',letterSpacing:'0.1em',marginBottom:12 }}>TELEGRAM УВЕДОМЛЕНИЯ</div>
                {['Новая сделка','Сообщение от покупателя','Деньги получены','Победитель в споре'].map((n,i)=>(
                  <label key={n} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer' }} onClick={()=>setNotifs(p=>p.map((v,j)=>j===i?!v:v))}>
                    <span style={{ fontSize:13,color:'var(--t2)' }}>{n}</span>
                    <div style={{ width:38,height:22,borderRadius:11,background:notifs[i]?'rgba(0,245,255,0.2)':'rgba(255,255,255,0.06)',border:`1px solid ${notifs[i]?'rgba(0,245,255,0.35)':'rgba(255,255,255,0.1)'}`,position:'relative',transition:'all 0.2s' }}>
                      <div style={{ position:'absolute',top:3,left:notifs[i]?19:3,width:14,height:14,borderRadius:'50%',background:notifs[i]?'var(--cyan)':'rgba(255,255,255,0.25)',boxShadow:notifs[i]?'0 0 6px rgba(0,245,255,0.5)':'none',transition:'all 0.2s' }}/>
                    </div>
                  </label>
                ))}
              </div>

              <button style={{ padding:'11px',background:'rgba(255,0,128,0.06)',border:'1px solid rgba(255,0,128,0.15)',borderRadius:12,color:'#ff6b9d',fontFamily:'var(--font-display)',fontSize:12,letterSpacing:'0.08em',cursor:'pointer',transition:'background 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,0,128,0.12)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,0,128,0.06)'}
                onClick={()=>{ localStorage.removeItem('token'); navigate?.('/') }}
              >🚪 ВЫЙТИ ИЗ АККАУНТА</button>
            </div>
          </div>
        )}
      </div>

      {showDep && <DepositModal onClose={()=>setShowDep(false)}/>}
      {showWd  && <WithdrawModal balance={user.balance} onClose={()=>setShowWd(false)}/>}
    </div>
  )
}
