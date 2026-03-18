"""
╔══════════════════════════════════════════════════════════════════╗
║           NEXUS TRADE AI v4.0 — ФИНАЛЬНАЯ ВЕРСИЯ               ║
║   Groq Llama 3 + Multi-TF TA + Risk Management + Telegram      ║
╚══════════════════════════════════════════════════════════════════╝

УСТАНОВКА:
    pip install python-binance python-telegram-bot pandas ta \
                schedule numpy groq colorlog requests

ЗАПУСК ЛОКАЛЬНО:
    python nexus_bot_v4.py

ЗАПУСК НА RAILWAY:
    Добавь переменные окружения в Railway Variables
"""

import os, sys, time, json, logging, schedule, threading, asyncio
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from collections import deque
from dataclasses import dataclass, field
from typing import Optional

from binance.client import Client
from binance.exceptions import BinanceAPIException
from telegram import Update, Bot, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (Application, CommandHandler,
                           CallbackQueryHandler, ContextTypes)
import ta
from groq import Groq

# ══════════════════════════════════════════
# ⚙️  КОНФИГУРАЦИЯ
# ══════════════════════════════════════════

class Config:
    # ── API ключи (Railway берёт из переменных окружения) ──
    BINANCE_API_KEY    = os.environ.get("BINANCE_API_KEY",    "ВСТАВЬ_API_KEY")
    BINANCE_API_SECRET = os.environ.get("BINANCE_API_SECRET", "ВСТАВЬ_SECRET")
    TELEGRAM_TOKEN     = os.environ.get("TELEGRAM_TOKEN",     "ВСТАВЬ_TOKEN")
    TELEGRAM_CHAT_ID   = os.environ.get("TELEGRAM_CHAT_ID",   "ВСТАВЬ_CHAT_ID")
    GROQ_API_KEY       = os.environ.get("GROQ_API_KEY",       "ВСТАВЬ_GROQ_KEY")

    # ── Groq ──
    GROQ_MODEL         = "llama3-70b-8192"   # Бесплатная мощная модель

    # ── Торговые пары ──
    TRADING_PAIRS      = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT"]

    # ── Капитал и риск ──
    MAX_TRADE_USDT     = 20.0    # Макс. сумма одной сделки
    MIN_TRADE_USDT     = 5.0     # Мин. сумма сделки
    MAX_OPEN_POSITIONS = 3       # Макс. открытых позиций одновременно
    MAX_DAILY_LOSS_PCT = 5.0     # Стоп при потере X% баланса за день
    RISK_PER_TRADE_PCT = 1.0     # % баланса на риск в каждой сделке

    # ── SL / TP (динамические через ATR) ──
    SL_ATR_MULT        = 1.5     # Stop-Loss = ATR × 1.5
    TP_ATR_MULT        = 3.0     # Take-Profit = ATR × 3.0  (R:R = 1:2)
    TRAILING_STOP_PCT  = 1.5     # Трейлинг стоп %

    # ── AI пороги ──
    MIN_TA_SCORE       = 65      # Мин. балл технического анализа
    MIN_GROQ_SCORE     = 60      # Мин. уверенность Groq
    USE_GROQ           = True    # False = только TA без Groq

    # ── Расписание ──
    CYCLE_MIN          = 5       # Полный цикл анализа каждые N минут
    EXIT_CHECK_SEC     = 30      # Проверка SL/TP каждые N секунд
    DAILY_REPORT_HOUR  = 20      # Ежедневный отчёт в XX:00

    # ── Таймфреймы для анализа ──
    TIMEFRAMES         = [("15m", 0.25), ("1h", 0.45), ("4h", 0.30)]


# ══════════════════════════════════════════
# 📋  ЛОГИРОВАНИЕ
# ══════════════════════════════════════════

def setup_logging():
    fmt = "%(asctime)s [%(levelname)s] %(message)s"
    handlers = [logging.FileHandler("nexus.log", encoding="utf-8"),
                logging.StreamHandler()]
    try:
        import colorlog
        ch = colorlog.StreamHandler()
        ch.setFormatter(colorlog.ColoredFormatter(
            "%(log_color)s%(asctime)s [%(levelname)s]%(reset)s %(message)s",
            log_colors={"DEBUG":"cyan","INFO":"green",
                        "WARNING":"yellow","ERROR":"red","CRITICAL":"bold_red"}
        ))
        handlers = [logging.FileHandler("nexus.log", encoding="utf-8"), ch]
    except ImportError:
        pass
    logging.basicConfig(level=logging.INFO, format=fmt, handlers=handlers)
    return logging.getLogger("Nexus")

log = setup_logging()


# ══════════════════════════════════════════
# 📦  СТРУКТУРЫ ДАННЫХ
# ══════════════════════════════════════════

@dataclass
class Position:
    symbol:        str
    entry_price:   float
    quantity:      float
    stop_loss:     float
    take_profit:   float
    trailing_stop: float
    strategy:      str
    groq_reason:   str  = ""
    entry_time:    str  = field(default_factory=lambda: datetime.now().isoformat())
    highest_price: float = 0.0

    def pnl(self, price: float) -> float:
        return (price - self.entry_price) * self.quantity

    def pnl_pct(self, price: float) -> float:
        return (price - self.entry_price) / self.entry_price * 100


@dataclass
class ClosedTrade:
    symbol:     str
    entry:      float
    exit_price: float
    quantity:   float
    pnl:        float
    pnl_pct:    float
    reason:     str
    strategy:   str
    groq_reason: str
    duration_min: float
    timestamp:  str = field(default_factory=lambda: datetime.now().isoformat())


# ══════════════════════════════════════════
# 🤖  GROQ AI
# ══════════════════════════════════════════

