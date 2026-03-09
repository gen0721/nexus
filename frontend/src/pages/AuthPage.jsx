import React, { useState, useEffect, useRef } from 'react'

const BOT_USERNAME = 'my_cheats_bot' // замени на своего бота

// ── Typing animation ────────────────────────────────────────────
function TypeWriter({ text, speed=60, delay=0 }) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    let i = 0
    const t = setTimeout(() => {
      const id = setInterval(() => {
        setShown(text.slice(0, ++i))
        if (i >= text.length) clearInterval(id)
      }, speed)
      return () => clearInterval(id)
    }, delay)
    return () => clearTimeout(t)
  }, [text, speed, delay])
  return <span>{shown}<span style={{ animation:'blink 1s infinite', opacity: shown.length < text.length ? 1 : 0 }}>|</span></span>
}

// ── Code digit input ─────────────────────────────────────────────
function CodeInput({ value, onChange }) {
  const refs = Array.from({ length:6 }, () => useRef(null))

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (!value[i] && i > 0) refs[i-1].current?.focus()
    }
  }

  const handleChange = (i, v) => {
    if (!v.match(/^\d?$/)) return
    const arr = value.split('')
    arr[i] = v
    onChange(arr.join('').padEnd(6,' ').slice(0,6))
    if (v && i < 5) refs[i+1].current?.focus()
  }

  const handlePaste = e => {
    const txt = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    onChange(txt.padEnd(6,' ').slice(0,6))
    refs[Math.min(txt.length, 5)].current?.focus()
    e.preventDefault()
  }

  return (
    <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
      {Array.from({length:6}).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          maxLength={1}
          value={value[i]?.trim() || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width:48, height:58, textAlign:'center',
            background: value[i]?.trim() ? 'rgba(0,245,255,0.08)' : 'rgba(255,255,255,0.04)',
            border: `2px solid ${value[i]?.trim() ? 'rgba(0,245,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius:12,
            color:'#fff', fontFamily:'var(--font-display)', fontSize:24, fontWeight:700,
            outline:'none',
            transition:'all 0.2s',
            boxShadow: value[i]?.trim() ? '0 0 15px rgba(0,245,255,0.2)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ── Step indicator ───────────────────────────────────────────────
function StepDots({ step, total=3 }) {
  return (
    <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:32 }}>
      {Array.from({length:total}).map((_, i) => (
        <div key={i} style={{
          width: i === step ? 24 : 8, height:8, borderRadius:4,
          background: i < step ? 'var(--green)' : i === step ? 'var(--cyan)' : 'rgba(255,255,255,0.1)',
          boxShadow: i === step ? '0 0 10px rgba(0,245,255,0.5)' : 'none',
          transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}/>
      ))}
    </div>
  )
}

// ── MAIN ────────────────────────────────────────────────────────
export default function AuthPage({ navigate, onAuth }) {
  const [step, setStep]       = useState(0) // 0=start, 1=enter code, 2=fill profile
  const [code, setCode]       = useState('      ')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ username:'', email:'', password:'', password2:'' })
  const [showPass, setShowPass] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [mode, setMode]       = useState('register') // 'register' | 'login'

  const codeComplete = code.trim().length === 6 && !code.includes(' ')

  const openBot = () => {
    window.open(`https://t.me/${BOT_USERNAME}?start=auth`, '_blank')
    setTimeout(() => setStep(1), 800)
  }

  const verifyCode = async () => {
    if (!codeComplete) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/verify-code', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Неверный код')
      if (data.exists) {
        // Existing user — logged in
        localStorage.setItem('token', data.token)
        onAuth?.(data.user)
        navigate?.('/')
      } else {
        setStep(2)
      }
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const submitProfile = async () => {
    if (!form.username.trim()) return setError('Введите имя пользователя')
    if (form.password.length < 6) return setError('Пароль минимум 6 символов')
    if (form.password !== form.password2) return setError('Пароли не совпадают')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ code: code.trim(), ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка регистрации')
      localStorage.setItem('token', data.token)
      onAuth?.(data.user)
      navigate?.('/')
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const submitLogin = async () => {
    if (!codeComplete) return setError('Введите код из бота')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка входа')
      localStorage.setItem('token', data.token)
      onAuth?.(data.user)
      navigate?.('/')
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px', position:'relative', zIndex:1 }}>

      {/* Background glow */}
      <div style={{ position:'fixed', top:'30%', left:'50%', transform:'translate(-50%,-50%)', width:500, height:400, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(0,245,255,0.06) 0%, rgba(255,0,128,0.03) 50%, transparent 70%)', pointerEvents:'none' }}/>

      {/* Logo */}
      <div className="anim-up" style={{ marginBottom:40, textAlign:'center' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, letterSpacing:'0.1em' }}>
          <span style={{ color:'var(--cyan)', textShadow:'0 0 20px rgba(0,245,255,0.5)' }}>NEXUS</span>
          <span style={{ color:'var(--t3)' }}> MARKET</span>
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--t4)', letterSpacing:'0.2em', marginTop:4 }}>
          SECURE DIGITAL MARKETPLACE
        </div>
      </div>

      {/* Card */}
      <div className="anim-up" style={{
        animationDelay:'100ms',
        width:'100%', maxWidth:420,
        borderRadius:24, padding:'32px 28px',
        background:'linear-gradient(135deg, rgba(8,12,18,0.97), rgba(13,20,32,0.95))',
        border:'1px solid rgba(255,255,255,0.08)',
        boxShadow:'0 20px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,245,255,0.04)',
        position:'relative', overflow:'hidden',
      }}>
        {/* Top accent */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, var(--cyan), var(--pink), var(--green), transparent)' }}/>

        {/* Mode toggle */}
        {step === 0 && (
          <div style={{ display:'flex', gap:4, padding:'4px', background:'rgba(255,255,255,0.04)', borderRadius:12, marginBottom:28 }}>
            {[['register','РЕГИСТРАЦИЯ'],['login','ВОЙТИ']].map(([m,l]) => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                flex:1, padding:'9px', borderRadius:9, cursor:'pointer',
                background: mode===m ? 'rgba(0,245,255,0.12)' : 'transparent',
                border: mode===m ? '1px solid rgba(0,245,255,0.25)' : '1px solid transparent',
                color: mode===m ? 'var(--cyan)' : 'var(--t3)',
                fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, letterSpacing:'0.08em',
                transition:'all 0.2s',
              }}>{l}</button>
            ))}
          </div>
        )}

        <StepDots step={step}/>

        {/* ── STEP 0: Open bot ────────────────────────────────── */}
        {step === 0 && (
          <div className="anim-in">
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontSize:48, marginBottom:12, filter:'drop-shadow(0 0 15px rgba(0,245,255,0.4))' }}>🤖</div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, letterSpacing:'0.04em', marginBottom:8 }}>
                {mode === 'register' ? 'РЕГИСТРАЦИЯ' : 'ВХОД'} ЧЕРЕЗ TELEGRAM
              </h2>
              <p style={{ fontSize:13, color:'var(--t3)', lineHeight:1.7 }}>
                {mode === 'register'
                  ? 'Перейди в нашего Telegram бота — он пришлёт тебе 6-значный код для регистрации'
                  : 'Перейди в бота — он пришлёт одноразовый код для входа в аккаунт'}
              </p>
            </div>

            {/* Bot card */}
            <div style={{
              borderRadius:16, padding:'16px 20px', marginBottom:20,
              background:'rgba(0,245,255,0.05)', border:'1px solid rgba(0,245,255,0.15)',
              display:'flex', alignItems:'center', gap:16,
            }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#0088cc,#005fa3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, boxShadow:'0 0 15px rgba(0,136,204,0.4)' }}>
                ✈️
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, marginBottom:2 }}>@{BOT_USERNAME}</div>
                <div style={{ fontSize:12, color:'var(--t3)' }}>Официальный бот NEXUS MARKET</div>
              </div>
            </div>

            <button className="btn btn-cyan btn-full" onClick={openBot} style={{ marginBottom:12, fontSize:15 }}>
              <span>🚀</span> ОТКРЫТЬ TELEGRAM BOT
            </button>

            <button onClick={() => setStep(1)} style={{
              width:'100%', padding:'11px', background:'none', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:12, color:'var(--t3)', fontFamily:'var(--font-display)', fontSize:12,
              letterSpacing:'0.08em', cursor:'pointer', transition:'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color='var(--t2)'}
            onMouseLeave={e => e.currentTarget.style.color='var(--t3)'}
            >
              УЖЕ ЕСТЬ КОД →
            </button>
          </div>
        )}

        {/* ── STEP 1: Enter code ──────────────────────────────── */}
        {step === 1 && (
          <div className="anim-in">
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <div style={{ fontSize:42, marginBottom:12 }}>🔐</div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, letterSpacing:'0.04em', marginBottom:8 }}>
                ВВЕДИ КОД ИЗ БОТА
              </h2>
              <p style={{ fontSize:13, color:'var(--t3)', lineHeight:1.7 }}>
                Telegram бот отправил тебе 6-значный код.<br/>
                Введи его ниже:
              </p>
            </div>

            <div style={{ marginBottom:24 }}>
              <CodeInput value={code} onChange={setCode}/>
            </div>

            {error && (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(255,0,128,0.08)', border:'1px solid rgba(255,0,128,0.2)', color:'#ff6b9d', fontSize:13, marginBottom:16, textAlign:'center' }}>
                {error}
              </div>
            )}

            <button
              className={`btn btn-full ${codeComplete ? 'btn-cyan' : 'btn-ghost'}`}
              onClick={mode === 'login' ? submitLogin : verifyCode}
              disabled={!codeComplete || loading}
              style={{ marginBottom:12 }}
            >
              {loading ? (
                <span style={{ display:'inline-block', width:16, height:16, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'currentColor', animation:'spin 0.8s linear infinite' }}/>
              ) : '✓ ПОДТВЕРДИТЬ КОД'}
            </button>

            <button onClick={() => { setStep(0); setCode('      '); setError('') }} style={{
              width:'100%', padding:'10px', background:'none', border:'none',
              color:'var(--t3)', fontFamily:'var(--font-display)', fontSize:11,
              letterSpacing:'0.08em', cursor:'pointer',
            }}>
              ← НАЗАД
            </button>
          </div>
        )}

        {/* ── STEP 2: Fill profile ────────────────────────────── */}
        {step === 2 && (
          <div className="anim-in">
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontSize:42, marginBottom:12 }}>✨</div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, letterSpacing:'0.04em', marginBottom:8 }}>
                СОЗДАЙ ПРОФИЛЬ
              </h2>
              <p style={{ fontSize:13, color:'var(--t3)' }}>
                Последний шаг — заполни данные аккаунта
              </p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.1em', marginBottom:6 }}>ИМЯ ПОЛЬЗОВАТЕЛЯ</div>
                <input className="inp" placeholder="nexus_user" value={form.username}
                  onChange={e => setForm(f=>({...f, username:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'')}))}/>
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.1em', marginBottom:6 }}>EMAIL (необязательно)</div>
                <input className="inp" type="email" placeholder="user@email.com" value={form.email}
                  onChange={e => setForm(f=>({...f, email:e.target.value}))}/>
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.1em', marginBottom:6 }}>ПАРОЛЬ</div>
                <div style={{ position:'relative' }}>
                  <input className="inp" type={showPass?'text':'password'} placeholder="Минимум 6 символов" value={form.password}
                    onChange={e => setForm(f=>({...f, password:e.target.value}))} style={{ paddingRight:46 }}/>
                  <button onClick={() => setShowPass(!showPass)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--t3)', fontSize:16 }}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'var(--t3)', letterSpacing:'0.1em', marginBottom:6 }}>ПОВТОРИ ПАРОЛЬ</div>
                <input className="inp" type="password" placeholder="Повтори пароль" value={form.password2}
                  onChange={e => setForm(f=>({...f, password2:e.target.value}))}
                  style={{ borderColor: form.password2 && form.password !== form.password2 ? 'rgba(255,0,128,0.4)' : undefined }}/>
              </div>
            </div>

            {error && (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(255,0,128,0.08)', border:'1px solid rgba(255,0,128,0.2)', color:'#ff6b9d', fontSize:13, marginTop:12, textAlign:'center' }}>
                {error}
              </div>
            )}

            <button className="btn btn-green btn-full" onClick={submitProfile} disabled={loading} style={{ marginTop:20 }}>
              {loading
                ? <span style={{ display:'inline-block', width:16, height:16, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'#000', animation:'spin 0.8s linear infinite' }}/>
                : '🚀 СОЗДАТЬ АККАУНТ'}
            </button>
          </div>
        )}

        {/* Forgot password link */}
        {step === 0 && mode === 'login' && (
          <div style={{ textAlign:'center', marginTop:16 }}>
            <button onClick={() => window.open(`https://t.me/${BOT_USERNAME}?start=reset`, '_blank')} style={{
              background:'none', border:'none', cursor:'pointer',
              color:'var(--t3)', fontFamily:'var(--font-display)', fontSize:11,
              letterSpacing:'0.06em', textDecoration:'underline',
            }}>
              ЗАБЫЛ ПАРОЛЬ? → ВОССТАНОВИТЬ ЧЕРЕЗ БОТ
            </button>
          </div>
        )}
      </div>

      {/* Bottom note */}
      <div className="anim-up" style={{ animationDelay:'200ms', marginTop:24, textAlign:'center', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--t4)', letterSpacing:'0.1em' }}>
        ВХОД ТОЛЬКО ЧЕРЕЗ TELEGRAM · ДАННЫЕ ЗАЩИЩЕНЫ
      </div>
    </div>
  )
}
