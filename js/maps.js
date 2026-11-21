/**
 * 地圖（選關畫面）的景物與關卡按鈕座標
 *
 * 結構分兩層：大關（groups）→ 地圖分頁（maps）。
 * 每一筆 map：{ levels: [[x,y]...], objects: [{ pic, x, y }...] }
 * 座標一律只寫「單張地圖內的座標」（y 落在 0 ~ Constants.ASSETS_HEIGHT 之間），
 * 實際在整條地圖上的位置由 Maps.getPageY() 統一換算：
 * 第 1 頁不需要偏移，第 2 頁 +800、第 3 頁 +1600 …（數字由頁數自動推出）。
 * 要新增大關時，在 groups 後面 append 一組 { nameKey, maps: [...] }；
 * 要新增地圖時，在該組 maps 後面 append 一頁，既有座標完全不必修改。
 *
 * @author DaiEn
 * @Date 2026-11-20
 * @Correction 6
 */
var Maps = (function() {
	function Maps() {}

	// 大關（章節）列表：
	//   nameKey ＝對應 i18n.js 的多語字串 key（CHAPTER_NAME_n）
	//   maps    ＝該大關下的地圖分頁（index 0 是最下面那一頁）
	Maps.groups = [
		{
			nameKey: 'CHAPTER_NAME_0',// 第一章 棕櫚沙灣
			maps: [
				{
					// 第 1 張地圖（關卡 1 ～ 10）
					levels: [
						[500, 752], [480, 667], [400, 598], [302, 557], [212, 500],
						[176, 418], [199, 332], [261, 254], [351, 196], [445, 147]
					],
					objects: [
						{ pic: Images.OBJ_1_14, x: 240, y: 660 },// 第一行是風車（預設）
						{ pic: Images.OBJ_1_01, x: 208, y: 114 },// 樹
						{ pic: Images.OBJ_1_02, x: 111, y: 185 },// 樹
						{ pic: Images.OBJ_1_03, x: 10, y: 140 },// 樹
						
						{ pic: Images.OBJ_1_01, x: 50, y: 700 },// 樹
						
						{ pic: Images.OBJ_1_13, x: 655, y: 13 },// 樹（大樹）
						{ pic: Images.OBJ_1_13, x: 690, y: 754 },// 樹（大樹）
						{ pic: Images.OBJ_1_24, x: 588, y: 240 },// 石
						{ pic: Images.OBJ_1_44, x: 465, y: 330 },// 水池
						{ pic: Images.OBJ_1_00, x: 600, y: 370 }// 樹
					]
				},
				{
					// 第 2 張地圖（關卡 11 ～ 20）
					levels: [
						[513, 755], [449, 686], [347, 639], [238, 589], [176, 511],
						[152, 429], [176, 340], [261, 261], [372, 206], [478, 150]
					],
					objects: [
						{ pic: Images.OBJ_1_38, x: 268, y: 124 },// 小草屋
						{ pic: Images.OBJ_1_39, x: 310, y: 710 },// 小草屋
						{ pic: Images.OBJ_1_06, x: 167, y: 695 },// 樹
						{ pic: Images.OBJ_1_03, x: 408, y: 433 },// 樹
						{ pic: Images.OBJ_1_05, x: 15, y: 466 },// 樹
						{ pic: Images.OBJ_1_07, x: 592, y: 224 },// 樹屋
						{ pic: Images.OBJ_1_29, x: 603, y: 547 },// 圖騰石雕
						{ pic: Images.OBJ_1_45, x: 36, y: 285 }// 圖騰石雕
					]
				},
				{
					// 第 3 張地圖（關卡 21 ～ 30）
					levels: [
						[543, 754], [460, 688], [350, 650], [241, 606], [160, 537],
						[143, 447], [204, 365], [287, 295], [386, 234], [470, 156]
					],
					objects: [
						{ pic: Images.OBJ_1_01, x: 125, y: 706 },
						{ pic: Images.OBJ_1_37, x: 425, y: 440 },
						{ pic: Images.OBJ_1_15, x: 607, y: 637 },
						{ pic: Images.OBJ_1_46, x: 620, y: 343 },
						{ pic: Images.OBJ_1_00, x: 580, y: 95 },
						{ pic: Images.OBJ_1_08, x: 95, y: 230 },
						{ pic: Images.OBJ_1_09, x: 174, y: 200 },
						{ pic: Images.OBJ_1_42, x: 308, y: 722 }
					]
				},
				{
					// 第 4 張地圖（關卡 31 ～ 40）
					levels: [
						[400, 755], [296, 710], [198, 658], [118, 588], [118, 495],
						[176, 410], [261, 341], [378, 284], [484, 230], [468, 145]
					],
					objects: [
						{ pic: Images.OBJ_1_13, x: 64, y: 708 },
						{ pic: Images.OBJ_1_21, x: 448, y: 510 },
						{ pic: Images.OBJ_1_22, x: 596, y: 241 },
						{ pic: Images.OBJ_1_08, x: 143, y: 215 },
						{ pic: Images.OBJ_1_28, x: 360, y: 300 },
						{ pic: Images.OBJ_1_27, x: 275, y: 520 }
					]
				},
				{
					// 第 5 張地圖（關卡 41 ～ 50）
					levels: [
						[425, 563], [318, 533], [196, 506], [106, 447], [169, 355],
						[105, 263], [127, 155], [277, 147], [387, 235], [487, 181]
					],
					objects: [
						{ pic: Images.M_12, x: 58, y: 625 },
						{ pic: Images.M_4, x: 44, y: 333 },
						{ pic: Images.M_6, x: 85, y: 85 },
						{ pic: Images.M_7, x: 303, y: 389 },
						{ pic: Images.M_9, x: 601, y: 247 },
						{ pic: Images.M_10, x: 500, y: 405 },
						{ pic: Images.M_11, x: 419, y: 114 },
						{ pic: Images.M_5, x: 235, y: 239 }
					]
				}
			]
		}
		// 第二大關：之後在這裡 append 一組 { nameKey: 'CHAPTER_NAME_1', maps: [ ... ] }
	];

	// 相容層：預設取第一大關的地圖陣列（對應既有只讀第一大關的舊寫法）
	Maps.pages = Maps.groups[0].maps;

	// 取某一大關（group 預設 0）；越界回傳空物件
	function groupData(group) {
		return Maps.groups[group || 0] || { maps: [] };
	}

	// 大關（章節）名稱：優先走多語字串管理器（遊戲端當前語系），
	// 編輯環境無管理器時讀 i18n.js 中文表，再缺才回後備中文名。
	Maps.getGroupName = function(group) {
		var g = group || 0;
		var entry = Maps.groups[g];
		var key = entry && entry.nameKey;
		if (typeof DNStringManager !== 'undefined' && DNStringManager.getInstance && key) {
			var s = DNStringManager.getInstance().getString(key);
			if (s && s !== '???' && s !== '!!!') {
				return s;
			}
		}
		if (typeof g_strings !== 'undefined' && g_strings.cn && key) {
			var cn = g_strings.cn[key];
			if (cn) {
				return cn;
			}
		}
		return '第 ' + (g + 1) + ' 大關';
	};

	// 某一大關的地圖總數
	Maps.getPageCount = function(group) {
		return groupData(group).maps.length;
	};

	// 頁碼 -> 該大關整條地圖上的 y 位移
	// 目前第 1 頁排在最下面；若想讓第 1 頁排到最上面，把下面這行改成 page * Constants.ASSETS_HEIGHT
	Maps.getPageY = function(page, group) {
		return (Maps.getPageCount(group) - 1 - page) * Constants.ASSETS_HEIGHT;
	};

	// 底圖 atlas 名稱（第一章沿用 map/map_1 ~ map/map_N）
	Maps.getBackName = function(page, group) {
		return 'map/map_' + ((group || 0) * Maps.getPageCount(group) + page + 1);
	};

	// 取某一大關某一頁的關卡按鈕座標（已加上頁面位移）
	Maps.getLevelPoints = function(group, page) {
		var maps = groupData(group).maps;
		var offset = Maps.getPageY(page, group);
		var result = [];
		if (!maps[page]) {
			return result;
		}
		for (var i = 0; i < maps[page].levels.length; i++) {
			result.push([maps[page].levels[i][0], maps[page].levels[i][1] + offset]);
		}
		return result;
	};

	// 取某一大關某一頁的景物（已加上頁面位移）
	Maps.getObjects = function(group, page) {
		var maps = groupData(group).maps;
		var offset = Maps.getPageY(page, group);
		var result = [];
		if (!maps[page]) {
			return result;
		}
		for (var i = 0; i < maps[page].objects.length; i++) {
			var obj = maps[page].objects[i];
			result.push({ pic: obj.pic, x: obj.x, y: obj.y + offset });
		}
		return result;
	};

	return Maps;
})();