class GroqAI:
    def __init__(self):
        self.client = Groq(api_key=Config.GROQ_API_KEY)
        self.model  = Config.GROQ_MODEL
        self.calls  = 0
        log.info(f"🤖 Groq AI готов | {self.model}")

    def _call(self, prompt: str, max_tokens: int = 400) -> str:
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=max_tokens,
        )
        self.calls += 1
        raw = resp.choices[0].message.content.strip()
        # Убираем markdown обёртку если есть
        if "```" in raw:
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else parts[0]
            if raw.startswith("json"):
                raw = raw[4:]
        return raw.strip()

    def analyze(self, symbol: str, ind: dict, ta_sig: str, ta_score: int) -> dict:
        """Llama 3 анализирует индикаторы и выдаёт решение."""
        prompt = f"""You are an expert crypto trader. Analyze and give a trading decision.

ASSET: {symbol}
TIMEFRAME: 1h

INDICATORS:
- RSI-14: {ind.get('rsi',50):.1f}  RSI-7: {ind.get('rsi_7',50):.1f}
- MACD histogram: {ind.get('macd_hist',0):.5f}
- Bollinger %: {ind.get('bb_pct',0.5):.2f}  (0=lower, 1=upper band)
- EMA 9/21/50/200: {ind.get('ema_9',0):.2f}/{ind.get('ema_21',0):.2f}/{ind.get('ema_50',0):.2f}/{ind.get('ema_200',0):.2f}
- ADX: {ind.get('adx',20):.1f}
- Volume ratio: {ind.get('vol_ratio',1):.2f}x
- Stochastic K/D: {ind.get('stoch_k',50):.1f}/{ind.get('stoch_d',50):.1f}
- ATR: {ind.get('atr',0):.5f}
- RSI divergence: {ind.get('rsi_div','none')}

ALGORITHM SIGNAL: {ta_sig} ({ta_score}% confidence)

Respond ONLY valid JSON:
{{
  "decision": "BUY or SELL or HOLD",
  "confidence": 0-100,
  "reasoning": "2-3 sentences in Russian",
  "risk": "LOW or MEDIUM or HIGH",
  "key_factor": "main factor"
}}"""
        try:
            result = json.loads(self._call(prompt, 350))
            if result.get("decision") not in ["BUY","SELL","HOLD"]:
                result["decision"] = "HOLD"
            result["confidence"] = max(0, min(100, int(result.get("confidence", 50))))
            log.info(f"     🤖 Groq: {result['decision']} {result['confidence']}% | {result.get('key_factor','')}")
            return result
        except Exception as e:
            log.error(f"Groq analyze: {e}")
            return {"decision":"HOLD","confidence":0,"reasoning":f"Ошибка: {e}","risk":"HIGH","key_factor":"error"}

    def market_overview(self, pairs_data: list) -> dict:
        """Общий обзор рынка от Llama 3."""
        info = "\n".join(
            f"- {d['symbol']}: ${d['price']:,} | 24h: {d.get('chg',0):+.2f}%"
            for d in pairs_data
        )
        prompt = f"""Crypto analyst. Brief market overview.
PRICES:
{info}

JSON only:
{{
  "mood": "BULLISH or BEARISH or NEUTRAL",
  "summary": "2 sentences in Russian",
  "best_pair": "best opportunity",
  "avoid_pair": "most risky pair",
  "risk": "LOW or MEDIUM or HIGH"
}}"""
        try:
            return json.loads(self._call(prompt, 220))
        except:
            return {"mood":"NEUTRAL","summary":"Анализ недоступен",
                    "best_pair":"N/A","avoid_pair":"N/A","risk":"MEDIUM"}

    def explain_close(self, symbol: str, entry: float, exit_p: float, pnl: float, reason: str) -> str:
        """Groq объясняет почему позиция закрылась."""
        prompt = f"""Crypto trade closed. Brief explanation in Russian (1-2 sentences).
Symbol: {symbol} | Entry: ${entry:.4f} | Exit: ${exit_p:.4f} | PnL: ${pnl:+.4f} | Reason: {reason}
Respond with just the explanation text, no JSON."""
        try:
            return self._call(prompt, 100)
        except:
            return ""


# ══════════════════════════════════════════
# 📊  ТЕХНИЧЕСКИЙ АНАЛИЗ
# ══════════════════════════════════════════

