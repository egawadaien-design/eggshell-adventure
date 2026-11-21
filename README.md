<img src="https://raw.githubusercontent.com/egawadaien-design/eggshell-cat-apng-tool/main/icon/128x128.png" alt="蛋殼喵" height="80" align="left" style="margin-right:12px">
<img src="https://raw.githubusercontent.com/egawadaien-design/eggshell-cat-apng-tool/main/icon/logo-txt-w.png" alt="蛋殼喵 APNG 工具" height="80" align="left">

<br clear="left">

 # EggshellCatWeb — 蛋殼冒險

> EaselJS 2D 網頁關卡遊戲，含帳號註冊／登入、存檔同步與排行榜；資料層走 Supabase。

- 作者：DaiEn
- 建立：2026-11-22

---

## 一、專案現況

- 50 個關卡定義（`js/levels/L_1.js` … `L_50.js`）。
- 四語系：繁中、簡中、英文、日文（`js/i18n.js`）。
- 帳密認證、存檔逐關取 max 同步、前十名排行榜。
- 匿名模式只寫本機 localStorage；登入後拉伺服器存檔與本地合併，過關後推送後端。

## 二、目錄結構

**部署根 = `src/main/resources/static/`**（實際上傳到 Vercel 的就是這個資料夾）：

```
static/
├── index.html               # 入口頁，依序載入指令碼
├── css/app.css
├── js/
│   ├── createjs/            # EaselJS / PreloadJS / TweenJS / SoundJS
│   ├── levels/             # L_1 … L_50 關卡定義
│   ├── fx/                  # 天氣、NPC 走動等效果（除錯／半成品性質）
│   ├── game.js              # 遊戲主狀態機（Preload / Play / Map / 面板）
│   ├── canvas.js            # 舞台、縮放與滑鼠事件
│   ├── images.js           # 圖集與動畫註冊
│   ├── levels.js maps.js map-obstacles.js
│   ├── i18n.js              # 四語字典
│   ├── ads.js               # 品牌占位圖播放
│   ├── Utils.js
│   ├── supabase-config.js   # 前端公開設定（僅 URL + publishable 公開金鑰）
│   └── eruda.min.js         # 行動端除錯面板（預設關閉）
├── assets/art/             # 美術素材
├── assets/sound/            # 音效素材
├── api/                     # Vercel Serverless 函數（正式站後端中繼層）
├── _lib/                    # 函數共用模組（supabase / password / token / save-merge）
├── vercel.json             # /api/* 路由 rewrite、outputDirectory
├── package.json            # ESM 宣告、Node ≥18、無第三方依賴
├── .vercelignore           # 部署排除清單
└── tools/                   # 本機預覽／製作工具頁（正式站排除）
```

## 三、技術棧

| 層 | 技術 |
| --- | --- |
| 前端 | 原生 JavaScript + CreateJS 套件，Canvas 700×800 |
| 本機後端模擬 | Java 17、Spring Boot 4.1.2（STS 開發工具） |
| 正式後端 | Vercel Node Serverless Function（ESM `export default`） |
| 資料庫 | Supabase REST，自訂 `users` 表（不走 Supabase 內建 Auth） |
| 密碼雜湊 | PBKDF2WithHmacSHA256，120,000 次迭代、16-byte salt、256-bit 金鑰 |
| Session | 正式站：HMAC-SHA256 無狀態簽章 token；本機：記憶體 Map |

## 四、本機開發

1. 在 Supabase Dashboard → SQL Editor 執行 `docs/users-table.sql` 建好 `users` 表。
2. 把本機金鑰填入 `src/main/resources/application.properties`：
   - `supabase.url`：Project URL
   - `supabase.service-role-key`：`sb_secret_...` service-role 金鑰
   - `supabase.users-table`：資料表名，預設 `users`
3. 啟動本機服務：
   - Windows：在 repo 根目錄執行 `mvnw.cmd spring-boot:run`
   - 瀏覽器開啟 `http://localhost:8080/`
4. 前端同源 `fetch('/api/...')`，由 Spring Boot 控制器服務；路由與回應契約和 `api/` 函數一致。

## 五、環境變數對照

| 用途 | 本機（`application.properties`） | 正式站（Vercel Environment Variables） |
| --- | --- | --- |
| Supabase Project URL | `supabase.url` | `SUPABASE_URL` |
| service-role 私密金鑰 | `supabase.service-role-key` | `SUPABASE_SERVICE_ROLE_KEY` |
| 資料表名稱 | `supabase.users-table` | `SUPABASE_USERS_TABLE`（可省略，預設 `users`） |
| Token 簽章密鑰 | 不需要（記憶體 token） | `SESSION_SECRET`（長隨機字串） |
| Token 有效秒數 | — | `SESSION_TTL_SECONDS`（可省略，預設 30 天） |

## 六、API 端點一覽

回應一律 JSON：成功 `{ ok: true, ... }`；失敗 `{ ok: false, error: <穩定代碼> }`。

| 路由 | 方法 | 說明 | 失敗代碼 |
| --- | --- | --- | --- |
| `/api/auth/register` | POST | 註冊；成功回 `{ ok, account, token }` | `empty_fields` / `account_too_short`（3–32）/ `weak_password`（6–64）/ `account_exists` / `invalid_payload` / `server_error` |
| `/api/auth/login` | POST | 登入；成功回 `{ ok, account, token }` | `empty_fields` / `invalid_credential` / `invalid_payload` / `server_error` |
| `/api/save` | GET | 帶 `?token=...` 讀取存檔 | `invalid_session` / `server_error` |
| `/api/save/update` | POST | 上傳存檔；後端逐關取 max，總分由資料庫觸發器加總 | `invalid_session` / `invalid_payload` / `server_error` |
| `/api/leaderboard` | GET | 前十名排行；帶有效 token 時附自身名次與領先百分位 | `server_error` |

存檔結構：`{ levelsCompleted, scorePerLevel, starsPerLevel, totalScore }`。
陣列長度上限 200 關；分數只擋負數；星等夾 0–3；`total_score` 不接受前端指定。

## 七、部署到 Vercel

- 在 Settings → Environment Variables 設好第五節列出的變數，**改完要 Redeploy** 才生效。
- `vercel.json` 的 rewrites 不要移除，否則漂亮路由 404。
- `_lib/` 與 `api/` 同層，不要放進 `api/` 底下被識別成獨立端點。
- 單純網頁拖曳上傳通常只發靜態檔，不會把 `api/` 編成 Serverless Function。
- `.vercelignore` 會排除 `tools/`、Markdown 文件、PSD 來源檔與編輯器雜項；`api/`、`_lib/` 務必保留。

## 八、安全分層

- 前端只持有 publishable（anon）公開金鑰；service-role 私密金鑰只存在伺服器端。
- Supabase RLS 開啟但不對 anon／public 開寫入 policy；所有寫入由後端函數用 service-role 代理。
- 密碼以 PBKDF2 雜湊入庫，明文不入庫、不回傳前端。
- 登入失敗回應不區分「帳號不存在」與「密碼錯誤」，統一 `invalid_credential`。

## 九、文件索引

- `api/README.md`：函數清單、契約、共用模組與部署細節。
- `docs/Supabase 登入設置說明.md`：建表、金鑰對照、錯誤代碼、上 GitHub 前檢查。
- `docs/users-table.sql`：`users` 表 DDL、觸發器與索引。
