/**
 * 圖集（Sprite Atlas）與圖片常數定義
 * @author DaiEn
 * @Date 2026-11-21
 * @Correction 37
 */
var Images = (function() {
	//======================================================
	function Images() {}
	// MAIN 主選單待選組：由 game.js init() 隨機抽組後賦值，舊版面邏輯仍讀這三個常數
	Images.MAIN_MENU_VIDEO_S = null;
	Images.MAIN_MENU_VIDEO_E = null;
	Images.MAIN_MENU_BACK = null;
	// MAIN畫面第一組
	Images.MAIN_MENU_VIDEO_S1 = "assets/art/video/start1.webm";
	Images.MAIN_MENU_VIDEO_E1 = "assets/art/video/end1.webm";
	Images.MAIN_MENU_BACK1 = "start1";
	// MAIN畫面第二組
	Images.MAIN_MENU_VIDEO_S2 = "assets/art/video/start2.webm";
	Images.MAIN_MENU_VIDEO_E2 = "assets/art/video/end2.webm";
	Images.MAIN_MENU_BACK2 = "start2";
	// MAIN畫面第三組
	Images.MAIN_MENU_VIDEO_S3 = null;
	Images.MAIN_MENU_VIDEO_E3 = "assets/art/video/end3.webm";
	Images.MAIN_MENU_BACK3 = "start3";
	// MAIN畫面第四組
	Images.MAIN_MENU_VIDEO_S4 = null;
	Images.MAIN_MENU_VIDEO_E4 = "assets/art/video/end4.webm";
	Images.MAIN_MENU_BACK4 = "start4";
	
	Images.BUTTON_MORE_GAMES = "button_more_games";
	Images.BUTTON_SOUND_ON = "button_sound_on";
	Images.BUTTON_SOUND_OFF = "button_sound_off";
	Images.BUTTON_PLAY = "button_play";
	Images.BUTTON_EXIT = "button_exit";
	Images.BUTTON_PAUSE = "button_pause";
	Images.BUTTON_SHUFFLE = "button_shuffle";
	Images.BUTTON_RESTART = "button_restart";
	Images.BUTTON_CREDITS = "button_credits";
	Images.BUTTON_EYE_OPENED = "button_eye_opened";
	Images.BUTTON_EYE_CLOSED = "button_eye_closed";
	Images.BUTTON_PLAY_BIG = "button_play_big";
	Images.BUTTON_EV = "button_ev";
	Images.BUTTON_SETTING = "button_setting";
	
	Images.BUTTON_EYE_CLOSED = "button_eye_closed";
	Images.BUTTON_PLAY_BIG = "button_play_big";
	Images.BUTTON_EV = "button_ev";
	Images.BUTTON_SETTING = "button_setting";
	
	Images.BUTTON_A1 = "button_a1"; // 登入按鈕三段拼組：左緣
	Images.BUTTON_A2 = "button_a2"; // 登入按鈕三段拼組：中間藍色拉伸條
	Images.BUTTON_A3 = "button_a3"; // 登入按鈕三段拼組：右緣
	Images.BUTTON_A4 = "button_a4"; // 主選單登入入口圖示
	Images.BUTTON_A5 = "button_a5";

	Images.TIME_PROGRESS_BAR = "time_progress_bar";
	Images.DURATION = "duration"; // 時間標籤（all 群組第 28 幀）

	// 設定頁開關與滑桿（all 群組第 31~34 幀）
	Images.CHECK_ON = "check_on"; // 31 已勾選
	Images.CHECK_OFF = "check_off"; // 32 未勾選
	Images.SLIDER = "slider"; // 33 滑桿軌道
	Images.SLIDER_BTN = "slider_btn"; // 34 滑桿鈕
	
	Images.IN_CN = "in_cn"; // 36 简（簡體）
	Images.IN_TW = "in_tw"; // 35 繁（繁體）
	Images.IN_EN = "in_en"; // 37 En（英文）
	Images.IN_JA = "in_ja"; // 38 あ（日文）
	Images.BUTTON_LOGOUT = "button_logout"; // 39 登出遊戲

	Images.WINDOW = "window";

	// 排行榜前三名皇冠：assets/art/crown.png，64×192、1 欄 × 3 列，每格 64×64
	// 由上而下：金（第1名）／銀（第2名）／青銅鑽（第3名）
	Images.CROWN_1 = "crown_1";
	Images.CROWN_2 = "crown_2";
	Images.CROWN_3 = "crown_3";

	Images.GITHUB_1 = "github_1";
	Images.VERCEL_1 = "vercel_1";
	Images.LINK_1 = "link_1";
	Images.SUPABASE_1 = "supabase_1";

	Images.GUI_TOP = "gui_top"; // 取 all 群組第 14 幀
	Images.GUI_BOTTOM = "gui_bottom";

	Images.STAR_MINI = "star_mini";
	Images.STAR_MINI_EMPTY = "star_mini_empty";
	Images.FILL_BOTTOM = "fill_bottom";

	Images.TRANSITION_HOLE = "transition_hole"; // 场景切换

	Images.HAND = "hand";//手指
	Images.MIN_HEAD = "min_hrad";
	Images.CAT_TITLE = "cat_title";

	Images.MAP_MENU = "map/map_menu"; // 取 all 群組第 16 幀
	Images.MAP_BUTTON_UP = "button_up";
	Images.MAP_BUTTON_DOWN = "button_down";
	Images.MAP_BUTTON_DOWNLOAD = "button_download";
	// 風車本體柱仍在 map_objects_1 第 11 格；關卡按鈕與風車葉片改由 map_objects_2 提供
	Images.OBJ_1_11 = "map/obj_1_11";
	// map_objects_2 圖集：兩顆關卡按鈕＋一組風車葉片
	Images.OBJ_2_BUTTON1 = "map/obj_2_button1";
	Images.OBJ_2_BUTTON2 = "map/obj_2_button2";
	Images.OBJ_2_WINDMILL = "map/obj_2_windmill";

	// 霧氣圖（選關頁天氣層用）：assets/art/map/fog_ani.png，1024×768、RGBA
	// 由 weather.js 做水平平鋪流動，透明度就是霧的濃淡
	Images.FOG_ANI = "map/fog_ani";

	// 天氣控制按鈕圖組：assets/art/map/weather.png，160×128、RGBA
	// 5 欄 × 4 列共 20 格，每格 32×32，格與格之間沒有間距
	// 由 weather.js 的測試選單（控制按鈕 → 主選單 → 各組等級）取用
	Images.WEATHER_ICONS = "map/weather";

	// NPC 行走圖集：assets/art/npc/npc01_walk.png，384×512、RGBA、透明底
	// 4 欄 × 4 列共 16 格，每格 96×128，腳底統一對齊同一條基線（格內 y=123，下緣留 4px）
	// 列序＝背面 / 側面朝右 / 正面 / 側面朝左，每列四幀
	// 下面四個是「動畫名」而不是圖片名：DNAssetsManager 會替每個動畫名建一張 Sprite，
	// 所以 js/fx/npc_walker.js 直接用 getImage(動畫名) 拿到單格 Sprite；
	// 之後要換同一組動畫裡的第 2、3 幀時，先向圖集查出絕對格號，再用 gotoAndStop(格號) 跳過去
	// （這一版 EaselJS（0.7.1）的 gotoAndStop 只收一個參數，不能直接用（動畫名, 幀數））
	Images.NPC_01_WALK = "npc/npc01_walk";
	Images.NPC_01_WALK_BACK = "npc01_walk_back";
	Images.NPC_01_WALK_RIGHT = "npc01_walk_right";
	Images.NPC_01_WALK_FRONT = "npc01_walk_front";
	Images.NPC_01_WALK_LEFT = "npc01_walk_left";

	// 第二批 NPC 行走圖集（npc02 棕長髮抱籃、npc03 粉髮水手領連身裙）
	// 三張圖集規格完全一致：384×512、單格 96×128、4 欄 × 4 列、四組朝向、每列四幀。
	// 腳底也統一對齊格內 y=123（下緣留 4px）—— 16 格 × 3 張全部同位，
	// 所以 npc_walker.js 只用一個共用基線就夠，不必再逐隻補正。
	// 之後新增圖集務必要維持同樣的留白，一旦某張圖腳底偏高或偏低，
	// 不要靠改程式去補，把那張圖重新落格對齊同一條線，否則四隻站在一起會看到誰浮空、誰陷地。
	Images.NPC_02_WALK = "npc/npc02_walk";
	Images.NPC_02_WALK_BACK = "npc02_walk_back";
	Images.NPC_02_WALK_RIGHT = "npc02_walk_right";
	Images.NPC_02_WALK_FRONT = "npc02_walk_front";
	Images.NPC_02_WALK_LEFT = "npc02_walk_left";

	Images.NPC_03_WALK = "npc/npc03_walk";
	Images.NPC_03_WALK_BACK = "npc03_walk_back";
	Images.NPC_03_WALK_RIGHT = "npc03_walk_right";
	Images.NPC_03_WALK_FRONT = "npc03_walk_front";
	Images.NPC_03_WALK_LEFT = "npc03_walk_left";

	// 第三批 NPC：npc04 黑長直綠眼埃及風女孩（384×512、4 欄 × 4 列、單格 96×128，每列四幀）
	Images.NPC_04_WALK = "npc/npc04_walk";
	Images.NPC_04_WALK_BACK = "npc04_walk_back";
	Images.NPC_04_WALK_RIGHT = "npc04_walk_right";
	Images.NPC_04_WALK_FRONT = "npc04_walk_front";
	Images.NPC_04_WALK_LEFT = "npc04_walk_left";

	// 第四批 NPC：npc05、npc06（384×512、4 欄 × 4 列、單格 96×128，每列四幀）
	Images.NPC_05_WALK = "npc/npc05_walk";
	Images.NPC_05_WALK_BACK = "npc05_walk_back";
	Images.NPC_05_WALK_RIGHT = "npc05_walk_right";
	Images.NPC_05_WALK_FRONT = "npc05_walk_front";
	Images.NPC_05_WALK_LEFT = "npc05_walk_left";

	Images.NPC_06_WALK = "npc/npc06_walk";
	Images.NPC_06_WALK_BACK = "npc06_walk_back";
	Images.NPC_06_WALK_RIGHT = "npc06_walk_right";
	Images.NPC_06_WALK_FRONT = "npc06_walk_front";
	Images.NPC_06_WALK_LEFT = "npc06_walk_left";

	// map_objects_1 圖集 18 格，依幀序對應 obj_1_00 ~ obj_1_17
	Images.OBJ_1_00 = "map/obj_1_00";
	Images.OBJ_1_01 = "map/obj_1_01";
	Images.OBJ_1_02 = "map/obj_1_02";
	Images.OBJ_1_03 = "map/obj_1_03";
	Images.OBJ_1_04 = "map/obj_1_04";
	Images.OBJ_1_05 = "map/obj_1_05";
	Images.OBJ_1_06 = "map/obj_1_06";
	Images.OBJ_1_07 = "map/obj_1_07";
	Images.OBJ_1_08 = "map/obj_1_08";
	Images.OBJ_1_09 = "map/obj_1_09";
	Images.OBJ_1_10 = "map/obj_1_10";
	Images.OBJ_1_11 = "map/obj_1_11";
	Images.OBJ_1_12 = "map/obj_1_12";
	Images.OBJ_1_13 = "map/obj_1_13";
	Images.OBJ_1_14 = "map/obj_1_14";
	Images.OBJ_1_15 = "map/obj_1_15";
	Images.OBJ_1_16 = "map/obj_1_16";
	Images.OBJ_1_17 = "map/obj_1_17";
	
	Images.OBJ_1_18 = "map/obj_1_18";
	Images.OBJ_1_19 = "map/obj_1_19";
	Images.OBJ_1_20 = "map/obj_1_20";
	Images.OBJ_1_21 = "map/obj_1_21";
	Images.OBJ_1_22 = "map/obj_1_22";
	Images.OBJ_1_23 = "map/obj_1_23";
	Images.OBJ_1_24 = "map/obj_1_24";
	Images.OBJ_1_25 = "map/obj_1_25";
	Images.OBJ_1_26 = "map/obj_1_26";
	
	Images.OBJ_1_27 = "map/obj_1_27";
	Images.OBJ_1_28 = "map/obj_1_28";
	Images.OBJ_1_29 = "map/obj_1_29";
	Images.OBJ_1_30 = "map/obj_1_30";
	Images.OBJ_1_31 = "map/obj_1_31";
	Images.OBJ_1_32 = "map/obj_1_32";
	Images.OBJ_1_33 = "map/obj_1_33";

	Images.OBJ_1_34 = "map/obj_1_34";
	Images.OBJ_1_35 = "map/obj_1_35";
	Images.OBJ_1_36 = "map/obj_1_36";
	Images.OBJ_1_37 = "map/obj_1_37";
	Images.OBJ_1_38 = "map/obj_1_38";
	Images.OBJ_1_39 = "map/obj_1_39";
	Images.OBJ_1_40 = "map/obj_1_40";
	Images.OBJ_1_41 = "map/obj_1_41";
	Images.OBJ_1_42 = "map/obj_1_42";
	Images.OBJ_1_43 = "map/obj_1_43";
	Images.OBJ_1_44 = "map/obj_1_44";
	Images.OBJ_1_45 = "map/obj_1_45";
	Images.OBJ_1_46 = "map/obj_1_46";
	
	Images.BUSH = "map/bush";

	// 2023/12/18 daien add
	Images.M_1 = "map/m_1";
	Images.M_4 = "map/m_4";
	Images.M_5 = "map/m_5";
	Images.M_6 = "map/m_6";
	Images.M_7 = "map/m_7";
	Images.M_9 = "map/m_9";
	Images.M_10 = "map/m_10";
	Images.M_11 = "map/m_11";
	Images.M_12 = "map/m_12";

	Images.MINI_BUTTON = "mini_button";

	Images.CAPTION_SCORE = "current_score";
	Images.TOTAL_SCORE = "total_score";


	Images.CAPTION_LEVEL_COMPLETED = "caption_level_completed";
	Images.CAPTION_LEVEL_FAILED = "caption_level_failed";
	Images.CAPTION_PAUSE = "caption_pause";

	Images.CAPTION_MOVES = "caption_moves";
	Images.CAPTION_LEVEL = "caption_level";

	Images.END_LEVEL_WIN = "end_level_win";
	Images.END_LEVEL_TIME_IS_UP = "end_level_time_is_up";
	Images.END_LEVEL_NO_POSSIBLE_MOVES = "end_level_no_possible_moves";

	Images.LOGO = "logo";
	// 品牌／廣告圖組改由 ads.js 設定檔驅動，不在此登記靜態圖集

	Images.STAR_STICK = "star_stick"; // 时间轴标示线
	Images.SHINING = "shining";

	Images.BONUS_SHUFFLE = "bonus_shuffle";
	Images.BONUS_TIME = "bonus_time";
	Images.BONUS_POINTS = "bonus_points";
	Images.BONUS_AUTO = "bonus_auto";

	Images.BIG_STAR = "big_star";

	Images.BONUS_SHINING = "bonus_shining";
	return Images;
})();