class MarketAnalyzer:

    def get_candles(self, client, symbol: str, interval: str, limit: int = 200) -> Optional[pd.DataFrame]:
        try:
            raw = client.get_klines(symbol=symbol, interval=interval, limit=limit)
            df  = pd.DataFrame(raw, columns=[
                "time","open","high","low","close","volume",
                "close_time","quote_vol","trades","tb","tq","ignore"
            ])
            for col in ["open","high","low","close","volume"]:
                df[col] = df[col].astype(float)
            df["time"] = pd.to_datetime(df["time"], unit="ms")
            return df
        except Exception as e:
            log.error(f"get_candles {symbol}/{interval}: {e}")
            return None

    def indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        c, h, l, v = df["close"], df["high"], df["low"], df["volume"]

        # Momentum
        df["rsi_14"]  = ta.momentum.RSIIndicator(c, 14).rsi()
        df["rsi_7"]   = ta.momentum.RSIIndicator(c, 7).rsi()
        st = ta.momentum.StochasticOscillator(h, l, c)
        df["stoch_k"] = st.stoch()
        df["stoch_d"] = st.stoch_signal()

        # Trend
        macd = ta.trend.MACD(c)
        df["macd"]      = macd.macd()
        df["macd_sig"]  = macd.macd_signal()
        df["macd_hist"] = macd.macd_diff()
        for p in [9, 21, 50, 200]:
            df[f"ema_{p}"] = ta.trend.EMAIndicator(c, p).ema_indicator()
        df["adx"] = ta.trend.ADXIndicator(h, l, c).adx()

        # Volatility
        bb = ta.volatility.BollingerBands(c, 20, 2)
        df["bb_upper"] = bb.bollinger_hband()
        df["bb_lower"] = bb.bollinger_lband()
        df["bb_mid"]   = bb.bollinger_mavg()
        df["bb_pct"]   = (c - df["bb_lower"]) / (df["bb_upper"] - df["bb_lower"] + 1e-9)
        df["atr"]      = ta.volatility.AverageTrueRange(h, l, c, 14).average_true_range()

        # Volume
        df["vol_sma"]   = v.rolling(20).mean()
        df["vol_ratio"] = v / df["vol_sma"]
        df["obv"]       = ta.volume.OnBalanceVolumeIndicator(c, v).on_balance_volume()

        return df

    def _score_df(self, df: pd.DataFrame, tf: str) -> tuple:
        """Считает баллы BUY/SELL для одного таймфрейма."""
        if df is None or len(df) < 55:
            return "HOLD", 0, {}

        df   = self.indicators(df)
        last = df.iloc[-1]
        prev = df.iloc[-2]

        buy_pts = sell_pts = 0
        reasons = []

        # RSI
        rsi = last["rsi_14"]
        if rsi < 28:   buy_pts += 28; reasons.append(f"[{tf}] RSI={rsi:.0f} сильно перепродан")
        elif rsi < 42: buy_pts += 14
        elif rsi > 72: sell_pts += 28; reasons.append(f"[{tf}] RSI={rsi:.0f} сильно перекуплен")
        elif rsi > 58: sell_pts += 14

        # RSI дивергенция
        rsi_div = "none"
        if len(df) >= 6:
            if (df["close"].iloc[-1] < df["close"].iloc[-5] and
                    df["rsi_14"].iloc[-1] > df["rsi_14"].iloc[-5]):
                buy_pts += 18; reasons.append(f"[{tf}] Бычья RSI дивергенция"); rsi_div = "bullish"
            elif (df["close"].iloc[-1] > df["close"].iloc[-5] and
                  df["rsi_14"].iloc[-1] < df["rsi_14"].iloc[-5]):
                sell_pts += 18; reasons.append(f"[{tf}] Медвежья RSI дивергенция"); rsi_div = "bearish"

        # MACD кроссовер
        if prev["macd_hist"] < 0 and last["macd_hist"] > 0:
            buy_pts += 24; reasons.append(f"[{tf}] MACD бычий кроссовер")
        elif prev["macd_hist"] > 0 and last["macd_hist"] < 0:
            sell_pts += 24; reasons.append(f"[{tf}] MACD медвежий кроссовер")
        elif last["macd_hist"] > 0: buy_pts  += 8
        else:                       sell_pts += 8

        # Bollinger Bands
        bp = last["bb_pct"]
        if bp < 0.04:   buy_pts += 22; reasons.append(f"[{tf}] Касание нижней BB")
        elif bp < 0.22: buy_pts += 11
        elif bp > 0.96: sell_pts += 22; reasons.append(f"[{tf}] Касание верхней BB")
        elif bp > 0.78: sell_pts += 11

        # EMA структура
        if last["ema_9"] > last["ema_21"] > last["ema_50"]:
            buy_pts += 16; reasons.append(f"[{tf}] Бычья EMA структура")
        elif last["ema_9"] < last["ema_21"] < last["ema_50"]:
            sell_pts += 16; reasons.append(f"[{tf}] Медвежья EMA структура")

        # Golden / Death Cross 50/200
        if prev["ema_50"] < prev["ema_200"] and last["ema_50"] > last["ema_200"]:
            buy_pts += 22; reasons.append(f"[{tf}] 🌟 Golden Cross EMA50/200!")
        elif prev["ema_50"] > prev["ema_200"] and last["ema_50"] < last["ema_200"]:
            sell_pts += 22; reasons.append(f"[{tf}] ☠️ Death Cross EMA50/200!")

        # ADX — сила тренда
        if last["adx"] > 25:
            bonus = 12
            if buy_pts > sell_pts: buy_pts  += bonus; reasons.append(f"[{tf}] Сильный тренд ADX={last['adx']:.0f}")
            else:                  sell_pts += bonus

        # Объём
        if last["vol_ratio"] > 2.0:
            bonus = 14; tag = f"[{tf}] Объём {last['vol_ratio']:.1f}x выше нормы"
            if buy_pts > sell_pts: buy_pts  += bonus; reasons.append(tag)
            else:                  sell_pts += bonus; reasons.append(tag)

        # Stochastic
        if last["stoch_k"] < 20 and last["stoch_k"] > last["stoch_d"]:
            buy_pts += 10
        elif last["stoch_k"] > 80 and last["stoch_k"] < last["stoch_d"]:
            sell_pts += 10

        ind_snapshot = {
            "rsi": rsi, "rsi_7": last["rsi_7"],
            "macd_hist": last["macd_hist"],
            "bb_pct": bp,
            "ema_9": last["ema_9"], "ema_21": last["ema_21"],
            "ema_50": last["ema_50"], "ema_200": last["ema_200"],
            "adx": last["adx"], "vol_ratio": last["vol_ratio"],
            "stoch_k": last["stoch_k"], "stoch_d": last["stoch_d"],
            "atr": last["atr"], "rsi_div": rsi_div,
        }

        total = buy_pts + sell_pts
        if total == 0:
            return "HOLD", 0, ind_snapshot

        if buy_pts > sell_pts:
            return "BUY",  int(buy_pts  / total * 100), ind_snapshot
        elif sell_pts > buy_pts:
            return "SELL", int(sell_pts / total * 100), ind_snapshot
        return "HOLD", 50, ind_snapshot

    def multi_tf_signal(self, client, symbol: str) -> tuple:
        """
        Мультитаймфрейм анализ.
        Возвращает (signal, score, indicators_dict, reasons_list)
        """
        buy_w = sell_w = 0.0
        all_reasons = []
        last_ind = {}

        for tf, weight in Config.TIMEFRAMES:
            df = self.get_candles(client, symbol, tf, 200)
            sig, score, ind = self._score_df(df, tf)
            if sig == "BUY":  buy_w  += score * weight
            elif sig == "SELL": sell_w += score * weight
            last_ind = ind   # Берём индикаторы последнего ТФ для Groq

            if score > 0 and sig != "HOLD":
                all_reasons.append(f"{tf}: {sig} {score}%")

        if buy_w > sell_w and buy_w > 0:
            return "BUY",  min(100, int(buy_w)),  last_ind, all_reasons
        elif sell_w > buy_w and sell_w > 0:
            return "SELL", min(100, int(sell_w)), last_ind, all_reasons
        return "HOLD", 50, last_ind, ["Смешанные сигналы"]

    def get_atr(self, client, symbol: str) -> float:
        df = self.get_candles(client, symbol, "1h", 50)
        if df is None: return 0.0
        df = self.indicators(df)
        return float(df["atr"].iloc[-1])


