/**
 * 天氣特效層 —— 夜晚 / 下雨 / 打雷 / 起霧 / 降雪（每種都有等級）
 *
 * 使用方式（只掛在選關頁）：
 *   SelectLevelState.prototype.init() 內呼叫 WeatherSystem.g_instance.attach(this)
 *   離開選關頁不用手動關，_tick 會自己判斷本頁是否仍是最上層，不是就自動卸載。
 *
 * 等級設定（每組都是「關 + N 級」，全部走連續插值，所以切換一定是慢慢過渡、不會硬跳）：
 *   夜晚 → 關 / 黃昏 / 夜晚 / 深夜 / 凌晨   每級 2.5 秒漸變，色調與暗度一起插值
 *   下雨 → 關 / 小雨 / 雨 / 暴雨             濃度、落速、透明度隨等級插值，粒子由上方慢慢補進
 *   打雷 → 關 / 雷 / 暴雷                    雷＝只有閃光；暴雷＝閃光＋鋸齒落雷＋地面火光 3~6 秒
 *   起霧 → 關 / 小霧 / 霧 / 濃霧             濃度＝fog_ani.png 的透明度，2.5 秒漸入
 *                                            同一張圖頭尾相接，相鄰兩份左右鏡射交替，接縫不會有斷層
 *   降雪 → 關 / 小雪 / 雪 / 暴雪             粒子數、雪花大小、透明度隨等級插值
 *
 * 打雷間隔：
 *   設定值在 TUNE.thunder.interval（雷 10 分鐘、暴雷 5 分鐘，單位毫秒）。
 *   實際間隔 = 取「設定值 / 2」到「設定值」之間的隨機值（例：10 分鐘 → 5 ~ 10 分鐘）。
 *   Constants.DEBUG_MODE 為 true 時套用 TUNE.thunder.debugTimeScale（0.05），
 *   把間隔壓成 1/20 方便測試（10 分鐘 → 30 秒級）；正式環境請保持 1。
 *
 * 繪製策略（為什麼不走 WebGL）：
 *   1. 本專案的 EaselJS 是 0.7.1，沒有 StageGL。要走 GPU 只能另開一張 WebGL canvas，
 *      再自己處理尺寸同步、與遊戲畫面的合成順序、context lost 復原，成本遠大於收益。
 *   2. 夜晚最需要的「正片疊底」混合，EaselJS 的 DisplayObject.compositeOperation 直接吃得到
 *      （渲染時就是 canvas 的 globalCompositeOperation），跟原本 CSS 的做法像素級等價。
 *   3. 粒子量最多約 200 顆，用 2D canvas 分批一次 stroke / fill 就足以 60fps。
 *   若日後真要 GPU 路徑，只要把 _render 換成「單一 fullscreen quad + fragment shader」，
 *   對外介面（attach / detach / setLevel / allOff）完全不必動。
 *
 * 圖層順序（關鍵）：
 *   天氣圖層不是 DOM 遮罩，而是掛進「遊戲畫布」的 createjs.Container，
 *   插入位置＝第一個 GUI 子物件之前，所以疊放順序是：
 *       地圖（含太陽、雲、樹…） → 天氣圖層 → GUI（上方選單、左下角廣告圖標、按鈕）
 *   這樣 GUI 天生就壓在天氣之上，遮罩不必再切方塊避開它們（切块會留下看得見的接縫）。
 *
 *   天氣圖層內部（由下到上）：
 *     particleBmp  Bitmap(離屏 Canvas 2D)  雨 / 雪 / 霧 / 落雷 / 地面火光（夜間會被下面的夜晚層一起壓暗）
 *     nightShape   Shape ＋ multiply      夜晚／黃昏／深夜／凌晨（顏色與透明度每幀插值）
 *     flashShape   Shape ＋ screen        雷的閃光（近白）
 *     gcoShape     透明 1×1 哨兵          把 compositeOperation 還原成 source-over
 *                                          （EaselJS 0.7.1 只會設定、從不還原，不還原會連 GUI 一起被混合）
 *   全部 mouseEnabled = false，點擊／觸控照樣穿過去。
 *
 *   測試選單仍然是 DOM（z-index 13，畫布之上）：
 *   左上角「控制按鈕」→ 往下展開主選單 → 各組往右展開等級按鈕。
 *   全部用 assets/art/map/weather.png 的格子圖，一個字都不顯示（見 images.js 的 weather_icons 圖組）。
 *   圖組裡沒有「關」的格子，所以「再按一次同一顆已選的等級」＝關掉。
 *   同時只展開一組；選中的那顆與有開的組會加一圈金框；點空白處收起整個選單。
 *   按鈕尺寸跟遊戲單位等比（32 遊戲單位 → 32×畫面縮放，最少 1 倍）。
 *
 * 與遊戲 UI 的關係（這兩個 UI 是畫在遊戲畫布裡的 EaselJS 物件，DOM 遮罩壓上去一定比較高，
 * 硬挖洞就會留下接縫，所以改成「把天氣層放回畫布裡、排在 GUI 之下」）：
 *   保留區 1：上方選單 map_menu（700×86，最後停在 y=89/2，下緣 87.5 遊戲單位）
 *   保留區 2：左下角贊助商／廣告圖標（SELECT_LEVEL_LAYOUT 的 logo，預設中心 x=105, y=785）
 *   → 不再切塊、不再 clearRect：GUI 物件本身就在天氣層之上，天然不會被壓暗／蓋住
 *   → 雨、雪、霧、落雷、火光、夜色、閃光全片覆蓋，邊緣不再有補丁感
 *   navBottomCss 只留下來當「落雷的天空起點」，不再用來挖洞。
 *
 * 落雷落點：
 *   範圍用「可見地圖」＝ 內容區（700×800）與畫布的可見交集，上緣再避開上方選單；
 *   內容區比螢幕還高時（內容置中、上下被切掉一點），這樣落點才不會全擠在螢幕下半段。
 *   高度：每次在 TUNE.thunder.groundMin ~ groundMax（預設 0.12~0.94，佔可見地圖高度）
 *         之間取一個，且與上一發至少差 6% 高度，所以不會每道都劈在同一條水平線上。
 *   橫向：落點走黃金比例低差異序列，連續幾十道會平均散在可見地圖寬度內。
 *
 * 夜晚關燈：
 *   「關」不逐級回退（深夜要 7.5 秒、且會先變夜晚色再變黃昏色），
 *   改成一律在 TUNE.night.fadeOut（4 秒）內無條件轉回天亮。
 *
 * @author DaiEn
 * @Date 2026-11-18
 * @Correction 14
 */
