# ⚡ NEXUS MARKET

Безопасный маркетплейс цифровых товаров с неон-геймерским дизайном.  
Авторизация через Telegram бот, эскроу-защита сделок, мгновенный вывод через CryptoBot.

---

## 📁 СТРУКТУРА ПРОЕКТА

```
nexus-market/
├── backend/
│   ├── server.js              — Express сервер, инициализация БД
│   ├── package.json
│   ├── models/
│   │   └── index.js           — Sequelize модель User + подключение к PostgreSQL
│   ├── middleware/
│   │   └── auth.js            — JWT middleware (auth, adminAuth)
│   └── routes/
│       └── auth.js            — Авторизация: бот-вебхук, verify-code, register, login, /me
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js         — Vite + proxy /api → backend
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            — Роутер, глобальное состояние пользователя
│       ├── styles/
│       │   └── global.css     — Дизайн-система: переменные, кнопки, инпуты, анимации
│       └── pages/
│           ├── HomePage.jsx   — Главная: герой, статистика, каталог, как это работает
│           ├── AuthPage.jsx   — Авторизация через Telegram бот (3 шага)
│           ├── CatalogPage.jsx — Каталог с фильтрами, сортировкой, видами
│           ├── ProductPage.jsx — Страница товара, покупка, отзывы
│           ├── ProfilePage.jsx — Профиль: кошелёк, сделки, настройки
│           └── SellPage.jsx   — Создание объявления (4 шага)
├── railway.json               — Railway деплой конфиг
├── nixpacks.toml              — Инструкция сборки: install → build → start
└── README.md
```

---

## 🚀 ФУНКЦИИ — ОТ А ДО Я

### 🎨 Дизайн и интерфейс
- Геймерский неон-дизайн: RGB палитра (cyan/pink/green/yellow), тёмный фон `#040608`
- Кастомные шрифты: Rajdhani (заголовки), Exo 2 (текст), Share Tech Mono (цифры/коды)
- 3D tilt-эффект на карточках товаров при наведении мыши
- Анимированное particle-поле на главной (canvas, 80 частиц с соединениями)
- CSS grid-фон и noise-overlay для глубины
- Анимации: fadeUp, fadeIn, float, rgb-border, pulse, blink, shimmer (skeleton)
- Полностью адаптивная вёрстка (mobile-first)
- Кастомный scrollbar с неон-акцентом

### 🏠 HomePage — Главная страница
- Animated hero: gradient-текст NEXUS MARKET, Live-бейдж с счётчиком сделок
- Анимированные счётчики статистики (12 400+ продавцов, 84 200+ сделок)
- 3D карточки товаров с tilt на mouseMove
- Категории-таблетки с неон подсветкой активной
- Поиск в реальном времени
- Блок "Как это работает" — 4 шага с hover-эффектом
- Футер с копирайтом

### 🔐 AuthPage — Авторизация
- Регистрация и вход — два режима в одной странице
- Шаг 1: кнопка открытия Telegram бота (`@nexus_market_bot?start=auth`)
- Шаг 2: ввод 6-значного кода — отдельные input-поля, поддержка paste
- Шаг 3: заполнение профиля (username, email, пароль с показом)
- Dot-индикатор прогресса шагов
- Восстановление пароля через бот (`?start=reset`)
- JWT токен сохраняется в localStorage

### 🛍 CatalogPage — Каталог
- Sticky header: логотип, поиск, сортировка, переключатель вид, кнопка фильтры
- Категории-вкладки: ВСЕ / АККАУНТЫ / ПРЕДМЕТЫ / ИГРЫ / УСЛУГИ / КЛЮЧИ
- Фильтр-панель: цена min/max, выбор игры, рейтинг продавца, только HOT
- Сортировка: новые / дешевле / дороже / рейтинг / популярные
- Два вида: сетка (grid) и список (list)
- 3D tilt-карточки с holographic shimmer при наведении
- Пагинация (9 товаров на страницу)
- Модальное окно товара с деталями
- Счётчик найденных результатов
- Сброс всех фильтров

### 📦 ProductPage — Страница товара
- Hero-изображение / галерея с миниатюрами
- Бейджи: категория, игра, HOT, скидка в процентах
- Полное описание с pre-line форматированием
- Теги товара
- Отзывы покупателей со звёздочками, форма написания отзыва
- Сайдбар покупки:
  - Цена + зачёркнутая цена
  - Тип доставки (авто ⚡ / вручную 👤)
  - Наличие
  - Баланс пользователя + предупреждение если мало
- Карточка продавца: онлайн-индикатор, рейтинг, продажи, дата регистрации
- Кнопка "В избранное"
- Защита покупателя — блок с эскроу-описанием
- Модал подтверждения: расчёт баланса до/после покупки
- Модал успеха 🎉 с анимацией
- Блок похожих товаров внизу