# ══════════════════════════════════════════
# 💰  РИСК-МЕНЕДЖМЕНТ
# ══════════════════════════════════════════

class RiskManager:
    def __init__(self):
        self.daily_pnl    = 0.0
        self.history: list[ClosedTrade] = []
        self.last_reset   = datetime.now().date()

    def _reset(self):
        if datetime.now().date() > self.last_reset:
            self.daily_pnl  = 0.0
            self.last_reset = datetime.now().date()

    def can_trade(self, usdt: float, positions: dict) -> tuple:
        self._reset()
        if len(positions) >= Config.MAX_OPEN_POSITIONS:
            return False, f"Лимит позиций ({Config.MAX_OPEN_POSITIONS})"
        if usdt < Config.MIN_TRADE_USDT:
            return False, f"Мало USDT (${usdt:.2f})"
        max_loss = usdt * Config.MAX_DAILY_LOSS_PCT / 100
        if self.daily_pnl < -max_loss:
            return False, f"Дневной лимит потерь (${self.daily_pnl:.2f})"
        return True, "OK"

    def position_size(self, usdt: float, entry: float, sl: float) -> float:
        risk_usdt = usdt * Config.RISK_PER_TRADE_PCT / 100
        risk_pct  = abs(entry - sl) / entry
        if risk_pct < 1e-6: return Config.MIN_TRADE_USDT
        size = risk_usdt / risk_pct
        return max(Config.MIN_TRADE_USDT, min(Config.MAX_TRADE_USDT, size))

    def record(self, trade: ClosedTrade):
        self.daily_pnl += trade.pnl
        self.history.append(trade)
        if len(self.history) > 1000:
            self.history = self.history[-1000:]

    def stats(self) -> dict:
        h = self.history
        if not h:
            return {"total":0,"wins":0,"win_rate":0,"avg_pnl":0,
                    "total_pnl":0,"daily_pnl":self.daily_pnl,"best":0,"worst":0}
        wins     = [t for t in h if t.pnl > 0]
        total_pnl= sum(t.pnl for t in h)
        return {
            "total":     len(h),
            "wins":      len(wins),
            "win_rate":  len(wins) / len(h) * 100,
            "avg_pnl":   total_pnl / len(h),
            "total_pnl": total_pnl,
            "daily_pnl": self.daily_pnl,
            "best":      max(t.pnl for t in h),
            "worst":     min(t.pnl for t in h),
        }


# ══════════════════════════════════════════
# 🏦  ТОРГОВЫЙ ДВИЖОК
# ══════════════════════════════════════════

