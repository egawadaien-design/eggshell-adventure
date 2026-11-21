/**
 * 廣告／品牌圖設定清單（方案 A：外部 JS 設定檔）＋ 獨立廣告播放器
 * @author DaiEn
 * @Date 2026-11-21
 * @Correction 8
 *
 * 每筆一則廣告：
 *   id         內部識別，不可重複
 *   image      圖集檔名（對應 assets/art/<image>.png）
 *   frames     每格 [x, y, w, h]，陣列順序即播放次序
 *   animation  動畫名稱（SpriteSheet 註冊用，不可與其他圖集衝突）
 *   framerate  每秒影格；80ms/格 = 12.5 fps
 *   loopCount  循環次數：0 = 無限循環；正整數 = 循環該次數後停在最後一格
 *   url        點擊跳轉網址
 *   weight     隨機加權（越大越容易被抽到，預設 1）
 *   intervalMs  輪播切換間隔（毫秒）；由 AdCarousel 計時換片，預設 8000
 *
 * 新增廣告：在 list 後面 append 一筆，圖檔放 assets/art/ 即可，不必改核心程式。
 *
 * 播放器：Ads.brandingPic(logos)
 *   logos      Ads.list 其中一筆（圖組設定，含 frames／animation／loopCount／url）
 *   循環次數   由設定檔 loopCount 決定：0 = 無限循環，其餘正整數 = 循環後定格
 *   回傳規格   單格 180×110；回傳物件含 container（上桌用）、sprite、ad、
 *              width／height、loopCount、playedPasses、openLink()
 *   圖片來源   優先取 logos.imageObject（預覽頁預載後掛上）；否則退回遊戲端
 *              DNAssetsManager 載入結果；兩者都沒有就回傳空播放器。
 *
 * 輪播：Ads.createCarousel()
 *   同一槽位依各筆 intervalMs 輪播 Ads.list；加權隨機且避免連續同一則；
 *   舞台卸載後自動停止銷毀，對外開放 container／player／ad／openLink()／destroy()。
 */
var Ads = (function() {
	function Ads() {}

	Ads.list = [
		{
			id: "ad01",
			image: "branding-pic",
			animation: "branding_pic",
			framerate: 12.5,// 80毫秒每格（1000 / 80 = 12.5fps）
			frames: [
				[0, 0, 180, 110],    // 0 上排第 1 格
				[180, 0, 180, 110],  // 1 上排第 2 格
				[360, 0, 180, 110],  // 2 上排第 3 格
				[540, 0, 180, 110],  // 3 上排第 4 格
				[0, 110, 180, 110],  // 4 下排第 1 格
				[180, 110, 180, 110],// 5 下排第 2 格
				[360, 110, 180, 110],// 6 下排第 3 格
				[540, 110, 180, 110] // 7 下排第 4 格
			],
			loopCount: 0,// 0 = 無限循環
			url: "https://apng.top",
			weight: 1,
			intervalMs: 90000// 廣告停留時間
		},
		{
			id: "ad02",
			image: "branding-pic2",
			animation: "branding_pic2",
			framerate: 12.5,// 80毫秒每格（1000 / 80 = 12.5fps）
			frames: [
				[0, 0, 180, 110],    // 0 上排第 1 格
				[180, 0, 180, 110],  // 1 上排第 2 格
				[360, 0, 180, 110],  // 2 上排第 3 格
				[540, 0, 180, 110],  // 3 上排第 4 格
				[0, 110, 180, 110],  // 4 下排第 1 格
				[180, 110, 180, 110],// 5 下排第 2 格
				[360, 110, 180, 110],// 6 下排第 3 格
				[540, 110, 180, 110] // 7 下排第 4 格
			],
			loopCount: 3,// 循環 3 次後停在最後一格
			url: "https://apng.top",
			weight: 1,
			intervalMs: 90000// 廣告停留時間
		}
	];

	// 依 weight 加權隨機抽一筆；清單為空或全 權重時回傳 null／第一筆
	Ads.pickRandom = function() {
		if (!Ads.list || !Ads.list.length) {
			return null;
		}

		var total = 0;
		for (var i = 0; i < Ads.list.length; i++) {
			total += Math.max(0, Ads.list[i].weight || 1);
		}
		if (total <= 0) {
			return Ads.list[0];
		}

		var roll = Math.random() * total;
		for (var j = 0; j < Ads.list.length; j++) {
			roll -= Math.max(0, Ads.list[j].weight || 1);
			if (roll < 0) {
				return Ads.list[j];
			}
		}
		return Ads.list[Ads.list.length - 1];
	};

	return Ads;
})();

