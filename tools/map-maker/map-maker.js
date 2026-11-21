/**
 * 選關地圖障礙點編輯工具（瀏覽器端）
 *
 * 資料來源直接吃專案的 images.js / maps.js / map-obstacles.js：
 *   - 下拉選單由 Maps.groups → maps 自動產生（大關 → 地圖分頁，不是逐關卡）
 *   - 底圖：assets/art/map/map_N.jpg
 *   - 景觀：Maps.groups[group].maps[page].objects，圖片從 athlases 對應的 atlas PNG 裁切；
 *     少數未進 atlas 的走獨立 PNG 後備
 *   - 障礙：32×32 軸對齊網格，一整格＝一個不可通行區，中心存 { x, y, r }
 *
 * 本輪範圍：讀入既有景觀 ＋ 拖動改位置；景觀新增／刪除與裁切縮放後續再補。
 *
 * @author DaiEn
 * @Date 2026-11-20
 * @Correction 13
 */
(function () {
	'use strict';

	// ------------------------------------------------------------ 常數
	var CELL = 32;                       // 網格邊長（px，遊戲座標）
	var BOARD_W = 700;                   // 舞台寬（Constants.ASSETS_WIDTH）
	var BOARD_H = 800;                   // 舞台高（Constants.ASSETS_HEIGHT）
	var BLOCK_R = CELL / 2;              // 單格障礙預設水平半徑＝半格

	// 補上 maps.js 讀取時會用到的最小常數（工具頁不引整包 game.js）
	if (typeof Constants === 'undefined') {
		var Constants = {
			ASSETS_WIDTH: BOARD_W,
			ASSETS_HEIGHT: BOARD_H
		};
	}

	// ------------------------------------------------------------ DOM
	function el(id) {
		return document.getElementById(id);
	}

	var canvas = el('board');
	var ctx = canvas.getContext('2d', { willReadFrequently: true });
	var groupSelect = el('groupSelect');
	var pageSelect = el('pageSelect');
	var artNote = el('artNote');
	var metaPage = el('metaPage');
	var metaBlock = el('metaBlock');
	var metaObj = el('metaObj');
	var cursorTag = el('cursorTag');
	var statObj = el('statObj');
	var statBlock = el('statBlock');
	var objList = el('objList');
	var outText = el('out');
	var actionNote = el('actionNote');

	// ------------------------------------------------------------ 狀態
	var state = {
		group: 0,            // 目前大關索引（預設第一大關）
		page: -1,            // 目前選到的頁碼（-1 表示尚未選）
		tool: 'block',       // block | erase | move
		// 全部大關 × 頁的障礙格各存一份；結構 { groupIndex: { pageIndex: [ {col,row,x,y,r}, ... ] } }
		blocksByGroup: {},
		objects: [],        // 本頁景觀 [{ pic, x, y, entry, frame }]
		objectsHidden: false,// 暫時隱藏地面景觀（只遮顯示，不刪資料）
		drag: null           // 正在拖動的景觀索引（move 工具用）
	};

	// 目前大關＋頁的障礙格陣列（方便沿用既有 add/remove 邏輯）
	function currentBlocks() {
		if (state.page < 0) {
			return [];
		}
		if (!state.blocksByGroup[state.group]) {
			state.blocksByGroup[state.group] = {};
		}
		if (!state.blocksByGroup[state.group][state.page]) {
			state.blocksByGroup[state.group][state.page] = [];
		}
		return state.blocksByGroup[state.group][state.page];
	}

	// 圖集快取：atlas 名稱 → { img, ready, failed, frames, animations }
	var atlasCache = {};
	// 獨立圖片快取：圖檔路徑 → Image
	var imageCache = {};

	// ------------------------------------------------------------ 圖集解析
	// 把 Images 常數（如 Images.FOREST_1）對到的 "map/forest_1" 名稱，
	// 在 athlases 裡找到所屬 atlas 與 frame 矩形。
	function findAtlasFrame(picName) {
		if (!window.athlases) {
			return null;
		}
		for (var i = 0; i < window.athlases.length; i++) {
			var atlas = window.athlases[i];
			if (!atlas || !atlas.animations || !atlas.frames) {
				continue;
			}
			var frameList = atlas.animations[picName];
			if (frameList && frameList.length) {
				return {
					atlas: atlas,
					frame: atlas.frames[frameList[0]]
				};
			}
		}
		return null;
	}

	// 取一張 atlas 快取，回傳快取物件（尚未載入會開始載）
	function getAtlasEntry(atlas) {
		var key = atlas.images && atlas.images[0];
		if (!key) {
			return null;
		}
		if (atlasCache[key]) {
			return atlasCache[key];
		}
		var entry = {
			key: key,
			file: '../../assets/art/' + key + '.png',
			img: null,
			ready: false,
			failed: false
		};
		var img = new Image();
		img.onload = function () {
			entry.img = img;
			entry.ready = true;
			redraw();
		};
		img.onerror = function () {
			entry.failed = true;
			artNote.textContent = '讀不到圖集 ' + entry.file + '，該景觀以佔位方塊顯示。';
			redraw();
		};
		img.src = entry.file;
		atlasCache[key] = entry;
		return entry;
	}

	// 取獨立 PNG（atlas 找不到時的後備，例如 map/xxx → assets/art/map/xxx.png）
	function getStandaloneImage(picName) {
		if (imageCache[picName]) {
			return imageCache[picName];
		}
		var entry = {
			file: '../../assets/art/' + picName + '.png',
			img: null,
			ready: false,
			failed: false
		};
		var img = new Image();
		img.onload = function () {
			entry.img = img;
			entry.ready = true;
			redraw();
		};
		img.onerror = function () {
			entry.failed = true;
			redraw();
		};
		img.src = entry.file;
		imageCache[picName] = entry;
		return entry;
	}

	// 載入底圖（回傳快取物件；鍵值對齊 Maps.getBackName(group, page)）
	function getBackImage(page) {
		var key = Maps.getBackName(page, state.group);
		if (imageCache[key]) {
			return imageCache[key];
		}
		var entry = {
			file: '../../assets/art/' + key + '.jpg',
			img: null,
			ready: false,
			failed: false
		};
		var img = new Image();
		img.onload = function () {
			entry.img = img;
			entry.ready = true;
			redraw();
		};
		img.onerror = function () {
			entry.failed = true;
			redraw();
		};
		img.src = entry.file;
		imageCache[key] = entry;
		return entry;
	}

	// ------------------------------------------------------------ 資料載入
	// 讀目前大關 × 頁的景觀（頁內座標，不加分頁位移）
	function loadPageObjects(page) {
		state.objects = [];
		// 先觸發本頁底色地圖 jpg 載入；onload 會自動 redraw 畫上
		getBackImage(page);
		var group = state.group;
		var groupData = (Maps.groups || [])[group];
		var pageData = groupData && groupData.maps[page];
		if (!pageData || !pageData.objects) {
			return;
		}
		for (var i = 0; i < pageData.objects.length; i++) {
			var obj = pageData.objects[i];
			var hit = findAtlasFrame(obj.pic);
			var entry = null;
			var frame = null;
			if (hit) {
				entry = getAtlasEntry(hit.atlas);
				frame = hit.frame;
			} else {
				entry = getStandaloneImage(obj.pic);
			}
			state.objects.push({
				pic: obj.pic,
				x: obj.x,
				y: obj.y,
				entry: entry,
				frame: frame
			});
		}
	}

	// 把 MapObstacles 既有障礙一次載入全部大關 × 頁（啟動時讀回地圖數據，不是從空白開始）
	function loadAllBlocks() {
		state.blocksByGroup = {};
		var groups = MapObstacles.groups || [];
		for (var g = 0; g < groups.length; g++) {
			state.blocksByGroup[g] = {};
			var maps = groups[g].maps || [];
			for (var p = 0; p < maps.length; p++) {
				var list = maps[p].obstacles || [];
				var cells = [];
				for (var i = 0; i < list.length; i++) {
					var ob = list[i];
					cells.push({
						col: Math.floor(ob.x / CELL),
						row: Math.floor(ob.y / CELL),
						x: ob.x,
						y: ob.y,
						r: ob.r || BLOCK_R
					});
				}
				state.blocksByGroup[g][p] = cells;
			}
		}
	}

	// ------------------------------------------------------------ 網格座標
	function pointToCell(px, py) {
		var col = Math.floor(px / CELL);
		var row = Math.floor(py / CELL);
		if (col < 0 || col >= Math.ceil(BOARD_W / CELL)) {
			return null;
		}
		if (row < 0 || row >= Math.ceil(BOARD_H / CELL)) {
			return null;
		}
		return { col: col, row: row };
	}

	function cellCenter(col, row) {
		return {
			x: col * CELL + CELL / 2,
			y: row * CELL + CELL / 2
		};
	}

	function blockIndex(col, row) {
		var blocks = currentBlocks();
		for (var i = 0; i < blocks.length; i++) {
			if (blocks[i].col === col && blocks[i].row === row) {
				return i;
			}
		}
		return -1;
	}

	function addBlock(col, row) {
		if (blockIndex(col, row) !== -1) {
			return;
		}
		var c = cellCenter(col, row);
		currentBlocks().push({ col: col, row: row, x: c.x, y: c.y, r: BLOCK_R });
		redraw();
		refreshPanel();
	}

	function removeBlock(col, row) {
		var idx = blockIndex(col, row);
		if (idx === -1) {
			return;
		}
		currentBlocks().splice(idx, 1);
		redraw();
		refreshPanel();
	}

	function toggleBlock(col, row) {
		if (blockIndex(col, row) !== -1) {
			removeBlock(col, row);
		} else {
			addBlock(col, row);
		}
	}

	// ------------------------------------------------------------ 渲染
	function redraw() {
		ctx.clearRect(0, 0, BOARD_W, BOARD_H);

		// 1. 地面底圖（釘在最底層，避免障礙被景物蓋住看不到）
		if (state.page >= 0) {
			var back = imageCache[Maps.getBackName(state.page, state.group)];
			if (back && back.ready) {
				ctx.drawImage(back.img, 0, 0, BOARD_W, BOARD_H);
			} else if (!back || back.failed) {
				ctx.fillStyle = '#EADCC0';
				ctx.fillRect(0, 0, BOARD_W, BOARD_H);
			}
		} else {
			ctx.fillStyle = '#EADCC0';
			ctx.fillRect(0, 0, BOARD_W, BOARD_H);
		}

		// 2. 景觀（照 maps.js：中心錨點，圖片原點對到物件中心；隱藏時暫時不上畫）
		if (!state.objectsHidden) {
			for (var i = 0; i < state.objects.length; i++) {
				var obj = state.objects[i];
				drawObject(obj);
			}
		}

		// 3. 障礙格半透明藍色覆蓋（疊在景觀之上，景觀擋不住標示）
		var blocks = currentBlocks();
		for (var b = 0; b < blocks.length; b++) {
			var blk = blocks[b];
			ctx.fillStyle = 'rgba(76, 143, 176, 0.38)';
			ctx.fillRect(blk.col * CELL, blk.row * CELL, CELL, CELL);
			ctx.strokeStyle = 'rgba(27, 91, 84, 0.55)';
			ctx.lineWidth = 1;
			ctx.strokeRect(blk.col * CELL + 0.5, blk.row * CELL + 0.5, CELL - 1, CELL - 1);
		}

		// 4. 網格線（淡色，疊在最上方便對齊）
		ctx.strokeStyle = 'rgba(36, 29, 20, 0.10)';
		ctx.lineWidth = 1;
		for (var gx = 0; gx <= BOARD_W; gx += CELL) {
			ctx.beginPath();
			ctx.moveTo(gx + 0.5, 0);
			ctx.lineTo(gx + 0.5, BOARD_H);
			ctx.stroke();
		}
		for (var gy = 0; gy <= BOARD_H; gy += CELL) {
			ctx.beginPath();
			ctx.moveTo(0, gy + 0.5);
			ctx.lineTo(BOARD_W, gy + 0.5);
			ctx.stroke();
		}
	}

	function drawObject(obj) {
		var entry = obj.entry;
		if (entry && entry.ready && entry.img) {
			if (obj.frame) {
				// atlas 裁切：frame = [sx, sy, sw, sh]
				var sx = obj.frame[0];
				var sy = obj.frame[1];
				var sw = obj.frame[2];
				var sh = obj.frame[3];
				ctx.drawImage(entry.img, sx, sy, sw, sh, obj.x - sw / 2, obj.y - sh / 2, sw, sh);
			} else {
				var iw = entry.img.width;
				var ih = entry.img.height;
				ctx.drawImage(entry.img, obj.x - iw / 2, obj.y - ih / 2, iw, ih);
			}
		} else {
			// 佔位：失敗或還在載入時先畫一個小方塊標出位置
			ctx.fillStyle = 'rgba(163, 116, 42, 0.35)';
			ctx.fillRect(obj.x - 12, obj.y - 12, 24, 24);
		}
		// 錨點定位十字：綠色，畫在景觀中心（x, y），方便對齊落點
		drawAnchorCross(obj.x, obj.y);
	}

	// 在 (cx, cy) 畫一支綠色十字定位標記（橫豎各一段，外圍加細白邊避免壓在深色景物上看不清）
	function drawAnchorCross(cx, cy) {
		var arm = 9;   // 十字臂長（px）
		var gap = 3;   // 中心留白，不把中心點整個蓋住
		ctx.save();
		ctx.lineWidth = 2;
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
		ctx.beginPath();
		ctx.moveTo(cx - arm, cy); ctx.lineTo(cx - gap, cy);
		ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + arm, cy);
		ctx.moveTo(cx, cy - arm); ctx.lineTo(cx, cy - gap);
		ctx.moveTo(cx, cy + gap); ctx.lineTo(cx, cy + arm);
		ctx.stroke();
		ctx.strokeStyle = '#1FA85A';
		ctx.beginPath();
		ctx.moveTo(cx - arm, cy); ctx.lineTo(cx - gap, cy);
		ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + arm, cy);
		ctx.moveTo(cx, cy - arm); ctx.lineTo(cx, cy - gap);
		ctx.moveTo(cx, cy + gap); ctx.lineTo(cx, cy + arm);
		ctx.stroke();
		ctx.restore();
	}

	// 取畫布座標（考慮 CSS 縮放，回傳遊戲座標 0~700/800）
	function eventToBoard(e) {
		var rect = canvas.getBoundingClientRect();
		var scaleX = BOARD_W / rect.width;
		var scaleY = BOARD_H / rect.height;
		var px = (e.clientX - rect.left) * scaleX;
		var py = (e.clientY - rect.top) * scaleY;
		return { x: px, y: py };
	}

	// 點到哪一顆景觀（由上往下找，回傳索引；找不到 -1）
	function hitObject(px, py) {
		for (var i = state.objects.length - 1; i >= 0; i--) {
			var obj = state.objects[i];
			var w = 40;
			var h = 40;
			if (obj.entry && obj.entry.ready && obj.entry.img) {
				if (obj.frame) {
					w = obj.frame[2];
					h = obj.frame[3];
				} else {
					w = obj.entry.img.width;
					h = obj.entry.img.height;
				}
			}
			if (px >= obj.x - w / 2 && px <= obj.x + w / 2 &&
				py >= obj.y - h / 2 && py <= obj.y + h / 2) {
				return i;
			}
		}
		return -1;
	}

	// ------------------------------------------------------------ 互動
	var painting = false;
	var paintMode = null; // 'add' | 'erase'

	function applyPaintAt(px, py) {
		var cell = pointToCell(px, py);
		if (!cell) {
			return;
		}
		if (paintMode === 'add') {
			addBlock(cell.col, cell.row);
		} else if (paintMode === 'erase') {
			removeBlock(cell.col, cell.row);
		}
	}

	canvas.addEventListener('mousedown', function (e) {
		if (state.page < 0) {
			return;
		}
		var p = eventToBoard(e);

		if (state.tool === 'move') {
			var idx = hitObject(p.x, p.y);
			if (idx !== -1) {
				state.drag = {
					index: idx,
					offsetX: p.x - state.objects[idx].x,
					offsetY: p.y - state.objects[idx].y
				};
			}
			return;
		}

		// 障礙工具：左鍵標示／右鍵擦除
		var cell = pointToCell(p.x, p.y);
		if (!cell) {
			return;
		}
		painting = true;
		if (e.button === 2 || state.tool === 'erase') {
			paintMode = 'erase';
			removeBlock(cell.col, cell.row);
		} else {
			paintMode = 'add';
			toggleBlock(cell.col, cell.row);
		}
	});

	// 把游標座標標籤貼到滑鼠指標旁（相對於 .stage 容器；靠近邊緣時自動往內翻）
	function updateCursorTag(e, p) {
		var stage = canvas.parentElement;
		var rect = stage.getBoundingClientRect();
		var tx = e.clientX - rect.left;
		var ty = e.clientY - rect.top;
		cursorTag.textContent = '(' + Math.round(p.x) + ', ' + Math.round(p.y) + ')';
		var tagW = cursorTag.offsetWidth || 60;
		var tagH = cursorTag.offsetHeight || 20;
		var left = tx + 14;
		var top = ty - tagH - 8;
		if (left + tagW > rect.width) {
			left = tx - tagW - 14;
		}
		if (top < 0) {
			top = ty + 16;
		}
		cursorTag.style.left = left + 'px';
		cursorTag.style.top = top + 'px';
		cursorTag.hidden = false;
	}

	function hideCursorTag() {
		cursorTag.hidden = true;
	}

	canvas.addEventListener('mousemove', function (e) {
		if (state.page < 0) {
			return;
		}
		var p = eventToBoard(e);
		updateCursorTag(e, p);

		if (state.drag !== null) {
			var obj = state.objects[state.drag.index];
			obj.x = Math.round(p.x - state.drag.offsetX);
			obj.y = Math.round(p.y - state.drag.offsetY);
			redraw();
			refreshPanel();
			return;
		}

		if (painting) {
			applyPaintAt(p.x, p.y);
		}
	});

	function endDrag() {
		state.drag = null;
		painting = false;
		paintMode = null;
	}

	canvas.addEventListener('mouseup', endDrag);
	canvas.addEventListener('mouseleave', function (e) {
		endDrag();
		hideCursorTag();
	});
	// 右鍵選單擋掉，方便在畫板上右鍵擦除
	canvas.addEventListener('contextmenu', function (e) {
		e.preventDefault();
	});

	// ------------------------------------------------------------ 工具切換
	function setTool(tool) {
		state.tool = tool;
		el('toolBlock').classList.toggle('is-on', tool === 'block');
		el('toolErase').classList.toggle('is-on', tool === 'erase');
		el('toolMove').classList.toggle('is-on', tool === 'move');
		canvas.style.cursor = tool === 'move' ? 'grab' : 'crosshair';
	}

	el('toolBlock').addEventListener('click', function () { setTool('block'); });
	el('toolErase').addEventListener('click', function () { setTool('erase'); });
	el('toolMove').addEventListener('click', function () { setTool('move'); });

	el('btnClear').addEventListener('click', function () {
		if (state.page < 0) {
			return;
		}
		if (!state.blocksByGroup[state.group]) {
			state.blocksByGroup[state.group] = {};
		}
		state.blocksByGroup[state.group][state.page] = [];
		redraw();
		refreshPanel();
	});

	// 暫時隱藏／顯示地面景觀（只切顯示，景觀資料與座標保留）
	function syncObjectsToggle() {
		var btn = el('btnToggleObjects');
		btn.textContent = state.objectsHidden ? '顯示景觀' : '隱藏景觀';
		btn.classList.toggle('is-on', state.objectsHidden);
	}

	el('btnToggleObjects').addEventListener('click', function () {
		state.objectsHidden = !state.objectsHidden;
		syncObjectsToggle();
		redraw();
	});

	// ------------------------------------------------------------ 選單
	// 大關名稱（統一取 maps.js 的 Maps.getGroupName；編輯環境無字串管理器時讀 i18n.js 中文後備）
	function groupName(g) {
		if (typeof Maps !== 'undefined' && Maps.getGroupName) {
			return Maps.getGroupName(g);
		}
		var gdata = (MapObstacles.groups || [])[g];
		return (gdata && gdata.name) || ('第 ' + (g + 1) + ' 大關');
	}

	// 建立大關選單（預設選第一大關；大關清單以 Maps.groups 為準）
	function buildGroupSelect() {
		var groups = Maps.groups || [];
		groupSelect.innerHTML = '';
		for (var g = 0; g < groups.length; g++) {
			var opt = document.createElement('option');
			opt.value = String(g);
			opt.textContent = groupName(g);
			groupSelect.appendChild(opt);
		}
		groupSelect.value = '0';
	}

	// 依目前大關重建地圖分頁選單
	function buildPageSelect() {
		var groups = Maps.groups || [];
		var maps = (groups[state.group] && groups[state.group].maps) || [];
		pageSelect.innerHTML = '<option value="">— 請選擇地圖 —</option>';
		for (var i = 0; i < maps.length; i++) {
			var start = i * 10 + 1;
			var end = start + 9;
			var opt = document.createElement('option');
			opt.value = String(i);
			opt.textContent = '第 ' + (i + 1) + ' 張地圖（關卡 ' + start + '～' + end + '）';
			pageSelect.appendChild(opt);
		}
	}

	groupSelect.addEventListener('change', function () {
		if (groupSelect.value === '') {
			return;
		}
		state.group = Number(groupSelect.value);
		state.page = -1;
		state.objects = [];
		buildPageSelect();
		redraw();
		refreshPanel();
	});

	pageSelect.addEventListener('change', function () {
		if (pageSelect.value === '') {
			state.page = -1;
			state.objects = [];
			redraw();
			refreshPanel();
			return;
		}
		selectPage(Number(pageSelect.value));
	});

	function selectPage(page) {
		state.page = page;
		loadPageObjects(page);
		// 障礙已在啟動時全大關×頁載入、改動即時留在 blocksByGroup，切頁只讀回，不清上一頁
		redraw();
		refreshPanel();
	}

	// ------------------------------------------------------------ 面板更新
	function refreshPanel() {
		var blocks = currentBlocks();
		metaPage.textContent = state.page >= 0 ? '第 ' + (state.page + 1) + ' 張' : '—';
		metaBlock.textContent = blocks.length;
		metaObj.textContent = state.objects.length;
		statObj.textContent = state.objects.length;
		statBlock.textContent = blocks.length;

		// 景觀清單
		objList.innerHTML = '';
		for (var i = 0; i < state.objects.length; i++) {
			var obj = state.objects[i];
			var li = document.createElement('li');
			var name = document.createElement('span');
			name.textContent = obj.pic;
			var coord = document.createElement('span');
			coord.className = 'coord';
			coord.textContent = obj.x + ', ' + obj.y;
			li.appendChild(name);
			li.appendChild(coord);
			objList.appendChild(li);
		}

		renderOutput();
	}

	// ------------------------------------------------------------ 輸出
	// 把某頁的格陣列轉成輸出用 { x, y, r } 陣列（照 col、row 排序，順序穩定方便比對）
	function buildObstaclesArray(cells) {
		var sorted = cells.slice().sort(function (a, b) {
			if (a.row !== b.row) {
				return a.row - b.row;
			}
			return a.col - b.col;
		});
		return sorted.map(function (b) {
			return { x: b.x, y: b.y, r: b.r };
		});
	}

	// 產出整份 map-obstacles.js 內容（兩層：大關 groups → 地圖 maps，每張 obstacles）
	// 全部大關×頁都以工具內 blocksByGroup 為準，確保改過的每一頁都保留進輸出
	function renderOutput() {
		var groups = MapObstacles.groups || [];
		var lines = [];
		lines.push('var MapObstacles = (function() {');
		lines.push('\tfunction MapObstacles() {}');
		lines.push('');
		lines.push('\tMapObstacles.groups = [');

		for (var g = 0; g < groups.length; g++) {
			var maps = groups[g].maps || [];
			var gname = groupName(g);
			lines.push('\t\t{');
			lines.push('\t\t\tname: "' + gname + '",');
			lines.push('\t\t\tmaps: [');

			for (var p = 0; p < maps.length; p++) {
				var cells = (state.blocksByGroup[g] && state.blocksByGroup[g][p]) || [];
				var blocks = buildObstaclesArray(cells);
				lines.push('\t\t\t\t{ // 第 ' + (p + 1) + ' 張地圖（關卡 ' + (p * 10 + 1) + '～' + (p * 10 + 10) + '）');
				lines.push('\t\t\t\t\tobstacles: ' + formatArray(blocks));
				lines.push('\t\t\t\t}' + (p < maps.length - 1 ? ',' : ''));
			}

			lines.push('\t\t\t]');
			lines.push('\t\t}' + (g < groups.length - 1 ? ',' : ''));
		}

		lines.push('\t];');
		lines.push('');
		lines.push('\tMapObstacles.pages = MapObstacles.groups[0].maps;');
		lines.push('');
		lines.push('\tMapObstacles.getObstacles = function(page, group) {');
		lines.push('\t\tvar g = MapObstacles.groups[group || 0];');
		lines.push('\t\tif (!g || !g.maps[page]) { return []; }');
		lines.push('\t\treturn g.maps[page].obstacles || [];');
		lines.push('\t};');
		lines.push('');
		lines.push('\tMapObstacles.getPageCount = function() {');
		lines.push('\t\tvar g = MapObstacles.groups[0];');
		lines.push('\t\treturn g ? g.maps.length : 0;');
		lines.push('\t};');
		lines.push('');
		lines.push('\treturn MapObstacles;');
		lines.push('})();');

		outText.value = lines.join('\n');
	}

	function formatArray(list) {
		if (!list.length) {
			return '[]';
		}
		var parts = list.map(function (ob) {
			return '{ x: ' + ob.x + ', y: ' + ob.y + ', r: ' + ob.r + ' }';
		});
		return '[\n\t\t\t\t' + parts.join(',\n\t\t\t\t') + '\n\t\t\t]';
	}

	el('btnCopy').addEventListener('click', function () {
		var text = outText.value;
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).then(function () {
				actionNote.textContent = '已複製障礙資料。';
			}, function () {
				fallbackCopy(text);
			});
		} else {
			fallbackCopy(text);
		}
	});

	function fallbackCopy(text) {
		outText.select();
		try {
			document.execCommand('copy');
			actionNote.textContent = '已複製障礙資料。';
		} catch (err) {
			actionNote.textContent = '複製失敗，請手動選取文字複製。';
		}
		outText.blur();
	}

	el('btnDownload').addEventListener('click', function () {
		var blob = new Blob([outText.value], { type: 'text/javascript;charset=utf-8' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'map-obstacles.js';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		actionNote.textContent = '已下載 map-obstacles.js，放回 static/js/ 覆蓋即可。';
	});

	// ------------------------------------------------------------ 啟動
	function init() {
		if (!window.Maps) {
			artNote.textContent = '讀不到 maps.js，請確認 script 載入順序。';
			return;
		}
		if (!window.MapObstacles) {
			artNote.textContent = '讀不到 map-obstacles.js。';
			return;
		}
		buildGroupSelect();
		buildPageSelect();
		// 啟動先把既有地圖障礙數據全部讀回各大關×頁，不是從空白開始
		loadAllBlocks();
		setTool('block');
		syncObjectsToggle();
		redraw();
		refreshPanel();
		artNote.textContent = '圖集與底圖會隨選單載入；標示障礙用左鍵點選／拖曳，右鍵或擦除工具可清除。';
	}

	init();
})();