class TradingEngine:
    def __init__(self):
        self.client:   Optional[Client] = None
        self.groq      = GroqAI()
        self.analyzer  = MarketAnalyzer()
        self.risk      = RiskManager()
        self.positions: dict[str, Position] = {}
        self.running   = False
        self.signal_log= deque(maxlen=100)
        self.errors    = deque(maxlen=20)
        self.last_cycle: Optional[datetime] = None

    # ── Подключение ──

    def connect(self) -> bool:
        # Пробуем разные tld для обхода гео-блокировки Railway
        for tld in ["com", "us"]:
            try:
                self.client = Client(
                    Config.BINANCE_API_KEY,
                    Config.BINANCE_API_SECRET,
                    tld=tld,
                    requests_params={"timeout": 20}
                )
                self.client.ping()
                log.info(f"✅ Binance подключён (tld={tld})")
                return True
            except Exception as e:
                log.warning(f"Попытка tld={tld} не удалась: {e}")
        log.error("❌ Binance недоступен. Смени регион Railway на EU (eu-west4)")
        return False

    # ── Данные ──

    def price(self, symbol: str) -> float:
        try: return float(self.client.get_symbol_ticker(symbol=symbol)["price"])
        except: return 0.0

    def usdt_balance(self) -> float:
        try:
            for b in self.client.get_account()["balances"]:
                if b["asset"] == "USDT": return float(b["free"])
        except: pass
        return 0.0

    def all_balances(self) -> dict:
        try:
            return {b["asset"]: float(b["free"])
                    for b in self.client.get_account()["balances"]
                    if float(b["free"]) > 0.0001}
        except: return {}

    def _round_qty(self, symbol: str, qty: float) -> float:
        try:
            info = self.client.get_symbol_info(symbol)
            step = float([f["stepSize"] for f in info["filters"]
                          if f["filterType"] == "LOT_SIZE"][0])
            prec = len(f"{step:.10f}".rstrip("0").split(".")[-1])
            return round(qty, prec)
        except: return round(qty, 6)

    # ── Открытие позиции ──

    def open_position(self, symbol: str, groq_res: dict, ta_score: int,
                      reasons: list) -> Optional[Position]:
        usdt = self.usdt_balance()
        ok, why = self.risk.can_trade(usdt, self.positions)
        if not ok:
            log.warning(f"⛔ {symbol}: {why}"); return None
        if symbol in self.positions: return None

        p = self.price(symbol)
        if not p: return None

        atr = self.analyzer.get_atr(self.client, symbol)
        if atr < 1e-9: atr = p * 0.01

        sl  = p - atr * Config.SL_ATR_MULT
        tp  = p + atr * Config.TP_ATR_MULT
        qty = self._round_qty(symbol, self.risk.position_size(usdt, p, sl) / p)

        if qty * p < 5:
            log.warning(f"⛔ {symbol}: ордер слишком мал"); return None

        try:
            self.client.order_market_buy(symbol=symbol, quantity=qty)
        except BinanceAPIException as e:
            log.error(f"❌ BUY {symbol}: {e}"); return None

        pos = Position(
            symbol=symbol, entry_price=p, quantity=qty,
            stop_loss=sl, take_profit=tp,
            trailing_stop=p * (1 - Config.TRAILING_STOP_PCT / 100),
            strategy=f"TA {ta_score}% + Groq {groq_res.get('confidence',0)}%",
            groq_reason=groq_res.get("reasoning", ""),
            highest_price=p,
        )
        self.positions[symbol] = pos
        log.info(f"📈 OPEN {symbol} {qty} @ ${p:.4f} | SL ${sl:.4f} | TP ${tp:.4f}")
        return pos

    # ── Закрытие позиции ──

    def close_position(self, symbol: str, reason: str) -> Optional[ClosedTrade]:
        pos = self.positions.get(symbol)
        if not pos: return None

        p = self.price(symbol)
        try:
            self.client.order_market_sell(symbol=symbol, quantity=pos.quantity)
        except BinanceAPIException as e:
            log.error(f"❌ SELL {symbol}: {e}"); return None

        dur = (datetime.now() - datetime.fromisoformat(pos.entry_time)).total_seconds() / 60
        trade = ClosedTrade(
            symbol=symbol, entry=pos.entry_price, exit_price=p,
            quantity=pos.quantity,
            pnl=pos.pnl(p), pnl_pct=pos.pnl_pct(p),
            reason=reason, strategy=pos.strategy,
            groq_reason=pos.groq_reason,
            duration_min=round(dur, 1),
        )
        self.risk.record(trade)
        del self.positions[symbol]
        log.info(f"📉 CLOSE {symbol} @ ${p:.4f} | P&L ${trade.pnl:+.4f} | {reason}")
        return trade

    # ── Проверка выходов ──

    def check_exits(self) -> list[ClosedTrade]:
        closed = []
        for symbol in list(self.positions.keys()):
            pos = self.positions[symbol]
            p   = self.price(symbol)
            if not p: continue

            # Обновляем трейлинг стоп
            if p > pos.highest_price:
                pos.highest_price = p
                new_ts = p * (1 - Config.TRAILING_STOP_PCT / 100)
                if new_ts > pos.trailing_stop:
                    pos.trailing_stop = new_ts

            reason = None
            if   p <= pos.stop_loss:                                     reason = "🛑 Stop-Loss"
            elif p >= pos.take_profit:                                   reason = "🎯 Take-Profit"
            elif p <= pos.trailing_stop and p > pos.entry_price * 1.001: reason = "📐 Trailing Stop (с прибылью)"

            if reason:
                trade = self.close_position(symbol, reason)
                if trade: closed.append(trade)
        return closed

    # ── Главный цикл ──

    def full_cycle(self) -> list[dict]:
        if not self.running: return []
        self.last_cycle = datetime.now()
        log.info("═" * 60)
        log.info(f"🔄 ЦИКЛ | {self.last_cycle.strftime('%H:%M:%S')}")
        log.info(f"   USDT: ${self.usdt_balance():.2f} | Позиций: {len(self.positions)}")
        events = []

        for symbol in Config.TRADING_PAIRS:
            try:
                # 1. Мультитаймфрейм TA
                ta_sig, ta_score, ind, reasons = self.analyzer.multi_tf_signal(self.client, symbol)
                log.info(f"  {symbol}: TA={ta_sig} {ta_score}%")

                # 2. Groq (только если TA сильный)
                groq_res = {"decision":"HOLD","confidence":0,"reasoning":"","risk":"MEDIUM"}
                if Config.USE_GROQ and ta_score >= Config.MIN_TA_SCORE:
                    groq_res = self.groq.analyze(symbol, ind, ta_sig, ta_score)

                # 3. Финальное решение (оба согласны)
                final = "HOLD"
                groq_ok = (not Config.USE_GROQ or
                           (groq_res["decision"] == ta_sig and
                            groq_res["confidence"] >= Config.MIN_GROQ_SCORE))

                if ta_sig in ("BUY","SELL") and ta_score >= Config.MIN_TA_SCORE and groq_ok:
                    final = ta_sig

                self.signal_log.append({
                    "time": datetime.now().strftime("%H:%M"),
                    "symbol": symbol, "ta": ta_sig, "ta_score": ta_score,
                    "groq": groq_res["decision"], "groq_score": groq_res["confidence"],
                    "final": final,
                })
                log.info(f"     Groq={groq_res['decision']} {groq_res['confidence']}% → {final}")

                # 4. Действие
                if final == "BUY":
                    pos = self.open_position(symbol, groq_res, ta_score, reasons)
                    if pos:
                        events.append({"type":"open","pos":pos,
                                       "ta_score":ta_score,"groq":groq_res,"reasons":reasons})

                elif final == "SELL" and symbol in self.positions:
                    trade = self.close_position(
                        symbol, f"AI SELL (TA {ta_score}% + Groq {groq_res['confidence']}%)")
                    if trade:
                        events.append({"type":"close","trade":trade})

                time.sleep(1.0)

            except Exception as e:
                msg = f"Ошибка {symbol}: {e}"
                log.error(msg)
                self.errors.append({"time": datetime.now().isoformat(), "msg": msg})

        log.info("✅ ЦИКЛ ЗАВЕРШЁН\n")
        return events


