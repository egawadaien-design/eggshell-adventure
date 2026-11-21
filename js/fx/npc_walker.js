/**
 * NPC 走動層 —— 讓多隻 NPC 在選關畫面（地圖）上各自亂逛
 *
 * 掛載方式（只在選關頁掛）：
 *   SelectLevelState.prototype.init() 內呼叫 NpcWalker.g_instance.attach(this)
 *   不需要手動卸載：NPC 都在本頁 gameObjects 裡，本頁被 pop 掉（進關卡、回主選單）時，
 *   整個狀態容器連同物件一起消失，不會留下孤兒顯示物件。
 *
 * 這是第二版。第一版只掛 npc01 一隻，所有手感參數都寫死在模組常數裡；
 * 這一版改成「名冊（ROSTER）」：每隻 NPC 各自帶自己的圖集、速度、停留時間與進場延遲，
 * 而格規格、腳底基線、縮放、踏步節奏是全員共用（三張圖集已經對齊成同一套規格）。
 * 走動、避讓、景深、陰影的程式碼也全員共用同一份。
 * 之後要加第四隻角色，只要往 ROSTER 追加一筆、在 images.js 補一組圖集就好，
 * 這裡的邏輯一行都不用改。
 *
 * 為什麼不用自己的 requestAnimationFrame 迴圈：
 *   選關頁的景物、關卡按鈕都掛在 SelectLevelState.gameObjects，由 DNStateManager 每幀
 *   呼叫 update(dt)。NPC 走同一條路徑（addGameObjectAt）才會跟頁面共用同一個時鐘；
 *   進關卡時頂層換成過場狀態，本頁 update 自然停住，就不會出現「背景停了、只有 NPC
 *   還在走」的怪畫面。天氣層（weather.js）用 rAF 是因為它是一整張全螢幕貼圖，
 *   跟地圖物件不是同一種東西，這裡不需要那樣做。
 *
 * 圖集（六張規格完全一致）：
 *   assets/art/npc/npc01~06_walk.png  384×512
 *   都是 4 欄 × 4 列、單格 96×128；列序＝背面 / 側面朝右 / 正面 / 側面朝左，
 *   每列四幀。
 *   六張圖的腳底都對齊在格內 y=123（下緣留 4px）—— 16 格 × 6 張全部同位，
 *   所以基線只需要一個常數 CELL.baseline，不必再逐隻補正。
 *   之後新增圖集務必維持同樣留白：一旦某張圖腳底偏高或偏低，用程式去補是錯的解法，
 *   把那張圖重新落格對齊同一條線，否則新舊角色站在一起會看到誰浮空、誰陷地。
 *
 * 三隻不會疊在一起，靠兩件事：
 *   1) 挑落腳點前先看鄰居「現在站哪、下一站要去哪」，太近就重挑（最多 MOVE.targetTries 次）
 *   2) 走路途中如果兩個方向的間距都太小，兩邊各自往反方向退一半
 *      （不是其中一隻被硬推開，所以看起來像互相讓路，而不是誰在撞誰）
 *   退開後一律夾回本頁可走範圍，不會被擠到地圖外或擠進上方選單，
 *   而且被推開後會再確認一次沒被推進障礙裡（障礙優先於邊界）
 *   另外，退開的方向如果剛好跟這一段想走的方向相反，會改往另一軸錯開——
 *   不然兩隻面對面時，「前進多少就被推回多少」，會僵在原地看起來像當機。
 *
 * 碰到障礙怎麼繞（其他 NPC、之後才要加的地面障礙點都算）：
 *   1) 每趟路只規劃眼前這一段：直線能到就直走，被擋就在障礙側面插一個繞行點；
 *      走到繞行點再算下一段，所以連續好幾顆障礙也會一顆一顆繞過去
 *   2) 走的每一幀都先「假裝走過去」再檢查有沒有壓到障礙：壓到就把位置吸回障礙表面外，
 *      位移的切線分量會留下來，看起來是貼著邊緣滑過去，而不是撞到就停
 *   3) 正面撞上（前進幾乎被吃掉）才改成沿側面走，而且只在側走能走得更多時才切，
 *      不然會出現貼著障礙左右抖
 *   4) 站著不動的鄰居當固定障礙來規劃路線；正在走的鄰居只在即時碰撞時滑開，
 *      兩隻都拿對方當障礙去規劃，會互推到地圖兩端
 *   地面障礙點怎麼給（寫關卡的人看這段就好）：
 *     NpcWalker.g_instance.addObstacle(x, y, r)             // 圖層座標（已含頁位移）
 *     NpcWalker.g_instance.addPageObstacle(page, x, y, r)   // 第幾頁 + 頁內座標，內部自動加位移
 *     NpcWalker.g_instance.setObstacles([{x, y, r}, ...])   // 一次換掉整組
 *     NpcWalker.g_instance.clearObstacles()
 *     state.npcObstacles = [{x, y, r}, ...]                 // 掛在狀態上，切頁後自動沿用
 *   r 是地面上的半徑（水平方向），縱向會自動被 BODY.squash 壓扁，符合斜視角。
 *   最後還有一道保險：一幀真正移動得太少就記一次，連續卡住 1.5 秒就重挑落腳點，
 *   互推或被兩顆障礙夾在角落時不會永久定住。
 *
 * 景深（跟地圖景物同一套規則，關卡按鈕例外）：
 *   腳底 y 越大（越靠畫面下方）越前面，越小（越靠上方選單）越後面。
 *   做法是每幀把 objectsLayer 整層照排序鍵重排一次（不是我插在第幾格、也不是誰後加入誰在上），
 *   所以 NPC 走到樹後面會被樹遮住半個身子，繞到樹前面又會壓在樹上。
 *   關卡按鈕（地上的洞）不算「站著的東西」，固定墊在最底層，不參與 y 比較——
 *   否則按鈕的座標只要比 NPC 大，NPC 就會被按鈕圖整個蓋掉半截。
 *
 * 影格時間軸（獨立於位移）：
 *   每隻 NPC 內部一隻 StepTicker，只負責每隔 stepIntervalMs（220ms）順序推進一格（0→1→2→3 循環）。
 *   走路中只照 dt 自己累計，不受位移距離、步速、避讓、被推開影響；發呆/卡住/聊天/到格/無路徑
 *   等不移動狀態就 stop() 暫停並站回併腳幀。一幀最多補一格，不會一幀連轉多格。
 *
 * 腳底陰影：
 *   容器原點就是腳底正中央，所以陰影直接畫在原點上，角色走到哪影子就跟到哪。
 *   用多層同心的扁橢圓疊出柔邊（不用徑向漸層，避免引擎對漸層縮放的行為不確定），
 *   跨步幀拉寬、併腳幀收回，影子跟著腳步一起呼吸。
 *
 * @author DaiEn
 * @Date 2026-11-21
 * @Correction 36
 */
