 api/ — Vercel Serverless Function（正式站後端中繼層）

這個資料夾的用途：**在 Vercel 伺服器端代理「註冊／登入／存檔讀寫」到 Supabase**，
讓 `service_role` 私密金鑰永遠不會出現在前端程式碼裡。

- 作者：DaiEn
- 建立：2026-11-21
- 對應平台：Vercel（Node Serverless Function，ESM `export default`）
- 本機開發：同一組 `/api/*` 路由由 Spring Boot 控制器服務，契約與本資料夾函數一致

---

## 一、為什麼要有這一支後端

`service_role` key 可以跳過 RLS 直接讀寫資料庫，權限等於整個專案。
放前端 = 任何人 F12 就能抄走亂改。所以正式靜態站的流程是：

```
瀏覽器 ──帳密／存檔 JSON──▶ Vercel Function ──service_role──▶ Supabase（users 表）
                              ↑ 金鑰只存在這裡的環境變數
```

前端手上只有 `js/supabase-config.js` 的 publishable（anon）公開金鑰。

本機開發時，同樣的中繼角色由 Spring Boot 控制器擔任：

| 職責 | 本機（Spring Boot） | 正式站（Vercel Function） |
| --- | --- | --- |
| 註冊／登入 | `src/main/java/.../controller/AuthController.java` | `api/auth/register.js`、`api/auth/login.js` |
| 存檔讀寫 | `src/main/java/.../controller/SaveController.java` | `api/save.js`、`api/save/update.js` |
| 排行榜 | `src/main/java/.../controller/LeaderboardController.java` | `api/leaderboard.js` |
| 私密金鑰 | `application.properties` | Vercel 環境變數 `SUPABASE_SERVICE_ROLE_KEY` |
| session 存放 | 記憶體 Map（`SessionStore`） | 無狀態 HMAC 簽章 token（`_lib/token.js`） |

---

## 二、檔案清單

| 檔案 | 用途 | 路由 |
| --- | --- | --- |
| `auth/register.js` | 檢查帳號未被使用 → PBKDF2 雜湊入庫 → 核發 token | `POST /api/auth/register` |
| `auth/login.js` | 取回雜湊比對密碼 → 核發 token | `POST /api/auth/login` |
| `save.js` | 驗證 token → 回傳該帳號存檔 | `GET /api/save?token=...` |
| `save/update.js` | 驗證 token → 與庫存檔逐關取 max → 寫回並回傳合併結果 | `POST /api/save/update` |
| `leaderboard.js` | 前十名排行；帶有效 token 時附自身名次與領先百分位 | `GET /api/leaderboard?token=...` |

共用模組在上層 `../_lib/`（與 `api/` 同層的部署根 `_lib/`，不是函數入口，不會被當成獨立端點）：

| 模組 | 用途 |
| --- | --- |
| `_lib/supabase.js` | 環境變數讀取、REST 標頭、CORS、統一回應、依帳號查詢 |
| `_lib/password.js` | PBKDF2WithHmacSHA256 雜湊／驗證，參數與 Java `PasswordHasher` 一致 |
| `_lib/token.js` | HMAC-SHA256 無狀態 token 簽發／驗證（含到期時間） |
| `_lib/save-merge.js` | 存檔陣列校驗、逐關取 max、對外 payload 組裝 |

路由對應見部署根 `vercel.json` 的 `rewrites`。

---

## 三、端點契約

回應一律 JSON：成功 `{ ok: true, ... }`；失敗 `{ ok: false, error: <穩定代碼> }`。

### `POST /api/auth/register`

請求 `{ "account": "...", "password": "..." }`

- 成功 200：`{ "ok": true, "account": "...", "token": "..." }`
- 失敗：`empty_fields` / `account_too_short`（3–32）/ `weak_password`（6–64）/ `account_exists` / `invalid_payload` / `server_error`

### `POST /api/auth/login`

請求 `{ "account": "...", "password": "..." }`

- 成功 200：`{ "ok": true, "account": "...", "token": "..." }`
- 失敗：`empty_fields` / `invalid_credential` / `invalid_payload` / `server_error`

### `GET /api/save?token=...`

- 成功 200：`{ "ok": true, "account": "...", "save": { "levelsCompleted", "scorePerLevel", "starsPerLevel", "totalScore" } }`
- 失敗：`invalid_session` / `server_error`

### `POST /api/save/update`

請求 `{ "token": "...", "levelsCompleted": 2, "scorePerLevel": [..], "starsPerLevel": [..] }`

- 成功 200：`{ "ok": true, "account": "...", "save": <合併後存檔> }`
- 失敗：`invalid_session` / `invalid_payload` / `server_error`
- 規則：陣列長度上限 200 關；分數只擋負數不設上限；星等夾 0–3；逐關取 max；`total_score` 由資料庫觸發器加總，不接受前端指定。

---

## 四、環境變數（Vercel → Settings → Environment Variables）

| Key | 說明 |
| --- | --- |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...`（**不是** `sb_publishable_`） |
| `SUPABASE_USERS_TABLE` | 可省略，預設 `users` |
| `SESSION_SECRET` | token HMAC 簽章密鑰，自行產生一串長隨機字串；遺漏時端點回 `server_error` |
| `SESSION_TTL_SECONDS` | 可省略，token 有效秒數，預設 30 天 |

三個環境（Production / Preview / Development）都要勾；**改完要重新部署**才生效。

---

## 五、session token 說明

- 格式：`base64url(payload).base64url(HMAC-SHA256(payload, SESSION_SECRET))`，payload 含 `account` 與 `exp`。
- 無狀態：各函數各自驗章，不依賴共享記憶體，適合 Serverless 多實例。
- 限制：到期前無法伺服器端作廢；登出目前由前端清除本機 session。需要「主動登出即失效」時，再改 Supabase sessions 表持久化方案。
- 本機 Spring Boot 發的是 32-hex 記憶體 token；部署後舊 token 全部失效屬預期行為，前端收到 401 會清除 session 回到匿名本地模式。

---

## 六、安全檢查清單

- 前端原始碼（含 `_lib` 以外的 static JS）搜尋不到 `sb_secret_` 字串。
- `_lib/*.js` 不含任何明文金鑰，只讀 `process.env`；本資料夾檔案部署後雖可被下載，但內部沒有機密。
- 直接對 `/api/auth/login` 打亂碼密碼不會洩漏帳號是否存在（回應同為 `invalid_credential`）。
- Supabase RLS 不對 anon/public 開寫入 policy；寫入一律經函數用 service_role 代理。

---

## 七、部署注意

- 部署根配置：上傳到 Vercel 的資料夾就是本 `static/`（部署根）；`api/**` 為函數入口，`_lib/` 為共用模組，`index.html` 與 `js/`、`css/`、`assets/` 為前端靜態來源；`vercel.json` 的 `outputDirectory` 為 `"."`（部署根本身），rewrites 不要移除，否則漂亮路由 404。
- 函數要經建置才會生效：用 Git 連結（Root Directory 指到本資料夾）或在本資料夾跑 `vercel` CLI；單純網頁拖曳上傳通常只發靜態檔，不會把 `api/` 編成 Serverless Function。
- 函數入口一律 `api/**/*.js`；`_lib/` 與 `api/` 同層，不要放進 `api/` 底下被識別成端點。
- 前端是同源 `fetch('/api/...')`，不需額外 CORS 放行；函數內仍補了 CORS 標頭方便本機除錯。
- STS／Spring Boot 只是本機開發工具：`src/main/java/` 不在部署根內，正式後端一律由部署根 `api/` 函數承接。