# ══════════════════════════════════════════
# 📱  TELEGRAM УВЕДОМЛЕНИЯ
# ══════════════════════════════════════════

class TelegramBot:
    def __init__(self, engine: TradingEngine):
        self.engine = engine
        self.bot    = Bot(token=Config.TELEGRAM_TOKEN)

    def _send(self, text: str, markup=None):
        try:
            asyncio.run(self.bot.send_message(
                chat_id=Config.TELEGRAM_CHAT_ID, text=text,
                parse_mode="HTML", reply_markup=markup,
                disable_web_page_preview=True,
            ))
        except Exception as e:
            log.error(f"TG send: {e}")

    # ── Уведомления ──

    def notify_open(self, pos: Position, ta_score: int, groq: dict, reasons: list):
        r_text = "\n".join(f"  • {r}" for r in reasons[:4])
        self._send(
            f"📈 <b>ОТКРЫТА ПОЗИЦИЯ</b>\n"
            f"{'─'*28}\n"
            f"🪙 <b>{pos.symbol}</b>\n"
            f"💵 Цена входа:  <b>${pos.entry_price:.4f}</b>\n"
            f"📦 Количество: {pos.quantity}\n"
            f"🛑 Stop-Loss:  ${pos.stop_loss:.4f}\n"
            f"🎯 Take-Profit: ${pos.take_profit:.4f}\n"
            f"📐 Trailing:   {Config.TRAILING_STOP_PCT}%\n\n"
            f"<b>🤖 AI Анализ:</b>\n"
            f"  📊 TA Score:  {ta_score}%\n"
            f"  🧠 Groq:      {groq.get('confidence',0)}% ({groq.get('risk','?')} риск)\n"
            f"  💬 {groq.get('reasoning','')}\n\n"
            f"<b>Сигналы:</b>\n{r_text}\n\n"
            f"⏰ {datetime.now().strftime('%H:%M:%S')}"
        )

    def notify_close(self, trade: ClosedTrade):
        e = "🟢" if trade.pnl >= 0 else "🔴"
        self._send(
            f"{'📈' if trade.pnl>=0 else '📉'} <b>ЗАКРЫТА ПОЗИЦИЯ</b> {e}\n"
            f"{'─'*28}\n"
            f"🪙 <b>{trade.symbol}</b>\n"
            f"💵 Вход:   ${trade.entry:.4f}\n"
            f"💵 Выход:  ${trade.exit_price:.4f}\n"
            f"<b>P&L: {e} ${trade.pnl:+.4f} ({trade.pnl_pct:+.2f}%)</b>\n"
            f"⏱ Длительность: {trade.duration_min:.0f} мин\n"
            f"📋 Причина: {trade.reason}\n"
            f"🤖 {trade.groq_reason[:120]}\n\n"
            f"⏰ {datetime.now().strftime('%H:%M:%S')}"
        )

    def daily_report(self):
        s   = self.engine.risk.stats()
        bal = self.engine.all_balances()
        e   = "🟢" if s["daily_pnl"] >= 0 else "🔴"
        bal_str = "\n".join(f"  {k}: {v:.6f}" for k, v in list(bal.items())[:8])
        self._send(
            f"📊 <b>ЕЖЕДНЕВНЫЙ ОТЧЁТ</b>\n"
            f"{'─'*28}\n"
            f"📅 {datetime.now().strftime('%d.%m.%Y')}\n\n"
            f"Сделок:   {s['total']}  |  Побед: {s['wins']}\n"
            f"Win Rate: {s['win_rate']:.1f}%\n"
            f"Avg P&L:  ${s['avg_pnl']:+.4f}\n"
            f"P&L день: {e} ${s['daily_pnl']:+.4f}\n"
            f"P&L всего: ${s['total_pnl']:+.4f}\n"
            f"Лучшая:  +${s['best']:.4f}\n"
            f"Худшая:   ${s['worst']:.4f}\n\n"
            f"🤖 Groq вызовов: {self.engine.groq.calls}\n\n"
            f"<b>Баланс:</b>\n{bal_str}"
        )


# ══════════════════════════════════════════
# 🤖  TELEGRAM КОМАНДЫ И КНОПКИ
# ══════════════════════════════════════════