/**
 * 獨立廣告動畫播放器（AdPlayer）
 * 不依賴遊戲端狀態：只吃一筆圖組設定與載入圖片，產出可上桌的 Container；
 * 點擊跳轉統一交給 DNGameConfig.openUrl，沒有該層時退回 window.open。
 */
var AdPlayer = function(config) {
	this.ad = config || null;
	this.loopCount = (this.ad && typeof this.ad.loopCount === "number") ? this.ad.loopCount : 0;
	this.playedPasses = 0;
	this.container = null;
	this.sprite = null;
	this._endHandler = null;

	// 單格規格：取第一格寬高，預設 180×110
	var firstFrame = this.ad && this.ad.frames && this.ad.frames[0];
	this.width = (firstFrame && firstFrame[2]) || 180;
	this.height = (firstFrame && firstFrame[3]) || 110;

	if (!this.ad || typeof createjs === "undefined") {
		return;
	}

	var image = this._resolveImage();
	if (!image) {
		return;
	}

	var sheet = this._buildSheet(image);
	if (!sheet) {
		return;
	}

	var sprite = new createjs.Sprite(sheet, this.ad.animation);
	sprite.stop();

	// 置中 Container：原點對準圖框中心，上桌後直接定位中心點即可
	var proxy = new createjs.Container();
	var bounds = sprite.getBounds();
	if (bounds) {
		sprite.x = -bounds.width / 2;
		sprite.y = -bounds.height / 2;
	}
	proxy.addChild(sprite);

	this.container = proxy;
	this.sprite = sprite;
	this.sprite.gotoAndPlay(this.ad.animation);

	// 有限次數：監聽每一輪結束（animationend），達標後停在最後一格
	if (this.loopCount > 0) {
		var self = this;
		this._endHandler = function() {
			self._onPassEnd();
		};
		this.sprite.addEventListener("animationend", this._endHandler);
	}
};

// 圖片來源：呼叫端預載後掛的 imageObject 優先；否則取遊戲端資源管理器結果
AdPlayer.prototype._resolveImage = function() {
	if (this.ad.imageObject) {
		return this.ad.imageObject;
	}
	if (typeof DNAssetsManager !== "undefined" && DNAssetsManager.g_instance) {
		return DNAssetsManager.g_instance.getResult(this.ad.image) || null;
	}
	return null;
};

// 依圖組設定組 SpriteSheet；動畫幀序即 frames 陣列次序
AdPlayer.prototype._buildSheet = function(image) {
	var frameIds = [];
	for (var i = 0; i < this.ad.frames.length; i++) {
		frameIds.push(i);
	}

	var animations = {};
	animations[this.ad.animation] = { frames: frameIds };

	return new createjs.SpriteSheet({
		images: [image],
		framerate: this.ad.framerate || 12.5,
		frames: this.ad.frames,
		animations: animations
	});
};

// 完成指定輪數後，移除監聽並停在最後一格
AdPlayer.prototype._onPassEnd = function() {
	this.playedPasses++;
	if (this.playedPasses >= this.loopCount) {
		if (this.sprite && this._endHandler) {
			this.sprite.removeEventListener("animationend", this._endHandler);
		}
		var last = (this.ad.frames || []).length - 1;
		if (this.sprite && last >= 0) {
			this.sprite.gotoAndStop(last);
		}
	}
};

// 點擊前往廣告網址；無網址時不動作
AdPlayer.prototype.openLink = function() {
	if (!this.ad || !this.ad.url) {
		return;
	}
	if (typeof DNGameConfig !== "undefined" && typeof DNGameConfig.openUrl === "function") {
		DNGameConfig.openUrl(this.ad.url);
	} else {
		window.open(this.ad.url, "_blank");
	}
};

// 銷毀：移除動畫結束監聽並清掉內部參考；container 由宿主舞台移除
AdPlayer.prototype.destroy = function() {
	if (this.sprite && this._endHandler) {
		this.sprite.removeEventListener("animationend", this._endHandler);
	}
	this._endHandler = null;
	this.sprite = null;
	this.container = null;
};

// 工廠：brandingPic(圖組)；循環次數由設定檔 loopCount 決定，0 = 無限循環
Ads.brandingPic = function(logos) {
	return new AdPlayer(logos);
};

/**
 * 廣告輪播播放器（AdCarousel）
 * 同一槽位依各筆 intervalMs 輪播 Ads.list：加權隨機抽片，清單超過一筆時避免連續同一則；
 * 計時器在舞台卸載時自動停止，destroy() 主動清計時器與目前播放器。
 */