var manifest = [];

var athlases = [{
		"images": ["chips"],
		"frames": [
			// x y w h
			[513, 762, 71, 93], //0 亮 bugs/0
			[440, 857, 71, 93], //1 暗
			[75, 2, 71, 93], //2 bugs/1
			[2, 2, 71, 93], //3
			[440, 762, 71, 93], //4 bugs/2
			[586, 667, 71, 93], //5
			[513, 667, 71, 93], //6 bugs/3
			[440, 667, 71, 93], //7
			[367, 97, 71, 93], //8 bugs/4
			[294, 97, 71, 93], //9
			[367, 857, 71, 93], //10 bugs/5
			[367, 762, 71, 93], //11
			[513, 192, 71, 93], //12 bugs/6
			[440, 192, 71, 93], //13
			[294, 857, 71, 93], //14 bugs/7
			[294, 762, 71, 93], //15
			[221, 97, 71, 93], //16 bugs/8
			[75, 97, 71, 93], //17

			[586, 857, 71, 93], //18 empty/0
			[586, 762, 71, 93], //19

			[221, 857, 71, 93], //20 eyes/0
			[221, 762, 71, 93], //21
			[367, 667, 71, 93], //22 eyes/1
			[294, 667, 71, 93], //23
			[221, 667, 71, 93], //24 eyes/2
			[148, 857, 71, 93], //25
			[148, 762, 71, 93], //26 eyes/3
			[148, 667, 71, 93], //27
			[2, 97, 71, 93], //28 eyes/4
			[148, 97, 71, 93], //29
			[75, 857, 71, 93], //30 eyes/5
			[75, 762, 71, 93], //31
			[75, 667, 71, 93], //32 eyes/6
			[2, 857, 71, 93], //33
			[513, 2, 71, 93], //34 eyes/7
			[440, 2, 71, 93], //35
			[2, 764, 71, 93], //36 eyes/8
			[2, 669, 71, 93], //37

			[586, 572, 71, 93], //38 fruit/0
			[513, 572, 71, 93], //39
			[440, 572, 71, 93], //40 fruit/1
			[367, 572, 71, 93], //41
			[294, 572, 71, 93], //42 fruit/2
			[221, 572, 71, 93], //43
			[75, 572, 71, 93], //44 fruit/3
			[2, 572, 71, 93], //45

			[367, 192, 71, 93], //46 hands/0
			[294, 192, 71, 93], //47
			[367, 2, 71, 93], //48 hands/1
			[294, 2, 71, 93], //49
			[148, 572, 71, 93], //50 hands/3
			[586, 477, 71, 93], //51
			[513, 477, 71, 93], //52 hands/3
			[440, 477, 71, 93], //53

			[367, 477, 71, 93], //54 monsters/0
			[294, 477, 71, 93], //55
			[221, 477, 71, 93], //56 monsters/1
			[75, 477, 71, 93], //57
			[2, 477, 71, 93], //58 monsters/2
			[148, 477, 71, 93], //59
			[221, 192, 71, 93], //60 monsters/3
			[75, 192, 71, 93], //61

			[586, 382, 71, 93], //62 plants/0
			[513, 382, 71, 93], //63
			[2, 192, 71, 93], //64 plants/1
			[148, 192, 71, 93], //65
			[440, 382, 71, 93], //66 plants/2
			[367, 382, 71, 93], //67

			[294, 382, 71, 93], //68 snakes/0
			[221, 382, 71, 93], //69
			[75, 382, 71, 93], //70 snakes/1
			[2, 382, 71, 93], //71
			[221, 2, 71, 93], //72 snakes/2
			[148, 2, 71, 93], //73
			[148, 382, 71, 93], //74 snakes/3
			[586, 287, 71, 93], //75
			[513, 287, 71, 93], //76 snakes/4
			[440, 287, 71, 93], //77
			[367, 287, 71, 93], //78 snakes/5
			[294, 287, 71, 93], //79
			[221, 287, 71, 93], //80 snakes/6
			[75, 287, 71, 93], //81
			[2, 287, 71, 93], //82 snakes/7
			[148, 287, 71, 93], //83
			[513, 97, 71, 93], //84 snakes/8
			[440, 97, 71, 93] //85
		],
		"animations": {
			"bugs/0": [0],
			"bugs/0_1": [1],
			"bugs/1": [2],
			"bugs/1_1": [3],
			"bugs/2": [4],
			"bugs/2_1": [5],
			"bugs/3": [6],
			"bugs/3_1": [7],
			"bugs/4": [8],
			"bugs/4_1": [9],
			"bugs/5": [10],
			"bugs/5_1": [11],
			"bugs/6": [12],
			"bugs/6_1": [13],
			"bugs/7": [14],
			"bugs/7_1": [15],
			"bugs/8": [16],
			"bugs/8_1": [17],
			"empty/0": [18],
			"empty/0_1": [19],
			"eyes/0": [20],
			"eyes/0_1": [21],
			"eyes/1": [22],
			"eyes/1_1": [23],
			"eyes/2": [24],
			"eyes/2_1": [25],
			"eyes/3": [26],
			"eyes/3_1": [27],
			"eyes/4": [28],
			"eyes/4_1": [29],
			"eyes/5": [30],
			"eyes/5_1": [31],
			"eyes/6": [32],
			"eyes/6_1": [33],
			"eyes/7": [34],
			"eyes/7_1": [35],
			"eyes/8": [36],
			"eyes/8_1": [37],
			"fruit/0": [38],
			"fruit/0_1": [39],
			"fruit/1": [40],
			"fruit/1_1": [41],
			"fruit/2": [42],
			"fruit/2_1": [43],
			"fruit/3": [44],
			"fruit/3_1": [45],
			"hands/0": [46],
			"hands/0_1": [47],
			"hands/1": [48],
			"hands/1_1": [49],
			"hands/2": [50],
			"hands/2_1": [51],
			"hands/3": [52],
			"hands/3_1": [53],
			"monsters/0": [54],
			"monsters/0_1": [55],
			"monsters/1": [56],
			"monsters/1_1": [57],
			"monsters/2": [58],
			"monsters/2_1": [59],
			"monsters/3": [60],
			"monsters/3_1": [61],
			"plants/0": [62],
			"plants/0_1": [63],
			"plants/1": [64],
			"plants/1_1": [65],
			"plants/2": [66],
			"plants/2_1": [67],
			"snakes/0": [68],
			"snakes/0_1": [69],
			"snakes/1": [70],
			"snakes/1_1": [71],
			"snakes/2": [72],
			"snakes/2_1": [73],
			"snakes/3": [74],
			"snakes/3_1": [75],
			"snakes/4": [76],
			"snakes/4_1": [77],
			"snakes/5": [78],
			"snakes/5_1": [79],
			"snakes/6": [80],
			"snakes/6_1": [81],
			"snakes/7": [82],
			"snakes/7_1": [83],
			"snakes/8": [84],
			"snakes/8_1": [85]
		}
	},
	{
		"images": ["all"],
		"frames": [
			[553, 71, 79, 71], //0 大星星
			[79, 0, 79, 71], //1 自動
			[0, 0, 79, 71], //2 加分
			[711, 213, 164, 164], //3 獎勵 閃光 - 大
			[237, 0, 79, 71], //4 獎勵 洗牌
			[158, 0, 79, 71], //5 獎勵 時間
			[316, 0, 79, 71], //6 完成關卡(小)
			[395, 0, 158, 71], //7 失敗了
			[632, 0, 79, 71], //8 暫停
			[188, 480, 94, 27], //9 分數
			[0, 71, 316, 71], //10 動不了了！
			[316, 71, 237, 71], //11 時間到
			[0, 142, 316, 71], //12 完成關卡(大) - 游戏胜利
			[0, 213, 700, 70], //13 遊戲面 下選單
			[0, 283, 700, 86], //14 遊戲面 上選單
			[711, 0, 124, 213], //15 手指娃娃
			[0, 371, 700, 86], //16 遊戲外 上選單
			[502, 458, 39, 39], //17 金币（迷你按鈕）
			[188, 480, 94, 27], //18 分數
			[219, 458, 219, 22], //19 绿色进度条
			[711, 377, 81, 81], //20 小闪光
			[438, 458, 32, 31], //21 小星星（实）
			[470, 458, 32, 31], //22 小星星（空）
			[376, 480, 3, 27], //23 分割线
			[0, 458, 219, 22], //24 黄色进度条
			[553, 0, 79, 71], //25 小頭像
			[0, 480, 94, 27], //26 總 分
			[94, 480, 94, 27], //27 可 消 除 ：
			[282, 480, 94, 27], //28 時  間 ：
			[541, 480, 94, 27], //29 关  卡 ：
			[316,142,395,71], //30 上方的LOGO（蛋殼大冒險）
			// 2026-11-18
			[792,371,43,43], //31 以勾選
			[792,414,43,43], //32 未勾選
			[553,458,322,22], //33 滑竿
			[835,414,40,40], //34 滑竿鈕
			// 2026-11-19
			[835,0,40,40], //35 繁（tw）
			[835,40,40,40], //36 简（cn）
			[835,80,40,40], //37 En
			[835,120,40,40], //38 あ
			[835,160,40,40] //39 登出遊戲
		],
		"animations": {
			"big_star": [0], // 大星星
			"bonus_auto": [1], // 自動
			"bonus_points": [2], // 加分
			"bonus_shining": [3], // 獎勵 閃光 - 大
			"bonus_shuffle": [4], // 獎勵 洗牌
			"bonus_time": [5], // 獎勵 時間
			"caption_level_completed": [6], // 完成關卡
			"caption_level_failed": [7], // 失敗了
			"caption_pause": [8], // 暫停
			"current_score": [9], // 分數
			"end_level_no_possible_moves": [10], // 動不了了！
			"end_level_time_is_up": [11], // 時間到
			"end_level_win": [12],// 完成關卡(大) - 游戏胜利
			"gui_bottom": [13], // 遊戲面 下選單
			"gui_top": [14], // 遊戲內上選單（all 群組第 14 幀）
			"hand": [15], // 手指娃娃
			"map/map_menu": [16], // 地圖畫面上選單（all 群組第 16 幀）
			"mini_button": [17],// 金币（迷你按鈕）
			"score": [18], // 同9 分數
			"score_panel": [19], // 绿色进度条
			"shining": [20], // 小闪光
			"star_mini": [21], // 小星星（实）
			"star_mini_empty": [22], // 小星星（空）
			"star_stick": [23], // 分割线
			"time_progress_bar": [24], // 黄色进度条
			"min_hrad": [25],// 小頭像
			"total_score": [26], // 總 分
			"caption_moves": [27], // 可消除：all 第 27 幀
			"duration": [28], // 時間：all 第 28 幀
			"caption_level": [29], // 關卡：all 第 29 幀
			
			"cat_title": [30], // 上方的LOGO
			"check_on": [31], // 已勾選
			"check_off": [32], // 未勾選
			"slider": [33], // 滑桿軌道
			"slider_btn": [34], // 滑桿鈕
			
			"in_cn": [36], // 简（cn）
			"in_tw": [35], // 繁（tw）
			"in_en": [37], // En
			"in_ja": [38], // あ
			"button_logout": [39] // 登出遊戲
		}
	},
	{ // 天氣控制按鈕圖組 weather_icons：assets/art/map/weather.png
		// 160×128，5 欄 × 4 列，每格 32×32，格與格之間沒有間距（欄 = x/32，列 = y/32）
		// 第一格同時是「控制按鈕」與「夜晚」標題；由 weather.js 的測試選單取用
		"images": ["map/weather"],
		"frames": [
			[0, 0, 32, 32], //0 控制按鈕（與「夜晚」標題同一格）
			[32, 0, 32, 32], //1 黃昏
			[64, 0, 32, 32], //2 夜晚
			[96, 0, 32, 32], //3 深夜
			[128, 0, 32, 32], //4 凌晨
			[0, 32, 32, 32], //5 下雨
			[32, 32, 32, 32], //6 小雨
			[64, 32, 32, 32], //7 雨
			[96, 32, 32, 32], //8 暴雨
			[128, 32, 32, 32], //9 打雷
			[0, 64, 32, 32], //10 降雪
			[32, 64, 32, 32], //11 小雪
			[64, 64, 32, 32], //12 雪
			[96, 64, 32, 32], //13 暴雪
			[0, 96, 32, 32], //14 起霧
			[32, 96, 32, 32], //15 小霧
			[64, 96, 32, 32], //16 霧
			[96, 96, 32, 32], //17 濃霧
			[128, 64, 32, 32], //18 雷
			[128, 96, 32, 32] //19 暴雷
		],
		"animations": {
			"weather_ctrl": [0], // 控制按鈕
			"weather_night": [0], // 夜晚（標題）
			"weather_night_dusk": [1], // 黃昏
			"weather_night_night": [2], // 夜晚
			"weather_night_deep": [3], // 深夜
			"weather_night_dawn": [4], // 凌晨
			"weather_rain": [5], // 下雨（標題）
			"weather_rain_light": [6], // 小雨
			"weather_rain_mid": [7], // 雨
			"weather_rain_heavy": [8], // 暴雨
			"weather_thunder": [9], // 打雷（標題）
			"weather_thunder_mid": [18], // 雷
			"weather_thunder_heavy": [19], // 暴雷
			"weather_snow": [10], // 降雪（標題）
			"weather_snow_light": [11], // 小雪
			"weather_snow_mid": [12], // 雪
			"weather_snow_heavy": [13], // 暴雪
			"weather_fog": [14], // 起霧（標題）
			"weather_fog_light": [15], // 小霧
			"weather_fog_mid": [16], // 霧
			"weather_fog_heavy": [17] // 濃霧
		}
	},
	{
		"images": ["buttons"],
		"frames": [
			[694, 96, 96, 96], //0 INFO
			[406, 0, 96, 96], //1 下
			[598, 96, 96, 96], //2 HOME
			[502, 96, 96, 96], //3 閉眼
			[406, 96, 96, 96], //4 張眼
			[310, 96, 96, 96], //5 獎盃
			[214, 0, 96, 96], //6 暫停
			[118, 0, 96, 96], //7 PLAY
			[0, 0, 118, 118], //8 大PLAY
			[502, 0, 96, 96], //9 重置
			[598, 0, 96, 96], //10 洗牌
			[214, 96, 96, 96], //11 音源 OFF
			[118, 96, 96, 96], //12 音源 ON
			[310, 0, 96, 96], //13 上
			[790, 0, 45, 96], //14 下載
			[0, 118, 118, 80], //15 空白框
			[694, 0, 96, 96], //16 設置

			[790,118,22,80], //17 左
			[812,118,1,80], //18 右
			[813,118,22,80], //19 中
			[835,0,96,96], //20 登入
			[835,96,96,96] //21 未使用
		],
		"animations": {
			"button_credits": [0],
			"button_down": [1],
			"button_exit": [2],
			"button_eye_closed": [3],
			"button_eye_opened": [4],
			"button_more_games": [5],
			"button_pause": [6],
			"button_play": [7],
			"button_play_big": [8],
			"button_restart": [9],
			"button_shuffle": [10],
			"button_sound_off": [11],
			"button_sound_on": [12],
			"button_up": [13],
			"button_download": [14],
			"button_ev": [15],
			"button_setting": [16],
			
			"button_a1": [17],
			"button_a2": [18],
			"button_a3": [19],
			"button_a4": [20],
			"button_a5": [21]
		}
	},
	{
		"images": ["map/map_objects_1"],
		"frames": [
			[0, 0, 148, 262], // 0 樹
			[148, 0, 148, 262], // 1 樹
			[296, 0, 148, 262], // 2 樹
			[444, 0, 148, 262], // 3 樹
			
			[592, 0, 148, 262], // 4 石
			[740, 0, 148, 262], // 5 樹
			[888, 0, 148, 262], // 6 樹
			
			[1036, 0, 296, 434], // 7 樹屋
			[1332, 0, 86, 262], // 8 象牙欄杆
			[1418, 0, 102, 262], // 9 象牙欄杆
			
			[1332, 262, 188, 262], // 10 象牙欄杆
			[1332, 524, 86, 262], // 11 象牙欄杆
			[1418, 524, 102, 262], // 12 象牙欄杆
			
			[0, 262, 296, 524], // 13 树（大樹）
			[296, 262, 114, 172], // 14 木杆
			[410, 262, 95, 172], // 15 树
			
			[505, 262, 87, 172], // 16 树
			[592, 262, 148, 262], // 17 石柱子
			[740, 262, 148, 262], // 18 树
			
			[888, 262, 148, 262], // 19 树
			[1520, 0, 148, 262], // 20 芭蕉
			[1668, 0, 165, 262], // 21 石屋

			[1520, 262, 148, 262], // 22 食人花
			[1668, 262, 165, 262], // 23 雕像
			[296, 434, 114, 90], // 24 石
			
			[410, 434, 80, 90], // 25 破石槽（左）
			[490, 434, 102, 90], // 26 破石槽（右）
			[296, 524, 209, 262], // 27 枯木

			[505, 524, 235, 262], // 28 枯木
			[740, 524, 148, 341], // 29 圖騰石雕
			[888, 524, 148, 341], // 30 圖騰石雕

			[1036, 434, 296, 352], // 31 草屋
			[1520, 524, 148, 262], // 32 樹
			[1669, 524, 165, 262], // 33 小枯樹

			[0, 927, 148, 262], // 34 棕櫚
			[148, 927, 148, 262], // 35 棕櫚
			[296, 927, 148, 262], // 36 棕櫚
			
			[444, 927, 148, 262], // 37 圖騰石雕
			[592, 927, 148, 116], // 38 小草屋
			[592, 1044, 148, 145], // 39 小草屋

			[740, 865, 296, 324], // 40 石屋
			[1036, 786, 296, 403], // 41 葉子屋
			[1332, 786, 188, 141], // 42 骷髏
			
			[1332, 927, 188, 262], // 43 房屋
			[1520, 786, 314, 226], // 44 水池
			[1520, 1012, 314, 177], // 45 水池
			
			[373, 786, 117, 141], // 46 火焰石台
		],
		"animations": {
			"map/obj_1_00": [0],
			"map/obj_1_01": [1],
			"map/obj_1_02": [2],
			"map/obj_1_03": [3],
			"map/obj_1_04": [4],
			"map/obj_1_05": [5],
			"map/obj_1_06": [6],
			"map/obj_1_07": [7],
			"map/obj_1_08": [8],
			"map/obj_1_09": [9],
			"map/obj_1_10": [10],
			"map/obj_1_11": [11],
			"map/obj_1_12": [12],
			"map/obj_1_13": [13],
			"map/obj_1_14": [14],
			"map/obj_1_15": [15],
			"map/obj_1_16": [16],
			"map/obj_1_17": [17],
			
			"map/obj_1_18": [18],
			"map/obj_1_19": [19],
			"map/obj_1_20": [20],

			"map/obj_1_21": [21],
			"map/obj_1_22": [22],
			"map/obj_1_23": [23],

			"map/obj_1_24": [24],
			"map/obj_1_25": [25],
			"map/obj_1_26": [26],

			"map/obj_1_27": [27],
			"map/obj_1_28": [28],
			"map/obj_1_29": [29],

			"map/obj_1_30": [30],
			"map/obj_1_31": [31],
			"map/obj_1_32": [32],

			"map/obj_1_33": [33],
			"map/obj_1_34": [34],
			"map/obj_1_35": [35],
			"map/obj_1_36": [36],
			"map/obj_1_37": [37],
			"map/obj_1_38": [38],
			"map/obj_1_39": [39],
			"map/obj_1_40": [40],
			"map/obj_1_41": [41],
			"map/obj_1_42": [42],
			"map/obj_1_43": [43],
			"map/obj_1_44": [44],
			"map/obj_1_45": [45],
			"map/obj_1_46": [46]
		}
	},
	{
		"images": ["map/map_objects_2"],
		"frames": [
			[0, 69, 98, 69], // 关卡按钮
			[0, 0, 98, 69], // 关卡按钮
			[98, 0, 160, 160] // 風車
		],
		"animations": {
			"map/obj_2_button1": [0],// 关卡按钮(obj_1_09)
			"map/obj_2_button2": [1],// 关卡按钮(obj_1_10)
			"map/obj_2_windmill": [2]// 風車(obj_1_12)
		}
	},
	{
		"images": ["map/map_objects_3"],
		"frames": [
			[2, 2, 100, 108], // 0石锅
			[104, 2, 100, 108], // 1稻草
			[206, 2, 100, 108], // 2骷髅堆
			
			[308, 2, 100, 108], // 3小石
			[410, 2, 100, 108], // 4小石
			[512, 2, 202, 108], // 5中石
			
			[2, 112, 178, 164], // 6中石
			[2, 278, 178, 124], // 7中石
			
			[182, 112, 155, 288], // 8树
			[339, 112, 148, 288], // 9树
			[489, 112, 120, 203], // 10树
			[611, 112, 120, 203], // 11树
		],
		"animations": {
			"map/m_1": [0],
			"map/m_2": [1],
			"map/m_3": [2],
			"map/m_4": [3],
			"map/m_5": [4],
			"map/m_6": [5],
			"map/m_7": [6],
			"map/m_8": [7],
			"map/m_9": [8],
			"map/m_10": [9],
			"map/m_11": [10],
			"map/m_12": [11]
		}
	},
	{
		"images": ["font_gui"], // 数字
		"frames": [
			[2, 322, 25, 30],
			[2, 290, 25, 30],
			[2, 258, 25, 30],
			[2, 226, 25, 30],
			[2, 194, 25, 30],
			[2, 162, 25, 30],
			[2, 130, 25, 30],
			[2, 98, 25, 30],
			[2, 66, 25, 30],
			[2, 34, 25, 30],
			[2, 2, 25, 30]
		],
		"animations": {
			"font_gui/0": [0],
			"font_gui/1": [1],
			"font_gui/2": [2],
			"font_gui/3": [3],
			"font_gui/4": [4],
			"font_gui/5": [5],
			"font_gui/6": [6],
			"font_gui/7": [7],
			"font_gui/8": [8],
			"font_gui/9": [9],
			"font_gui/d": [10]
		}
	},
	{
		"images": ["font_score"], // 数字
		"frames": [
			[372, 2, 35, 40],
			[335, 2, 35, 40],
			[298, 2, 35, 40],
			[261, 2, 35, 40],
			[224, 2, 35, 40],
			[187, 2, 35, 40],
			[150, 2, 35, 40],
			[113, 2, 35, 40],
			[76, 2, 35, 40],
			[39, 2, 35, 40],
			[2, 2, 35, 40]
		],
		"animations": {
			"font_score/0": [0],
			"font_score/1": [1],
			"font_score/2": [2],
			"font_score/3": [3],
			"font_score/4": [4],
			"font_score/5": [5],
			"font_score/6": [6],
			"font_score/7": [7],
			"font_score/8": [8],
			"font_score/9": [9],
			"font_score/p": [10]
		}
	},
	{
		"images": ["hint"], // 光
		"frames": [
			[698, 490, 85, 120],
			[698, 368, 85, 120],
			[872, 246, 85, 120],
			[785, 246, 85, 120],
			[698, 246, 85, 120],
			[611, 490, 85, 120],
			[611, 368, 85, 120],
			[611, 246, 85, 120],
			[872, 124, 85, 120],
			[785, 124, 85, 120],
			[698, 124, 85, 120],
			[611, 124, 85, 120],
			[524, 490, 85, 120],
			[524, 368, 85, 120],
			[524, 246, 85, 120],
			[524, 124, 85, 120],
			[437, 490, 85, 120],
			[437, 368, 85, 120],
			[437, 246, 85, 120],
			[437, 124, 85, 120],
			[872, 2, 85, 120],
			[785, 2, 85, 120],
			[698, 2, 85, 120],
			[611, 2, 85, 120],
			[524, 2, 85, 120],
			[437, 2, 85, 120],
			[350, 490, 85, 120],
			[350, 368, 85, 120],
			[350, 246, 85, 120],
			[350, 124, 85, 120],
			[350, 2, 85, 120],
			[263, 490, 85, 120],
			[263, 368, 85, 120],
			[263, 246, 85, 120],
			[263, 124, 85, 120],
			[263, 2, 85, 120],
			[176, 490, 85, 120],
			[176, 368, 85, 120],
			[176, 246, 85, 120],
			[176, 124, 85, 120],
			[176, 2, 85, 120],
			[89, 490, 85, 120],
			[89, 368, 85, 120],
			[89, 246, 85, 120],
			[89, 124, 85, 120],
			[89, 2, 85, 120],
			[2, 490, 85, 120],
			[2, 368, 85, 120],
			[2, 246, 85, 120],
			[2, 124, 85, 120],
			[2, 2, 85, 120]
		],
		"animations": {
			"hint_0": [0],
			"hint_1": [1],
			"hint_2": [2],
			"hint_3": [3],
			"hint_4": [4],
			"hint_5": [5],
			"hint_6": [6],
			"hint_7": [7],
			"hint_8": [8],
			"hint_9": [9],
			"hint_10": [10],
			"hint_11": [11],
			"hint_12": [12],
			"hint_13": [13],
			"hint_14": [14],
			"hint_15": [15],
			"hint_16": [16],
			"hint_17": [17],
			"hint_18": [18],
			"hint_19": [19],
			"hint_20": [20],
			"hint_21": [21],
			"hint_22": [22],
			"hint_23": [23],
			"hint_24": [24],
			"hint_25": [25],
			"hint_26": [26],
			"hint_27": [27],
			"hint_28": [28],
			"hint_29": [29],
			"hint_30": [30],
			"hint_31": [31],
			"hint_32": [32],
			"hint_33": [33],
			"hint_34": [34],
			"hint_35": [35],
			"hint_36": [36],
			"hint_37": [37],
			"hint_38": [38],
			"hint_39": [39],
			"hint_40": [40],
			"hint_41": [41],
			"hint_42": [42],
			"hint_43": [43],
			"hint_44": [44],
			"hint_45": [45],
			"hint_46": [46],
			"hint_47": [47],
			"hint_48": [48],
			"hint_49": [49],
			"hint_50": [50]
		}
	},
	{
		"images": ["match"], // 光
		"frames": [
			[785, 124, 85, 120],
			[785, 2, 85, 120],
			[698, 124, 85, 120],
			[698, 2, 85, 120],
			[611, 124, 85, 120],
			[611, 2, 85, 120],
			[524, 124, 85, 120],
			[524, 2, 85, 120],
			[437, 124, 85, 120],
			[437, 2, 85, 120],
			[350, 124, 85, 120],
			[350, 2, 85, 120],
			[263, 124, 85, 120],
			[263, 2, 85, 120],
			[176, 124, 85, 120],
			[176, 2, 85, 120],
			[89, 124, 85, 120],
			[89, 2, 85, 120],
			[2, 124, 85, 120],
			[2, 2, 85, 120]
		],
		"animations": {
			"match_0": [0],
			"match_1": [1],
			"match_2": [2],
			"match_3": [3],
			"match_4": [4],
			"match_5": [5],
			"match_6": [6],
			"match_7": [7],
			"match_8": [8],
			"match_9": [9],
			"match_10": [10],
			"match_11": [11],
			"match_12": [12],
			"match_13": [13],
			"match_14": [14],
			"match_15": [15],
			"match_16": [16],
			"match_17": [17],
			"match_18": [18],
			"match_19": [19]
		}
	},
	{
		"images": ["highlite"], // 光
		"frames": [
			[722, 308, 70, 100],
			[722, 206, 70, 100],
			[650, 308, 70, 100],
			[650, 206, 70, 100],
			[578, 308, 70, 100],
			[578, 206, 70, 100],
			[722, 104, 70, 100],
			[650, 104, 70, 100],
			[578, 104, 70, 100],
			[506, 308, 70, 100],
			[506, 206, 70, 100],
			[506, 104, 70, 100],
			[722, 2, 70, 100],
			[650, 2, 70, 100],
			[578, 2, 70, 100],
			[506, 2, 70, 100],
			[434, 308, 70, 100],
			[434, 206, 70, 100],
			[434, 104, 70, 100],
			[434, 2, 70, 100],
			[362, 308, 70, 100],
			[362, 206, 70, 100],
			[362, 104, 70, 100],
			[362, 2, 70, 100],
			[290, 308, 70, 100],
			[290, 206, 70, 100],
			[290, 104, 70, 100],
			[290, 2, 70, 100],
			[218, 308, 70, 100],
			[218, 206, 70, 100],
			[218, 104, 70, 100],
			[218, 2, 70, 100],
			[146, 308, 70, 100],
			[146, 206, 70, 100],
			[146, 104, 70, 100],
			[146, 2, 70, 100],
			[74, 308, 70, 100],
			[74, 206, 70, 100],
			[74, 104, 70, 100],
			[74, 2, 70, 100],
			[2, 308, 70, 100],
			[2, 206, 70, 100],
			[2, 104, 70, 100],
			[2, 2, 70, 100]
		],
		"animations": {
			"highlite_0": [0],
			"highlite_1": [1],
			"highlite_2": [2],
			"highlite_3": [3],
			"highlite_4": [4],
			"highlite_5": [5],
			"highlite_6": [6],
			"highlite_7": [7],
			"highlite_8": [8],
			"highlite_9": [9],
			"highlite_10": [10],
			"highlite_11": [11],
			"highlite_12": [12],
			"highlite_13": [13],
			"highlite_14": [14],
			"highlite_15": [15],
			"highlite_16": [16],
			"highlite_17": [17],
			"highlite_18": [18],
			"highlite_19": [19],
			"highlite_20": [20],
			"highlite_21": [21],
			"highlite_22": [22],
			"highlite_23": [23],
			"highlite_24": [24],
			"highlite_25": [25],
			"highlite_26": [26],
			"highlite_27": [27],
			"highlite_28": [28],
			"highlite_29": [29],
			"highlite_30": [30],
			"highlite_31": [31],
			"highlite_32": [32],
			"highlite_33": [33],
			"highlite_34": [34],
			"highlite_35": [35],
			"highlite_36": [36],
			"highlite_37": [37],
			"highlite_38": [38],
			"highlite_39": [39],
			"highlite_40": [40],
			"highlite_41": [41],
			"highlite_42": [42],
			"highlite_43": [43]
		}
	},
	{
		// NPC01 行走圖集：assets/art/npc/npc01_walk.png，384×512、RGBA、透明底
		// 4 欄 × 4 列共 16 格，單格 96×128；列序＝背面 / 側面朝右 / 正面 / 側面朝左，每列四幀
		// 每一格的腳底都在格內 y=123（下緣留 4px 空白），程式把 Sprite 往上位移 baseline×縮放即可對齊腳底中心
		"images": ["npc/npc01_walk"],
		"frames": [
			[0, 0, 96, 128], // 0 背面 1
			[96, 0, 96, 128], // 1 背面 2
			[192, 0, 96, 128], // 2 背面 3
			[288, 0, 96, 128], // 3 背面 4
			[0, 128, 96, 128], // 4 側面朝右 1
			[96, 128, 96, 128], // 5 側面朝右 2
			[192, 128, 96, 128], // 6 側面朝右 3
			[288, 128, 96, 128], // 7 側面朝右 4
			[0, 256, 96, 128], // 8 正面 1
			[96, 256, 96, 128], // 9 正面 2
			[192, 256, 96, 128], // 10 正面 3
			[288, 256, 96, 128], // 11 正面 4
			[0, 384, 96, 128], // 12 側面朝左 1
			[96, 384, 96, 128], // 13 側面朝左 2
			[192, 384, 96, 128], // 14 側面朝左 3
			[288, 384, 96, 128] // 15 側面朝左 4
		],
		"animations": {
			// 注意：這版引擎（EaselJS 0.7.1）把「陣列」形式的動畫當成 [起始格, 結束格, 下一組, 速度] 的區間，
			// 一組幀清單必須用物件形式 frames（見 SpriteSheet._setupAnimations 的 else 分支）
			"npc01_walk_back": {"frames": [0, 1, 2, 3]},
			"npc01_walk_right": {"frames": [4, 5, 6, 7]},
			"npc01_walk_front": {"frames": [8, 9, 10, 11]},
			"npc01_walk_left": {"frames": [12, 13, 14, 15]}
		}
	},
	{
		// NPC02 行走圖集：assets/art/npc/npc02_walk.png，384×512、RGBA、透明底
		// 4 欄 × 4 列共 16 格，單格 96×128；列序＝背面 / 側面朝右 / 正面 / 側面朝左，每列四幀；腳底對齊格內 y=123
		"images": ["npc/npc02_walk"],
		"frames": [
			[0, 0, 96, 128], // 0 背面 1
			[96, 0, 96, 128], // 1 背面 2
			[192, 0, 96, 128], // 2 背面 3
			[288, 0, 96, 128], // 3 背面 4
			[0, 128, 96, 128], // 4 側面朝右 1
			[96, 128, 96, 128], // 5 側面朝右 2
			[192, 128, 96, 128], // 6 側面朝右 3
			[288, 128, 96, 128], // 7 側面朝右 4
			[0, 256, 96, 128], // 8 正面 1
			[96, 256, 96, 128], // 9 正面 2
			[192, 256, 96, 128], // 10 正面 3
			[288, 256, 96, 128], // 11 正面 4
			[0, 384, 96, 128], // 12 側面朝左 1
			[96, 384, 96, 128], // 13 側面朝左 2
			[192, 384, 96, 128], // 14 側面朝左 3
			[288, 384, 96, 128] // 15 側面朝左 4
		],
		"animations": {
			"npc02_walk_back": {"frames": [0, 1, 2, 3]},
			"npc02_walk_right": {"frames": [4, 5, 6, 7]},
			"npc02_walk_front": {"frames": [8, 9, 10, 11]},
			"npc02_walk_left": {"frames": [12, 13, 14, 15]}
		}
	},
	{
		// NPC03 行走圖集：assets/art/npc/npc03_walk.png，384×512、RGBA、透明底
		// 4 欄 × 4 列共 16 格，單格 96×128；列序＝背面 / 側面朝右 / 正面 / 側面朝左，每列四幀；腳底對齊格內 y=123
		"images": ["npc/npc03_walk"],
		"frames": [
			[0, 0, 96, 128], // 0 背面 1
			[96, 0, 96, 128], // 1 背面 2
			[192, 0, 96, 128], // 2 背面 3
			[288, 0, 96, 128], // 3 背面 4
			[0, 128, 96, 128], // 4 側面朝右 1
			[96, 128, 96, 128], // 5 側面朝右 2
			[192, 128, 96, 128], // 6 側面朝右 3
			[288, 128, 96, 128], // 7 側面朝右 4
			[0, 256, 96, 128], // 8 正面 1
			[96, 256, 96, 128], // 9 正面 2
			[192, 256, 96, 128], // 10 正面 3
			[288, 256, 96, 128], // 11 正面 4
			[0, 384, 96, 128], // 12 側面朝左 1
			[96, 384, 96, 128], // 13 側面朝左 2
			[192, 384, 96, 128], // 14 側面朝左 3
			[288, 384, 96, 128] // 15 側面朝左 4
		],
		"animations": {
			"npc03_walk_back": {"frames": [0, 1, 2, 3]},
			"npc03_walk_right": {"frames": [4, 5, 6, 7]},
			"npc03_walk_front": {"frames": [8, 9, 10, 11]},
			"npc03_walk_left": {"frames": [12, 13, 14, 15]}
		}
	},
	{
		// NPC04 行走圖集：assets/art/npc/npc04_walk.png，384×512、RGBA、透明底
		// 4 欄 × 4 列共 16 格，單格 96×128；列序＝背面 / 側面朝右 / 正面 / 側面朝左，每列四幀；腳底對齊格內 y=123
		"images": ["npc/npc04_walk"],
		"frames": [
			[0, 0, 96, 128], // 0 背面 1
			[96, 0, 96, 128], // 1 背面 2
			[192, 0, 96, 128], // 2 背面 3
			[288, 0, 96, 128], // 3 背面 4
			[0, 128, 96, 128], // 4 側面朝右 1
			[96, 128, 96, 128], // 5 側面朝右 2
			[192, 128, 96, 128], // 6 側面朝右 3
			[288, 128, 96, 128], // 7 側面朝右 4
			[0, 256, 96, 128], // 8 正面 1
			[96, 256, 96, 128], // 9 正面 2
			[192, 256, 96, 128], // 10 正面 3
			[288, 256, 96, 128], // 11 正面 4
			[0, 384, 96, 128], // 12 側面朝左 1
			[96, 384, 96, 128], // 13 側面朝左 2
			[192, 384, 96, 128], // 14 側面朝左 3
			[288, 384, 96, 128] // 15 側面朝左 4
		],
		"animations": {
			"npc04_walk_back": {"frames": [0, 1, 2, 3]},
			"npc04_walk_right": {"frames": [4, 5, 6, 7]},
			"npc04_walk_front": {"frames": [8, 9, 10, 11]},
			"npc04_walk_left": {"frames": [12, 13, 14, 15]}
		}
	},
	{
		// NPC05 行走圖集：assets/art/npc/npc05_walk.png，384×512、RGBA、透明底
		// 4 欄 × 4 列共 16 格，單格 96×128；列序＝背面 / 側面朝右 / 正面 / 側面朝左，每列四幀
		"images": ["npc/npc05_walk"],
		"frames": [
			[0, 0, 96, 128], // 0 背面 1
			[96, 0, 96, 128], // 1 背面 2
			[192, 0, 96, 128], // 2 背面 3
			[288, 0, 96, 128], // 3 背面 4
			[0, 128, 96, 128], // 4 側面朝右 1
			[96, 128, 96, 128], // 5 側面朝右 2
			[192, 128, 96, 128], // 6 側面朝右 3
			[288, 128, 96, 128], // 7 側面朝右 4
			[0, 256, 96, 128], // 8 正面 1
			[96, 256, 96, 128], // 9 正面 2
			[192, 256, 96, 128], // 10 正面 3
			[288, 256, 96, 128], // 11 正面 4
			[0, 384, 96, 128], // 12 側面朝左 1
			[96, 384, 96, 128], // 13 側面朝左 2
			[192, 384, 96, 128], // 14 側面朝左 3
			[288, 384, 96, 128] // 15 側面朝左 4
		],
		"animations": {
			"npc05_walk_back": {"frames": [0, 1, 2, 3]},
			"npc05_walk_right": {"frames": [4, 5, 6, 7]},
			"npc05_walk_front": {"frames": [8, 9, 10, 11]},
			"npc05_walk_left": {"frames": [12, 13, 14, 15]}
		}
	},
	{
		// NPC06 行走圖集：assets/art/npc/npc06_walk.png，384×512、RGBA、透明底
		// 4 欄 × 4 列共 16 格，單格 96×128；列序＝背面 / 側面朝右 / 正面 / 側面朝左，每列四幀；腳底對齊格內 y=123
		"images": ["npc/npc06_walk"],
		"frames": [
			[0, 0, 96, 128], // 0 背面 1
			[96, 0, 96, 128], // 1 背面 2
			[192, 0, 96, 128], // 2 背面 3
			[288, 0, 96, 128], // 3 背面 4
			[0, 128, 96, 128], // 4 側面朝右 1
			[96, 128, 96, 128], // 5 側面朝右 2
			[192, 128, 96, 128], // 6 側面朝右 3
			[288, 128, 96, 128], // 7 側面朝右 4
			[0, 256, 96, 128], // 8 正面 1
			[96, 256, 96, 128], // 9 正面 2
			[192, 256, 96, 128], // 10 正面 3
			[288, 256, 96, 128], // 11 正面 4
			[0, 384, 96, 128], // 12 側面朝左 1
			[96, 384, 96, 128], // 13 側面朝左 2
			[192, 384, 96, 128], // 14 側面朝左 3
			[288, 384, 96, 128] // 15 側面朝左 4
		],
		"animations": {
			"npc06_walk_back": {"frames": [0, 1, 2, 3]},
			"npc06_walk_right": {"frames": [4, 5, 6, 7]},
			"npc06_walk_front": {"frames": [8, 9, 10, 11]},
			"npc06_walk_left": {"frames": [12, 13, 14, 15]}
		}
	},
	{
		// 排行榜前三名皇冠：assets/art/crown.png，64×192、1 欄 × 3 列，每格 64×64
		// 格序＝金（1）／銀（2）／青銅鑽（3），由上往下垂直排列
		"images": ["crown"],
		"frames": [
			[0, 0, 64, 64],  // 0 金皇冠（第1名）
			[0, 64, 64, 64], // 1 銀皇冠（第2名）
			[0, 128, 64, 64], // 2 青銅鑽（第3名）
			
			[0, 192, 32, 32], // github
			[32, 192, 32, 32], // vercel
			[0, 224, 32, 32], // LINK
			[32, 224, 32, 32] // supabase
		],
		"animations": {
			"crown_1": [0],
			"crown_2": [1],
			"crown_3": [2],
			
			"github_1": [3],
			"vercel_1": [4],
			"link_1": [5],
			"supabase_1": [6]
		}
	}
];