def build_app(engine: TradingEngine, tg: TelegramBot) -> Application:
    app = Application.builder().token(Config.TELEGRAM_TOKEN).job_queue(None).build()

    # ── Клавиатура ──
    def menu():
        return InlineKeyboardMarkup([
            [InlineKeyboardButton("▶️ Запуск",     callback_data="run"),
             InlineKeyboardButton("⏹ Стоп",       callback_data="stop")],
            [InlineKeyboardButton("💼 Баланс",    callback_data="balance"),
             InlineKeyboardButton("📋 Позиции",   callback_data="positions")],
            [InlineKeyboardButton("🧠 AI Анализ", callback_data="analyze"),
             InlineKeyboardButton("📈 Статистика",callback_data="stats")],
            [InlineKeyboardButton("🌍 Рынок",     callback_data="market"),
             InlineKeyboardButton("📜 Сигналы",   callback_data="signals")],
            [InlineKeyboardButton("❌ Закрыть всё",callback_data="closeall")],
        ])

    # ── Хэндлеры ──

    async def h_start(u: Update, _):
        s = "🟢 РАБОТАЕТ" if engine.running else "🔴 СТОП"
        lc = engine.last_cycle.strftime("%H:%M") if engine.last_cycle else "—"
        await u.message.reply_text(
            f"⚡ <b>NEXUS TRADE AI v4.0</b>\n"
            f"🤖 Groq Llama 3 + Multi-TF TA\n"
            f"{'─'*28}\n"
            f"Статус:    {s}\n"
            f"Позиций:   {len(engine.positions)}/{Config.MAX_OPEN_POSITIONS}\n"
            f"Посл. цикл: {lc}\n"
            f"Пары: {', '.join(Config.TRADING_PAIRS)}\n"
            f"P&L день: ${engine.risk.daily_pnl:+.2f}\n\n"
            f"Выбери действие:",
            parse_mode="HTML", reply_markup=menu()
        )

    async def h_balance(u: Update, _):
        bal = engine.all_balances()
        lines = ["💼 <b>Баланс кошелька:</b>\n"]
        for k, v in bal.items():
            lines.append(f"  <b>{k}</b>: {v:.6f}")
        await u.message.reply_text("\n".join(lines), parse_mode="HTML")

    async def h_positions(u: Update, _):
        if not engine.positions:
            await u.message.reply_text("📭 Нет открытых позиций"); return
        lines = ["📋 <b>Позиции:</b>\n"]
        for sym, pos in engine.positions.items():
            p   = engine.price(sym)
            pnl = pos.pnl(p)
            e   = "🟢" if pnl >= 0 else "🔴"
            dur = (datetime.now() - datetime.fromisoformat(pos.entry_time)).total_seconds() / 60
            lines.append(
                f"{e} <b>{sym}</b>  ⏱{dur:.0f}м\n"
                f"  Вход: ${pos.entry_price:.4f} → ${p:.4f}\n"
                f"  P&L: <b>{e} ${pnl:+.4f} ({pos.pnl_pct(p):+.2f}%)</b>\n"
                f"  SL ${pos.stop_loss:.4f} | TP ${pos.take_profit:.4f}\n"
                f"  Trail: ${pos.trailing_stop:.4f}\n"
                f"  🤖 {pos.groq_reason[:80]}\n"
            )
        await u.message.reply_text("\n".join(lines), parse_mode="HTML")

    async def h_analyze(u: Update, _):
        msg = await u.message.reply_text("🧠 Анализирую (TA + Groq Llama 3)...")
        lines = ["📊 <b>AI Анализ рынка:</b>\n"]
        for symbol in Config.TRADING_PAIRS:
            ta_sig, ta_sc, ind, reasons = engine.analyzer.multi_tf_signal(engine.client, symbol)
            groq = engine.groq.analyze(symbol, ind, ta_sig, ta_sc) if ta_sc >= 50 else {}
            te = {"BUY":"📈","SELL":"📉","HOLD":"⏸"}.get(ta_sig,"❓")
            ge = {"BUY":"📈","SELL":"📉","HOLD":"⏸"}.get(groq.get("decision","HOLD"),"⏸")
            lines.append(
                f"{te} <b>{symbol}</b>\n"
                f"  TA: {ta_sig} {ta_sc}%\n"
                f"  Groq: {ge} {groq.get('decision','?')} {groq.get('confidence',0)}%\n"
                f"  💬 {groq.get('reasoning','—')[:90]}\n"
            )
            time.sleep(0.5)
        await msg.edit_text("\n".join(lines), parse_mode="HTML")

    async def h_market(u: Update, _):
        msg = await u.message.reply_text("🌍 Groq анализирует рынок...")
        pd_list = []
        for sym in Config.TRADING_PAIRS:
            try:
                t = engine.client.get_ticker(symbol=sym)
                pd_list.append({"symbol":sym,"price":float(t["lastPrice"]),"chg":float(t["priceChangePercent"])})
            except: pass
        ov = engine.groq.market_overview(pd_list)
        me = {"BULLISH":"🟢","BEARISH":"🔴","NEUTRAL":"🟡"}.get(ov.get("mood",""),"⚪")
        prices_str = "\n".join(
            f"  {d['symbol']}: ${d['price']:,}  {d['chg']:+.2f}%" for d in pd_list
        )
        await msg.edit_text(
            f"🌍 <b>Обзор рынка (Groq Llama 3)</b>\n"
            f"{'─'*28}\n"
            f"Настроение: {me} <b>{ov.get('mood','?')}</b>\n"
            f"Лучшая:     <b>{ov.get('best_pair','?')}</b>\n"
            f"Избегать:   <b>{ov.get('avoid_pair','?')}</b>\n"
            f"Риск:       <b>{ov.get('risk','?')}</b>\n\n"
            f"💬 {ov.get('summary','')}\n\n"
            f"<b>Цены:</b>\n{prices_str}",
            parse_mode="HTML"
        )

    async def h_stats(u: Update, _):
        s = engine.risk.stats()
        e = "🟢" if s["daily_pnl"] >= 0 else "🔴"
        await u.message.reply_text(
            f"📈 <b>Статистика торговли:</b>\n"
            f"{'─'*28}\n"
            f"Сделок:    {s['total']}\n"
            f"Побед:     {s['wins']}\n"
            f"Win Rate:  {s['win_rate']:.1f}%\n"
            f"Avg P&L:   ${s['avg_pnl']:+.4f}\n"
            f"P&L день:  {e} ${s['daily_pnl']:+.4f}\n"
            f"P&L всего: ${s['total_pnl']:+.4f}\n"
            f"Лучшая:   +${s['best']:.4f}\n"
            f"Худшая:    ${s['worst']:.4f}\n\n"
            f"🤖 Groq вызовов: {engine.groq.calls}",
            parse_mode="HTML"
        )

    async def h_signals(u: Update, _):
        if not engine.signal_log:
            await u.message.reply_text("Нет сигналов пока"); return
        lines = ["📜 <b>Последние сигналы:</b>\n"]
        for s in list(engine.signal_log)[-10:][::-1]:
            fe = {"BUY":"📈","SELL":"📉","HOLD":"⏸"}.get(s["final"],"❓")
            lines.append(
                f"{fe} <b>{s['symbol']}</b>  {s['time']}\n"
                f"  TA: {s['ta']} {s['ta_score']}% | Groq: {s['groq']} {s['groq_score']}%\n"
                f"  → {s['final']}\n"
            )
        await u.message.reply_text("\n".join(lines), parse_mode="HTML")

    async def h_run(u: Update, _):
        engine.running = True
        await u.message.reply_text("▶️ <b>Торговля запущена!</b>", parse_mode="HTML")
        log.info("▶️ Запуск через Telegram")

    async def h_stop(u: Update, _):
        engine.running = False
        await u.message.reply_text(
            "⏹ <b>Торговля остановлена.</b>\n"
            "Открытые позиции защищены SL/TP.", parse_mode="HTML")
        log.info("⏹ Стоп через Telegram")

    async def h_closeall(u: Update, _):
        if not engine.positions:
            await u.message.reply_text("📭 Нет позиций для закрытия"); return
        await u.message.reply_text(f"⚠️ Закрываю {len(engine.positions)} позиций...")
        for sym in list(engine.positions.keys()):
            trade = engine.close_position(sym, "Ручное закрытие всех")
            if trade: tg.notify_close(trade)
        await u.message.reply_text("✅ Все позиции закрыты")

    # Маршрутизатор кнопок
    async def btn_handler(u: Update, ctx: ContextTypes.DEFAULT_TYPE):
        q = u.callback_query
        await q.answer()
        u.message = q.message
        handlers = {
            "run": h_run, "stop": h_stop,
            "balance": h_balance, "positions": h_positions,
            "analyze": h_analyze, "stats": h_stats,
            "market": h_market, "signals": h_signals,
            "closeall": h_closeall,
        }
        handler = handlers.get(q.data)
        if handler:
            await handler(u, ctx)

    # Регистрация
    cmds = [("start",h_start),("balance",h_balance),("positions",h_positions),
            ("analyze",h_analyze),("market",h_market),("stats",h_stats),
            ("signals",h_signals),("run",h_run),("stop",h_stop),("closeall",h_closeall)]
    for name, handler in cmds:
        app.add_handler(CommandHandler(name, handler))
    app.add_handler(CallbackQueryHandler(btn_handler))

    return app