var WeatherSystem = (function() {
	// 每一個「組」＝主選單裡的一顆按鈕；fade 是「每升一級」所需的秒數
	// cell 是這組標題按鈕在按鈕圖組裡的格子名稱，cells 是各等級的格子（0 = 關，沒有圖所以留 null）
	var GROUPS = [{
			key: "night",
			title: "夜晚",
			fade: 2.5,
			cell: "night",
			levels: ["關", "黃昏", "夜晚", "深夜", "凌晨"],
			cells: [null, "night_dusk", "night_night", "night_deep", "night_dawn"]
		},
		{
			key: "rain",
			title: "下雨",
			fade: 2.0,
			cell: "rain",
			levels: ["關", "小雨", "雨", "暴雨"],
			cells: [null, "rain_light", "rain_mid", "rain_heavy"]
		},
		{
			key: "thunder",
			title: "打雷",
			fade: 0.5,
			cell: "thunder",
			levels: ["關", "雷", "暴雷"],
			cells: [null, "thunder_mid", "thunder_heavy"]
		},
		{
			key: "fog",
			title: "起霧",
			fade: 2.5,
			cell: "fog",
			levels: ["關", "小霧", "霧", "濃霧"],
			cells: [null, "fog_light", "fog_mid", "fog_heavy"]
		},
		{
			key: "snow",
			title: "降雪",
			fade: 2.0,
			cell: "snow",
			levels: ["關", "小雪", "雪", "暴雪"],
			cells: [null, "snow_light", "snow_mid", "snow_heavy"]
		}
	];

	// 控制按鈕圖組：assets/art/map/weather.png（160×128，5 欄 × 4 列，每格 32×32）
	// 這張圖在 images.js 的 athlases 裡登記成 weather_icons，會被遊戲的預載清單自動帶上。
	var BTN_SHEET = "assets/art/map/weather.png";
	var BTN_SHEET_W = 160;
	var BTN_SHEET_H = 128;
	var BTN_CELL = 32;

	// 每一格在圖裡的 [欄, 列]（座標 = 欄×32, 列×32）
	var BTN_CELLS = {
		ctrl: [0, 0], // 控制按鈕（與「夜晚」標題同一格：太陽）
		night: [0, 0], // 夜晚
		night_dusk: [1, 0], // 黃昏
		night_night: [2, 0], // 夜晚
		night_deep: [3, 0], // 深夜
		night_dawn: [4, 0], // 凌晨
		rain: [0, 1], // 下雨
		rain_light: [1, 1], // 小雨
		rain_mid: [2, 1], // 雨
		rain_heavy: [3, 1], // 暴雨
		thunder: [4, 1], // 打雷
		snow: [0, 2], // 降雪
		snow_light: [1, 2], // 小雪
		snow_mid: [2, 2], // 雪
		snow_heavy: [3, 2], // 暴雪
		thunder_mid: [4, 2], // 雷
		thunder_heavy: [4, 3], // 暴雷
		fog: [0, 3], // 起霧
		fog_light: [1, 3], // 小霧
		fog_mid: [2, 3], // 霧
		fog_heavy: [3, 3] // 濃霧
	};

	// 夜晚四段色調（r / g / b 為正片疊底的顏色，a 為該段可壓到多暗）
	var NIGHT_TINT = [
		{ r: 0, g: 0, b: 0, a: 0 }, // 關
		{ r: 186, g: 112, b: 60, a: 0.44 }, // 黃昏：暖橘
		{ r: 40, g: 48, b: 112, a: 0.62 }, // 夜晚：藍
		{ r: 10, g: 12, b: 34, a: 0.84 }, // 深夜：近黑藍
		{ r: 72, g: 74, b: 142, a: 0.52 } // 凌晨：紫藍
	];

	// 雨：濃度倍率 / 落速倍率 / 透明度倍率（對應 關·小雨·雨·暴雨）
	var RAIN_COUNT = [0, 0.45, 1.0, 1.85];
	var RAIN_SPEED = [0, 0.90, 1.0, 1.18];
	var RAIN_ALPHA = [0, 0.80, 1.0, 1.12];

	// 雪：濃度倍率 / 雪花大小倍率 / 透明度倍率（對應 關·小雪·雪·暴雪）
	var SNOW_COUNT = [0, 0.45, 1.0, 1.90];
	var SNOW_SIZE = [0, 0.85, 1.0, 1.15];
	var SNOW_ALPHA = [0, 0.85, 1.0, 1.05];

	// 霧：只靠透明度表現濃淡（對應 關·小霧·霧·濃霧）
	// 依回饋「看不見」整體乘一倍（原本 0 / 0.13 / 0.27 / 0.50）
	var FOG_ALPHA = [0, 0.50, 0.75, 1.00];

	// 手感調校區
	var TUNE = {
		rain: {
			base: 70, // 基準顆數（「雨」等級、畫面寬 700 時）
			minLen: 12,
			maxLen: 26,
			minSpeed: 420, // CSS px / 秒
			maxSpeed: 720,
			slant: 0.16, // 斜度：每往下 1，往左 0.16
			alpha: 0.55
		},
		snow: {
			base: 55,
			minR: 1.2,
			maxR: 3.0,
			minSpeed: 55,
			maxSpeed: 130,
			sway: 26, // 左右飄的最大幅度（px）
			alpha: 0.70
		},
		fog: {
			dirMin: 60, // 每隔 16~30 秒換一次流向
			dirMax: 90,
			speed: 34, // 基準流速（px / 秒）
			reverseTime: 10.0, // 反向要花幾秒慢慢轉過去
			breathe: 0.08 // 透明度呼吸幅度
		},
		thunder: {
			// 打雷間隔設定值（毫秒）：雷 10 分鐘、暴雷 5 分鐘
			interval: [0, 10 * 60 * 1000, 5 * 60 * 1000],
			peakFlash: [0, 0.70, 0.95], // 閃光亮度上限
			groundMin: 0.12, // 落雷打在「可見地圖」的高度範圍（可見地圖高度的比例，不是整個 800）
			groundMax: 0.94, // 每次隨機取範圍內一個值，所以不會每道都劈在同一條水平線
			groundGap: 0.06, // 與上一道落雷至少差這麼多高度（0.06 = 可見地圖高度的 6%）
			boltLife: 0.45, // 落雷可見時間
			fireMin: 3.0, // 地面火光最短持續
			fireMax: 6.0, // 最長持續
			debugTimeScale: 0.05 // DEBUG_MODE 時把間隔壓成 1/20
		},
		night: {
			fadeOut: 4.0 // 選「關」時，不管目前是哪一段，都在這個秒數內轉回天亮
		}
	};

	// 閃光亮度序列：[時間(秒), 亮度]，線性插值重播，做出「兩段閃」的雷感
	var FLASH_KEYS = [
		[0.00, 0.90],
		[0.09, 0.12],
		[0.16, 0.78],
		[0.30, 0.00],
		[0.34, 0.55],
		[0.55, 0.00]
	];

	// 落雷本身的閃爍序列
	var BOLT_KEYS = [
		[0.00, 1.00],
		[0.10, 0.30],
		[0.18, 0.90],
		[0.45, 0.00]
	];

	// 上導航資訊列（map/map_menu 這張圖是 700×86、以中心點對齊）
	// 面板最後停在 y = 89/2，所以底邊 = 89/2 + 86/2 = 87.5（遊戲單位）
	var NAV_BAR_BOTTOM = 89 / 2 + 86 / 2;

	// 舊 WebView 沒有 rAF 時的退化寫法
	var raf = window.requestAnimationFrame || function(cb) {
		return setTimeout(function() {
			cb(new Date().getTime());
		}, 16);
	};
	var caf = window.cancelAnimationFrame || function(id) {
		clearTimeout(id);
	};

	// 陣列插值（pos 可能是小數，用來做等級之間的平滑過渡）
	function interp(arr, pos) {
		var max = arr.length - 1;
		if (pos <= 0) {
			return arr[0];
		}
		if (pos >= max) {
			return arr[max];
		}

		var i = Math.floor(pos);
		var f = pos - i;
		return arr[i] + (arr[i + 1] - arr[i]) * f;
	}

	function WeatherSystem() {
		this.owner = null;
		this.attached = false;
		this.domReady = false;

		this.time = 0;
		this.lastTs = 0;
		this.rafId = 0;
		this.frameCount = 0;

		// 圖層
		// 夜晚與閃光不再是 DOM 遮罩，而是畫進遊戲畫布裡的一層（插在 GUI 之下、地圖之上）。
		// 這樣「上方選單」與「左下角廣告圖標」天生就壓在天氣之上，遮罩不必再切方塊、
		// 也就不會出現接縫（邊緣露白／補丁感）。
		this.fxCon = null; // createjs.Container：粒子 → 夜晚 → 閃光 → 收尾哨兵
		this.particleBmp = null; // 把離屏粒子畫布貼進畫布的 Bitmap
		this.nightShape = null; // 夜晚（multiply）
		this.flashShape = null; // 打雷閃光（screen）
		this.gcoShape = null; // 收尾哨兵：把 compositeOperation 還原成 source-over
		this.canvas = null; // 離屏粒子畫布（不進 DOM）
		this.ctx = null;
		this.barEl = null;
		this.ctrlEl = null; // 控制按鈕
		this.mainEl = null; // 往下展開的主選單
		this.rows = {}; // key -> { row, head, box, btns }
		this.menuKey = null; // 目前展開的組
		this.btnScale = 1; // 32×32 格子換算成 CSS px 的比例
		this._docClickBind = null;

		// 尺寸（CSS px）
		this.cssW = 0;
		this.cssH = 0;
		this.dpr = 1;

		// 內容區（700×800）在畫面上的實際位置
		this.contentTop = 0;
		this.contentScale = 1;
		this.contentOffsetY = 0;
		this.contentH = 0;
		this.navBottomCss = 0; // 上方選單的下緣（圖層座標，落雷用它當地圖上緣）

		// 目標等級（整數）與目前等級（浮點，負責淡入淡出）
		this.level = {};
		this.pos = {};

		for (var i = 0; i < GROUPS.length; i++) {
			this.level[GROUPS[i].key] = 0;
			this.pos[GROUPS[i].key] = 0;
		}

		// 打雷
		this.thunderClock = 0; // 從掛上開始累計的秒數
		this.nextStrike = Infinity; // 下一次打雷的時間點（秒）
		this.flash = 0;
		this.flashSeq = -1;
		this.bolt = null; // 目前這道落雷的幾何
		this.boltT = -1;
		this.fire = null; // 地面火光
		this.boltSeq = Math.random(); // 落點橫向均勻鋪開用的低差異序列（0~1）
		this.lastGroundRatio = -1; // 上一道落雷的地面高度比例，用來避免連續劈在同一條線
		this.thunderTimer = 0; // 雷聲延遲計時器（閃光後 200ms 播出）
		this.rainInstance = null; // 雨聲循環實例（下雨中保持一支，雨停即釋放）

		// 粒子池（預先配置到「最大等級」的數量，實際只畫前 N 顆）
		this.rain = [];
		this.snow = [];
		this.rainActive = 0;
		this.snowActive = 0;

		// 貼圖
		this.fogImg = null; // fog_ani.png（或程式生成的替代貼圖）
		this.fogLayers = []; // 兩層不同速度，避免看出重複節奏
		this.fogDirTarget = 1;
		this.fogDir = 1;
		this.fogDirTimer = 0;
		this.fireTex = null;

		// 上一次寫進圖層的值，避免每幀都重建圖形
		this.lastNightKey = "";
		this.lastNightAlpha = -1;
		this.lastFlashAlpha = -1;
	}

	/* ------------------------------------------------------------------ *
	 *  DOM 建立
	 * ------------------------------------------------------------------ */

	WeatherSystem.prototype._buildDom = function() {
		if (this.domReady) {
			return;
		}

		// 粒子畫布：改成「離屏」，不再貼在畫面最上層
		// 它會以 Bitmap 的形式被塞進遊戲畫布的圖層裡，所以畫面座標系仍然是 CSS px
		var canvas = document.createElement("canvas");
		this.canvas = canvas;
		this.ctx = canvas.getContext ? canvas.getContext("2d") : null;

		// 貼圖：霧（優先吃 assets/art/map/fog_ani.png）與地面火光
		this._loadFogTexture();
		this.fireTex = this._makeFireTexture();

		this.domReady = true;

		// 天氣圖層（夜晚/閃光/粒子）：掛在遊戲畫布的 GUI 之下
		this._buildFxCon();

		// 圖片式巢狀選單（受 Constants.DEBUG_MODE 控制，DOM 層，自然在畫布最上層）
		this._buildDebugBar();
	};

	// 建天氣圖層：粒子 → 夜晚 → 閃光，全部畫在同一張遊戲畫布上
	WeatherSystem.prototype._buildFxCon = function() {
		if (this.fxCon) {
			return;
		}

		// createjs 由 index.html 在 game.js 之前載入；萬一沒有就先不建（避免整頁掛掉）
		if (typeof createjs === "undefined" || !createjs.Container) {
			return;
		}

		var W = Constants.ASSETS_WIDTH;
		var H = Constants.ASSETS_HEIGHT;

		var con = new createjs.Container();
		con.mouseEnabled = false; // 不吃點擊，觸控照樣穿過去給 GUI
		con.mouseChildren = false;
		con.visible = false;

		// 1) 粒子：雨 / 雪 / 霧 / 落雷 / 地面火光（畫在離屏畫布，再當圖貼上來）
		this.particleBmp = new createjs.Bitmap(this.canvas);
		this.particleBmp.mouseEnabled = false;
		this.particleBmp.x = 0;
		this.particleBmp.y = 0;

		// 2) 夜晚：multiply 混合，跟原來的 DOM 圖層算法一模一樣
		this.nightShape = new createjs.Shape();
		this.nightShape.mouseEnabled = false;
		this.nightShape.compositeOperation = "multiply";

		// 3) 打雷閃光：screen 混合（近白）
		this.flashShape = new createjs.Shape();
		this.flashShape.mouseEnabled = false;
		this.flashShape.compositeOperation = "screen";

		// 4) 收尾哨兵：把 compositeOperation 還原成 source-over
		//    EaselJS 0.7.1 在畫子物件時會把 compositeOperation 直接寫進共用的 canvas context，
		//    而整個函式庫沒有任何一處會把它還原（原始碼裡連 "source-over" 都沒有）。
		//    少了這一步，之後才畫的 GUI（上選單、logo、按鈕）會一起被 multiply/screen 汙染。
		//    這裡放一個完全透明、1×1 的方塊：畫下去沒有任何像素變化，但會把混合模式設回來。
		this.gcoShape = new createjs.Shape();
		this.gcoShape.mouseEnabled = false;
		this.gcoShape.compositeOperation = "source-over";
		this.gcoShape.graphics.beginFill("rgba(0,0,0,0)").drawRect(0, 0, 1, 1);

		con.addChild(this.particleBmp);
		con.addChild(this.nightShape);
		con.addChild(this.flashShape);
		con.addChild(this.gcoShape);

		this.fxCon = con;

		// 先畫一次墊底（顏色之後隨等級更新）
		this._drawNightShape(0, 0, 0);
		this.flashShape.graphics.clear();
		this.flashShape.graphics.beginFill("rgb(255,252,240)").drawRect(0, 0, W, H);
		this.nightShape.alpha = 0;
		this.flashShape.alpha = 0;
	};

	// 夜晚色塊重畫（只有顏色真的變了才重建圖形）
	WeatherSystem.prototype._drawNightShape = function(r, g, b) {
		if (!this.nightShape) {
			return;
		}

		this.nightShape.graphics.clear();
		this.nightShape.graphics.beginFill("rgb(" + r + "," + g + "," + b + ")").drawRect(0, 0, Constants.ASSETS_WIDTH, Constants.ASSETS_HEIGHT);
	};

	// 把天氣圖層插進遊戲畫布的「GUI 之下、地圖之上」
	// owner 是 DNGameState（選關頁），GUI 物件都掛在它身上（owner.gui 陣列）
	WeatherSystem.prototype._mountFx = function() {
		var owner = this.owner;

		if (!owner || !owner.addChild || !this.fxCon) {
			return false;
		}

		if (this.fxCon.parent === owner) {
			return true;
		}

		if (this.fxCon.parent) {
			this.fxCon.parent.removeChild(this.fxCon);
		}

		// 找第一個 GUI 子物件的索引 → 插在它前面，就等於在 GUI 之下
		var idx = owner.getNumChildren ? owner.getNumChildren() : 0;

		if (owner.gui && owner.getChildIndex) {
			for (var i = 0; i < owner.gui.length; i++) {
				var at = owner.getChildIndex(owner.gui[i]);
				if (at >= 0 && at < idx) {
					idx = at;
				}
			}
		}

		if (owner.addChildAt) {
			owner.addChildAt(this.fxCon, idx);
		} else {
			owner.addChild(this.fxCon);
		}

		return true;
	};

	// 霧的貼圖：先跟已載入的資源要 fog_ani.png，拿不到就用程式生成的無縫雜訊圖頂著
	WeatherSystem.prototype._loadFogTexture = function() {
		var img = null;

		try {
			if (typeof DNAssetsManager !== "undefined" && DNAssetsManager.g_instance) {
				img = DNAssetsManager.g_instance.getResult(Images.FOG_ANI);
			}
		} catch (e) {
			img = null;
		}

		if (img && (!img.width || !img.height)) {
			img = null;
		}

		if (img) {
			this.fogImg = img;
		} else {
			this.fogImg = this._makeNoiseTile(512);
		}

		// 單層、同一張圖頭尾相接：相鄰兩份左右鏡射交替（mirror），
		// 這樣就算美術圖的左右邊緣沒有對齊，接縫兩側也是「同一條邊自己相接」，看不出斷層。
		this.fogLayers = [{
			scale: 1.0,
			speed: 1.0,
			alpha: 1.0,
			mirror: true,
			offset: 0
		}];
	};

	// 程式生成的「可平鋪」霧貼圖：整數頻率的正弦疊加，天生左右可接、不會有接縫
	WeatherSystem.prototype._makeNoiseTile = function(size) {
		var tex = document.createElement("canvas");
		tex.width = size;
		tex.height = size;

		var tctx = tex.getContext("2d");
		if (!tctx || !tctx.createImageData) {
			return null;
		}

		// [振幅, x 方向頻率, y 方向頻率, 相位]
		var terms = [
			[1.00, 1, 2, 0.61],
			[0.72, 2, 3, 1.93],
			[0.48, 3, 1, 3.42],
			[0.34, 5, 4, 5.11],
			[0.24, 7, 6, 0.33],
			[0.16, 11, 9, 2.24]
		];
		var ampSum = 0;
		for (var t = 0; t < terms.length; t++) {
			ampSum += terms[t][0];
		}

		var data = tctx.createImageData(size, size);
		var px = data.data;

		for (var y = 0; y < size; y++) {
			for (var x = 0; x < size; x++) {
				var v = 0;
				for (var k = 0; k < terms.length; k++) {
					var tm = terms[k];
					v += tm[0] *
						Math.sin(6.2832 * tm[1] * x / size + tm[3]) *
						Math.sin(6.2832 * tm[2] * y / size + tm[3] * 1.7);
				}

				// 正規化成 0~1，再拉高對比讓霧有「厚薄」
				var n = Utils.Clamp((v / ampSum + 1) * 0.5, 0, 1);
				n = Math.pow(Utils.Clamp((n - 0.34) / 0.62, 0, 1), 1.35);

				var idx = (y * size + x) * 4;
				px[idx] = 232;
				px[idx + 1] = 240;
				px[idx + 2] = 255;
				px[idx + 3] = Math.round(n * 255);
			}
		}

		tctx.putImageData(data, 0, 0);
		return tex;
	};

	// 地面火光的柔邊貼圖（只建一次）
	WeatherSystem.prototype._makeFireTexture = function() {
		var size = 128;
		var tex = document.createElement("canvas");
		tex.width = size;
		tex.height = size;

		var tctx = tex.getContext("2d");
		if (!tctx) {
			return null;
		}

		var g = tctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
		g.addColorStop(0.0, "rgba(255,244,206,1)");
		g.addColorStop(0.22, "rgba(255,196,96,0.92)");
		g.addColorStop(0.48, "rgba(255,132,38,0.55)");
		g.addColorStop(0.78, "rgba(150,40,0,0.18)");
		g.addColorStop(1.0, "rgba(120,20,0,0)");

		tctx.fillStyle = g;
		tctx.fillRect(0, 0, size, size);

		return tex;
	};

	/* ------------------------------------------------------------------ *
	 *  測試選單：控制按鈕（左上、上選單下方）→ 往下展開主選單 → 各組往右展開設置
	 * ------------------------------------------------------------------ */

	WeatherSystem.prototype._buildDebugBar = function() {
		// 跟遊戲共用的除錯開關：Constants.DEBUG_MODE（game.js 的 Constants 區塊）
		// 為 false 就不建立，連 DOM 都不佔。
		/*if (!Constants.DEBUG_MODE) {
			return;
		}*/
		if (this.barEl) {
			return;
		}

		var _this = this;
		var i;

		var bar = document.createElement("div");
		bar.style.cssText = "position:fixed;left:0;top:0;z-index:13;display:none;flex-direction:column;" +
			"pointer-events:none;-webkit-user-select:none;user-select:none;";

		// 控制按鈕：按下往「下」展開主選單
		this.ctrlEl = this._makeButton("ctrl");
		this.ctrlEl.onclick = function() {
			_this._toggleMain();
			return false;
		};
		bar.appendChild(this.ctrlEl);

		// 主選單：直排五組（夜晚 / 下雨 / 打雷 / 起霧 / 降雪）
		var main = document.createElement("div");
		main.style.cssText = "display:none;flex-direction:column;pointer-events:none;";
		bar.appendChild(main);
		this.mainEl = main;

		this.rows = {};

		for (i = 0; i < GROUPS.length; i++) {
			var g = GROUPS[i];

			var row = document.createElement("div");
			row.style.cssText = "display:flex;align-items:flex-start;pointer-events:none;";

			// 組標題按鈕：按下往「右」展開自己的等級按鈕
			var head = this._makeButton(g.cell);
			head.onclick = (function(group) {
				return function() {
					_this._toggleGroup(group.key);
					return false;
				};
			})(g);
			row.appendChild(head);

			// 等級按鈕：橫排，預設收起
			var lvBox = document.createElement("div");
			lvBox.style.cssText = "display:none;align-items:flex-start;flex:0 0 auto;pointer-events:none;";

			var btns = [];
			for (var lv = 1; lv < g.levels.length; lv++) {
				var b = this._makeButton(g.cells[lv]);

				b.onclick = (function(group, levelValue) {
					return function() {
						// 圖組裡沒有「關」的格子，所以「再按一次同一顆」就當作關掉
						_this.setLevel(group.key, _this.level[group.key] === levelValue ? 0 : levelValue);
						return false;
					};
				})(g, lv);

				lvBox.appendChild(b);
				btns.push(b);
			}

			row.appendChild(lvBox);
			main.appendChild(row);

			this.rows[g.key] = {
				row: row,
				head: head,
				box: lvBox,
				btns: btns
			};
		}

		document.body.appendChild(bar);
		this.barEl = bar;

		// 點空白處收起（連展開的那一組一起收）
		this._docClickBind = function(e) {
			if (!_this.barEl) {
				return;
			}
			if (_this.barEl.contains && _this.barEl.contains(e.target)) {
				return;
			}
			_this._closeMenu();
		};
		document.addEventListener("mousedown", this._docClickBind, true);

		this._syncButtons();
	};

	// 依格子名稱建立一顆圖示按鈕（不帶任何文字）
	WeatherSystem.prototype._makeButton = function(cellName) {
		var el = document.createElement("div");
		el.__cell = cellName;
		el.style.cssText = "pointer-events:auto;cursor:pointer;border-radius:5px;flex:0 0 auto;" +
			"background-image:url(" + BTN_SHEET + ");background-repeat:no-repeat;" +
			"-webkit-tap-highlight-color:transparent;";
		this._applyCellSize(el);
		return el;
	};

	// 32×32 的格子依畫面縮放成 CSS px（跟遊戲單位一起等比）
	WeatherSystem.prototype._applyCellSize = function(el) {
		if (!el || !el.__cell) {
			return;
		}

		var c = BTN_CELLS[el.__cell];
		if (!c) {
			return;
		}

		var k = this.btnScale || 1;

		el.style.width = (BTN_CELL * k) + "px";
		el.style.height = (BTN_CELL * k) + "px";
		el.style.backgroundSize = (BTN_SHEET_W * k) + "px " + (BTN_SHEET_H * k) + "px";
		el.style.backgroundPosition = (-c[0] * BTN_CELL * k) + "px " + (-c[1] * BTN_CELL * k) + "px";
	};

	// 依目前等級更新按鈕外觀：有開的組加一圈金框，該組選中的那一顆也加框並放大一點
	WeatherSystem.prototype._syncButtons = function() {
		if (!this.rows) {
			return;
		}

		for (var i = 0; i < GROUPS.length; i++) {
			var g = GROUPS[i];
			var r = this.rows[g.key];
			if (!r) {
				continue;
			}

			var lv = this.level[g.key];

			r.head.style.boxShadow = lv > 0 ? "0 0 0 2px rgba(255,206,110,0.95)" : "none";
			r.head.style.opacity = lv > 0 ? "1" : "0.88";

			for (var j = 0; j < r.btns.length; j++) {
				var on = (j + 1) === lv;

				r.btns[j].style.boxShadow = on ? "0 0 0 2px rgba(255,206,110,0.95)" : "none";
				r.btns[j].style.opacity = on ? "1" : (lv === 0 ? "0.9" : "0.72");
				r.btns[j].style.transform = on ? "scale(1.06)" : "none";
			}
		}
	};

	// 控制按鈕：往下展開／收起主選單
	WeatherSystem.prototype._toggleMain = function() {
		if (!this.mainEl) {
			return;
		}

		var open = this.mainEl.style.display !== "none";
		this.mainEl.style.display = open ? "none" : "flex";

		if (open) {
			this._collapseGroups();
		}
	};

	// 組標題按鈕：往右展開／收起自己的等級按鈕（同時只展開一組）
	WeatherSystem.prototype._toggleGroup = function(key) {
		if (!this.rows || !this.rows[key]) {
			return;
		}

		var open = (this.menuKey === key);

		this._collapseGroups();

		if (!open) {
			this.rows[key].box.style.display = "flex";
			this.menuKey = key;
		}
	};

	WeatherSystem.prototype._collapseGroups = function() {
		if (this.rows) {
			for (var k in this.rows) {
				if (this.rows.hasOwnProperty(k)) {
					this.rows[k].box.style.display = "none";
				}
			}
		}

		this.menuKey = null;
	};

	WeatherSystem.prototype._closeMenu = function() {
		this._collapseGroups();

		if (this.mainEl) {
			this.mainEl.style.display = "none";
		}
	};

	/* ------------------------------------------------------------------ *
	 *  尺寸同步
	 * ------------------------------------------------------------------ */

	WeatherSystem.prototype._syncLayout = function() {
		if (!this.domReady) {
			return;
		}

		var gameCanvas = document.getElementById("canvas");
		if (!gameCanvas) {
			return;
		}

		var r = gameCanvas.getBoundingClientRect();
		if (r.width <= 0 || r.height <= 0) {
			return;
		}

		this.cssW = r.width;
		this.cssH = r.height;
		// 特效不需要視網膜級銳利度，dpr 上限壓在 2
		this.dpr = Math.min(window.devicePixelRatio || 1, 2);

		// 內容區（700×800）在畫面上的位置：寬度恆為整寬、高度置中
		var s = r.width / Constants.ASSETS_WIDTH;
		var contentTop = r.top + r.height / 2 - Constants.ASSETS_HEIGHT * s / 2;
		var offsetY = contentTop - r.top; // 內容區上緣在圖層內的 y

		this.contentScale = s;
		this.contentTop = contentTop;
		this.contentOffsetY = offsetY; // 內容區上緣在圖層內的 y（落雷用它當地圖上緣）
		this.contentH = Constants.ASSETS_HEIGHT * s;

		// 上方選單下緣（圖層內部座標；落雷用它當地圖上緣）
		this.navBottomCss = offsetY + NAV_BAR_BOTTOM * s;

		// 粒子畫布：改成離屏，尺寸 = 畫布 CSS 尺寸 × dpr（畫圖仍用 CSS px 座標系）
		var cw = Math.round(r.width * this.dpr);
		var ch = Math.round(r.height * this.dpr);

		if (this.canvas.width !== cw || this.canvas.height !== ch) {
			this.canvas.width = cw;
			this.canvas.height = ch;
			this._resetParticles();
		}

		if (this.ctx) {
			// 之後一律用 CSS px 當座標系畫圖
			this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
		}

		// 離屏畫布貼回 700×800 的圖層座標系
		if (this.particleBmp && cw > 0 && ch > 0) {
			this.particleBmp.scaleX = Constants.ASSETS_WIDTH / cw;
			this.particleBmp.scaleY = Constants.ASSETS_HEIGHT / ch;
		}

		// 控制按鈕：貼在左上角、上導航資訊列下方
		if (this.barEl) {
			this.btnScale = Math.max(1, s); // 32×32 的格子跟遊戲單位一起等比放大

			this.barEl.style.left = (r.left + 6 * s) + "px";
			// 名稱列固定在上方（y≈100），天氣控制選單整組再下移到名稱列下方
			this.barEl.style.top = (contentTop + NAV_BAR_BOTTOM * s + 30 * s + 2) + "px";

			var btns = [this.ctrlEl];
			var key;

			if (this.rows) {
				for (key in this.rows) {
					if (this.rows.hasOwnProperty(key)) {
						btns = btns.concat([this.rows[key].head], this.rows[key].btns);
					}
				}
			}

			for (key = 0; key < btns.length; key++) {
				this._applyCellSize(btns[key]);
			}

			if (this.mainEl) {
				this.mainEl.style.marginTop = (4 * s) + "px";
				this.mainEl.style.gap = (4 * s) + "px";
			}

			if (this.rows) {
				for (key in this.rows) {
					if (this.rows.hasOwnProperty(key)) {
						this.rows[key].box.style.marginLeft = (4 * s) + "px";
						this.rows[key].box.style.gap = (3 * s) + "px";
					}
				}
			}
		}
	};

	WeatherSystem.prototype._applyBox = function(el, box) {
		if (!el) {
			return;
		}
		var pairs = box.split(";");
		for (var i = 0; i < pairs.length; i++) {
			var kv = pairs[i].split(":");
			if (kv.length === 2) {
				el.style.setProperty(kv[0].trim(), kv[1].trim());
			}
		}
	};

	/* ------------------------------------------------------------------ *
	 *  粒子池
	 * ------------------------------------------------------------------ */

	WeatherSystem.prototype._resetParticles = function() {
		var W = this.cssW;
		var H = this.cssH;

		this.rain.length = 0;
		this.snow.length = 0;
		this.rainActive = 0;
		this.snowActive = 0;

		if (W <= 0 || H <= 0) {
			return;
		}

		var scale = Math.max(0.6, Math.min(1.6, W / 700));
		var i;

		// 雨滴：先配置到「暴雨」等級的數量，實際只畫前面的 N 顆
		var rainCap = Math.round(TUNE.rain.base * scale * RAIN_COUNT[3]);
		for (i = 0; i < rainCap; i++) {
			this.rain.push({
				x: Math.random() * (W + 120) - 60,
				y: Math.random() * H,
				len: Utils.RandomRange(TUNE.rain.minLen, TUNE.rain.maxLen),
				sp: Utils.RandomRange(TUNE.rain.minSpeed, TUNE.rain.maxSpeed)
			});
		}

		// 雪花：同上
		var snowCap = Math.round(TUNE.snow.base * scale * SNOW_COUNT[3]);
		for (i = 0; i < snowCap; i++) {
			this.snow.push({
				x: Math.random() * W,
				bx: Math.random() * W,
				y: Math.random() * H,
				r: Utils.RandomRange(TUNE.snow.minR, TUNE.snow.maxR),
				sp: Utils.RandomRange(TUNE.snow.minSpeed, TUNE.snow.maxSpeed),
				ph: Math.random() * 6.283,
				amp: TUNE.snow.sway * (0.4 + Math.random() * 0.6)
			});
		}

		this.fogDirTimer = Utils.RandomRange(TUNE.fog.dirMin, TUNE.fog.dirMax);
	};

	// 濃度變高時，把新啟用的粒子放到畫面外上方，讓它是「從天而降」而不是憑空出現
	WeatherSystem.prototype._activateRain = function(n) {
		if (n > this.rain.length) {
			n = this.rain.length;
		}

		for (var i = this.rainActive; i < n; i++) {
			var d = this.rain[i];
			d.y = -Utils.RandomRange(0, this.cssH * 0.55) - d.len;
			d.x = Math.random() * (this.cssW + 120) - 60;
		}

		this.rainActive = n;
	};

	WeatherSystem.prototype._activateSnow = function(n) {
		if (n > this.snow.length) {
			n = this.snow.length;
		}

		for (var i = this.snowActive; i < n; i++) {
			var f = this.snow[i];
			f.y = -Utils.RandomRange(0, this.cssH * 0.55) - f.r;
			f.bx = Math.random() * this.cssW;
			f.x = f.bx;
		}

		this.snowActive = n;
	};

	/* ------------------------------------------------------------------ *
	 *  對外操作
	 * ------------------------------------------------------------------ */

	WeatherSystem.prototype.attach = function(owner) {
		if (this.attached && this.owner === owner) {
			this._syncLayout();
			return;
		}

		this.owner = owner || null;

		if (!this.domReady) {
			this._buildDom();
		}

		this._showLayers();
		this._mountFx();
		this._syncLayout();

		this.attached = true;
		this.lastTs = 0;

		// 打雷排程從掛上這一刻重新起算
		this.thunderClock = 0;
		this._scheduleNextStrike();

		if (!this.rafId) {
			this.rafId = raf(this._loopBind);
		}
	};

	WeatherSystem.prototype.detach = function() {
		this.attached = false;
		this.owner = null;

		// 離開選關頁：取消尚未到點的雷聲計時器，並停掉循環雨聲
		if (this.thunderTimer) {
			clearTimeout(this.thunderTimer);
			this.thunderTimer = 0;
		}
		this._stopRainSound();

		if (this.rafId) {
			caf(this.rafId);
			this.rafId = 0;
		}

		this.flash = 0;
		this.flashSeq = -1;
		this.bolt = null;
		this.boltT = -1;
		this.fire = null;

		this._closeMenu();

		// 夜晚與閃光歸零（圖層留在畫布裡，只是透明，下次掛上不必重建）
		if (this.nightShape) {
			this.nightShape.alpha = 0;
		}
		if (this.flashShape) {
			this.flashShape.alpha = 0;
		}
		this.lastNightKey = "";
		this.lastNightAlpha = -1;
		this.lastFlashAlpha = -1;

		if (this.ctx) {
			this.ctx.clearRect(0, 0, this.cssW, this.cssH);
		}

		this.lastTs = 0;

		this._hideLayers();
	};

	WeatherSystem.prototype._showLayers = function() {
		this._buildFxCon();

		if (this.fxCon) {
			this.fxCon.visible = true;
		}
		if (this.barEl) {
			this.barEl.style.display = "flex";
		}
	};

	WeatherSystem.prototype._hideLayers = function() {
		if (this.fxCon) {
			this.fxCon.visible = false;
		}
		if (this.barEl) {
			this.barEl.style.display = "none";
		}
	};

	// 設定某一組的等級（0 = 關）
	WeatherSystem.prototype.setLevel = function(key, level) {
		var g = null;
		for (var i = 0; i < GROUPS.length; i++) {
			if (GROUPS[i].key === key) {
				g = GROUPS[i];
			}
		}
		if (!g) {
			return;
		}

		level = Math.round(Utils.Clamp(level, 0, g.levels.length - 1));
		this.level[key] = level;

		// 打雷：換等級就重算下一次的時間
		if (key === "thunder") {
			this._scheduleNextStrike();
		}

		this._syncButtons();
	};

	WeatherSystem.prototype.getLevel = function(key) {
		return this.level[key] || 0;
	};

	WeatherSystem.prototype.allOff = function() {
		for (var i = 0; i < GROUPS.length; i++) {
			this.level[GROUPS[i].key] = 0;
		}
		this._scheduleNextStrike();
		this._syncButtons();
	};

	/* ------------------------------------------------------------------ *
	 *  主迴圈
	 * ------------------------------------------------------------------ */

	WeatherSystem.prototype._loopBind = function(ts) {
		WeatherSystem.g_instance._tick(ts);
	};

	WeatherSystem.prototype._tick = function(ts) {
		if (!this.attached) {
			return;
		}

		// 只允許在選關頁顯示：一旦本頁不是最上層就立刻卸載
		var manager = (typeof DNStateManager !== "undefined") ? DNStateManager.g_instance : null;
		var states = manager ? manager.states : null;
		var top = (states && states.length > 0) ? states[states.length - 1] : null;

		if (this.owner !== null && top !== this.owner) {
			this.detach();
			return;
		}

		var dt = 0;
		if (this.lastTs) {
			dt = Math.min(0.05, (ts - this.lastTs) / 1000);
		}
		this.lastTs = ts;
		this.time += dt;
		this.thunderClock += dt;
		this.frameCount++;

		if (this.frameCount % 30 === 0) {
			this._syncLayout();
		}

		this._advanceLevels(dt);
		this._scheduleThunder();
		this._advanceParticles(dt);
		this._advanceFog(dt);
		this._advanceBolt(dt);
		this._render();
		this._applyDomOpacity();

		this.rafId = raf(this._loopBind);
	};

	// 等級平滑過渡：每升一級花 fade 秒，所以「小雨→暴雨」也是漸漸變濃，不會一次出現
	// 夜晚例外：選「關」時，不管目前停在哪一段，一律在 TUNE.night.fadeOut 秒內無條件轉回天亮
	WeatherSystem.prototype._advanceLevels = function(dt) {
		var nightMax = 0;
		var i;

		for (i = 0; i < GROUPS.length; i++) {
			if (GROUPS[i].key === "night") {
				nightMax = GROUPS[i].levels.length - 1;
			}
		}

		for (i = 0; i < GROUPS.length; i++) {
			var g = GROUPS[i];
			var target = this.level[g.key];
			var cur = this.pos[g.key];
			var step = dt / g.fade;

			if (g.key === "night" && target === 0 && cur > 0) {
				// 關燈：不逐級回退（否則深夜要 7.5 秒，而且會先變成夜晚色再變黃昏色），
				// 改成一律以 fadeOut 秒走完全程，平順地亮起來
				cur = Math.max(0, cur - dt * nightMax / TUNE.night.fadeOut);
			} else if (cur < target) {
				cur = Math.min(target, cur + step);
			} else if (cur > target) {
				cur = Math.max(target, cur - step);
			}

			this.pos[g.key] = cur;
		}
	};

	/* ------------------------------------------------------------------ *
	 *  打雷
	 * ------------------------------------------------------------------ */

	// 重算下一次打雷的時間點
	WeatherSystem.prototype._scheduleNextStrike = function() {
		var level = this.level.thunder;

		if (level <= 0) {
			this.nextStrike = Infinity;
			return;
		}

		var base = TUNE.thunder.interval[level] || TUNE.thunder.interval[1];
		var scale = Constants.DEBUG_MODE ? TUNE.thunder.debugTimeScale : 1;

		// 下限 = 設定值 / 2，上限 = 設定值，區間隨機
		var half = base / 2;
		var interval = (half + Math.random() * half) / 1000 * scale;

		this.nextStrike = this.thunderClock + interval;
	};

	WeatherSystem.prototype._scheduleThunder = function() {
		if (this.level.thunder <= 0 || this.nextStrike === Infinity) {
			return;
		}

		if (this.thunderClock >= this.nextStrike) {
			this._strike(this.level.thunder);
			this._scheduleNextStrike();
		}
	};

	// 打一次雷：閃光一定有，暴雷再加上落雷與地面火光
	WeatherSystem.prototype._strike = function(level) {
		this.flashSeq = 0;

		if (level >= 2) {
			this._generateBolt();
		}

		// 雷聲延遲 200ms 配合閃光（光速快、聲速慢的聽覺效果）；離開頁面時由 detach 取消
		var _this = this;
		this.thunderTimer = setTimeout(function() {
			_this.thunderTimer = 0;
			if (_this.attached && typeof DNSoundManager !== "undefined" && DNSoundManager.g_instance) {
				DNSoundManager.g_instance.play(Sounds.THUNDER, 0.8);
			}
		}, 200);//延遲 200ms
	};

	// 停止循環雨聲（雨停、換等級或卸載時呼叫）
	WeatherSystem.prototype._stopRainSound = function() {
		if (this.rainInstance) {
			try {
				this.rainInstance.stop();
			} catch (e) {}
			// 同步從管理器循環實例清單移除，避免釋放後仍被 setSfxVolume 拿到壞參考
			if (typeof DNSoundManager !== "undefined" && DNSoundManager.g_instance) {
				DNSoundManager.g_instance.releaseLoop(this.rainInstance);
			}
			this.rainInstance = null;
		}
	};

	WeatherSystem.prototype._generateBolt = function() {
		var W = this.cssW;
		var H = this.cssH;
		if (W <= 0 || H <= 0) {
			return;
		}

		// 落雷必須打在「可見地圖」上，所以用內容區（700×800）與畫布的可見交集來算：
		// 內容區比螢幕還高時（內容置中、上下各被切掉一點），只用內容區 70%~94% 的話，
		// 落點會全部擠在螢幕下半那一段，上半完全劈不到。
		var areaTop = this.contentOffsetY || 0;
		var areaH = this.contentH > 0 ? this.contentH : H;

		var visTop = Math.max(0, areaTop, this.navBottomCss || 0); // 可見地圖上緣（避開上方選單）
		var visBottom = Math.min(H, areaTop + areaH); // 可見地圖下緣

		if (visBottom - visTop < areaH * 0.3) { // 極端比例時退回整個內容區
			visTop = areaTop;
			visBottom = areaTop + areaH;
		}

		var bandH = visBottom - visTop;

		// 落點高度：每次在地圖上找一個新的落點高度（地圖本身有高低起伏），
		// 並強制和上一發至少差 6% 高度，避免連續好幾道劈在同一條水平線上。
		var gMin = Utils.Clamp(TUNE.thunder.groundMin, 0.02, 0.98);
		var gMax = Utils.Clamp(TUNE.thunder.groundMax, gMin, 0.98);
		var ratio = Utils.RandomRange(gMin, gMax);

		// 太靠近上一發就只在「離上一發足夠遠的那一段」裡取，
		// 也就是把可用高度切成 [gMin, last-0.06] ∪ [last+0.06, gMax] 兩段，隨機挑一段
		if (this.lastGroundRatio >= 0 && Math.abs(ratio - this.lastGroundRatio) < TUNE.thunder.groundGap) {
			var loBound = this.lastGroundRatio + TUNE.thunder.groundGap;
			var hiBound = this.lastGroundRatio - TUNE.thunder.groundGap;
			var hasHigh = loBound <= gMax;
			var hasLow = hiBound >= gMin;

			if (!hasHigh && hasLow) {
				ratio = Utils.RandomRange(gMin, hiBound);
			} else if (hasHigh && !hasLow) {
				ratio = Utils.RandomRange(loBound, gMax);
			} else if (hasHigh && hasLow) {
				ratio = (Math.random() < 0.5) ? Utils.RandomRange(loBound, gMax) : Utils.RandomRange(gMin, hiBound);
			}
		}

		this.lastGroundRatio = ratio;

		var groundY = visTop + bandH * ratio;
		var skyY = areaTop + 6; // 從地圖上緣開始劈（會被選單保留區擦掉，所以看不到它壓在選單上）

		// 落點橫向用黃金比例序列鋪開（低差異序列）：
		// 連續幾十道雷會平均散在可見地圖寬度內，而不是隨機擠在同一段。
		this.boltSeq = (this.boltSeq + 0.6180339887) % 1;

		var x1 = Utils.Clamp(W * (0.08 + 0.84 * this.boltSeq) + Utils.RandomRange(-0.03, 0.03) * W, W * 0.08, W * 0.92);
		var x0 = Utils.Clamp(x1 + Utils.RandomRange(-0.20, 0.20) * W, W * 0.06, W * 0.94);

		var pts = [];
		var segs = 10;
		var i;

		for (i = 0; i <= segs; i++) {
			var t = i / segs;
			var jitter = (i === 0 || i === segs) ? 0 : (Math.random() - 0.5) * W * 0.075;
			pts.push({
				x: x0 + (x1 - x0) * t + jitter,
				y: skyY + (groundY - skyY) * t
			});
		}

		// 兩條分叉，讓它看起來是「扭曲的閃電」而不是直線
		var branches = [];
		for (i = 0; i < 2; i++) {
			var bi = Math.round(Utils.RandomRange(2, 8));
			var bx = pts[bi].x;
			var by = pts[bi].y;
			var dir = (i === 0 ? -1 : 1);
			branches.push([{
					x: bx,
					y: by
				},
				{
					x: Utils.Clamp(bx + dir * W * Utils.RandomRange(0.05, 0.13), 4, W - 4),
					y: Math.min(groundY, by + Utils.RandomRange(0.06, 0.16) * areaH)
				},
				{
					x: Utils.Clamp(bx + dir * W * Utils.RandomRange(0.08, 0.18), 4, W - 4),
					y: Math.min(groundY, by + Utils.RandomRange(0.14, 0.28) * areaH)
				}
			]);
		}

		this.bolt = {
			pts: pts,
			branches: branches,
			x: x1,
			y: groundY
		};
		this.boltT = 0;

		// 地面火光：3~6 秒
		this.fire = {
			x: x1,
			y: groundY,
			t: 0,
			life: Utils.RandomRange(TUNE.thunder.fireMin, TUNE.thunder.fireMax),
			seed: Math.random() * 100
		};
	};

	WeatherSystem.prototype._advanceBolt = function(dt) {
		// 閃光
		if (this.flashSeq >= 0) {
			this.flashSeq += dt;
			this.flash = keyframe(FLASH_KEYS, this.flashSeq);

			if (this.flashSeq > FLASH_KEYS[FLASH_KEYS.length - 1][0]) {
				this.flash = 0;
				this.flashSeq = -1;
			}
		}

		// 落雷
		if (this.boltT >= 0) {
			this.boltT += dt;
			if (this.boltT > TUNE.thunder.boltLife) {
				this.bolt = null;
				this.boltT = -1;
			}
		}

		// 地面火光
		if (this.fire) {
			this.fire.t += dt;
			if (this.fire.t >= this.fire.life) {
				this.fire = null;
			}
		}
	};

	// [時間, 值] 序列的線性插值，序列外一律回 0
	function keyframe(keys, t) {
		for (var i = 1; i < keys.length; i++) {
			if (t <= keys[i][0]) {
				var t0 = keys[i - 1][0];
				var t1 = keys[i][0];
				var v0 = keys[i - 1][1];
				var v1 = keys[i][1];
				var k = (t1 === t0) ? 0 : (t - t0) / (t1 - t0);
				return v0 + (v1 - v0) * k;
			}
		}
		return 0;
	}

	/* ------------------------------------------------------------------ *
	 *  粒子
	 * ------------------------------------------------------------------ */

	WeatherSystem.prototype._advanceParticles = function(dt) {
		var W = this.cssW;
		var H = this.cssH;
		var i;
		var p;

		var rainPos = this.pos.rain;
		var snowPos = this.pos.snow;

		var rainFactor = interp(RAIN_COUNT, rainPos);
		var rainSpeedK = interp(RAIN_SPEED, rainPos);
		var snowFactor = interp(SNOW_COUNT, snowPos);

		// 雨
		if (rainFactor > 0.01) {
			var targetN = Math.round(this.rain.length * (rainFactor / RAIN_COUNT[3]));

			if (targetN > this.rainActive) {
				this._activateRain(targetN);
			} else if (targetN < this.rainActive) {
				this.rainActive = targetN;
			}

			// 雨聲：下雨中只維持一支循環實例，不每幀重複 play；雨停由 else 分支釋放
			// 走管理器 playLoop，隨音效總音量（sfxVolume）一併控制
			if (!this.rainInstance && typeof DNSoundManager !== "undefined" && DNSoundManager.g_instance) {
				this.rainInstance = DNSoundManager.g_instance.playLoop(Sounds.RAIN, 0.5);
			}

			for (i = 0; i < this.rainActive; i++) {
				p = this.rain[i];
				p.y += p.sp * rainSpeedK * dt;
				p.x -= p.sp * rainSpeedK * TUNE.rain.slant * dt;

				if (p.y > H + 20 || p.x < -80) {
					p.y = -20 - Math.random() * H * 0.15;
					p.x = Math.random() * (W + 120) - 60;
				}
			}
		} else {
			this.rainActive = 0;
			this._stopRainSound();
		}

		// 雪
		if (snowFactor > 0.01) {
			var targetSnow = Math.round(this.snow.length * (snowFactor / SNOW_COUNT[3]));

			if (targetSnow > this.snowActive) {
				this._activateSnow(targetSnow);
			} else if (targetSnow < this.snowActive) {
				this.snowActive = targetSnow;
			}

			for (i = 0; i < this.snowActive; i++) {
				p = this.snow[i];
				p.y += p.sp * dt;
				p.ph += dt * 0.9;
				p.x = p.bx + Math.sin(p.ph) * p.amp;

				if (p.y > H + 6) {
					p.y = -6;
					p.bx = Math.random() * W;
				}
			}
		} else {
			this.snowActive = 0;
		}
	};

	// 霧的流向：往一個方向流一陣子，再慢慢轉向另一邊
	WeatherSystem.prototype._advanceFog = function(dt) {
		this.fogDirTimer -= dt;
		if (this.fogDirTimer <= 0) {
			this.fogDirTarget = -this.fogDirTarget;
			this.fogDirTimer = Utils.RandomRange(TUNE.fog.dirMin, TUNE.fog.dirMax);
		}

		// 方向本身也做插值，所以是「慢慢反過來」而不是瞬間倒轉
		// 從 +1 走到 -1 共 2 格，所以在 reverseTime 秒內走完 2 格
		var step = dt * 2 / TUNE.fog.reverseTime;
		if (this.fogDir < this.fogDirTarget) {
			this.fogDir = Math.min(this.fogDirTarget, this.fogDir + step);
		} else if (this.fogDir > this.fogDirTarget) {
			this.fogDir = Math.max(this.fogDirTarget, this.fogDir - step);
		}

		if (this.pos.fog <= 0.01) {
			return;
		}

		for (var i = 0; i < this.fogLayers.length; i++) {
			var L = this.fogLayers[i];
			L.offset += TUNE.fog.speed * L.speed * this.fogDir * dt;
		}
	};

	/* ------------------------------------------------------------------ *
	 *  繪製
	 * ------------------------------------------------------------------ */

	WeatherSystem.prototype._render = function() {
		var ctx = this.ctx;
		if (!ctx) {
			return;
		}

		var W = this.cssW;
		var H = this.cssH;

		ctx.clearRect(0, 0, W, H);

		var rainPos = this.pos.rain;
		var snowPos = this.pos.snow;
		var fogPos = this.pos.fog;

		var hasRain = interp(RAIN_COUNT, rainPos) > 0.01;
		var hasSnow = interp(SNOW_COUNT, snowPos) > 0.01;
		var hasFog = interp(FOG_ALPHA, fogPos) > 0.004;
		var hasFire = !!this.fire;
		var hasBolt = !!this.bolt;

		if (!hasRain && !hasSnow && !hasFog && !hasFire && !hasBolt) {
			return;
		}

		var i;

		// 雨：所有雨絲合成一條 path，一次 stroke
		if (hasRain) {
			ctx.strokeStyle = "rgb(198,220,255)";
			ctx.globalAlpha = Math.min(1, TUNE.rain.alpha * interp(RAIN_ALPHA, rainPos));
			ctx.lineWidth = 1;
			ctx.lineCap = "butt";
			ctx.beginPath();

			for (i = 0; i < this.rainActive; i++) {
				var d = this.rain[i];
				ctx.moveTo(d.x, d.y);
				ctx.lineTo(d.x + d.len * TUNE.rain.slant, d.y - d.len);
			}

			ctx.stroke();
		}

		// 雪：合成一條 path，一次 fill
		if (hasSnow) {
			var snowSizeK = interp(SNOW_SIZE, snowPos);

			ctx.fillStyle = "rgb(255,255,255)";
			ctx.globalAlpha = Math.min(1, TUNE.snow.alpha * interp(SNOW_ALPHA, snowPos));
			ctx.beginPath();

			for (i = 0; i < this.snowActive; i++) {
				var f = this.snow[i];
				var rr = f.r * snowSizeK;
				ctx.moveTo(f.x + rr, f.y);
				ctx.arc(f.x, f.y, rr, 0, 6.2832);
			}

			ctx.fill();
		}

		// 霧：把 fog_ani.png 水平平鋪，兩層不同速度做視差
		if (hasFog && this.fogImg) {
			this._renderFog(ctx, W, H);
		}

		// 地面火光
		if (hasFire) {
			this._renderFire(ctx, H);
		}

		// 落雷
		if (hasBolt) {
			this._renderBolt(ctx);
		}

		ctx.globalAlpha = 1;
	};

	WeatherSystem.prototype._renderFog = function(ctx, W, H) {
		var img = this.fogImg;
		if (!img || !img.width || !img.height) {
			return;
		}

		var baseAlpha = interp(FOG_ALPHA, this.pos.fog);
		var breathe = 1 + Math.sin(this.time * 0.55) * TUNE.fog.breathe;

		for (var i = 0; i < this.fogLayers.length; i++) {
			var L = this.fogLayers[i];

			// 讓圖至少蓋滿整個高度（1024×768 在 700×800 的畫面上約 1.09 倍）
			var k = (H * 1.06 / img.height) * L.scale;
			var tw = Math.round(img.width * k);
			var th = Math.round(img.height * k);

			ctx.globalAlpha = Math.min(1, baseAlpha * L.alpha * breathe);

			// 頭尾相接：一位移只在「一個完整循環」內打轉
			// 鏡射時一個循環是兩份圖（原向 + 左右翻），所以餘數要對 2 * tw 取
			var period = L.mirror ? tw * 2 : tw;
			var p = L.offset % period;
			if (p < 0) {
				p += period;
			}

			var x = -p;
			var idx = 0;

			// 完全在畫面左側外的份數直接跳過（不影響鏡射的正反交替）
			while (x + tw <= 0) {
				x += tw;
				idx++;
			}

			while (x < W) {
				if (L.mirror && (idx % 2 === 1)) {
					// 奇數份左右鏡射：接縫左邊是原圖右緣、右邊是同一條右緣的鏡像，接得剛剛好
					ctx.save();
					ctx.translate(x + tw, (H - th) / 2);
					ctx.scale(-1, 1);
					ctx.drawImage(img, 0, 0, tw, th);
					ctx.restore();
				} else {
					ctx.drawImage(img, x, (H - th) / 2, tw, th);
				}

				x += tw;
				idx++;
			}
		}
	};

	WeatherSystem.prototype._renderFire = function(ctx, H) {
		var f = this.fire;
		if (!this.fireTex) {
			return;
		}

		var lifeK = 1 - f.t / f.life; // 0 = 快燒完
		// 兩段正弦疊出抖動，讓火光不是死板的漸層
		var flicker = 0.78 + Math.sin(this.time * 13 + f.seed) * 0.12 +
			Math.sin(this.time * 27 + f.seed * 2) * 0.08;
		var a = Utils.Clamp(lifeK * flicker, 0, 1);

		var size = H * 0.16 * (0.9 + lifeK * 0.35);

		ctx.globalAlpha = a * 0.95;
		ctx.drawImage(this.fireTex, f.x - size * 0.55, f.y - size * 0.55, size * 1.1, size * 1.1);

		ctx.globalAlpha = a * 0.55;
		ctx.drawImage(this.fireTex, f.x - size, f.y - size, size * 2, size * 2);
	};

	WeatherSystem.prototype._renderBolt = function(ctx) {
		var b = this.bolt;
		if (!b || this.boltT < 0) {
			return;
		}

		var a = keyframe(BOLT_KEYS, this.boltT);
		if (a <= 0.01) {
			return;
		}

		var i;
		var j;

		// 光暈
		ctx.globalAlpha = a * 0.28;
		ctx.strokeStyle = "rgb(180,210,255)";
		ctx.lineWidth = 7;
		ctx.lineCap = "round";
		ctx.beginPath();
		for (i = 0; i < b.pts.length; i++) {
			if (i === 0) {
				ctx.moveTo(b.pts[i].x, b.pts[i].y);
			} else {
				ctx.lineTo(b.pts[i].x, b.pts[i].y);
			}
		}
		for (i = 0; i < b.branches.length; i++) {
			var br = b.branches[i];
			for (j = 0; j < br.length; j++) {
				if (j === 0) {
					ctx.moveTo(br[j].x, br[j].y);
				} else {
					ctx.lineTo(br[j].x, br[j].y);
				}
			}
		}
		ctx.stroke();

		// 核心
		ctx.globalAlpha = a;
		ctx.strokeStyle = "rgb(255,255,255)";
		ctx.lineWidth = 1.8;
		ctx.beginPath();
		for (i = 0; i < b.pts.length; i++) {
			if (i === 0) {
				ctx.moveTo(b.pts[i].x, b.pts[i].y);
			} else {
				ctx.lineTo(b.pts[i].x, b.pts[i].y);
			}
		}
		for (i = 0; i < b.branches.length; i++) {
			var br2 = b.branches[i];
			for (j = 0; j < br2.length; j++) {
				if (j === 0) {
					ctx.moveTo(br2[j].x, br2[j].y);
				} else {
					ctx.lineTo(br2[j].x, br2[j].y);
				}
			}
		}
		ctx.stroke();
	};

	// 夜晚與閃光是畫布圖層，只在數值真的變了才重建／改透明度
	WeatherSystem.prototype._applyDomOpacity = function() {
		var p = this.pos.night;
		var maxLv = NIGHT_TINT.length - 1;

		var i = Math.floor(Utils.Clamp(p, 0, maxLv));
		var nx = (i < maxLv) ? NIGHT_TINT[i + 1] : NIGHT_TINT[maxLv];
		var cu = NIGHT_TINT[i];
		var f = Utils.Clamp(p, 0, maxLv) - i;

		var r = Math.round(cu.r + (nx.r - cu.r) * f);
		var g = Math.round(cu.g + (nx.g - cu.g) * f);
		var b = Math.round(cu.b + (nx.b - cu.b) * f);
		var alpha = cu.a + (nx.a - cu.a) * f;

		var key = r + "," + g + "," + b;

		if (this.nightShape) {
			if (key !== this.lastNightKey) {
				this._drawNightShape(r, g, b);
				this.lastNightKey = key;
			}
			if (Math.abs(alpha - this.lastNightAlpha) > 0.002) {
				this.nightShape.alpha = alpha;
				this.lastNightAlpha = alpha;
			}
		}

		// 閃光：亮度上限依「雷 / 暴雷」等級
		var peak = interp(TUNE.thunder.peakFlash, this.pos.thunder);
		var flashAlpha = this.flash * (peak > 0 ? peak : 0);

		// 打雷等級歸零就別再閃
		if (this.level.thunder <= 0) {
			flashAlpha = 0;
		}

		if (this.flashShape && Math.abs(flashAlpha - this.lastFlashAlpha) > 0.004) {
			this.flashShape.alpha = flashAlpha;
			this.lastFlashAlpha = flashAlpha;
		}
	};

	/* ------------------------------------------------------------------ *
	 *  對外常數
	 * ------------------------------------------------------------------ */

	WeatherSystem.GROUPS = GROUPS;
	WeatherSystem.TUNE = TUNE;

	WeatherSystem.g_instance = new WeatherSystem();

	return WeatherSystem;
})();