### 👤 ProfilePage — Профиль пользователя (6 вкладок)

**📊 Обзор:**
- 4 карточки статистики: продажи, покупки, пополнено, выведено
- Animated ring-прогресс доверия аккаунта (Telegram / Email / Продажи / Верификация)
- Animated ring-прогресс рейтинга продавца со звёздочками
- Последние 4 транзакции с кнопкой перехода к кошельку

**💳 Кошелёк:**
- Карточки: доступный баланс, заморожено, всего внесено, всего выведено
- Кнопки пополнения и вывода
- Полная история транзакций

**🤝 Сделки:**
- Счётчики: все / активные / завершённые / споры
- Список сделок с цветовыми статусами

**📦 Мои товары:**
- Заглушка с призывом разместить товар

**⭐ Отзывы:**
- Карточки полученных отзывов с оценками

**⚙️ Настройки:**
- Форма: имя, email, смена пароля
- Toggle-переключатели уведомлений в Telegram
- Кнопка выхода из аккаунта

**Модалы:**
- Пополнение: CryptoBot (USDT/TON/BTC) и Lava (карта РФ, СБП), быстрые суммы $5/$10/$20/$50
- Вывод: сумма с валидацией по доступному балансу

### 📝 SellPage — Создание объявления (4 шага)

**Шаг 1 — Категория:**
- 5 карточек категорий с анимацией выбора
- Выбор игры/платформы — теги-кнопки (15 вариантов)

**Шаг 2 — Описание:**
- Название (80 символов с счётчиком)
- Описание с textarea (минимум 20 символов, валидация)
- Теги — добавление по Enter, удаление по ✕
- Загрузка фото: drag & drop + click, до 5 штук, превью с удалением, "главное" фото

**Шаг 3 — Цена и доставка:**
- Цена и зачёркнутая цена
- Количество и минимальный заказ
- Блок расчёта комиссии 5% в реальном времени
- Выбор доставки: Авто (мгновенно) или Вручную
- Поле для данных автодоставки (появляется при выборе авто)

**Шаг 4 — Подтверждение:**
- Таблица всех введённых данных
- Предупреждение о правилах
- Кнопка публикации со спиннером

Во всех шагах — живой предпросмотр карточки справа

### 🤖 Backend — Авторизация через Telegram бот
- `POST /api/auth/bot-webhook` — принимает апдейты от Telegram
  - `/start` → генерирует 6-значный код, отправляет в бот
  - `/start reset` → код для сброса пароля
- `POST /api/auth/verify-code` — проверяет код, возвращает флаг exists (новый/старый)
- `POST /api/auth/register` — регистрация (username, email, пароль, bcrypt hash)
- `POST /api/auth/reset-password` — сброс пароля по коду из бота
- `GET /api/auth/me` — получение профиля по JWT
- Коды живут 10 минут, автоочистка каждую минуту
- Welcome-сообщение в бот при успешной регистрации
- JWT токены на 30 дней

### 🗄 База данных
- PostgreSQL через Sequelize ORM
- Таблица `Users`: id (UUID), telegramId, username, firstName, email, password (bcrypt),
  balance, frozenBalance, totalDeposited, totalWithdrawn, totalSales, totalPurchases,
  rating, reviewCount, isAdmin, isBanned, banUntil, banReason, isVerified,
  referralCode, referredBy, referralEarnings, lastActive
- Таблица создаётся автоматически при первом запуске (`CREATE TABLE IF NOT EXISTS`)
- SSL поддержка для Railway PostgreSQL

---

## ⚙️ ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
BOT_TOKEN=1234567890:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_SECRET=your_super_secret_key_minimum_32_chars
PORT=8080
NODE_ENV=production
```

---

## 🚂 ДЕПЛОЙ НА RAILWAY — ПОШАГОВО

### 1. Подготовка GitHub репозитория

```bash
git init
git add .
git commit -m "Initial commit: NEXUS MARKET"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nexus-market.git
git push -u origin main
```

### 2. Создание проекта на Railway

1. Зайти на [railway.app](https://railway.app) → **New Project**
2. Выбрать **Deploy from GitHub repo**
3. Выбрать репозиторий `nexus-market`
4. Railway автоматически определит `nixpacks.toml` и начнёт сборку

### 3. Добавление PostgreSQL базы данных

1. В проекте Railway нажать **+ New** → **Database** → **Add PostgreSQL**
2. После создания перейти в **PostgreSQL** → вкладка **Connect**
3. Скопировать **DATABASE_URL** (формат: `postgresql://...`)

### 4. Настройка переменных окружения

В Railway: проект → ваш сервис → вкладка **Variables** → добавить:

| Переменная | Значение |
|------------|----------|
| `DATABASE_URL` | Скопировать из PostgreSQL сервиса |
| `BOT_TOKEN` | Токен вашего Telegram бота от @BotFather |
| `JWT_SECRET` | Любая случайная строка 32+ символов |
| `NODE_ENV` | `production` |