var AdCarousel = function() {
	this.list = (typeof Ads !== "undefined" && Ads.list) ? Ads.list : [];
	this.container = (typeof createjs !== "undefined") ? new createjs.Container() : null;
	this.player = null;   // 目前掛載的 AdPlayer
	this.ad = null;       // 目前顯示的廣告設定
	this._timer = null;
	this._started = false;
	this._defaultInterval = 8000;
};

// 啟動輪播：先上第一筆，再排第一次換片
AdCarousel.prototype.start = function() {
	if (this._started) {
		return;
	}
	this._started = true;
	if (!this.list.length) {
		return;
	}
	this._mount(this._pickNext(null));
	this._schedule();
};

// 取目前廣告的停留毫秒；非法值退回預設 8 秒
AdCarousel.prototype._interval = function(ad) {
	var ms = ad && typeof ad.intervalMs === "number" && ad.intervalMs > 0 ? ad.intervalMs : this._defaultInterval;
	return ms;
};

// 加權隨機抽片；多筆時避開與目前同一則（重試若干次避免卡死）
AdCarousel.prototype._pickNext = function(current) {
	if (this.list.length <= 1) {
		return this.list[0] || null;
	}
	var next = current;
	var guard = 0;
	while (next === current && guard < 5) {
		next = Ads.pickRandom();
		guard++;
	}
	return next;
};

// 換上指定廣告：先建新播放器，驗證無誤才拆掉舊播放器；新的建不起來就保留舊片，槽位不空白
AdCarousel.prototype._mount = function(ad) {
	if (!ad) {
		return;
	}

	var candidate = Ads.brandingPic(ad);
	if (!candidate || !candidate.container) {
		// 新片素材尚未就緒／圖組無效：沿用目前播放器，不拆舊的，下次計時再試
		return;
	}

	this._teardownPlayer();
	this.player = candidate;
	this.ad = ad;
	if (this.container) {
		// 新片尺寸可能不同：先歸一縮放，交由宿主 calcScale 重新等比縮進
		this.container.scaleX = this.container.scaleY = 1;
		this.container.addChild(candidate.container);
	}
};

// 拆掉目前播放器並銷毀內部資源
AdCarousel.prototype._teardownPlayer = function() {
	if (this.player) {
		if (this.container && this.player.container) {
			this.container.removeChild(this.player.container);
		}
		if (typeof this.player.destroy === "function") {
			this.player.destroy();
		}
		this.player = null;
	}
};

// 依目前廣告 intervalMs 排下一次換片
AdCarousel.prototype._schedule = function() {
	this._clearTimer();
	var self = this;
	var ms = this._interval(this.ad);
	this._timer = setTimeout(function() {
		self._tick();
	}, ms);
};

// 換片計時回呼：舞台已卸載就整體銷毀，避免殘留計時器繼續跳
AdCarousel.prototype._tick = function() {
	if (this._isDetached()) {
		this.destroy();
		return;
	}
	this._mount(this._pickNext(this.ad));
	this._schedule();
};

// 判斷輪播容器是否已脫離舞台：沿 parent 鏈回溯到頂層，查是否掛在 Stage 上。
// 注意：這版 EaselJS 不會在 DisplayObject 上掛 .stage 欄位，必須用 getStage() 回溯。
AdCarousel.prototype._isDetached = function() {
	if (!this.container) {
		return true;
	}
	if (typeof this.container.getStage === "function") {
		return !this.container.getStage();
	}
	return !this.container.parent;
};

// 點擊：優先走目前播放器的 openLink；播放器缺失時退回設定網址
AdCarousel.prototype.openLink = function() {
	if (this.player) {
		this.player.openLink();
		return;
	}
	if (!this.ad || !this.ad.url) {
		return;
	}
	if (typeof DNGameConfig !== "undefined" && typeof DNGameConfig.openUrl === "function") {
		DNGameConfig.openUrl(this.ad.url);
	} else {
		window.open(this.ad.url, "_blank");
	}
};

// 主動銷毀：清計時器、拆播放器
AdCarousel.prototype.destroy = function() {
	this._clearTimer();
	this._teardownPlayer();
	this._started = false;
};

AdCarousel.prototype._clearTimer = function() {
	if (this._timer) {
		clearTimeout(this._timer);
		this._timer = null;
	}
};

// 工廠：建立空輪播，宿主呼叫 start() 後開始換片
Ads.createCarousel = function() {
	return new AdCarousel();
};