var NpcWalker = (function() {
	// 三張圖集共用的格規格
	var CELL = {
		w: 96,
		h: 128,
		baseline: 123, // 腳底在格內的 y（下緣留 4px）；六張圖集都已對齊這條線，所以只有一個值
		scale: 0.92 // 圖集縮到遊戲單位的比例，換算後身高約 96
	};

	// 角色在地面上的「佔地」：撞到障礙、繞行、產生陰影都用這組數值
	// 地圖是斜視角，畫面上同樣 1px，縱向看起來比橫向擠，所以量距離時把 y 乘上 squash，
	// 等於把橢圓佔地換算成圓，程式只要比半徑就好（跟 separate() 的 minGap/verticalGap 同一套概念）
	var BODY = {
		rx: 20, // 腳底佔地的水平半徑（角色寬約 52，取一半再多留一點）
		squash: 2.4 // 縱向壓縮比：y 差 1px 等於水平差 2.4px
	};

	// 障礙是 32×32 軸對齊方格：資料只存中心點 (x, y) 與半格 r，
	// 整個 [x-r, x+r] × [y-r, y+r] 都是不可通行，不再用圓心距離判斷
	var BLOCK_CELL = {
		half: 16, // 方格半格寬（與工具端 CELL=32、BLOCK_R=16 對應）
		// 角色佔地在「斜視平面」上換算：x 方向看 BODY.rx，y 方向要除以 squash 才是畫面像素半徑
		padY: BODY.rx / BODY.squash
	};

	// 格狀移動的網格：一格 32px，跟障礙方格完全對齊（障礙中心 x/y 都是 16 mod 32）。
	// 整張地圖離散成網格，NPC 只站在「可走格」的中心點，從一格走到相鄰一格；
	// 路徑規劃（A*）也在同一張網格上算，障礙格不可進入，這樣才會完美避開障礙。
	// actor.x / actor.y 只是繪製位置（目前所在格中心，移動中在兩格中心之間插值）。
	var PATH_GRID = {
		cell: 32,
		cols: Math.ceil(Constants.ASSETS_WIDTH / 32),
		rows: Math.ceil(Constants.ASSETS_HEIGHT / 32)
	};


	// 大家共用的手感；每隻個別要調的欄位放在 ROSTER 裡
	var MOVE = {
		marginX: 54, // 左右可走範圍離畫面邊界多遠
		marginTop: 165, // 上緣閃開上方選單與 logo
		marginBottom: 62, // 下緣留白，腳底不要貼死畫面底
		stepIntervalMs: 190, // 獨立影格時間軸：每隔 220 毫秒換一格；全員同一節奏，與位移距離、步速、避讓解耦
		minGap: 30, // 兩隻 NPC 之間「水平」希望拉開的距離
		verticalGap: 17, // 地圖是斜視角，同樣的距離在 y 上要更擠才看得出重疊
		pushStrength: 0.45, // 太近時每一幀自行退開的比例（1 = 一次退到位，會很硬）
		targetClearance: 60, // 挑落腳格時，離鄰居與鄰居的目標至少這麼遠（px）
		targetTries: 4, // 挑不到乾淨的格就重挑幾次
		idleChance: 0.22, // 到定點後，有多少機率不換位置、留在原地發呆
		idleMin: 2000, // 發呆最短時間（毫秒）
		idleMax: 4200, // 發呆最長時間

		farChance: 0.85, // 有多少機率直接挑很遠的目標格，拉長移動路線
		farMinCells: 20, // 被選成「遠距目標」時，曼哈頓距離至少這麼多格（本頁可走上限約 17～19）
		
		chatRadius: 50, // 兩隻距離這麼近就視為迎面相遇（聊天時會主動轉向對方）
		chatChance: 0.35, // 迎面相遇時，有多少機率停下來面對面聊天
		chatMin: 1600, // 聊天最短時間（毫秒）
		chatMax: 3400, // 聊天最長時間
		chatCooldown: 4000, // 聊完之後多久內不再發起聊天，先各自走開避免黏在同一處
		fadeTime: 320, // 進場淡入時間（毫秒）
		obstacleMargin: 6, // 判定格中心離障礙表面再多留這麼多，走起來才不會擦到邊
		npcRadius: 12, // 鄰居佔地判定用的半徑（比 BODY 小，兩隻才不會互相頂住）
		stallFramesMax: 30, // 連續走不動超過這麼多幀就進入卡住暫停
		stuckPause: 1400, // 卡住時原地停頓的毫秒數，時間到再重找目標格
		softNpcRadius: 9, // 走動中鄰居的柔軟佔地：規劃時只避開它目前所在格，不擋整片圓

		minPerPage: 1, // INT：每一個地圖分頁至少上場幾名 NPC（有候選時）；候選為 0 則不上場
		maxPerPage: 3 // INT：每一個地圖分頁最多上場幾名 NPC；從 visible=true 的名冊中隨機抽，候選不足時以實際人數為準
	};

	// 名冊。anim 裡放的是「Images 上的常數名稱」，真正的值等到建立角色時才查，
	// 這樣這支檔案排在哪個 script 標籤前面都不會拿到 undefined 而整頁爆掉
	var ROSTER = [{
		id: "npc01",
		visible: true, // 獨立顯示開關：false 時這隻不進選關頁（不建立容器、不參與避讓）；圖集尚未改四格前先關閉
		anim: {
			back: "NPC_01_WALK_BACK",
			right: "NPC_01_WALK_RIGHT",
			front: "NPC_01_WALK_FRONT",
			left: "NPC_01_WALK_LEFT"
		},
		speed: 44, // 每秒走多少遊戲單位（畫布寬 700，約 16 秒橫越一次）
		pauseMin: 700, // 走到定點後停頓的最短時間（毫秒）
		pauseMax: 2800, // 走到定點後停頓的最長時間
		shadowRX: 24, // 腳底陰影的水平半徑
		shadowRY: 7.5, // 腳底陰影的垂直半徑（壓扁才有貼地感）
		spawnSlot: 0.22, // 進場位置落在可走寬度的哪個比例（三隻錯開才不會一開場就撞在一起）
		fadeDelay: 0 // 進場前的等待時間，讓三隻不是同時冒出來
	}, {
		id: "npc02",
		visible: true,
		anim: {
			back: "NPC_02_WALK_BACK",
			right: "NPC_02_WALK_RIGHT",
			front: "NPC_02_WALK_FRONT",
			left: "NPC_02_WALK_LEFT"
		},
		speed: 50, // 抱籃的那隻走得比較急
		pauseMin: 500,
		pauseMax: 2200,
		shadowRX: 25,
		shadowRY: 8,
		spawnSlot: 0.52,
		fadeDelay: 220
	}, {
		id: "npc03",
		visible: true,
		anim: {
			back: "NPC_03_WALK_BACK",
			right: "NPC_03_WALK_RIGHT",
			front: "NPC_03_WALK_FRONT",
			left: "NPC_03_WALK_LEFT"
		},
		speed: 44, // 粉髮水手領那隻慢條斯理，停得也比較久
		pauseMin: 1300,
		pauseMax: 3600,
		shadowRX: 23,
		shadowRY: 7,
		spawnSlot: 0.8,
		fadeDelay: 440
	}, {
		id: "npc04",
		visible: true,
		anim: {
			back: "NPC_04_WALK_BACK",
			right: "NPC_04_WALK_RIGHT",
			front: "NPC_04_WALK_FRONT",
			left: "NPC_04_WALK_LEFT"
		},
		speed: 46, // 黑長直埃及風女孩，步速取 npc01 與 npc02 之間
		pauseMin: 600,
		pauseMax: 2500,
		shadowRX: 24,
		shadowRY: 7.5,
		spawnSlot: 0.36, // 與前三隻進場槽位錯開
		fadeDelay: 660
	}, {
		id: "npc05",
		visible: true,
		anim: {
			back: "NPC_05_WALK_BACK",
			right: "NPC_05_WALK_RIGHT",
			front: "NPC_05_WALK_FRONT",
			left: "NPC_05_WALK_LEFT"
		},
		speed: 42,
		pauseMin: 700,
		pauseMax: 2800,
		shadowRX: 24,
		shadowRY: 7.5,
		spawnSlot: 0.68, // 與既有四隻進場槽位錯開
		fadeDelay: 880
	}, {
		id: "npc06",
		visible: true,
		anim: {
			back: "NPC_06_WALK_BACK",
			right: "NPC_06_WALK_RIGHT",
			front: "NPC_06_WALK_FRONT",
			left: "NPC_06_WALK_LEFT"
		},
		speed: 48,
		pauseMin: 550,
		pauseMax: 2400,
		shadowRX: 24,
		shadowRY: 7.5,
		spawnSlot: 0.9, // 最右側進場，與其他角色錯開
		fadeDelay: 1100
	}];

	// 走路循環用的格序（順序式四格）：0 → 1 → 2 → 3 → 0 → 1 → 2 → 3 …
	// 圖集每列四格，依格號順序迴圈，不再走鐘擺回頭。
	var CYCLE = [0, 1, 2, 3];

	/**
	 * 獨立影格時間軸：只負責「每隔 intervalMs 推進一格」，格序在 0 ~ cycleLen-1 間順序循環。
	 * 與角色位移、步速、避讓、被推開完全解耦：moving=true 時只照 dt 累計，不受其他因素影響；
	 * moving=false（發呆／卡住／聊天／到格站立／無路徑）時暫停並回到起始格。
	 * 時鐘仍由主 update 統一推 dt（不另開 rAF／setInterval），但計時狀態全部封在這隻小計時器裡。
	 * @param {Number} intervalMs 換格間隔（毫秒）
	 * @param {Number} cycleLen 循環格數
	 */
	function createStepTicker(intervalMs, cycleLen) {
		var ticker = {
			interval: intervalMs, // 換格間隔（毫秒）
			cycleLen: cycleLen, // 循環格數
			clock: 0, // 累計毫秒
			index: 0, // 目前格序
			/**
			 * 每幀推進；moving 為 true 才累計。一幀最多補一格，超出的時間保留到下一幀。
			 * @param {Number} dt 本幀經過秒數
			 * @param {Boolean} moving 是否正在走路
			 * @return {Boolean} 本幀是否換了一格
			 */
			tick: function(dt, moving) {
				if (!moving) {
					return false;
				}
				ticker.clock += dt * 1000;
				if (ticker.clock >= ticker.interval) {
					ticker.clock -= ticker.interval;
					ticker.index = (ticker.index + 1) % ticker.cycleLen;
					return true;
				}
				return false;
			},
			// 停止移動：暫停累計、歸回起始格
			stop: function() {
				ticker.clock = 0;
				ticker.index = 0;
			},
			// 進場錯開起始格，避免多隻永遠同手同腳
			setIndex: function(i) {
				ticker.index = ((i % ticker.cycleLen) + ticker.cycleLen) % ticker.cycleLen;
			}
		};
		return ticker;
	}

	function NpcWalker() {
		this.owner = null; // 目前掛在哪個狀態上
		this.actors = []; // 目前名冊上所有 NPC 的顯示容器

	this.obstacles = []; // 外部註冊的地面障礙點（圓形，座標與 levelPoints 同一套，已含頁位移）

	}

	// 全域單例，跟 weather.js 的 WeatherSystem.g_instance 同一個寫法
	NpcWalker.g_instance = new NpcWalker();

	/**
	 * 把 profile.anim 上的常數名稱解析成真正的動畫名
	 * @param {Object} profile 名冊上的一筆
	 * @return {Object} {back, right, front, left} 四個動畫名
	 */
	function resolveAnims(profile) {
		return {
			back: Images[profile.anim.back],
			right: Images[profile.anim.right],
			front: Images[profile.anim.front],
			left: Images[profile.anim.left]
		};
	}


	/**
	 * 在地面「平面」上量兩點的距離
	 * 把 y 乘上 squash，等同於把角色與障礙的橢圓佔地換算成圓，
	 * 之後所有比較都只要比半徑，程式單純、也不會出現「橫向撞到卻縱向沒撞到」的怪判斷
	 */
	function spaceDist(ax, ay, bx, by) {
		var dx = ax - bx;
		var dy = (ay - by) * BODY.squash;
		return Math.sqrt(dx * dx + dy * dy);
	}

	/**
	 * 從 a 指向 b 的朝向方向（right/left/front/back），用來判斷兩隻是不是面對面
	 */
	function dirToward(ax, ay, bx, by) {
		var dx = bx - ax;
		var dy = by - ay;
		if (Math.abs(dx) > Math.abs(dy) * 1.05) {
			return dx > 0 ? "right" : "left";
		}
		return dy > 0 ? "front" : "back";
	}

	/**
	 * 取一個障礙方格的軸對齊邊界（資料存中心點，半格用 b.r，缺值時退回 16）
	 */
	function blockRect(b) {
		var half = (typeof b.r === 'number' && b.r > 0) ? b.r : BLOCK_CELL.half;
		return {
			left: b.x - half,
			right: b.x + half,
			top: b.y - half,
			bottom: b.y + half
		};
	}

	/**
	 * 角色佔地（視為一個小矩形）是否壓進某個障礙方格；
	 * pad 是角色在各方向要離開方格邊界的餘裕（繞行多留 obstacleMargin）
	 */
	function rectHitsBlock(x, y, b, pad) {
		var r = blockRect(b);
		var halfX = BODY.rx + pad;
		var halfY = BLOCK_CELL.padY + pad;
		return x + halfX > r.left && x - halfX < r.right &&
			y + halfY > r.top && y - halfY < r.bottom;
	}

	/**
	 * 格座標 → 格中心畫面座標（pageTop 是本頁在整張直排地圖上的頂端）
	 */
	function cellCenter(col, row, actor) {
		return {
			x: col * PATH_GRID.cell + PATH_GRID.cell / 2,
			y: actor.pageTop(actor.page) + row * PATH_GRID.cell + PATH_GRID.cell / 2
		};
	}

	/**
	 * 畫面座標 → 格索引（夾在網格範圍內）
	 */
	function cellAt(x, y, actor) {
		var col = Math.floor(x / PATH_GRID.cell);
		var row = Math.floor((y - actor.pageTop(actor.page)) / PATH_GRID.cell);
		col = Math.max(0, Math.min(PATH_GRID.cols - 1, col));
		row = Math.max(0, Math.min(PATH_GRID.rows - 1, row));
		return { cx: col, cy: row };
	}

	/**
	 * 收集這一幀要閃的所有障礙
	 * 來源＝外部註冊的地面障礙格 ＋ 狀態自帶的點（state.npcObstacles） ＋ 其他 NPC。
	 * 其他 NPC 一律納入規劃避讓：靜止鄰居用 npcRadius 佔地，走動中鄰居用較小的 softNpcRadius，
	 * 只避開它目前所在格，不會把整片圓當牆；即時的近身錯開仍交給 separate。
	 */
	function collectBlockers(actor, walker) {
		var list = [];
		var i;

		var obstacles = walker.obstacles;
		for (i = 0; i < obstacles.length; i++) {
			list.push(obstacles[i]);
		}

		var extra = actor.state ? actor.state.npcObstacles : null;
		if (extra && extra.length) {
			for (i = 0; i < extra.length; i++) {
				list.push(extra[i]);
			}
		}

		var others = walker.actors;
		for (i = 0; i < others.length; i++) {
			var other = others[i];
			if (other === actor || other.dead || !other.parent) {
				continue;
			}
			var standing = other.pauseLeft > 0 || other.spawnWait > 0;
			list.push({
				x: other.x,
				y: other.y,
				r: standing ? MOVE.npcRadius : MOVE.softNpcRadius,
				isNpc: true,
				soft: !standing
			});
		}

		return list;
	}

	/**
	 * 某一格是否可走：先看格中心有沒有落在可走邊界內，再看有沒有壓到障礙／靜止鄰居。
	 * 規劃與挑目標都用同一套判定，保證 A* 算出來的格 NPC 真的站得進去。
	 */
	function cellWalkable(col, row, actor, blockers) {
		var bounds = actor.walkBounds();
		var center = cellCenter(col, row, actor);
		if (center.x < bounds.left || center.x > bounds.right ||
			center.y < bounds.top || center.y > bounds.bottom) {
			return false;
		}
		return !actor.pointBlocked(center.x, center.y, blockers);
	}

	/**
	 * 標記本頁網格：障礙格、被鄰居佔住的格、邊界外的格都設為受阻。
	 */
	function buildBlockedGrid(actor, blockers) {
		var cols = PATH_GRID.cols;
		var rows = PATH_GRID.rows;
		var blocked = new Array(cols * rows);
		for (var gy = 0; gy < rows; gy++) {
			for (var gx = 0; gx < cols; gx++) {
				blocked[gy * cols + gx] = !cellWalkable(gx, gy, actor, blockers);
			}
		}
		return blocked;
	}

	/**
	 * A* 在 32 網格上求「目前格 → 目標格」的可通行路徑。
	 * 只走上下左右四個正交方向（對照方案圖上的水平／垂直廊道），不斜穿牆角。
	 * 回傳格索引序列 [{cx, cy}, ...]，不含起點、含目標；找不到路回 null。
	 */
	function planAStar(actor, blockers) {
		var cols = PATH_GRID.cols;
		var rows = PATH_GRID.rows;
		var blocked = buildBlockedGrid(actor, blockers);

		var start = { cx: actor.cellCx, cy: actor.cellCy };
		var goal = { cx: actor.targetCx, cy: actor.targetCy };

		// 起點若剛好落在受阻格（進場誤落），先視為可走，否則永遠起不來
		blocked[start.cy * cols + start.cx] = false;

		var open = [];
		var came = {};
		var gScore = {};
		var closed = {};
		var key = function(cx, cy) { return cy * cols + cx; };

		var h = function(cx, cy) {
			return Math.abs(cx - goal.cx) + Math.abs(cy - goal.cy);
		};

		var startKey = key(start.cx, start.cy);
		gScore[startKey] = 0;
		open.push({ cx: start.cx, cy: start.cy, f: h(start.cx, start.cy) });

		var neighbors = [
			{ dx: 1, dy: 0 }, { dx: -1, dy: 0 },
			{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }
		];

		var found = false;
		var guard = 0;
		while (open.length && guard < cols * rows * 4) {
			guard++;
			// 取 f 最小的節點（網格小，線性找就夠）
			var bestIdx = 0;
			for (var oi = 1; oi < open.length; oi++) {
				if (open[oi].f < open[bestIdx].f) {
					bestIdx = oi;
				}
			}
			var cur = open.splice(bestIdx, 1)[0];
			var curKey = key(cur.cx, cur.cy);
			if (closed[curKey]) {
				continue;
			}
			closed[curKey] = true;

			if (cur.cx === goal.cx && cur.cy === goal.cy) {
				found = true;
				break;
			}

			for (var ni = 0; ni < neighbors.length; ni++) {
				var n = neighbors[ni];
				var nx = cur.cx + n.dx;
				var ny = cur.cy + n.dy;
				if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
					continue;
				}
				var nKey = key(nx, ny);
				if (closed[nKey] || blocked[nKey]) {
					continue;
				}

				var tentative = gScore[curKey] + 1;
				if (gScore[nKey] === undefined || tentative < gScore[nKey]) {
					gScore[nKey] = tentative;
					came[nKey] = curKey;
					open.push({ cx: nx, cy: ny, f: tentative + h(nx, ny) });
				}
			}
		}

		if (!found) {
			return null;
		}

		// 回溯格索引路徑
		var gridPath = [];
		var curKey = key(goal.cx, goal.cy);
		while (curKey !== undefined) {
			var cgx = curKey % cols;
			var cgy = Math.floor(curKey / cols);
			gridPath.push({ cx: cgx, cy: cgy });
			if (curKey === startKey) {
				break;
			}
			curKey = came[curKey];
		}
		gridPath.reverse();
		if (gridPath.length) {
			gridPath.shift(); // 去掉起點
		}
		return gridPath;
	}


	/**
	 * 掛到指定狀態；同一個狀態重複呼叫也只會有一組 NPC
	 * @param {DNGameState} state 選關頁狀態本體（要有 objectsLayer）
	 * @return {Boolean} 是否掛載成功（一張圖集都沒載到時回 false）
	 */
	NpcWalker.prototype.attach = function(state) {
		// 與景物共用 objectsLayer，才能照腳底 y 混排景深；不要再拆獨立 NPC 層
		var npcContainer = state.objectsLayer;
		if (!state || !npcContainer) {
			return false;
		}

		// 翻頁後重掛：先把上一頁的 NPC 全部摘掉，再對當前頁重新隨機抽選（每頁獨立計算）。
		// 原本「同一 state 重複呼叫直接沿用」的保護移除：選關頁翻頁時 state 不變，但要換一批。
		this.detach();

		var self = this;

		// 先收齊 visible=true 的候選名單，再洗牌。每頁上場人數在 minPerPage ~ maxPerPage 之間隨機；
		// 候選人數低於上限就以實際候選為準，不會補空；候選為 0 則不上場。
		var candidates = [];
		for (var c = 0; c < ROSTER.length; c++) {
			if (ROSTER[c].visible === false) {
				continue;
			}
			candidates.push(ROSTER[c]);
		}
		Utils.shuffle(candidates);

		var max = (typeof MOVE.maxPerPage === "number" && MOVE.maxPerPage > 0) ? MOVE.maxPerPage : candidates.length;
		var min = (typeof MOVE.minPerPage === "number" && MOVE.minPerPage > 0) ? MOVE.minPerPage : 0;
		var wantMax = Math.min(max, candidates.length);
		var wantMin = Math.min(min, wantMax);
		var wantCount = wantMax > wantMin ? Utils.RandomRangeInt(wantMin, wantMax) : wantMax;
		var picked = candidates.slice(0, wantCount);

		var spawned = 0;
		for (var i = 0; i < picked.length; i++) {
			var profile = picked[i];
			var actor = makeActor(state, profile, self);
			if (!actor) {
				continue;
			}

			// 走 addGameObjectAt：一方面進容器，一方面進 gameObjects 讓每幀 update 被呼叫
			state.addGameObjectAt(actor, npcContainer);

			// 先入列再進場：後面的角色挑落腳點時才看得到先出生的鄰居
			self.actors.push(actor);
			actor.enterPage(actor.currentPage(), MOVE.fadeTime, profile.fadeDelay);
			spawned++;
		}

		if (!spawned) {
			// 圖集沒載到就不要硬掛，避免選關頁整頁一起爆掉
			console.warn("NPC 行走圖集一張都沒有載到，選關頁不掛 NPC");
			return false;
		}

		this.owner = state;
		return true;
	};

	/**
	 * 把整組 NPC 從畫面上摘掉（正常流程不會用到，只有熱重載或狀態被硬換時才需要）
	 */
	NpcWalker.prototype.detach = function() {
		for (var i = 0; i < this.actors.length; i++) {
			var actor = this.actors[i];
			actor.dead = true;
			createjs.Tween.removeTweens(actor);
			if (actor.parent) {
				actor.parent.removeChild(actor);
			}
		}
		this.actors = [];
		this.owner = null;
	};

	/**
	 * 目前名冊上的所有 NPC（除錯或外部要查位置時用）
	 * @return {Array} actor 陣列（複本，改它不會影響實際運作）
	 */
	NpcWalker.prototype.getActors = function() {
		return this.actors.slice();
	};


	/**
	 * 註冊一個地面障礙點（圓形）
	 * 座標跟 levelPoints、行道樹是同一套「圖層座標」，也就是已經含頁位移的那組，
	 * 這樣繞行判斷不必再換算；手上只有頁內座標時用 addPageObstacle，它會自動換。
	 * @param {Number} x 圖層座標 x
	 * @param {Number} y 圖層座標 y
	 * @param {Number} r 地面上的半徑（水平方向；縱向會被 BODY.squash 壓扁，符合斜視角）
	 */
	NpcWalker.prototype.addObstacle = function(x, y, r) {
		this.obstacles.push({
			x: x,
			y: y,
			r: r
		});
	};

	/**
	 * 用「第幾頁 + 頁內座標」註冊障礙點，內部自動加上該頁的地圖位移
	 * @param {Number} page 頁碼
	 * @param {Number} x 頁內 x
	 * @param {Number} y 頁內 y（跟景物、關卡按鈕同一套座標）
	 * @param {Number} r 地面上的半徑
	 */
	NpcWalker.prototype.addPageObstacle = function(page, x, y, r, group) {
		this.addObstacle(x, Maps.getPageY(page, group) + y, r);
	};

	/**
	 * 一次換掉整組障礙點（切換關卡時整批更新用）
	 * @param {Array} list [{x, y, r}, ...]
	 */
	NpcWalker.prototype.setObstacles = function(list) {
		this.obstacles = [];
		if (!list) {
			return;
		}
		for (var i = 0; i < list.length; i++) {
			this.addObstacle(list[i].x, list[i].y, list[i].r);
		}
	};

	/**
	 * 清空障礙點
	 */
	NpcWalker.prototype.clearObstacles = function() {
		this.obstacles = [];
	};

	/**
	 * 目前註冊了哪些障礙點（除錯或外部檢查用，回傳複本）
	 * @return {Array} [{x, y, r}, ...]
	 */
	NpcWalker.prototype.getObstacles = function() {
		return this.obstacles.slice();
	};


	/**
	 * 建立一隻 NPC 的顯示容器（原點＝腳底正中央）
	 * @param {DNGameState} state 選關頁狀態
	 * @param {Object} profile 名冊上的一筆
	 * @param {NpcWalker} walker 單例本體，拿來查鄰居
	 * @return {createjs.Container|null} 建不起來（圖集沒載到）時回 null
	 */
	function makeActor(state, profile, walker) {
		var anims = resolveAnims(profile);

		// 傳動畫名給 getImage，拿到的是已 stop() 的單格 Sprite
		var sprite = DNAssetsManager.g_instance.getImage(anims.front);
		if (!sprite || typeof sprite.gotoAndStop !== "function") {
			console.warn("NPC 行走圖集（" + Images[profile.anim.front] + "）沒有載到，這隻先不掛");
			return null;
		}

		var actor = new createjs.Container();
		actor.layer = state.objectsLayer;
		actor.state = state;
		actor.dead = false;
		actor.id = profile.id;

		// 這一版引擎（EaselJS 0.7.1）的 Sprite.gotoAndStop 只收一個參數：
		// 傳動畫名 → 停在那組動畫的第 0 幀；傳數字 → 直接跳到該「絕對格號」。
		// 所以要在同一組動畫裡換幀，得先跟圖集問出每一幀的絕對格號，再跳過去。
		// 這裡先把四個朝向的格號表查好，之後每幀只做一次比對，不重複查。
		var frameTable = {};
		var dirNames = ["back", "right", "front", "left"];
		for (var d = 0; d < dirNames.length; d++) {
			var animInfo = sprite.spriteSheet && sprite.spriteSheet.getAnimation ? sprite.spriteSheet.getAnimation(
				anims[dirNames[d]]) : null;
			frameTable[dirNames[d]] = (animInfo && animInfo.frames && animInfo.frames.length) ? animInfo.frames : [0];
		}

		// 把縮放與位移補到腳底：Sprite 的左上角跟容器的原點差半格寬、一個 CELL.baseline 高
		// 三張圖集的格規格與腳底基線都一樣，所以這幾行對三隻都成立，不必逐隻傳參數
		sprite.scaleX = sprite.scaleY = CELL.scale;
		sprite.x = -(CELL.w / 2) * CELL.scale;
		sprite.y = -CELL.baseline * CELL.scale;
		sprite.mouseEnabled = false;
		sprite.shownFrame = -1;

		// 腳底陰影：用多層同心的扁橢圓疊出柔邊
		// 不用徑向漸層是因為這版引擎的漸層要跟著物件縮放，行為不好掌握；
		// 純路徑填色一定會照物件矩陣轉換，外圈一層層加淡，遠看就是模糊的接地影
		var shadow = new createjs.Shape();
		var shadowLayers = [{
			r: 1.0,
			a: 0.03
		}, {
			r: 0.88,
			a: 0.03
		}, {
			r: 0.76,
			a: 0.04
		}, {
			r: 0.63,
			a: 0.05
		}, {
			r: 0.5,
			a: 0.06
		}, {
			r: 0.37,
			a: 0.07
		}, {
			r: 0.24,
			a: 0.08
		}];
		for (var s = 0; s < shadowLayers.length; s++) {
			var rx = profile.shadowRX * shadowLayers[s].r;
			var ry = profile.shadowRY * shadowLayers[s].r;
			shadow.graphics
				.beginFill("rgba(30, 22, 12, " + shadowLayers[s].a + ")")
				.drawEllipse(-rx, -ry, rx * 2, ry * 2);
		}
		shadow.y = 1; // 陰影中心往下偏一點，貼著腳底而不是切過鞋面
		shadow.mouseEnabled = false;

		// 陰影先加、角色後加 → 影子永遠壓在自己底下
		actor.addChild(shadow);
		actor.addChild(sprite);
		actor.shadow = shadow;
		actor.sprite = sprite;
		actor.mouseEnabled = false; // 不要擋住關卡按鈕的點擊
		actor.mouseChildren = false;

		actor.dir = "front"; // 目前朝向
		actor.step = createStepTicker(MOVE.stepIntervalMs, CYCLE.length); // 獨立影格時間軸：只負責每 220ms 推進一格
		actor.pauseLeft = 0; // 還要站在原地多久（毫秒）
		actor.spawnWait = 0; // 進場前還要等多久（毫秒）
		actor.page = -1; // 目前在卷軸的第幾頁

		// 格狀移動：NPC 只站在 32×32 可走格上，x/y 是目前所在格中心（繪製用）
		actor.cellCx = 0; // 目前所在格的行索引
		actor.cellCy = 0; // 目前所在格的列索引
		actor.targetCx = 0; // 目標格行索引
		actor.targetCy = 0; // 目標格列索引
		actor.pathCells = []; // A* 算出來的格索引序列（不含起點、含目標）
		actor.pathIndex = 0; // 目前走到路徑第幾格
		actor.stallFrames = 0; // 連續走不動的幀數
		actor.stuckTimer = 0; // 卡住暫停倒數（毫秒）；>0 時原地等待，時間到重找目標格
		actor.chatTimer = 0; // 面對面聊天倒數（毫秒）；>0 時站著看對方，時間到再繼續走
		actor.chatWith = null; // 正在聊天的另一隻 NPC
		actor.chatCd = 0; // 聊天冷卻倒數（毫秒）；>0 時不再發起新聊天

		actor.x = 0; // 繪製位置（格中心，移動中在兩格中心之間插值）
		actor.y = 0;


		// 取目前頁碼：SelectLevelState.currentPage 是掛在建構子上的靜態值
		actor.currentPage = function() {
			var ctor = state.constructor;
			if (ctor && typeof ctor.currentPage === "number") {
				return ctor.currentPage;
			}
			return 0;
		};

		// 取目前大關：SelectLevelState.currentGroup 是掛在建構子上的靜態值（預設 0）
		actor.currentGroup = function() {
			var ctor = state.constructor;
			if (ctor && typeof ctor.currentGroup === "number") {
				return ctor.currentGroup;
			}
			return 0;
		};

		// 第 page 頁在地圖座標裡的頂端（景物、關卡點的 y 都已經含這段位移）
		actor.pageTop = function(page) {
			return Maps.getPageY(page, actor.currentGroup());
		};

		/**
		 * 這一頁可走範圍的四條邊
		 */
		actor.walkBounds = function() {
			var top = actor.pageTop(actor.page);
			return {
				left: MOVE.marginX,
				right: Constants.ASSETS_WIDTH - MOVE.marginX,
				top: top + MOVE.marginTop,
				bottom: top + Constants.ASSETS_HEIGHT - MOVE.marginBottom
			};
		};

		/**
		 * 把繪製位置夾回本頁可走邊界（被鄰居推開時用；障礙判定走格判定，不做表面滑離）
		 */
		actor.clampToPage = function() {
			var b = actor.walkBounds();
			if (actor.x < b.left) {
				actor.x = b.left;
			} else if (actor.x > b.right) {
				actor.x = b.right;
			}
			if (actor.y < b.top) {
				actor.y = b.top;
			} else if (actor.y > b.bottom) {
				actor.y = b.bottom;
			}
		};

		/**
		 * 目前路徑上第一個還沒走到的格中心；沒有路徑時回 null
		 */
		actor.waypoint = function() {
			if (actor.pathIndex >= actor.pathCells.length) {
				return null;
			}
			var cell = actor.pathCells[actor.pathIndex];
			return cellCenter(cell.cx, cell.cy, actor);
		};

		/**
		 * 某個候選格離鄰居有多遠：同時看鄰居「現在所在格」與「目標格」，
		 * 只看現在的位置會出現兩隻同時決定去同一格、然後在終點撞在一起的情況
		 * @param {Number} col 候選格行
		 * @param {Number} row 候選格列
		 * @return {Number} 最近的距離（沒有鄰居時回一個很大的數）
		 */
		actor.clearanceAt = function(col, row) {
			var center = cellCenter(col, row, actor);
			var nearest = 1e9;
			var others = walker.actors;
			for (var i = 0; i < others.length; i++) {
				var other = others[i];
				if (other === actor || other.dead) {
					continue;
				}

				var dNow = Utils.Distance(center.x, center.y, other.x, other.y);
				if (dNow < nearest) {
					nearest = dNow;
				}

				// 鄰居已經有目標格在跑，那格也算「被佔用」
				if (typeof other.targetCx === "number") {
					var otherGoal = cellCenter(other.targetCx, other.targetCy, actor);
					var dTarget = Utils.Distance(center.x, center.y, otherGoal.x, otherGoal.y);
					if (dTarget < nearest) {
						nearest = dTarget;
					}
				}
			}
			return nearest;
		};

		/**
		 * 選一個新的目標格，範圍限在「目前這一頁的可走格」。
		 * 先擲發呆機率：命中就留在目前格、多站一會兒；
		 * 否則重抽幾次，取離鄰居最遠、也離自己最遠的一格；
		 * 遠距機率命中時優先挑離自己很遠的格，拉長移動路線。
		 * 整頁都被佔住就留在原地，下一輪再挑。
		 */
		actor.pickTarget = function() {
			// 原地發呆：不換目標，只延長休息，時間到再重新挑
			if (Utils.RandomRange(0, 1) < MOVE.idleChance) {
				actor.targetCx = actor.cellCx;
				actor.targetCy = actor.cellCy;
				actor.pauseLeft = Utils.RandomRange(MOVE.idleMin, MOVE.idleMax);
				return;
			}

			var blockers = collectBlockers(actor, walker);
			var wantFar = Utils.RandomRange(0, 1) < MOVE.farChance;
			var bestCol = actor.cellCx;
			var bestRow = actor.cellCy;
			var bestScore = -1;
			// 遠距模式多抽幾次，盡量抽到夠遠的格；一般模式維持原本抽樣量
			var tries = wantFar ? MOVE.targetTries * 14 : MOVE.targetTries * 6;

			for (var i = 0; i < tries; i++) {
				var col = Utils.RandomRangeInt(0, PATH_GRID.cols - 1);
				var row = Utils.RandomRangeInt(0, PATH_GRID.rows - 1);

				// 生在受阻格（障礙或鄰居身上）就直接換一格
				if (!cellWalkable(col, row, actor, blockers)) {
					continue;
				}

				var center = cellCenter(col, row, actor);
				var clear = actor.clearanceAt(col, row);
				var fromSelf = spaceDist(center.x, center.y, actor.x, actor.y);
				// 距離用格數曼哈頓距離；遠距目標以「離自己夠遠的格」為主
				var manh = Math.abs(col - actor.cellCx) + Math.abs(row - actor.cellCy);
				var score = wantFar ? clear * 0.2 + manh * 10 : clear + fromSelf * 0.5;
				if (score > bestScore) {
					bestScore = score;
					bestCol = col;
					bestRow = row;
				}
				var farOk = !wantFar || manh >= MOVE.farMinCells;
				// 一般模式抽到夠乾淨、夠遠就停；遠距模式非等到夠遠的格不提早結束
				if (clear >= MOVE.targetClearance && (farOk || (!wantFar && fromSelf > 60))) {
					break;
				}
			}

			if (bestScore < 0) {
				// 整頁都被障礙佔住：目標留在目前格，先休息，下一輪再挑
				actor.targetCx = actor.cellCx;
				actor.targetCy = actor.cellCy;
			} else {
				actor.targetCx = bestCol;
				actor.targetCy = bestRow;
			}
		};



		/**
		 * 這個點是不是壓在障礙上（含繞行餘裕）
		 * @param {Number} x 座標 x
		 * @param {Number} y 座標 y
		 * @param {Array} blockers 障礙清單
		 * @return {Boolean} true = 這個點不能站
		 */
		actor.pointBlocked = function(x, y, blockers) {
			var pad = MOVE.obstacleMargin;
			for (var i = 0; i < blockers.length; i++) {
				var b = blockers[i];
				if (b.isNpc) {
					// 靜止鄰居維持完整佔地；走動中鄰居只擋貼身距離，保留錯開空間
					var need = b.soft ? b.r + 4 : b.r + BODY.rx + pad;
					if (spaceDist(x, y, b.x, b.y) < need) {
						return true;
					}
					continue;
				}
				if (rectHitsBlock(x, y, b, pad)) {
					return true;
				}
			}
			return false;
		};

		/**
		 * 規劃目前格 → 目標格的完整格狀路徑：在 32 網格上跑四方向 A*，
		 * 障礙格不可進入，路徑沿可走格廊道繞過障礙。找不到路就清空路徑，
		 * 交給卡住保險重挑目標格。
		 */
		actor.planLeg = function() {
			actor.pathCells = [];
			actor.pathIndex = 0;

			var blockers = collectBlockers(actor, walker);
			var path = planAStar(actor, blockers);
			if (!path || !path.length) {
				return; // 無可行路：handleStall 會重挑目標格
			}
			actor.pathCells = path;
			actor.pathIndex = 0;
		};

		/**
		 * 推進到路徑下一格；回傳 true 表示還有後續格，false 表示已走完。
		 */
		actor.advancePath = function() {
			actor.pathIndex += 1;
			return actor.pathIndex < actor.pathCells.length;
		};

		/**
		 * 卡住保險：這一幀幾乎沒移動時記一次。
		 * 先原地重規劃一次（舊路徑可能被鄰居或障礙變化卡住）；
		 * 超過門檻仍卡住就徹底重挑目標格，不會一直在同一格磨。
		 * @param {Number} realMove 這一幀真正移動的距離
		 * @param {Number} stepLength 這一幀原本想走的距離
		 */
		actor.handleStall = function(realMove, stepLength) {
			if (realMove < stepLength * 0.05) {
				actor.stallFrames = (actor.stallFrames || 0) + 1;

				// 第一幀卡住先重跑一次 A*，舊路徑過時時原地就能繞出
				if (actor.stallFrames === 1) {
					actor.planLeg();
					return;
				}

				// 卡夠門檻就進入「原地停頓」：等 stuckPause 毫秒後由 update 重找目標格
				if (actor.stallFrames >= MOVE.stallFramesMax) {
					actor.stallFrames = 0;
					actor.stuckTimer = MOVE.stuckPause;
				}
			} else {
				actor.stallFrames = 0;
				actor.stuckTimer = 0;
			}
		};


		/**
		 * 以某格為中心，由內往外一圈圈找最近的可走格（進場落點剛好壓到障礙時兜底）。
		 * 找不到時回 null，交給呼叫端留在原地、下一輪再挑。
		 */
		function findFreeCell(col, row, blockers) {
			if (cellWalkable(col, row, actor, blockers)) {
				return { cx: col, cy: row };
			}
			var maxRing = Math.max(PATH_GRID.cols, PATH_GRID.rows);
			for (var ring = 1; ring <= maxRing; ring++) {
				for (var dc = -ring; dc <= ring; dc++) {
					for (var dr = -ring; dr <= ring; dr++) {
						if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring) {
							continue;
						}
						var nc = col + dc;
						var nr = row + dr;
						if (nc < 0 || nc >= PATH_GRID.cols || nr < 0 || nr >= PATH_GRID.rows) {
							continue;
						}
						if (cellWalkable(nc, nr, actor, blockers)) {
							return { cx: nc, cy: nr };
						}
					}
				}
			}
			return null;
		}


		// 切朝向並指定第幾幀（frame 傳 1 就是併腳的站立幀）
		// 同一格不重複跳，因為 gotoAndStop 每次都會走一次 normalize，能省則省
		actor.faceTo = function(dir, frame) {
			var frames = frameTable[dir] || frameTable.front;
			var absolute = frames[frame];
			if (absolute === undefined) {
				absolute = frames[0];
			}
			if (sprite.shownFrame !== absolute) {
				sprite.gotoAndStop(absolute);
				sprite.shownFrame = absolute;

				// 跨步的兩格兩腳張開，腳底接觸面積變大 → 影子跟著拉寬、壓薄一點
				// 併腳的那格收回正常大小，這樣即使人只動一點點，影子也在呼吸
				var wide = (frame === 1) ? 1 : 1.12;
				var flat = (frame === 1) ? 1 : 0.92;
				shadow.scaleX = wide;
				shadow.scaleY = flat;
			}
		};

		/**
		 * 進入某一頁：把位置丟到那一頁的偏下方，淡入後開始走
		 * 翻頁時地圖會捲動，NPC 直接在新頁現身比「從舊頁一路走 800px 過去」合理
		 * @param {Number} page 目標頁碼
		 * @param {Number} fadeTime 淡入時間（毫秒）
		 * @param {Number} delay 淡入前先等多久（毫秒，用來錯開三隻）
		 */
		actor.enterPage = function(page, fadeTime, delay) {
			actor.page = page;

			var blockers = collectBlockers(actor, walker);
			// 進場落在下半部某格：照 spawnSlot 取欄，列隨機抽；壓到障礙就由 findFreeCell 就近找可走格
			var col = Math.floor(PATH_GRID.cols * profile.spawnSlot);
			var row = Utils.RandomRangeInt(Math.floor(PATH_GRID.rows * 0.55), PATH_GRID.rows - 1);
			var free = findFreeCell(col, row, blockers);
			if (free) {
				actor.cellCx = free.cx;
				actor.cellCy = free.cy;
			} else {
				var center = actor.walkBounds();
				var c = cellAt(center.left + (center.right - center.left) * profile.spawnSlot,
					center.top + (center.bottom - center.top) * 0.7, actor);
				actor.cellCx = c.cx;
				actor.cellCy = c.cy;
			}
			var spawn = cellCenter(actor.cellCx, actor.cellCy, actor);
			actor.x = spawn.x;
			actor.y = spawn.y;

			actor.step.stop();
			// 起始格錯開，不然多隻會永遠同手同腳
			actor.step.setIndex(Utils.RandomRangeInt(0, CYCLE.length - 1));
			actor.dir = "front";
			actor.spawnWait = delay || 0;
			actor.pauseLeft = Utils.RandomRange(profile.pauseMin, profile.pauseMax) * 0.4;
			actor.stallFrames = 0;
			actor.stuckTimer = 0;
			actor.chatTimer = 0;
			actor.chatWith = null;
			actor.chatCd = 0;
			actor.faceTo("front", 1);

			actor.pickTarget();
			actor.planLeg();
			actor.sortDepth();

			// 淡入：先在延遲裡站著，時間到才慢慢浮出來
			createjs.Tween.removeTweens(actor);
			actor.alpha = 0;
			createjs.Tween.get(actor)
				.wait(actor.spawnWait)
				.to({
					alpha: 1
				}, fadeTime || MOVE.fadeTime, createjs.Ease.linear);
		};

		/**
		 * 太靠近鄰居時往反方向退開
		 * 兩個方向的間距都太小才算擠，而且挑「缺口比較大的那個方向」退，
		 * 所以站在同一直排或同一橫排的兩隻會往最容易分開的方向讓開，不會互相頂住。
		 * 退開後若會踩進受阻格就不採用該軸，避免讓進石頭裡。
		 */
		actor.separate = function() {
			var blockers = collectBlockers(actor, walker);
			var others = walker.actors;
			for (var i = 0; i < others.length; i++) {
				var other = others[i];
				if (other === actor || other.dead || !other.parent) {
					continue;
				}

				var sepX = Math.abs(actor.x - other.x);
				var sepY = Math.abs(actor.y - other.y);
				var gapX = MOVE.minGap - sepX;
				var gapY = MOVE.verticalGap - sepY;

				if (gapX <= 0 || gapY <= 0) {
					continue; // 有一個方向已經夠開，就不算擠
				}

				var dirX = (actor.x >= other.x) ? 1 : -1;
				var dirY = (actor.y >= other.y) ? 1 : -1;
				var useX = gapX >= gapY;

				// 退開的方向如果剛好跟這一段想走的方向相反，會變成「前進多少就被推回多少」，
				// 兩隻面對面時就一直僵在原地動不了。這種情況改成往另一軸錯開，讓它們擦身而過
				var wp = actor.waypoint();
				var dnx = wp ? wp.x - actor.x : 0;
				var dny = wp ? wp.y - actor.y : 0;
				if (useX && dirX * dnx < 0) {
					useX = false;
				} else if (!useX && dirY * dny < 0) {
					useX = true;
				}

				var nx = actor.x;
				var ny = actor.y;
				if (useX) {
					nx += dirX * gapX * MOVE.pushStrength;
				} else {
					ny += dirY * gapY * MOVE.pushStrength;
				}

				// 退開後落在受阻格就不動這個方向，寧可貼著也不踩進障礙
				if (!actor.pointBlocked(nx, ny, blockers)) {
					actor.x = nx;
					actor.y = ny;
				}
			}

			actor.clampToPage();
		};

		/**
		 * 迎面相遇偵測：兩隻距離夠近、又都朝著對方時，擲聊天機率。
		 * 命中就兩隻一起停下來面對面站著聊天；沒命中就交給 separate 與 A* 繞行。
		 * @return {Boolean} true = 正在聊天或剛進入聊天，這一幀不要往對方身上走
		 */
		actor.checkEncounter = function() {
			if (actor.chatTimer > 0) {
				return true;
			}

			var others = walker.actors;
			for (var i = 0; i < others.length; i++) {
				var other = others[i];
				if (other === actor || other.dead || !other.parent || other.chatTimer > 0) {
					continue;
				}
				// 任一方還在聊天冷卻期：只繞行，不再停下來聊
				if (actor.chatCd > 0 || other.chatCd > 0) {
					continue;
				}

				var d = spaceDist(actor.x, actor.y, other.x, other.y);
				if (d > MOVE.chatRadius) {
					continue;
				}

				// 兩隻都在休息就不打擾彼此的發呆
				if (actor.pauseLeft > 0 && other.pauseLeft > 0) {
					continue;
				}

				var myDir = dirToward(actor.x, actor.y, other.x, other.y);
				var oDir = dirToward(other.x, other.y, actor.x, actor.y);

				if (Utils.RandomRange(0, 1) < MOVE.chatChance) {
					var dur = Utils.RandomRange(MOVE.chatMin, MOVE.chatMax);
					actor.chatTimer = dur;
					actor.chatWith = other;
					other.chatTimer = dur;
					other.chatWith = actor;
					actor.dir = myDir;
					other.dir = oDir;
					// 中斷原本的休息與舊路徑，聊天結束後重新挑目標
					actor.pauseLeft = 0;
					other.pauseLeft = 0;
					actor.pathCells = [];
					actor.pathIndex = 0;
					other.pathCells = [];
					other.pathIndex = 0;
					return true;
				}
				// 沒命中聊天：不擋移動，靠 separate 錯開、規劃時避開彼此
				return false;
			}
			return false;
		};

		/**
		 * 讓整層照座標重新排一次前後順序
		 * 兩條規則：
		 *   1) 關卡按鈕是「地上的洞」不是站著的東西，固定墊在最底層，不參與 y 比較
		 *      （否則按鈕座標只要比 NPC 大，就會像把 NPC 半個身子吞掉那樣蓋過去）
		 *   2) 其他地圖景物照腳底 y 排：y 小的在後、大的在前，跟 onScrollFinished 一致
		 *
		 * 這裡不用「數一數有幾顆在我後面、就插到那個索引」的做法——那只有在整層本身
		 * 已經排好序時才成立，一換頁、一掉落就未必；直接把整層依排序鍵重排才穩。
		 * 排序鍵相同時保持原本的先後，避免同一高度的東西互相閃爍。
		 * 其他 NPC 也在這一層裡，它們的 y 就是自己的腳底座標，照同一條規則參與比較。
		 */
		// 景物落地點（景深鍵值）：取圖片下緣的 y。
		// 景觀是以中心錨點擺放，中心往下到圖片底部這段高度才是真正落地位置；
		// 拿這個落地 y 跟 NPC 腳底 y 比前後，不能拿景觀中心點比，否則高景物會被錯誤遮擋。
		// 優先用 MapSkewer 落地時記錄的 baseY（靜止落地點，避免掉落動畫途中閃爍）；
		// 沒有記錄時再讀實際渲染框下緣（框 y ＋ 框高）兜底。
		function sceneryGroundY(child) {
			if (typeof child.baseY === "number" && isFinite(child.baseY)) {
				return child.baseY;
			}
			var bounds = null;
			if (child.getTransformedBounds) {
				bounds = child.getTransformedBounds();
			}
			if (bounds && typeof bounds.height === "number" && isFinite(bounds.height) && bounds.height > 0) {
				return bounds.y + bounds.height;
			}
			return typeof child.y === "number" ? child.y : 0;
		}

		// NPC 景深鍵值：同樣取自身圖片框下緣的 y（框 y ＋ 框高），跟景物落地點同一條規則；
		// 框取不到時才退回容器原點（腳底）。陰影在原點下方一點點，框下緣已含這段接地影。
		function actorGroundY(actor) {
			var bounds = null;
			if (actor.getTransformedBounds) {
				bounds = actor.getTransformedBounds();
			}
			if (bounds && typeof bounds.height === "number" && isFinite(bounds.height) && bounds.height > 0) {
				return bounds.y + bounds.height;
			}
			return typeof actor.y === "number" ? actor.y : 0;
		}

		actor.sortDepth = function() {
			var layer = actor.layer;
			if (!layer || layer.getNumChildren() === 0) {
				return;
			}

			// 目前這一頁的關卡按鈕清單（removeOldObjects 會清空、addNewObjects 會重填）
			var groundList = (actor.state && actor.state.levelPoints) ? actor.state.levelPoints : [];

			var all = [];
			for (var i = 0; i < layer.getNumChildren(); i++) {
				var child = layer.getChildAt(i);
				var key;

				if (groundList.indexOf(child) !== -1) {
					// 地上的關卡按鈕：給一個遠小於任何座標的鍵，永遠在最底
					key = -100000;
				} else if (child === actor) {
					// NPC：用自身圖片框下緣 y 當景深鍵值，跟景物落地點同規則
					key = actorGroundY(actor);
				} else {
					// 景觀：用落地點（圖片下緣 y）當景深鍵值，跟 NPC 框下緣同一條規則
					key = sceneryGroundY(child);
				}

				all.push({
					obj: child,
					key: key,
					order: i
				});
			}

			all.sort(function(a, b) {
				if (a.key === b.key) {
					return a.order - b.order;
				}
				return a.key - b.key;
			});

			// 已經是這個順序就不動，省掉每幀重新掛載的成本
			var changed = false;
			for (var k = 0; k < all.length; k++) {
				if (layer.getChildAt(k) !== all[k].obj) {
					changed = true;
					break;
				}
			}
			if (!changed) {
				return;
			}

			// 先全部摘下來再照新順序疊回去，避免中途出現重複索引
			for (var m = 0; m < all.length; m++) {
				layer.removeChild(all[m].obj);
			}
			for (var n = 0; n < all.length; n++) {
				layer.addChild(all[n].obj);
			}
		};

		/**
		 * 每幀更新：換頁偵測 → 進場等待 → 停頓 → 繞障礙 → 換幀 → 避讓 → 重排景深
		 * @param {Number} dt 距離上一幀的秒數
		 */
		actor.update = function(dt) {
			if (actor.dead || !actor.parent) {
				return;
			}

			var page = actor.currentPage();
			if (page !== actor.page) {
				actor.enterPage(page, MOVE.fadeTime, 0);
				return;
			}

			// 檢查目前落腳格（格中心）是否後來被障礙／鄰居佔住；是就就近站回可走格中心。
			// 走路插值途中 x/y 不是格中心，不能拿它回算格索引，否則會把已規劃路徑的起點弄偏。
			var startX = actor.x;
			var startY = actor.y;
			var blockers = collectBlockers(actor, walker);
			var selfCenter = cellCenter(actor.cellCx, actor.cellCy, actor);
			if (actor.pointBlocked(selfCenter.x, selfCenter.y, blockers)) {
				var free = findFreeCell(actor.cellCx, actor.cellCy, blockers);
				if (free) {
					actor.cellCx = free.cx;
					actor.cellCy = free.cy;
					var fc = cellCenter(free.cx, free.cy, actor);
					actor.x = fc.x;
					actor.y = fc.y;
				}
			}

			// 進場延遲還沒到：站著不動，連排序都省了（淡入中不需要參與景深）
			if (actor.spawnWait > 0) {
				actor.spawnWait -= dt * 1000;
				return;
			}

			// 站在原地休息：站回併腳幀，但避讓與景深還是要算
			// （鄰居可能走過來、旁邊的景物也可能在動）
			if (actor.pauseLeft > 0) {
				actor.pauseLeft -= dt * 1000;
				actor.step.stop();
				if (actor.pauseLeft <= 0) {
					// 休息結束才挑下一個目標格，不然會一直對著已經站著的目標傻站
					actor.pickTarget();
					actor.planLeg();
				}
				actor.faceTo(actor.dir, 1);
				actor.separate();
				actor.sortDepth();
				return;
			}

			// 卡住暫停：完全動不了時先原地站著等一下，倒數完再重找目標格，
			// 不會一直在同一面牆或同一位鄰居前面硬頂
			if (actor.stuckTimer > 0) {
				actor.stuckTimer -= dt * 1000;
				actor.step.stop();
				if (actor.stuckTimer <= 0) {
					actor.stuckTimer = 0;
					actor.pickTarget();
					actor.planLeg();
				}
				actor.faceTo(actor.dir, 1);
				actor.separate();
				actor.sortDepth();
				return;
			}

			// 面對面聊天：站著看對方，不倒退也不走動；倒數結束再重找目標格
			if (actor.chatTimer > 0) {
				actor.chatTimer -= dt * 1000;
				actor.step.stop();
				if (actor.chatWith && actor.chatWith.parent) {
					actor.dir = dirToward(actor.x, actor.y, actor.chatWith.x, actor.chatWith.y);
				}
				if (actor.chatTimer <= 0) {
					actor.chatTimer = 0;
					actor.chatWith = null;
					actor.chatCd = MOVE.chatCooldown;
					actor.pickTarget();
					actor.planLeg();
				}
				actor.faceTo(actor.dir, 1);
				actor.sortDepth();
				return;
			}

			// 聊天冷卻倒數：期間只繞行，不重複發起聊天
			if (actor.chatCd > 0) {
				actor.chatCd -= dt * 1000;
			}

			// 迎面相遇：命中就進聊天；否則繼續走，由避讓與 A* 繞開彼此
			actor.checkEncounter();

			// 快取路徑若跟目前落腳格不接鄰（被鄰居推開過格），視為過時清掉重規劃
			if (actor.pathCells.length) {
				var firstCell = actor.pathCells[0];
				if (Math.abs(firstCell.cx - actor.cellCx) + Math.abs(firstCell.cy - actor.cellCy) !== 1) {
					actor.pathCells = [];
					actor.pathIndex = 0;
				}
			}

			// 路徑空了：已有既定目標就沿「同一個目標格」重規劃，不在中途被鄰居逼成附近的新目標；
			// 完全沒有既定目標、或舊目標被封死走不通時，才重新挑下一個目標格
			var wp = actor.waypoint();
			if (!actor.pathCells.length) {
				var hasGoal = actor.targetCx !== actor.cellCx || actor.targetCy !== actor.cellCy;
				if (!hasGoal) {
					actor.pickTarget();
				}
				actor.planLeg();
				if (!actor.pathCells.length) {
					actor.pickTarget();
					actor.planLeg();
				}
				wp = actor.waypoint();
			}

			if (!wp) {
				actor.step.stop();
				actor.faceTo(actor.dir, 1);
				actor.separate();
				actor.sortDepth();
				return;
			}

			// 下一格後來被鄰居佔住（或景物/障礙變化）就清掉舊路徑，下一幀重新規劃繞開
			var wpCell = actor.pathCells[actor.pathIndex];
			if (wpCell && !cellWalkable(wpCell.cx, wpCell.cy, actor, blockers)) {
				actor.pathCells = [];
				actor.pathIndex = 0;
				wp = actor.waypoint();
				if (!wp) {
					actor.step.stop();
					actor.faceTo(actor.dir, 1);
					actor.separate();
					actor.sortDepth();
					return;
				}
			}

			var dist = Utils.Distance(wp.x, wp.y, actor.x, actor.y);
			var dx = wp.x - actor.x;
			var dy = wp.y - actor.y;
			var stepLength = profile.speed * dt;

			// 抵達目前這一格：貼齊格中心，把目前格同步成這一格，再推進路徑
			if (dist <= stepLength || dist <= 0.5) {
				// 到格站立：暫停影格時間軸、站回併腳，不沿用殘留相位
				actor.step.stop();
				actor.x = wp.x;
				actor.y = wp.y;
				var arrivedCell = actor.pathCells[actor.pathIndex];
				actor.cellCx = arrivedCell.cx;
				actor.cellCy = arrivedCell.cy;
				var arrived = actor.advancePath();

				if (!arrived) {
					// 走到最終目標格：停頓一下再挑下一格
					actor.pauseLeft = Utils.RandomRange(profile.pauseMin, profile.pauseMax);
				}
				actor.faceTo(actor.dir, 1);
				actor.separate();
				actor.sortDepth();
				return;
			}

			var ux = dx / dist;
			var uy = dy / dist;
			var prevX = actor.x;
			var prevY = actor.y;
			actor.x += ux * stepLength;
			actor.y += uy * stepLength;
			actor.clampToPage();

			// 朝向看「實際移動」而不是「想去的方向」
			var mvx = actor.x - prevX;
			var mvy = actor.y - prevY;
			if (Math.abs(mvx) > Math.abs(mvy) * 1.05) {
				actor.dir = mvx > 0 ? "right" : "left";
			} else {
				actor.dir = mvy > 0 ? "front" : "back";
			}

			// 獨立影格時間軸：走路中只照 220ms 自己推進一格，與位移距離、步速、避讓、被推開都無關。
			// 一幀最多補一格，超出的時間保留到下一幀；不會一幀連轉多格造成腳部快速交換。
			actor.step.tick(dt, true);
			actor.faceTo(actor.dir, CYCLE[actor.step.index]);

			actor.separate();
			actor.sortDepth();

			// 定身保險：一幀真正移動得太少就記一次；卡在同一處多次就重挑目標格
			var realMove = Math.abs(actor.x - startX) + Math.abs(actor.y - startY);
			actor.handleStall(realMove, stepLength);
		};

		// 本頁不在最上層時（例如正在進關卡的過場）DNStateManager 會叫 forceUpdate，這裡不做事
		actor.forceUpdate = function(dt) {};

		actor.isDead = function() {
			return actor.dead;
		};

		actor.onDead = function() {
			actor.dead = true;
		};

		return actor;
	}

	return NpcWalker;
})();