### 5. Настройка Telegram бота

Получить токен у @BotFather:
```
/newbot → указать имя → указать username → скопировать токен
```

После деплоя зарегистрировать вебхук (заменить YOUR_DOMAIN и YOUR_TOKEN):
```
https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=https://YOUR_DOMAIN.railway.app/api/auth/bot-webhook
```

Проверить что вебхук установлен:
```
https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo
```

### 6. Первый запуск

После деплоя Railway покажет URL вида `https://nexus-market-production-xxxx.up.railway.app`

При первом обращении:
- Сервер подключится к PostgreSQL
- Автоматически создаст таблицу `Users`
- Фронтенд (собранный Vite) будет отдаваться как статика

### 7. Проверка работы

```
GET https://YOUR_DOMAIN.railway.app/health
→ {"status":"ok","ts":"2026-03-09T..."}
```

---

## 💻 ЛОКАЛЬНАЯ РАЗРАБОТКА

### Требования
- Node.js 18+
- PostgreSQL (локально или через Railway)

### Установка

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Запуск

**Terminal 1 — Backend:**
```bash
cd backend
DATABASE_URL=postgresql://localhost/nexus_dev BOT_TOKEN=xxx JWT_SECRET=devsecret node server.js
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Открыть http://localhost:5173
```

Vite автоматически проксирует `/api/*` на `http://localhost:8080`

### Сборка для продакшена

```bash
cd frontend
npm run build
# Папка dist/ будет отдаваться Express сервером
```

---

## 📦 ЗАВИСИМОСТИ

### Backend
| Пакет | Версия | Назначение |
|-------|--------|-----------|
| express | ^4.18 | HTTP сервер |
| sequelize | ^6.35 | ORM для PostgreSQL |
| pg | ^8.11 | PostgreSQL драйвер |
| bcryptjs | ^2.4 | Хэширование паролей |
| jsonwebtoken | ^9.0 | JWT токены |
| cors | ^2.8 | CORS заголовки |

### Frontend
| Пакет | Версия | Назначение |
|-------|--------|-----------|
| react | ^18.2 | UI библиотека |
| react-router-dom | ^6.20 | Роутинг |
| react-hot-toast | ^2.4 | Toast уведомления |
| vite | ^5.0 | Сборщик |

---

## 🗺 РОУТЫ ПРИЛОЖЕНИЯ

| URL | Страница | Авторизация |
|-----|----------|-------------|
| `/` | HomePage | Нет |
| `/auth` | AuthPage | Нет (редирект на / если авторизован) |
| `/catalog` | CatalogPage | Нет |
| `/product/:id` | ProductPage | Нет (покупка требует авторизации) |
| `/profile` | ProfilePage | Да (редирект на /auth) |
| `/sell` | SellPage | Да (редирект на /auth) |

### API эндпоинты

| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/auth/bot-webhook` | Telegram бот вебхук |
| POST | `/api/auth/verify-code` | Проверка кода из бота |
| POST | `/api/auth/register` | Регистрация нового пользователя |
| POST | `/api/auth/reset-password` | Сброс пароля |
| GET | `/api/auth/me` | Профиль текущего пользователя (JWT) |
| GET | `/health` | Проверка работы сервера |

---

## 🔧 ЧТО НУЖНО НАСТРОИТЬ ДО ЗАПУСКА

1. **`frontend/src/pages/AuthPage.jsx`** — строка 5:
   ```js
   const BOT_USERNAME = 'nexus_market_bot' // ← заменить на своего бота
   ```

2. **Вебхук бота** — зарегистрировать после деплоя (см. шаг 5 выше)

3. **JWT_SECRET** — обязательно уникальный для каждого проекта

---

## 📌 СТАТУС СТРАНИЦ

| Страница | Статус | Примечание |
|----------|--------|-----------|
| HomePage | ✅ Готова | Mock данные |
| AuthPage | ✅ Готова | Полный flow с ботом |
| CatalogPage | ✅ Готова | Mock данные |
| ProductPage | ✅ Готова | Mock данные |
| ProfilePage | ✅ Готова | Mock данные |
| SellPage | ✅ Готова | Submit на `/api/products` |
| DealPage | 🔄 В разработке | Следующий этап |
| AdminPage | 🔄 В разработке | Следующий этап |

---

## 🛡 БЕЗОПАСНОСТЬ

- Пароли хэшируются bcrypt (cost factor 12)
- JWT токены — срок 30 дней, секрет из env
- Telegram коды — 6 цифр, TTL 10 минут, одноразовые
- isBanned проверяется при каждом запросе через middleware
- SSL соединение с PostgreSQL в production

---

*NEXUS MARKET — © 2026*