# ══════════════════════════════════════════
# 🚀  ТОЧКА ВХОДА
# ══════════════════════════════════════════

def main():
    log.info("🚀 Запуск NEXUS TRADE AI v4.0...")

    # Проверка конфига
    missing = []
    if "ВСТАВЬ" in Config.BINANCE_API_KEY or not Config.BINANCE_API_KEY:
        missing.append("BINANCE_API_KEY")
    if "ВСТАВЬ" in Config.BINANCE_API_SECRET or not Config.BINANCE_API_SECRET:
        missing.append("BINANCE_API_SECRET")
    if "ВСТАВЬ" in Config.TELEGRAM_TOKEN or not Config.TELEGRAM_TOKEN:
        missing.append("TELEGRAM_TOKEN")
    if "ВСТАВЬ" in Config.TELEGRAM_CHAT_ID or not Config.TELEGRAM_CHAT_ID:
        missing.append("TELEGRAM_CHAT_ID")
    if "ВСТАВЬ" in Config.GROQ_API_KEY or not Config.GROQ_API_KEY:
        missing.append("GROQ_API_KEY")

    if missing:
        print(f"\n❌ Не заполнены переменные:\n  " + "\n  ".join(missing))
        print("\nЛокально: заполни в коде или поставь .env")
        print("Railway:  добавь в Variables на сайте railway.app\n")
        sys.exit(1)

    # Инициализация
    engine = TradingEngine()
    if not engine.connect():
        sys.exit(1)

    tg = TelegramBot(engine)

    # Функции расписания
    def cycle_job():
        try:
            events = engine.full_cycle()
            for ev in events:
                if ev["type"] == "open":
                    tg.notify_open(ev["pos"], ev["ta_score"], ev["groq"], ev["reasons"])
                elif ev["type"] == "close":
                    tg.notify_close(ev["trade"])
        except Exception as e:
            log.error(f"Ошибка цикла: {e}")

    def exit_job():
        try:
            if not engine.running: return
            for trade in engine.check_exits():
                tg.notify_close(trade)
        except Exception as e:
            log.error(f"Ошибка проверки выходов: {e}")

    # Расписание
    schedule.every(Config.CYCLE_MIN).minutes.do(cycle_job)
    schedule.every(Config.EXIT_CHECK_SEC).seconds.do(exit_job)
    schedule.every().day.at(f"{Config.DAILY_REPORT_HOUR:02d}:00").do(tg.daily_report)

    # Планировщик в отдельном потоке
    def run_scheduler():
        log.info("⏱ Планировщик запущен")
        while True:
            schedule.run_pending()
            time.sleep(5)

    threading.Thread(target=run_scheduler, daemon=True).start()

    # Сообщение о запуске
    log.info("=" * 60)
    log.info("  NEXUS TRADE AI v4.0 готов к работе!")
    log.info(f"  Groq модель:  {Config.GROQ_MODEL}")
    log.info(f"  Пары:         {Config.TRADING_PAIRS}")
    log.info(f"  Цикл:         каждые {Config.CYCLE_MIN} мин")
    log.info(f"  Проверка SL:  каждые {Config.EXIT_CHECK_SEC} сек")
    log.info(f"  Макс. сделка: ${Config.MAX_TRADE_USDT}")
    log.info(f"  Max позиций:  {Config.MAX_OPEN_POSITIONS}")
    log.info("  Telegram:     /start")
    log.info("=" * 60)

    # Запуск Telegram
    app = build_app(engine, tg)
    app.run_polling(
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True
    )


if __name__ == "__main__":
    main()
