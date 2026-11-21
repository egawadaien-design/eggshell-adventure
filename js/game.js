/**
 * 蛋壳大冒險 - 遊戲主邏輯（Preload / Play / Map 各狀態）
 * @author DaiEn
 * @Date 2026-11-21
 * @Correction 105
 */
function init() {

	// MAIN 主選單背景：進入 MAIN 畫面之前，隨機決定這一輪顯示第一組或第二組
	// 一次頁面生命週期只選一次；選完把舊的三個 MAIN_MENU_* 常數補上對應值，
	// MainMenuState 的版面與影片接力邏輯沿用原本讀法，不用改。
	var menu_groups = [
		{
			video_s: Images.MAIN_MENU_VIDEO_S1,
			video_e: Images.MAIN_MENU_VIDEO_E1,
			back: Images.MAIN_MENU_BACK1
		},
		{
			video_s: Images.MAIN_MENU_VIDEO_S2,
			video_e: Images.MAIN_MENU_VIDEO_E2,
			back: Images.MAIN_MENU_BACK2
		},
		{
			video_s: Images.MAIN_MENU_VIDEO_S3,
			video_e: Images.MAIN_MENU_VIDEO_E3,
			back: Images.MAIN_MENU_BACK3
		},
		{
			video_s: Images.MAIN_MENU_VIDEO_S4,
			video_e: Images.MAIN_MENU_VIDEO_E4,
			back: Images.MAIN_MENU_BACK4
		}
	];
	var menu_pick = menu_groups[Math.floor(Math.random() * menu_groups.length)];
	// 主片路徑為空（null / 空字串）時保留 null：影片層會跳過開場，直接循環播放 E 段
	Images.MAIN_MENU_VIDEO_S = menu_pick.video_s || null;
	Images.MAIN_MENU_VIDEO_E = menu_pick.video_e || null;
	Images.MAIN_MENU_BACK = menu_pick.back;

	var localizable = [
		Images.CAPTION_LEVEL_COMPLETED,
		Images.CAPTION_LEVEL_FAILED,
		Images.CAPTION_PAUSE,
		Images.END_LEVEL_NO_POSSIBLE_MOVES,
		Images.END_LEVEL_TIME_IS_UP,
		Images.END_LEVEL_WIN,
		Images.CAPTION_SCORE,
		Images.TOTAL_SCORE,
		Images.CAPTION_MOVES,
		Images.CAPTION_LEVEL
	];

	var jpg = [
		"map/map_1",//（增加地图需要修改）
		"map/map_2",
		"map/map_3",
		"map/map_4",
		"map/map_5",
		Images.MAIN_MENU_BACK
	];

	var art = [
		Images.FILL_BOTTOM, // fill_bottom.png，實際為 png，放本清單會補 .png 副檔名請求
		Images.TRANSITION_HOLE,
		Images.WINDOW,
		Images.FOG_ANI, // 霧氣動畫圖（選關頁天氣層用；1024×768，可水平平鋪）
		Images.LOGO, // 贊助商／品牌槽位預設靜態圖 logo.png（180×110）
	];
	// CHECK_ON / CHECK_OFF / SLIDER / SLIDER_BTN 屬於 all 圖集第 31~34 幀，
	// 隨 athlases 的語系拆檔（all.cn / all.tw / all.en / all.ja.png）一併載入，這裡不另列獨立 png。
	// 注意：本清單組 manifest 時一律補 .png 副檔名，jpg 檔（如 map/map_1）必須放上面的 jpg 清單

	// 廣告圖組不在此 athlases 註冊：圖組由 ads.js 的 AdPlayer 依 frames 直接組 SpriteSheet，
	// 原始 png 在下方 manifest 區段依 Ads.list 預載。

	// 加载图像
	for (var i = 0; i < athlases.length; i++) {
		// 防御：圖集若有組沒寫 images，跳過而不是把 undefined 塞進清單
		var atlas_images = athlases[i] && athlases[i]["images"];
		if (!atlas_images || !atlas_images[0]) {
			continue;
		}
		// all 圖集依目前語系拆檔（all.cn / all.tw / all.en / all.ja.png），其餘圖集沿用原名
		art.push(DNStringManager.getInstance().resolveAtlasImage(atlas_images[0]));
	}

	for (var i = 0; i < art.length; i++) {
		// 防御：常數被刪掉但清單忘了刪時會是 undefined，這裡擋掉，避免去請求 assets/art/undefined.png
		if (!art[i]) {
			console.warn("art(PNG) 清單第 " + i + " 項沒有對應的圖檔名，已跳過");
			continue;
		}
		manifest.push({
			src: "assets/art/" + art[i] + ".png",
			id: art[i]
		});
	}

	// 廣告圖組：AdCarousel／AdPlayer 直接用 Ads.list 的 frames 組 SpriteSheet，
	// 這裡只把原始 png 當一般圖片預載進 manifest（id = ad.image），供 getResult 取值；去重避免重複下載。
	if (typeof Ads !== "undefined" && Ads.list) {
		var adSeen = {};
		for (var adIdx = 0; adIdx < Ads.list.length; adIdx++) {
			var adImg = Ads.list[adIdx] && Ads.list[adIdx].image;
			if (adImg && !adSeen[adImg]) {
				adSeen[adImg] = true;
				manifest.push({
					src: "assets/art/" + adImg + ".png",
					id: adImg
				});
			}
		}
	}

	for (var i = 0; i < jpg.length; i++) {
		// 防御：同上，jpg 清單也擋一次
		if (!jpg[i]) {
			console.warn("art(JPG) 清單第 " + i + " 項沒有對應的圖檔名，已跳過");
			continue;
		}
		manifest.push({
			src: "assets/art/" + jpg[i] + ".jpg",
			id: jpg[i]
		});
	}

	for (var i = 0; i < 50; i++) {// 背景
		manifest.push({
			src: "assets/art/back/back_" + (i+1) + ".jpg",
			id: "back_" + (i+1)
		});
	}

	var sound_manifest = [];// 音效
	createjs.Sound.alternateExtensions = ["m4a"];
	for (var i = 0; i < Sounds.ALL.length; i++) {
		sound_manifest.push({
			src: Sounds.ALL[i] + ".ogg",
			id: Sounds.ALL[i]
		});
	}
	// 加载maps.js
	Constants.g_isPC = !Utils.IsMobileBrowser();
	new DNStateManager(manifest, sound_manifest, athlases, localizable);
};

// 文字指定长度换行
function formatText(text, maxLength) {
	if (text.length <= maxLength) return text;

	let result = text.substring(0, maxLength);
	let lastSpaceIndex = result.lastIndexOf(" ");
	if (lastSpaceIndex === -1) {
		return result + "\n";
	} else {
		return result.substring(0, lastSpaceIndex) + "\n" + formatText(text.substring(lastSpaceIndex + 1), maxLength);
	}
}

// 定义一个名为 __extends 的函数，用于实现继承。如果当前上下文中已经存在 __extends 函数，则使用现有的；否则，定义一个新的。
var __extends = this.__extends || function(d, b) {
	for (var p in b) { // 遍历父类 b 的所有静态属性（即直接定义在 b 上的属性，不包括其原型链上的属性）
		// 使用 hasOwnProperty 方法检查属性 p 是否直接属于 b，而不是继承自其原型链
		if (b.hasOwnProperty(p)) {
			d[p] = b[p]; // 如果是 b 的自有属性，则将其复制到子类 d 上，实现静态属性的继承
		}
	}
	// 定义一个临时构造函数 __，它的目的是在创建新实例时设置正确的构造函数属性
	function __() {
		this.constructor = d; // 将这个新实例的 constructor 属性设置为子类 d，确保通过子类创建的实例能够识别自己的构造函数
	}
	// 将临时构造函数的原型设置为父类 b 的原型，这样创建的子类实例就能访问到父类原型上的方法和属性
	__.prototype = b.prototype;
	// 将子类 d 的原型设置为一个新创建的临时构造函数 __ 的实例，这样 d 的实例就会继承 b 的原型链上的所有方法和属性
	// 同时，由于之前设置了 this.constructor = d，所以 d 的实例仍然知道自己的构造函数是 d 而不是 b
	d.prototype = new __();
};

// 游戏状态
var DNGameState = (function(_super) {
	// 加载canvas.js
	// 使用__extends方法继承父类，DNGameState是子类，_super代表它的父类
	__extends(DNGameState, _super);
	// 定义DNGameState构造函数
	function DNGameState() {
		_super.call(this); // 调用父类的构造函数进行初始化
		this.liveTime = 0.0; // 游戏已运行时间 
		this.gameObjects = new Array(); // 存储游戏对象的数组
		this.gui = new Array(); // 存储GUI元素的数组
		this.newGameObjects = new Array(); // 存储新生成的游戏对象的数组
		this.initiliazed = false; // 是否已初始化的标志
		this.consoleH = 200; // 控制台的高度（用于文本输出）
		this.haveFill = false; // 一个填充状态的标志
	}
	// 在DNGameState的原型上定义一个getShader方法，返回shaderShape属性
	DNGameState.prototype.getShader = function() {
		return this.shaderShape;
	};
	// 在DNGameState的原型上定义一个addShader方法，用于添加一个着色器效果
	DNGameState.prototype.addShader = function(color) {
		// 创建一个新的Shape对象，这将作为我们的着色器效果
		this.shaderShape = new createjs.Shape();
		this.shaderShape.graphics.beginFill("#000000"); // 开始填充黑色
		this.shaderShape.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH, Constants
		.ASSETS_HEIGHT); // 绘制一个矩形，覆盖整个游戏区域（使用Constants中定义的宽度和高度）
		this.shaderShape.graphics.endFill(); // 结束填充
		this.addChild(this.shaderShape); // 将着色器效果添加到游戏状态中
		this.shaderShape.alpha = 0; // 设置着色器效果的初始透明度为0（完全透明）
		// 使用Tween动画库在300毫秒后开始将着色器效果的透明度改变到0.75，并在800毫秒内完成这个过渡，使用线性缓动函数
		createjs.Tween.get(this.shaderShape).wait(300).to({
			alpha: 0.75
		}, 800, createjs.Ease.linear);
	};

	// 在DNGameState的原型上定义一个isInitiliazed方法，用于检查游戏状态是否已初始化
	DNGameState.prototype.isInitiliazed = function() {
		return this.initiliazed; // 返回初始化标志的值（true或false）
	};
	// 当鼠标按下时触发的事件
	DNGameState.prototype.onMouseDown = function(x, y) {
		DNGUIObject.wasHandlerThisFrame = false; // 标记DNGUIObject的当前帧是否已处理，初始化为false
		// 遍历GUI对象数组，对每个GUI对象调用其onMouseDown方法
		for (var i = 0; i < this.gui.length; i++) {
			this.gui[i].onMouseDown(x, y);
		}
	};
	// 当鼠标移动时触发的事件
	DNGameState.prototype.onMouseMove = function(x, y) {
		DNGUIObject.wasHandlerThisFrame = false; // 标记DNGUIObject的当前帧是否已处理，初始化为false
		// 遍历GUI对象数组，对每个GUI对象调用其onMouseMove方法
		for (var i = 0; i < this.gui.length; i++) {
			this.gui[i].onMouseMove(x, y);
		}
	};
	// 当鼠标松开时触发的事件
	DNGameState.prototype.onMouseUp = function(x, y) {
		DNGUIObject.wasHandlerThisFrame = false; // 标记DNGUIObject的当前帧是否已处理，初始化为false
		// 遍历GUI对象数组，对每个GUI对象调用其onMouseUp方法
		for (var i = 0; i < this.gui.length; i++) {
			this.gui[i].onMouseUp(x, y);
		}
	};
	// 用于添加GUI对象的函数
	DNGameState.prototype.addGuiObject = function(gui_object) {
		this.gui.push(gui_object); // 将传入的GUI对象添加到GUI对象数组中
		this.addGameObject(gui_object); // 将传入的GUI对象添加到游戏对象数组中（尽管此段代码中未显示游戏对象数组的定义）
	};
	// 游戏状态更新函数
	DNGameState.prototype.update = function(dt) {
		this.liveTime += dt; // 更新当前游戏状态的存活时间
		// 初始化新游戏对象数组
		this.newGameObjects = new Array();
		// 遍历游戏对象数组
		for (var i = 0; i < this.gameObjects.length; i++) {
			var obj = this.gameObjects[i]; // 获取当前游戏对象
			// 更新当前游戏对象的状态或属性
			obj.update(dt);
			// 如果当前游戏对象已死亡，则调用其onDead方法
			if (obj.isDead()) {
				obj.onDead();
			} else {
				this.newGameObjects.push(obj); // 否则，将该游戏对象添加到新游戏对象数组中
			}
		}
		// 将新游戏对象数组赋值给游戏对象数组，完成更新
		this.gameObjects = this.newGameObjects;
	};
	// 强制更新游戏状态函数
	DNGameState.prototype.forceUpdate = function(dt) {
		for (var i = 0; i < this.gameObjects.length; i++) { // 强制更新所有游戏对象的状态或属性
			this.gameObjects[i].forceUpdate(dt);
		}
	};
	// 添加游戏对象到游戏状态中的函数
	DNGameState.prototype.addGameObject = function(obj) {
		this.gameObjects.push(obj); // 将传入的obj对象添加到当前游戏状态的gameObjects数组中
	};
	// 在指定层级添加游戏对象的函数
	DNGameState.prototype.addGameObjectAt = function(obj, layer) {
		this.gameObjects.push(obj); // 将传入的obj对象添加到当前游戏状态的gameObjects数组中
		// 如果传入的layer存在，则将obj添加为layer的子对象
		if (layer) {
			layer.addChild(obj);
		}
	};
	// 在指定位置和层级添加游戏对象的函数
	DNGameState.prototype.addGameObjectAtPos = function(obj, layer, x, y) {
		this.gameObjects.push(obj); // 将传入的obj对象添加到当前游戏状态的gameObjects数组中
		// 如果传入的layer存在，则将obj添加为layer的子对象，并设置其位置为(x, y)
		if (layer) {
			layer.addChild(obj);
			obj.x = x; // 设置obj的x坐标为x
			obj.y = y; // 设置obj的y坐标为y
		}
	};
	// 清理当前游戏状态的函数，目前为空函数，需要开发者根据实际需求进行实现
	DNGameState.prototype.cleanup = function() {};
	// 恢复当前游戏状态的函数，目前为空函数，需要开发者根据实际需求进行实现
	DNGameState.prototype.resume = function() {};
	// 初始化当前游戏状态的函数，将initiliazed属性设置为true，表示已初始化
	DNGameState.prototype.init = function() {
		this.initiliazed = true;
	};
	// 根据需要居中对齐函数 
	DNGameState.prototype.alignByCenter = function(need_fill) {
		// 如果当前设备不是PC
		/*if (!Constants.g_isPC) {
			// 将游戏对象的位置y设置为屏幕高度的一半减去游戏对象的高度，使游戏对象在屏幕中央居中
			this.y = (Constants.SCREEN_HEIGHT - Constants.ASSETS_HEIGHT) / 2;
		} else {
			// 如果当前设备是PC，则不执行任何操作
			return;
		}*/
		// 将游戏对象的位置y设置为屏幕高度的一半减去游戏对象的高度，使游戏对象在屏幕中央居中
		this.y = (Constants.SCREEN_HEIGHT - Constants.ASSETS_HEIGHT) / 2;
		// 如果需要填充（填充游戏画面外的图像）
		//if (need_fill) {
			// 如果游戏对象的高度小于屏幕高度且尚未填充过
			if (Constants.ASSETS_HEIGHT < Constants.SCREEN_HEIGHT && !this.haveFill) {
				// 设置haveFill为true，表示已经填充过
				this.haveFill = true;
				// 从图像管理器中获取填充图像的底部并添加到游戏对象中
				var fill_down = DNAssetsManager.g_instance.getImage(Images.FILL_BOTTOM);
				this.addChild(fill_down);
				// 再次从图像管理器中获取填充图像的底部，但这次是将其y轴翻转后添加到游戏对象中
				var fill_up = DNAssetsManager.g_instance.getImage(Images.FILL_BOTTOM);
				this.addChild(fill_up);
				fill_up.scaleY = -1;
				// 定义填充图像的高度为206像素
				var fill_h = 206;
				// 计算差异值，即屏幕高度与游戏对象高度的一半差值
				var diff = (Constants.SCREEN_HEIGHT - Constants.ASSETS_HEIGHT) / 2;
				// 如果差异值大于填充图像的高度的一半，则进行以下操作
				if (diff > fill_h) {
					// 根据差异值调整填充图像的y轴缩放比例，使其适应屏幕大小
					fill_down.scaleY = (diff / fill_h);
					fill_up.scaleY = -(diff / fill_h);
					// 设置填充图像的y位置为游戏对象的高度，使其与游戏对象底部对齐
					fill_down.y = Constants.ASSETS_HEIGHT;
				} else {
					// 如果差异值小于或等于填充图像的高度的一半，则将填充图像的y位置
					// 设置为游戏对象的高度，使其与游戏对象底部对齐，但不进行缩放。
					fill_down.y = Constants.ASSETS_HEIGHT;
				}
			}
		//}
	};
	// 加载布局函数
	DNGameState.prototype.loadLayout = function(layout, layer) {
		// 遍历布局数组
		for (var i = 0; i < layout.length; i++) {
			// 获取当前布局元素
			var element = layout[i];
			// 加载GUI对象，并返回该对象
			var gui_object = this.loadGUIObject(element, layer);
			// 如果当前元素有子元素
			if (element["children"]) {
				// 对子元素进行递归加载布局操作，使用返回的gui_object作为父级对象
				this.loadLayout(element["children"], gui_object);
			}
		}
	};
	// 加载GUI对象函数
	DNGameState.prototype.loadGUIObject = function(element, layer) {
		var x = element["x"]; // 读取元素的x坐标
		var y = element["y"]; // 读取元素的y坐标
		// 读取元素的旋转角度，默认为0
		var rotation = element["rotation"] || 0;
		// 读取元素的名称
		var name = element["name"];
		// 读取元素的图片信息
		var picture = element["picture"];
		// 初始化gui_object变量，用于存储创建的GUI对象
		var gui_object;
		// 根据元素类型创建相应的GUI对象
		switch (element["type"]) {
			case Layouts.TYPE_LOGO_PLACEHOLDER: // 如果是LOGO占位符类型
				// 创建一个新的DNLogoPlaceholder对象，并设置最大宽度和高度
				gui_object = new DNLogoPlaceholder(element["max_width"] || 200, element["max_height"] ||
					100);
				break;
			case Layouts.TYPE_SKEW: // 如果是倾斜类型
				// 创建一个新的Skewer对象，并传入图片信息
				gui_object = new Skewer(picture);
				break;
			case Layouts.TYPE_BUTTON: // 如果是按钮类型
				// 创建一个新的DNButton对象，并传入图片信息
				gui_object = new DNButton(picture);
				break;
			case Layouts.TYPE_STATIC_PICTURE: // 如果是静态图片类型
				// 创建一个新的DNStaticPicture对象，并传入图片信息
				gui_object = new DNStaticPicture(picture);
				break;
			case Layouts.TYPE_FIT_PICTURE: // 等比縮放鋪滿的背景圖
				// 沒寫 fit_width / fit_height 時，預設鋪滿整個 700×800 舞台；
				// fit_align / fit_offset_x / fit_offset_y 沒寫時，用 DNFitPicture 內建的預設值
				gui_object = new DNFitPicture(picture, element["fit_width"] || Constants.ASSETS_WIDTH,
					element["fit_height"] || Constants.ASSETS_HEIGHT, element["fit_align"],
					element["fit_offset_x"], element["fit_offset_y"]);
				break;
			case Layouts.TYPE_FIT_VIDEO: // 等比鋪滿的影片背景
				// video 欄位是主片路徑（相對 static），例如 "assets/art/start.mp4"
				// loop_video：循環片段路徑（選用），主片播完後交棒給它原生 loop；長度直接讀檔案
				// loop_tail_ms：沒有循環片段時，尾段要重播幾毫秒，0 = 播完停在最後一格
				// 對位參數跟圖片背景一模一樣，沒寫時走同一組內建預設
				gui_object = new DNVideoPicture(element["video"], element["fit_width"] || Constants.ASSETS_WIDTH,
					element["fit_height"] || Constants.ASSETS_HEIGHT, element["fit_align"],
					element["fit_offset_x"], element["fit_offset_y"], element["loop_tail_ms"],
					element["loop_video"]);
				break;
			case Layouts.TYPE_PLACEHOLDER: // 如果是占位符类型
				// 创建一个新的DNPlaceholder对象
				gui_object = new DNPlaceholder();
				break;
			case Layouts.TYPE_JELLY_BUTTON: // 如果是果冻按钮类型
				// 创建一个新的DNJellyButton对象，并传入图片信息
				gui_object = new DNJellyButton(picture);
				break;
			case Layouts.TYPE_TEXT_FIELD: // 如果是文本字段类型
				// 创建一个新的DNTextField对象，并传入文本、字体和字符间距信息
				gui_object = new DNTextField(element["text"], {
					name: element["font"],
					letterDist: element["letter_dist"]
				});
				break;
			case Layouts.TYPE_FLAT_BUTTON: // 如果是扁平按钮类型
				// 创建一个新的DNFlatButton对象，并传入图片信息
				gui_object = new DNFlatButton(picture);
				break;
			case Layouts.TYPE_PROGRESS_BAR: // 如果是进度条类型
				// 创建一个新的DNProgressBar对象，并传入图片信息（此处代码可能有问题，因为通常进度条会有其他参数） 
				gui_object = new DNProgressBar(null, picture); // 可能需要修复此处代码以正确初始化进度条对象
				break;
		}
		// 如果成功创建了GUI对象，则进行以下设置和添加操作
		if (gui_object) {
			// 设置GUI对象的名称、坐标和旋转角度属性
			gui_object.name = name;
			gui_object.x = x;
			gui_object.y = y;
			gui_object.rotation = rotation;
			// 将GUI对象添加到当前游戏状态的GUI对象列表中（假设存在addGuiObject方法）
			this.addGuiObject(gui_object);
			// 将GUI对象添加到指定的layer中，作为其子对象进行管理和渲染
			layer.addChild(gui_object);
			// 设置GUI对象的缩放比例（如果元素定义了scale属性），默认为1（不缩放）
			gui_object.scaleX = gui_object.scaleY = (element["scale"] || 1);
		} else { // 如果未成功创建GUI对象（例如由于未知类型），则在控制台中打印错误信息。
			// 打印出错误信息，包含无法识别的元素类型。这有助于调试和定位问题。
			console.log("解析布局错误。找不到类型：", element["type"]);
		}
		// 返回创建的GUI
		return gui_object;
	};
	// 定义DNGameState对象的一个方法，用于查找具有指定名称的GUI对象
	DNGameState.prototype.findGUIObject = function(name) {
		// 遍历DNGameState对象中的gui数组
		for (var i = 0; i < this.gui.length; i++) {
			// 如果当前GUI对象的名称与指定的名称相同
			if (this.gui[i].name == name) {
				// 返回找到的GUI对象
				return this.gui[i];
			}
		}
		// 如果未找到匹配的GUI对象，则返回null
		return null;
	};
	// 当游戏暂停时调用的方法，当前版本为空，可以后续添加暂停逻辑
	DNGameState.prototype.onPause = function() {};
	// 当游戏恢复时调用的方法，当前版本为空，可以后续添加恢复逻辑
	DNGameState.prototype.onResume = function() {};
	// 当游戏重新开始时调用的方法，当前版本为空，可以后续添加重新开始逻辑
	DNGameState.prototype.onRestart = function() {};
	return DNGameState;
})(createjs.Container);

// 使用自调用匿名函数和继承机制定义一个DNGameObject构造函数，它继承自createjs.Container
var DNGameObject = (function(_super) {
	// __extends是一个帮助函数，通常在TypeScript编译为JavaScript时出现，用于实现继承  
	// 在这里，它确保DNGameObject从_super（即createjs.Container）继承所有属性和方法
	__extends(DNGameObject, _super);
	// DNGameObject构造函数定义
	function DNGameObject() {
		// 调用父类构造函数，进行初始化
		_super.call(this);
		// 初始化该游戏对象的生存时间（以秒或毫秒为单位，具体取决于dt的传递方式）
		this.liveTime = 0;
		// 初始化强制生存时间，可能用于某些特殊效果或机制
		this.forceLiveTime = 0;
		// 初始化一个标志，表示该游戏对象是否被“杀死”
		this.killed = false;
	}
	// 定义更新方法，每次调用此方法时，对象的生存时间都会增加dt（通常表示自上一帧以来的时间差）
	DNGameObject.prototype.update = function(dt) {
		this.liveTime += dt;
	};
	// 定义强制更新方法，与update类似，但影响的是forceLiveTime而不是liveTime
	DNGameObject.prototype.forceUpdate = function(dt) {
		this.forceLiveTime += dt;
	};
	// 定义“杀死”对象的方法，将killed标志设置为true
	DNGameObject.prototype.kill = function() {
		this.killed = true;
	};
	// 定义检查对象是否“死亡”的方法，返回killed标志的状态
	DNGameObject.prototype.isDead = function() {
		return this.killed;
	};
	// 定义当对象“死亡”时调用的方法，用于清理资源等操作  
	// 如果该对象有一个父容器，它会从父容器中移除自己
	DNGameObject.prototype.onDead = function() {
		/// 在这里进行清理工作
		if (this.parent) {
			this.parent.removeChild(this);
		}
	};
	// 返回DNGameObject构造函数，以便在外部使用它创建新的DNGameObject实例
	return DNGameObject;
})(createjs.Container); // 将createjs.Container作为_super参数传递给自调用匿名函数，实现继承

// 奖励
var Bonus = (function(_super) {
	// 使用__extends函数来继承另一个类的属性和方法。这里，Bonus类继承自_super。
	__extends(Bonus, _super);
	// 定义Bonus类。它接受三个参数：name, callback, immortal。
	function Bonus(name, callback, immortal) {
		// 调用父类的构造函数。
		_super.call(this);
		// 创建一个文本字段，用于显示剩余时间。初始值为"00d00"
		this.timeLeftLabel = new DNTextField("00d00", DNFontDef.GUI_FONT);
		// 设置剩余时间为4到6之间的随机整数。
		this.timeLeft = Utils.RandomRangeInt(4, 6);
		// 初始化两个布尔变量，用于控制Bonus的表现状态。
		this.hiddingNow = false; // 当前是否隐藏。
		this.activatingNow = false; // 当前是否正在激活
		// 从图片资源管理器中获取一个中心对齐的图片，用于显示闪烁效果。
		this.shining = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.BONUS_SHINING);
		// 设置immortal属性。如果immortal为真，则将剩余时间设置为9。
		this.immortal = immortal;
		if (this.immortal) {
			this.timeLeft = 9;
		}
		// 存储传入的回调函数，用于后续调用。
		this.callback = callback;
		// 将上面创建的闪烁图片添加到Bonus容器中。
		this.addChild(this.shining);
		// 从图片资源管理器中获取一个图片，并将其添加到Bonus容器中。
		this.pic = DNAssetsManager.g_instance.getCenteredImageWithProxy(name);
		this.addChild(this.pic);
		// 将剩余时间标签添加到Bonus容器中，并设置其x坐标为负的宽度的一半，y坐标为40。
		this.addChild(this.timeLeftLabel);
		this.timeLeftLabel.x = -this.timeLeftLabel.getBounds().width / 2;
		this.timeLeftLabel.y = 40;
		// 立即更新Bonus的状态。
		this.update(0);
	}
	// 定义一个名为show的方法，该方法接受两个参数：x_from和x_to。
	Bonus.prototype.show = function(x_from, x_to) {
		//  设置Bonus容器的x坐标和fromX属性。fromX可能是动画的起始位置。
		this.x = this.fromX = x_from;
		// 使用createjs库的Tween对象来创建一个动画，使Bonus容器在400毫秒内从x_from移动到x_to位置。
		// 结束时使用ease-out缓动效果。
		createjs.Tween.get(this).to({
			x: x_to
		}, 400, createjs.Ease.backOut);
		// 在动画结束后等待100毫秒，然后播放音效。音效管理器是全局的实例，
		// 它播放名为Sounds.SHOW_BONUS的音效，音量为0.7。
		createjs.Tween.get(this).wait(100).call(function() {
			return DNSoundManager.g_instance.play(Sounds.SHOW_BONUS, 0.7);
		});
	};
	// 定义一个名为hide的方法，用于隐藏Bonus效果。
	Bonus.prototype.hide = function() {
		var _this = this; // 创建一个变量来引用当前Bonus对象，以便在回调函数中使用。
		// 使用createjs库的Tween对象来创建一个动画，
		// 使Bonus容器在400毫秒内移动到fromX位置。结束时使用ease-in缓动效果。
		createjs.Tween.get(this).to({
			x: this.fromX
		}, 400, createjs.Ease.backIn).call(function() {
			// 动画结束后，调用kill方法来销毁Bonus容器。
			return _this.kill();
		});
		// 设置hiddingNow属性为true，表示Bonus正在隐藏。
		this.hiddingNow = true;
	};
	// 定义一个名为update的方法，用于更新Bonus效果的状态。它接受一个参数dt，代表时间差。
	Bonus.prototype.update = function(dt) {
		// 调用父类的update方法来更新基础容器。
		_super.prototype.update.call(this, dt);
		// 使闪烁图片的旋转增加一定的角度。这里乘以100可能是为了加快旋转速度。
		this.shining.rotation += dt * 100;
		// 如果Bonus正在隐藏，则直接返回，不再执行后续代码。
		if (this.hiddingNow) {
			return;
		}
		// 更新剩余时间，减去时间差dt。
		this.timeLeft -= dt;
		// 如果剩余时间小于或等于0，则设置剩余时间为0，并根据immortal属性决定是否隐藏Bonus。
		if (this.timeLeft <= 0) {
			this.timeLeft = 0;
			// 如果immortal为假，则调用hide方法来隐藏Bonus。
			if (!this.immortal) {
				this.hide();
			}
		}
		// 更新剩余时间标签的文本，显示剩余时间。这里使用了Utils.IntToTimeString方法将整数时间转换为可读的时间字符串。
		this.timeLeftLabel.setText(Utils.IntToTimeString(Math.floor(this.timeLeft)));
	};
	// 定义一个名为runEffect的方法，用于运行Bonus效果。
	Bonus.prototype.runEffect = function() {
		var _this = this; // 创建一个变量来引用当前Bonus对象，以便在回调函数中使用。
		// 使用createjs库的Tween对象来创建一个动画，使Bonus容器的scaleX和scaleY属性在450毫秒内变为1.5倍，
		// alpha属性变为0（完全透明）。结束时使用ease-circOut缓动效果。
		createjs.Tween.get(this).to({
			scaleX: 1.5,
			scaleY: 1.5,
			alpha: 0
		}, 450, createjs.Ease.circOut).call(function() {
			// 动画结束后，调用kill方法来销毁Bonus容器。
			return _this.kill();
		});
		// 设置activatingNow属性为true，表示Bonus正在激活。
		this.activatingNow = true;
		// 调用callback方法。这个方法需要在调用runEffect方法时传入。
		this.callback();
	};
	// 定义一个名为onDead的方法，用于处理Bonus死亡事件。它继承了父类的onDead方法。
	Bonus.prototype.onDead = function() {
		// 调用父类的onDead方法。
		_super.prototype.onDead.call(this);
		// 调用PlayState实例的bonusDead方法，传入当前Bonus对象作为参数。
		PlayState.g_instance.bonusDead(this);
	};
	// 定义一个名为chechMouseClick的方法，用于检测鼠标点击事件。它接受x和y参数，表示鼠标的坐标。
	Bonus.prototype.chechMouseClick = function(x, y) {
		// 如果Bonus正在激活，则直接返回，不进行后续操作。
		if (this.activatingNow) {
			return;
		}
		// 将Bonus的本地坐标转换为全局坐标。
		var pos = this.localToGlobal(0, 0);
		// 将全局坐标的x和y值除以屏幕缩放比例，以适应不同分辨率的屏幕。
		pos.x /= Constants.SCREEN_SCALE;
		pos.y /= Constants.SCREEN_SCALE;
		// 计算Bonus的有效区域宽度和高度。这里使用了0.65的缩放比例和scaleX、scaleY属性来调整大小。
		var w = this.pic.getBounds().width * 0.65 * this.scaleX;
		var h = this.pic.getBounds().height * 0.65 * this.scaleY;
		// 使用if语句判断鼠标点击位置是否落在Bonus的有效区域内。
		if (pos.x < x + w && pos.x > x - w && pos.y < y + h && pos.y > y - h) {
			// 如果在有效区域内，则运行runEffect方法，启动Bonus效果。
			this.runEffect();
			// 返回true表示检测到鼠标点击事件。
			return true;
		}
		// 如果不在有效区域内，则返回false表示未检测到鼠标点击事件。
		return false;
	};
	return Bonus;
})(DNGameObject);

// 使用立即执行函数表达式 (IIFE) 来定义 DNTimer 类，这样可以在不污染全局命名空间的情况下创建局部变量。
var DNTimer = (function(_super) {
	// 使用 __extends 函数（该函数通常在 ES6 的 extends 关键字中用于实现继承）来继承 _super（即 DNGameObject）的属性和方法。
	__extends(DNTimer, _super);
	// 定义 DNTimer 类的构造函数，它接受两个参数：time 和 count。
	function DNTimer(time, count) {
		// 调用父类（DNGameObject）的构造函数，实现继承。
		_super.call(this);
		// 设置 count 的默认值为 1000000。
		this.count = 1000000;
		// 设置 loop 的默认值为 false，表示不循环。
		this.loop = false;
		// 将传入的 time 值赋给 this.time。
		this.time = time;
		// 将传入的 count 值赋给 this.count。
		this.count = count;
		// 如果 this.count 的值为 0 或未定义，则设置 loop 为 true，表示循环。
		if (!this.count) {
			this.loop = true;
		}
	}
	// DNTimer 类原型上的 update 方法，接受一个参数 dt（可能是时间差）。
	DNTimer.prototype.update = function(dt) {
		// 调用父类的 update 方法。
		_super.prototype.update.call(this, dt);
		// 如果 this.liveTime 大于 this.time，则执行后续的代码块。
		if (this.liveTime > this.time) {
			// 调用 runAction 方法，但由于其是空方法，所以没有实际效果。
			this.runAction;
			// 从 this.liveTime 中减去 this.time 的值。
			this.liveTime -= this.time;
			// 如果 loop 为 false（即不循环），则执行后续的代码块。
			if (!this.loop) {
				// 减少 count 的值。
				this.count--;
				// 如果 count 的值小于或等于 0，则执行后续的代码块。
				if (this.count <= 0) {
					// 调用 kill 方法（可能是销毁对象的方法）。
					this.kill();
				}
			}
		}
	};
	// DNTimer 类原型上的 runAction 方法，目前是空的，没有执行任何操作。可能在后续开发中有用。
	DNTimer.prototype.runAction = function() {};
	// 返回定义的 DNTimer 类。这样外部就可以使用这个类来创建对象了。
	return DNTimer;
	// 使用 DNGameObject 作为 DNTimer 的父类。
	// 这样 DNTimer 就继承了 DNGameObject 的属性和方法。然后立即执行这个函数表达式。
})(DNGameObject);

// 使用立即执行函数表达式 (IIFE) 来定义 DNGUIObject 类，这样可以在不污染全局命名空间的情况下创建局部变量
var DNGUIObject = (function(_super) {
	// 使用 __extends 函数（该函数通常在 ES6 的 extends 关键字中用于实现继承）来继承 _super（即 DNGameObject）的属性和方法。
	__extends(DNGUIObject, _super);
	// 定义 DNGUIObject 类的构造函数，它接受任意数量的参数。
	function DNGUIObject() {
		// 使用 apply 方法调用父类（DNGameObject）的构造函数，
		// 并传入 arguments 对象，这样就可以自动调用父类的所有构造函数。
		_super.apply(this, arguments);
	}
	// DNGUIObject 类原型上的 onMouseDown 方法，接受 x 和 y 两个参数。目前是空的，没有执行任何操作。在后续开发中有用。
	DNGUIObject.prototype.onMouseDown = function(x, y) {};
	// DNGUIObject 类原型上的 onMouseUp 方法，接受 x 和 y 两个参数。目前是空的，没有执行任何操作。在后续开发中有用。
	DNGUIObject.prototype.onMouseUp = function(x, y) {};
	// DNGUIObject 类原型上的 onMouseMove 方法，接受 x 和 y 两个参数。目前是空的，没有执行任何操作。在后续开发中有用。
	DNGUIObject.prototype.onMouseMove = function(x, y) {};
	// DNGUIObject 类原型上的 setHandler 方法，接受一个回调函数作为参数。目前是空的，没有执行任何操作。在后续开发中有用。
	DNGUIObject.prototype.setHandler = function(callback) {};
	// 定义一个静态属性 wasHandlerThisFrame，初始值为 false。这个属性可能用于跟踪是否处理了鼠标事件。
	DNGUIObject.wasHandlerThisFrame = false;
	// 返回定义的 DNGUIObject 类。这样外部就可以使用这个类来创建对象了。
	return DNGUIObject;
	// 使用 DNGameObject 作为 DNGUIObject 的父类。
	// 这样 DNGUIObject 就继承了 DNGameObject 的属性和方法。然后立即执行这个函数表达式。
})(DNGameObject);

// 使用立即执行函数表达式 (IIFE) 来定义 DNFlatButton 类，这样可以在不污染全局命名空间的情况下创建局部变量
// 扁平按钮类型
var DNFlatButton = (function(_super) {
	// 使用 __extends 函数（该函数通常在 ES6 的 extends 关键字中用于实现继承）来继承 _super（即 DNGUIObject）的属性和方法
	__extends(DNFlatButton, _super);
	// 定义 DNFlatButton 类的构造函数，接受两个参数：name 和 callback。
	function DNFlatButton(name, callback) {
		// 调用父类（DNGUIObject）的构造函数。
		_super.call(this);
		// 初始化 this.func 为 null。
		this.func = null;
		// 初始化 this.enabled 为 true，表示按钮是启用的。
		this.enabled = true;
		// 初始化 this.wasHandlerThisFrame 为 false，表示当前帧没有处理过事件。
		this.wasHandlerThisFrame = false;
		// 设置按钮的图片。
		this.setPicture(name);
		// 设置回调函数。
		this.func = callback;
	}
	// DNFlatButton 类原型上的 update 方法，接受一个参数 dt（可能是时间差）。
	DNFlatButton.prototype.update = function(dt) {
		// 调用父类的 update 方法。
		_super.prototype.update.call(this, dt);
		// 重置 this.wasHandlerThisFrame 为 false，表示当前帧没有处理过事件。
		this.wasHandlerThisFrame = false;
	};
	// DNFlatButton 类原型上的 setPicture 方法，接受一个参数 name，用于设置按钮的图片。
	DNFlatButton.prototype.setPicture = function(name) {
		// 检查当前按钮是否有图片，并且图片是否是当前按钮的子节点。
		if (this.picture && this.picture.parent) {
			// 如果满足条件，则从当前按钮中移除图片。
			this.picture.parent.removeChild(this.picture);
		}
		// 从 DNAssetsManager 中获取图片，并设置为当前按钮的子节点。
		this.picture = DNAssetsManager.g_instance.getCenteredImageWithProxy(name);
		this.addChild(this.picture);
	};
	// DNFlatButton 类原型上的 setHandler 方法，接受一个回调函数作为参数，用于设置按钮的事件处理函数。
	DNFlatButton.prototype.setHandler = function(callback) {
		// 设置回调函数。
		this.func = callback;
	};
	// DNFlatButton 类原型上的 onMouseDown 方法，接受 x 和 y 两个参数，表示鼠标按下的位置。
	DNFlatButton.prototype.onMouseDown = function(x, y) {
		// 检查鼠标是否在当前按钮的范围内按下。
		if (this.hitTestSmart(x, y)) {
			// 如果满足条件，则设置 this.liveTime 为 0。是为了重置按钮的状态或计时器。
			this.liveTime = 0;
			// 检查当前帧是否已经处理过事件。如果未处理过，则执行后续代码块。
			if (!DNGUIObject.wasHandlerThisFrame) {
				// 设置 DNGUIObject 的 wasHandlerThisFrame 为 true。是为了防止重复处理事件。
				DNGUIObject.wasHandlerThisFrame = true;
				// 设置当前按钮的 wasHandlerThisFrame 为 true。是为了防止重复处理事件。
				this.wasHandlerThisFrame = true;
				// 调用回调函数。是为了执行某个动作或触发其他事件。
				this.func();
				// 播放点击音效。是为了提供反馈或增强用户体验
				DNSoundManager.g_instance.play(Sounds.CLICK);
			}
		}
	};
	// DNFlatButton 类原型上的 hitTestSmart 方法，接受 x 和 y 两个参数，用于检测鼠标位置是否在当前按钮范围内。
	// 它是一个优化过的 hitTest 方法，考虑了按钮的位置和大小以及其父节点的位置和大小。
	// 它首先检查按钮是否启用，然后检查其父节点和可见性
	DNFlatButton.prototype.hitTestSmart = function(x, y) {
		// 如果按钮未启用，则直接返回。
		if (!this.enabled) {
			return;
		}
		// 如果按钮没有父节点或者不可见，则返回 false。
		if (!this.parent || !this.visible) {
			return false;
		}
		// 获取按钮图片在当前按钮坐标系中的位置。
		var pos = this.picture.localToGlobal(0, 0);
		// 将位置的 x 和 y 值除以屏幕比例，以适应不同分辨率的屏幕。
		pos.x /= Constants.SCREEN_SCALE;
		pos.y /= Constants.SCREEN_SCALE;
		// 计算按钮的宽度和高度，这里使用了 0.6 的缩放系数。
		var w = this.picture.getBounds().width * 0.6 * this.scaleX;
		var h = this.picture.getBounds().height * 0.6 * this.scaleY;
		// 检测鼠标位置是否在按钮范围内。
		return pos.x < x + w && pos.x > x - w && pos.y < y + h && pos.y > y - h;
	};
	// 返回 DNFlatButton 类，结束定义。
	return DNFlatButton;
})(DNGUIObject);

// 按钮类型
var DNButton = (function(_super) {
	__extends(DNButton, _super);

	function DNButton(name, callback) {
		_super.call(this);
		this.selected = false;
		this.func = null;
		this.enabled = true;

		this.picture = DNAssetsManager.g_instance.getCenteredImageWithProxy(name);
		this.addChild(this.picture);

		this.func = callback;

		this.picWidth = this.picture.getBounds().width * 1.15;
		this.picHeight = this.picture.getBounds().height * 1.15;
	}
	DNButton.prototype.getPicture = function() {
		return this.picture;
	};

	DNButton.prototype.setHandler = function(callback) {
		this.func = callback;
	};

	DNButton.prototype.select = function() {
		if (!this.selected) {
			createjs.Tween.removeTweens(this.picture);

			createjs.Tween.get(this.picture).to({
				scaleX: 1.15,
				scaleY: 1.15
			}, 150, createjs.Ease.linear);
			this.selected = true;
		}
	};

	DNButton.prototype.deselect = function() {
		if (this.selected) {
			createjs.Tween.removeTweens(this.picture);

			createjs.Tween.get(this.picture).to({
				scaleX: 1.0,
				scaleY: 1.0
			}, 150, createjs.Ease.linear);
			this.selected = false;
		}
	};

	DNButton.prototype.onMouseDown = function(x, y) {
		if (this.hitTestSmart(x, y)) {
			this.liveTime = 0;

			this.select();
		}
	};

	DNButton.prototype.onMouseUp = function(x, y) {
		if (this.hitTestSmart(x, y) && this.selected) {
			if (!DNGUIObject.wasHandlerThisFrame) {
				DNGUIObject.wasHandlerThisFrame = true;

				this.func();

				//  run action
				DNSoundManager.g_instance.play(Sounds.CLICK);
			}
		}

		this.deselect();
	};

	DNButton.prototype.onMouseMove = function(x, y) {
		if (!this.hitTestSmart(x, y)) {
			this.deselect();
		}
	};

	DNButton.prototype.hitTestSmart = function(x, y) {
		if (!this.enabled) {
			return;
		}

		if (!this.parent || !this.visible) {
			return false;
		}

		var pos = this.picture.localToGlobal(0, 0);

		pos.x /= Constants.SCREEN_SCALE;
		pos.y /= Constants.SCREEN_SCALE;

		var w = this.picture.getBounds().width * 0.6 * this.scaleX;
		var h = this.picture.getBounds().height * 0.6 * this.scaleY;

		return pos.x < x + w && pos.x > x - w && pos.y < y + h && pos.y > y - h;
	};

	DNButton.prototype.setEnabled = function(enabled) {
		this.enabled = enabled;
	};
	return DNButton;
})(DNGUIObject);

// 创建一个文本字段
var DNTextField = (function(_super) {
	// 使用 __extends 方法实现 DNTextField 对 DNGUIObject 的继承 
	__extends(DNTextField, _super);
	// 定义 DNTextField 的构造函数，接受两个参数：text 和 font_def 
	function DNTextField(text, font_def) {
		// 调用父类的构造函数
		_super.call(this);
		// 初始化 textWidth 属性为 0，表示文本的宽度
		this.textWidth = 0;
		// 初始化 fontNamePrefix 属性为空字符串，表示字体名的前缀
		this.fontNamePrefix = "";
		// 初始化 letterDistance 属性为 0，表示字符之间的距离
		this.letterDistance = 0;
		// 如果传入了 font_def 参数
		if (font_def) {
			// 将 font_def 的 name 属性值赋给 fontNamePrefix
			this.fontNamePrefix = font_def.name;
			// 将 font_def 的 letterDist 属性值赋给 letterDistance
			this.letterDistance = font_def.letterDist;
		}
		// 如果传入了 text 参数
		if (text) {
			// 调用 setText 方法，将传入的 text 参数值赋给 text 属性
			this.setText(text);
		}
	}
	// 定义 setText 方法，接受一个参数 text，表示要设置的文本内容
	DNTextField.prototype.setText = function(text) {
		// 如果传入的 text 参数值和当前 text 属性的值相等，则直接返回，不再执行后续操作
		if (this.text == text) {
			return;
		}
		// 将传入的 text 参数值赋给 text 属性
		this.text = text;
		// 调用 removeAllChildren 方法，移除当前对象下的所有子对象
		this.removeAllChildren();
		// 初始化 x_offset 为 0，表示字符的 x 坐标偏移量
		var x_offset = 0;
		// 遍历 text 中的每个字符，从第一个字符开始，直到最后一个字符结束
		for (var i = 0; i < text.length; i++) {
			// 获取当前字符的字符码（ASCII码）
			var char_code = text.charAt(i);
			// 通过 DNAssetsManager 的实例调用 getImage 方法，传入 fontNamePrefix 和当前字符的字符码，获取当前字符的图像对象 ch
			var ch = DNAssetsManager.g_instance.getImage(this.fontNamePrefix + char_code);
			// 将当前字符的图像对象 ch 添加为当前对象的子对象，并显示出来
			this.addChild(ch);
			// 设置当前字符的图像对象的 x 坐标为 x_offset，即每个字符从左到右依次排列，起始位置从 x_offset 开始计算
			ch.x = x_offset;
			// 将当前字符的宽度加到 x_offset 上，为下一个字符留出空间，并更新 x_offset 的值
			x_offset += ch.getBounds().width + this.letterDistance;
		}
		// 将 textWidth 属性设置为 x_offset，即所有字符的宽度之和，表示文本的宽度
		this.textWidth = x_offset;
	};// 设置文本内容的方法结束，内部定义了如何渲染和处理文本内容的方法
	// 定义 getWidth 方法，返回 textWidth 属性的值，即文本的宽度 
	DNTextField.prototype.getWidth = function() {
		return this.textWidth;
	};// getWidth 方法结束，返回文本的宽度值的方法定义完毕。
	// 定义 getText 方法，返回 text 属性的值，即文本内容
	DNTextField.prototype.getText = function() {
		return this.text;
	};// getText 方法结束，返回文本内容的方法定义完毕。
	// 返回 DNTextField 类，以便在其他地方使用
	return DNTextField;// 结束定义 DNTextField 类
})(DNGUIObject);// 使用 DNGUIObject 作为 DNTextField 的父类

// 使用立即执行的函数表达式 (IIFE) 来定义一个闭包，这样可以避免在全局作用域中添加不必要的变量。
// 发光动画使用
var AutoreleaseEffect = (function(_super) {
	__extends(AutoreleaseEffect, _super);
	// 定义 AutoreleaseEffect 构造函数，接受四个参数：name、count、frame_time 和 loop。
	function AutoreleaseEffect(name, count, frame_time, loop) {
		// 调用父类（DNGameObject）的构造函数。
		_super.call(this);
		// 初始化一些属性。
		this.frames = new Array();// 用于存储所有帧的数组。
		this.frame = -1;// 当前显示的帧索引。
		this.loop = false;// 是否循环播放。
		this.paused = false;// 是否暂停。
		// 每帧的显示时间。
		this.frameTime = frame_time;
		// 根据传入的参数 count，循环获取指定数量的图片，并将它们添加到 frames 数组中。
		for (var i = 0; i < count; i++) {
			this.frames.push(DNAssetsManager.g_instance.getCenteredImageWithProxy(name + i));
		}
		// 如果传入的 loop 参数为 true，则设置循环为 true。
		if (loop) {
			this.loop = loop;
		}
		// 调用 update 方法更新对象。这里的参数是 100，但不清楚具体意义。
		this.update(100);
	}
	// 定义 pause 方法，用于暂停效果。将 paused 属性设置为 true。
	AutoreleaseEffect.prototype.pause = function() {
		this.paused = true;
	};
	// 定义 play 方法，用于播放效果。将 paused 属性设置为 false，并重置 liveTime 为 0。
	AutoreleaseEffect.prototype.play = function() {
		this.paused = false;
		this.liveTime = 0;
	};
	// 定义 gotoAndStop 方法，用于跳转到指定帧并停止。首先调用 pause 方法暂停效果，然后移除所有子对象并添加指定帧的图片。
	AutoreleaseEffect.prototype.gotoAndStop = function(frame) {
		this.pause();

		//if frame == old frame
		this.removeAllChildren();
		this.addChild(this.frames[frame]);
	};
	// 定义 totalFrames 方法，返回总帧数。返回 frames 数组的长度。
	AutoreleaseEffect.prototype.totalFrames = function() {
		return this.frames.length;
	};
	// 定义 setLoop 方法，用于设置是否循环播放。接受一个参数 loop，并将其设置为对象的 loop 属性。
	AutoreleaseEffect.prototype.setLoop = function(loop) {
		this.loop = loop;
	};
	// 定义 setFrameTime 方法，用于设置每帧的显示时间。接受一个参数 tm，并将其设置为对象的 frameTime 属性。
	AutoreleaseEffect.prototype.setFrameTime = function(tm) {
		this.frameTime = tm;
	};
	// 定义 update 方法，用于更新效果。如果对象没有被暂停，则调用父类的 update 方法并更新 liveTime。
	// 如果 liveTime 大于 frameTime，则重置 liveTime 为 0，并更新当前帧索引。
	// 如果当前帧索引超出 frames 数组的长度，则根据 loop 属性决定是否从头开始播放或停止播放。
	// 最后，移除所有子对象并添加当前帧的图片。
	AutoreleaseEffect.prototype.update = function(dt) {
		if (this.paused) {
			return;// 如果对象被暂停，则不执行后续操作。
		}
		// 调用父类的 update 方法以执行常规更新操作。
		_super.prototype.update.call(this, dt);
		// 如果 liveTime 大于 frameTime，则需要更新当前帧索引和显示图片。
		if (this.liveTime > this.frameTime) {
			this.liveTime = 0;// this.liveTime 属性被重置为 0

			this.frame++;

			if (this.frame >= this.frames.length) {// 如果当前帧索引大于等于 frames 数组的长度
				this.frame = this.frames.length - 1;// 将当前帧索引设置为 frames 数组的最后一个元素的索引

				if (this.loop) {// 如果设置了循环播放
					this.frame = 0;// 将当前帧索引重置为 0
				} else {
					this.kill();// 停止播放
				}
			}
			// 移除当前对象下的所有子对象。
			this.removeAllChildren();
			// 获取当前帧的图片。
			var pic = this.frames[this.frame];
			// 将当前帧的图片添加为当前对象的子对象，并显示出来。
			this.addChild(pic);
		}
	};
	// 返回 AutoreleaseEffect 类，以便在其他地方使用。
	return AutoreleaseEffect;
})(DNGameObject);// 使用 DNGameObject 作为 AutoreleaseEffect 的父类。

// 创建一个立即执行的函数表达式（IIFE），命名为ChipState。这样做的目的是为了在定义函数的同时，定义它的作用域，  
// 防止在代码的其他部分意外地修改它。
// 方块状态
var ChipState = (function() {
	// 定义一个名为ChipState的构造函数函数。这个函数没有参数。
	function ChipState() {
		// 在这个构造函数中，初始化一个名为stateTime的属性，并赋值为0。这个属性可能用于跟踪某种状态的时间或持续时间。
		this.stateTime = 0;
	}
	// 定义ChipState的原型方法isNormalState。这个方法没有参数，并返回一个布尔值false。
	// 这可能是一个占位方法，根据实际的实现，可能会返回一个更准确的正常状态判断。
	ChipState.prototype.isNormalState = function() {
		return false;
	};
	// 定义ChipState的原型方法update。这个方法接受一个参数dt，表示时间差。
	// 在这个方法中，将stateTime属性增加dt的值，可能是为了更新或累加状态时间。
	ChipState.prototype.update = function(dt) {
		this.stateTime += dt;
	};
	// 定义ChipState的原型方法init。这个方法目前是空的，可能用于初始化对象的某些属性或设置。
	ChipState.prototype.init = function() {};
	// 定义ChipState的原型方法cleanup。这个方法目前也是空的，可能用于清理或重置对象的某些属性或设置。
	ChipState.prototype.cleanup = function() {};
	// 定义ChipState的原型方法setContext。这个方法接受一个参数context，并将其赋值给对象的context属性。
	// 这可能用于设置或更新与对象相关的上下文或环境。
	ChipState.prototype.setContext = function(context) {
		this.context = context;
	};
	// 最后，通过return ChipState语句，将ChipState构造函数作为模块的输出返回，这样其他代码就可以使用它了。
	return ChipState;
})(); // 这里的括号表示立即执行这个IIFE函数。这确保了ChipState模块立即加载并准备使用。

// 方块
var Chip = (function(_super) {
	__extends(Chip, _super);

	function Chip(layer, index_x, index_y) {
		_super.call(this);
		this.inaccesible = false;
		this.eyeOpened = false;
		this.shining = null;

		this.layer = layer;
		this.indexX = index_x;
		this.indexY = index_y;
	}
	Chip.prototype.getLayer = function() {
		return this.layer;
	};

	Chip.prototype.getIndexX = function() {
		return this.indexX;
	};

	Chip.prototype.getIndexY = function() {
		return this.indexY;
	};

	Chip.prototype.setPic = function(name, id) {
		this.removeAllChildren();

		this.baseName = name;
		this.chipID = id;

		this.accesiblePic = DNAssetsManager.g_instance.getCenteredImageWithProxy(name + "/" + id); // 亮方快
		this.accesiblePic.x = 10;
		this.accesiblePic.y = 9;
		this.addChild(this.accesiblePic);

		this.inaccesiblePic = DNAssetsManager.g_instance.getCenteredImageWithProxy(name + "/" + id +
		"_1"); // 暗方块
		this.inaccesiblePic.x = 10;
		this.inaccesiblePic.y = 9;
		this.addChild(this.inaccesiblePic);

		this.recalcAccesibleVisible();
	};

	Chip.prototype.shine = function() {
		this.shining = new DNGameObject();

		this.shining.addChild(DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.SHINING));

		this.shining.alpha = 0;
		createjs.Tween.get(this.shining).to({
			alpha: 1
		}, 400, createjs.Ease.linear);

		this.shining.scaleX = this.shining.scaleY = 4;
		createjs.Tween.get(this.shining).to({
			scaleX: 1,
			scaleY: 1
		}, 600, createjs.Ease.cubicOut);

		DNSoundManager.g_instance.playSinglePerFrame(Sounds.GENERATE_BONUS);

		return this.shining;
	};

	Chip.prototype.isAccesible = function() {
		return !this.inaccesible;
	};

	Chip.prototype.setInaccesible = function() {
		this.inaccesible = true;

		this.recalcAccesibleVisible();
	};

	Chip.prototype.setAccesible = function() {
		this.inaccesible = false;

		this.recalcAccesibleVisible();
	};

	Chip.prototype.setEyeState = function(opened) {
		this.eyeOpened = opened;

		this.recalcAccesibleVisible();
	};

	Chip.prototype.recalcAccesibleVisible = function() {
		if (this.accesiblePic && this.inaccesiblePic) {
			if (!this.eyeOpened) {
				this.accesiblePic.visible = true;
				this.inaccesiblePic.visible = false;
			} else {
				this.inaccesiblePic.visible = this.inaccesible;
				this.accesiblePic.visible = !this.inaccesible;
			}
		}
	};

	Chip.prototype.update = function(dt) {
		_super.prototype.update.call(this, dt);

		if (this.state) {
			this.state.update(dt);
		}

		if (this.shining) {
			this.shining.rotation += dt * 60;
		}
	};

	Chip.prototype.hideShining = function() {
		var _this = this;
		if (this.shining) {
			createjs.Tween.get(this.shining).to({
				alpha: 0
			}, 300, createjs.Ease.linear).call(function() {
				return _this.shining.kill();
			});
		}
	};

	Chip.prototype.match = function(first) {
		this.removeFromField();

		this.setState(new ChipStateMatch(first));
		// 吻合的方块发光
		PlayState.g_instance.addGameObjectAtPos(new AutoreleaseEffect("match_", 20, 0.045),
			PlayState.g_instance.gameLayer,
			this.x + 2, this.y + 8);

		if (this.haveShining()) {
			PlayState.g_instance.showBonus();
		}

		this.hideShining();
	};

	Chip.prototype.tempMatch = function(name, id) {
		this.setPic(name, id);

		this.removeFromField();
	};

	Chip.prototype.shuffle = function(name, id) {
		this.removeFromField();

		this.setState(new ChipStateShuffle(name, id));
	};

	Chip.prototype.setData = function(name, id) {
		this.baseName = name;
		this.chipID = id;
	};

	Chip.prototype.select = function() {
		DNSoundManager.g_instance.play(Sounds.SELECT);

		if (!this.highlight1) {
			this.highlight1 = new AutoreleaseEffect("highlite_", 44, 0.032, true);
			PlayState.g_instance.addGameObjectAtPos(this.highlight1,
				PlayState.g_instance.chipLayers[this.layer],
				this.x + 1, this.y + 4);

			this.highlight2 = new AutoreleaseEffect("highlite_", 44, 0.053, true);
			PlayState.g_instance.addGameObjectAtPos(this.highlight2,
				PlayState.g_instance.chipLayers[this.layer],
				this.x + 1, this.y + 4);
			this.highlight2.scaleX = -1;
		}
	};

	Chip.prototype.deselect = function() {
		if (this.highlight1) {
			this.highlight1.setLoop(false);
			createjs.Tween.get(this.highlight1).to({
				alpha: 0
			}, 400, createjs.Ease.linear);
			this.highlight1 = null;

			this.highlight2.setLoop(false);
			createjs.Tween.get(this.highlight2).to({
				alpha: 0
			}, 400, createjs.Ease.linear);
			this.highlight2 = null;
		}
	};

	Chip.prototype.setState = function(state) {
		if (this.state) {
			this.state.cleanup();
		}

		this.state = state;

		this.state.setContext(this);
		this.state.init();
	};

	Chip.prototype.getBaseName = function() {
		return this.baseName;
	};

	Chip.prototype.getID = function() {
		return this.chipID;
	};

	Chip.prototype.removeFromField = function() {
		PlayState.g_instance.removeChipFromField(this.layer, this.indexX, this.indexY);
	};

	Chip.prototype.isNormalState = function() {
		if (this.state) {
			return this.state.isNormalState();
		}

		return false;
	};

	Chip.prototype.haveShining = function() {
		return this.shining != null && !this.shining.isDead();
	};
	return Chip;
})(DNGameObject);

/// <reference path="references.ts" />
var ChipDef = (function() {
	function ChipDef() {}
	return ChipDef;
})();

// 方块匹配状态
var ChipStateMatch = (function(_super) {
	__extends(ChipStateMatch, _super);

	function ChipStateMatch(first) {
		_super.call(this);

		this.first = first;
	}
	ChipStateMatch.prototype.init = function() {
		var _this = this;
		this.context.deselect();

		//  go top
		PlayState.g_instance.gameLayer.addChild(this.context);

		if (this.first) {
			createjs.Tween.get(this.context).to({
				y: -200
			}, 600, createjs.Ease.circIn).call(function() {
				return _this.context.kill();
			});
		} else {
			createjs.Tween.get(this.context).to({
				y: Constants.ASSETS_HEIGHT + 200
			}, 600, createjs.Ease.circIn).call(function() {
				return _this.context.kill();
			});
		}
	};
	return ChipStateMatch;
})(ChipState);

// 方块状态正常
var ChipStateNormal = (function(_super) {
	__extends(ChipStateNormal, _super);

	function ChipStateNormal() {
		_super.apply(this, arguments);
	}
	ChipStateNormal.prototype.isNormalState = function() {
		return true;
	};
	return ChipStateNormal;
})(ChipState);

// 方块洗牌
var ChipStateShuffle = (function(_super) {
	__extends(ChipStateShuffle, _super);

	function ChipStateShuffle(name, id) {
		_super.call(this);

		this.name = name;
		this.id = id;
	}
	ChipStateShuffle.prototype.init = function() {
		var _this = this;
		this.context.hideShining();

		this.context.rotation = 0;
		var dir = (Math.random() < 0.5 ? -1 : +1);

		createjs.Tween.get(this.context).wait(Utils.RandomRange(0, 600)).to({
			y: -200,
			rotation: 360 * dir
		}, 600, createjs.Ease.circIn).wait(800).call(function() {
			return _this.context.setPic(_this.name, _this.id);
		}).to({
			y: this.context.y,
			rotation: 720 * dir
		}, 600, createjs.Ease.circOut).call(function() {
			return _this.context.setState(new ChipStateNormal());
		});
	};
	return ChipStateShuffle;
})(ChipState);

// 生成新方块
var ChipStateSpawnNew = (function(_super) {
	__extends(ChipStateSpawnNew, _super);

	function ChipStateSpawnNew() {
		_super.apply(this, arguments);
		this.speed = 0;
	}
	ChipStateSpawnNew.prototype.init = function() {
		this.goalY = this.context.y;

		this.context.y = -100;

		this.delay = this.context.getLayer() * 0.4 + Utils.RandomRange(0, 0.4);
	};

	ChipStateSpawnNew.prototype.update = function(dt) {
		this.delay -= dt;

		if (this.delay > 0) {
			return;
		}

		this.speed += Constants.GRAVITY_ACC * dt;

		this.context.y += this.speed * dt;

		if (this.context.y >= this.goalY) {
			this.context.y = this.goalY;

			this.context.setState(new ChipStateNormal());

			PlayState.g_instance.playDropSound();
		}
	};
	return ChipStateSpawnNew;
})(ChipState);

// 各种常量
var Constants = (function() {
	function Constants() {}
	Constants.TEST = 0;
	
	Constants.FIELD_WIDTH = 12 * 2;
	Constants.FIELD_HEIGHT = 8 * 2;

	Constants.MOUSE_DOWN = "stagemousedown";
	Constants.MOUSE_UP = "stagemouseup";
	Constants.MOUSE_MOVE = "stagemousemove";

	Constants.CHIP_WIDTH = 53;
	Constants.CHIP_HEIGHT = 74;

	Constants.LAYER_OFFSET_X = -5;
	Constants.LAYER_OFFSET_Y = -7;

	Constants.FIELD_OFFSET_X = 64;
	Constants.FIELD_OFFSET_Y = 132;

	Constants.GRAVITY_ACC = 2500;

	// 基準寬高
	Constants.ASSETS_WIDTH = 700;
	Constants.ASSETS_HEIGHT = 800;
	// 像素比 
	Constants.PIXEL_RATIO = 1;

	// 初始值，執行時會被覆寫
	Constants.SCREEN_HEIGHT = 800;
	// 屏幕比例
	Constants.SCREEN_SCALE = 1;

	Constants.g_isPC = true;
	// FIXME 除錯模式
	Constants.DEBUG_MODE = false;

	Constants.COOL_TRANSITION_SPEED = 500;

	Constants.HINT_DELAY = 5;
	return Constants;
})();

// 场景切换动画（In State）
var CoolTransitionInState = (function(_super) {
	__extends(CoolTransitionInState, _super);

	function CoolTransitionInState(next_state) {
		var _this = this;
		_super.call(this);
		this.pic = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.TRANSITION_HOLE);

		this.nextState = next_state;

		this.addChild(this.pic);
		this.pic.x = Constants.ASSETS_WIDTH / 2;
		this.pic.y = Constants.SCREEN_HEIGHT / 2;

		this.pic.scaleX = this.pic.scaleY = 15;

		createjs.Tween.get(this.pic).to({
			scaleX: 0,
			scaleY: 0
		}, Constants.COOL_TRANSITION_SPEED, createjs.Ease.cubicOut).wait(100).call(function() {
			return _this.onFinishShade();
		});

		//  shading
		this.left = new createjs.Shape();
		this.left.graphics.beginFill("#000000");
		this.left.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH / 2, Constants.SCREEN_HEIGHT);
		this.left.graphics.endFill();
		this.addChild(this.left);

		this.right = new createjs.Shape();
		this.right.graphics.beginFill("#000000");
		this.right.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH / 2, Constants.SCREEN_HEIGHT);
		this.right.graphics.endFill();
		this.addChild(this.right);

		this.top = new createjs.Shape();
		this.top.graphics.beginFill("#000000");
		this.top.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH, Constants.SCREEN_HEIGHT / 2);
		this.top.graphics.endFill();
		this.addChild(this.top);

		this.bottom = new createjs.Shape();
		this.bottom.graphics.beginFill("#000000");
		this.bottom.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH, Constants.SCREEN_HEIGHT / 2);
		this.bottom.graphics.endFill();
		this.addChild(this.bottom);

		this.update(0);
	}
	CoolTransitionInState.prototype.update = function(dt) {
		_super.prototype.update.call(this, dt);

		var sz = 95;

		this.left.x = -this.pic.scaleX * sz;
		this.right.x = this.pic.scaleX * sz + Constants.ASSETS_WIDTH / 2;
		this.top.y = -this.pic.scaleX * sz;
		this.bottom.y = this.pic.scaleX * sz + Constants.SCREEN_HEIGHT / 2;
	};

	CoolTransitionInState.prototype.onFinishShade = function() {
		DNStateManager.g_instance.changeState(this.nextState);
		DNStateManager.g_instance.pushState(new CoolTransitionOutState());
	};

	CoolTransitionInState.prototype.setNextState = function(state) {
		this.nextState = state;
	};

	CoolTransitionInState.prototype.alignByCenter = function() {
		//  do nothing
	};
	return CoolTransitionInState;
})(DNGameState);

// 场景切换动画（Out State）
var CoolTransitionOutState = (function(_super) {
	__extends(CoolTransitionOutState, _super);

	function CoolTransitionOutState() {
		_super.call(this);
		this.pic = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.TRANSITION_HOLE);

		this.addChild(this.pic);
		this.pic.x = Constants.ASSETS_WIDTH / 2;
		this.pic.y = Constants.SCREEN_HEIGHT / 2;

		this.pic.scaleX = this.pic.scaleY = 0;

		createjs.Tween.get(this.pic).to({
			scaleX: 15,
			scaleY: 15
		}, Constants.COOL_TRANSITION_SPEED, createjs.Ease.cubicIn).call(function() {
			return DNStateManager.g_instance.popState();
		});

		//  shading
		this.left = new createjs.Shape();
		this.left.graphics.beginFill("#000000");
		this.left.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH / 2, Constants.SCREEN_HEIGHT);
		this.left.graphics.endFill();
		this.addChild(this.left);

		this.right = new createjs.Shape();
		this.right.graphics.beginFill("#000000");
		this.right.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH / 2, Constants.SCREEN_HEIGHT);
		this.right.graphics.endFill();
		this.addChild(this.right);

		this.top = new createjs.Shape();
		this.top.graphics.beginFill("#000000");
		this.top.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH, Constants.SCREEN_HEIGHT / 2);
		this.top.graphics.endFill();
		this.addChild(this.top);

		this.bottom = new createjs.Shape();
		this.bottom.graphics.beginFill("#000000");
		this.bottom.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH, Constants.SCREEN_HEIGHT / 2);
		this.bottom.graphics.endFill();
		this.addChild(this.bottom);

		this.update(0);
	}
	CoolTransitionOutState.prototype.update = function(dt) {
		_super.prototype.update.call(this, dt);

		var sz = 95;

		this.left.x = -this.pic.scaleX * sz;
		this.right.x = this.pic.scaleX * sz + Constants.ASSETS_WIDTH / 2;
		this.top.y = -this.pic.scaleX * sz;
		this.bottom.y = this.pic.scaleX * sz + Constants.SCREEN_HEIGHT / 2;
	};

	CoolTransitionOutState.prototype.alignByCenter = function() {
		//  do nothing
	};
	return CoolTransitionOutState;
})(DNGameState);

// 主MAIN布局
var MainMenuState = (function(_super) {
	__extends(MainMenuState, _super);

	function MainMenuState() {
		var _this = this;
		_super.call(this);
		this.MAIN_MENU_LAYOUT = [{
				// 主選單背景（底層）：靜圖備用。等比縮放到蓋滿 700×800（1024×1024 會先縮成 800×800）
				// 影片沒就緒、解不出來、或被瀏覽器擋掉自動播放時，玩家看到的就是這一張
				// fit_align：left = 靠左、裁掉右邊 100px；center = 左右各裁 50px；right = 靠右、裁掉左邊 100px
				// fit_offset_x / fit_offset_y：在上面的對位結果再推的像素偏移，正值往右、往下
				type: Layouts.TYPE_FIT_PICTURE,
				picture: Images.MAIN_MENU_BACK,
				fit_width: Constants.ASSETS_WIDTH,
				fit_height: Constants.ASSETS_HEIGHT,
				fit_align: "left",
				fit_offset_x: 0,
				fit_offset_y: 0,
				x: Constants.ASSETS_WIDTH / 2,
				y: Constants.ASSETS_HEIGHT / 2
			},
			{ // 主選單背景（上層）：影片，兩段接力
				// 第一段 start.mp4 播一次（實際 10.6 秒）；
				// 播完交棒給第二段 end.mp4 讓瀏覽器原生 loop 一直循環，不會閃、也不用 seek。
				// 循環長度不寫死：直接讀 end.mp4 檔案的實際長度（大約 4 秒多），換素材不必改程式。
				type: Layouts.TYPE_FIT_VIDEO,
				name: "menu_bg_video",
				video: Images.MAIN_MENU_VIDEO_S, // 開場：播一次
				loop_video: Images.MAIN_MENU_VIDEO_E, // 循環段：接上之後無限循環
				loop_tail_ms: 0, // 已經有循環片段，這個用不到（留著是給「單支影片尾段重播」的情況用）
				fit_width: Constants.ASSETS_WIDTH,
				fit_height: Constants.ASSETS_HEIGHT,
				fit_align: "left",
				fit_offset_x: 0,
				fit_offset_y: 0,
				x: Constants.ASSETS_WIDTH / 2,
				y: Constants.ASSETS_HEIGHT / 2
			},
			//------------------------
			{ // 上方的LOGO
				type: Layouts.TYPE_STATIC_PICTURE,
				picture: Images.CAT_TITLE,
				x: 230,
				y: 90,
				name: "title",
				rotation: 10
			},
			//-----------------
			{ // 中间游戏按钮
				type: Layouts.TYPE_JELLY_BUTTON,
				name: Layouts.NAME_BUTTON_PLAY,
				picture: Images.BUTTON_PLAY_BIG,
				x: 355,
				y: 900
			},
			/*{ // 音效开关
				type: Layouts.TYPE_PLACEHOLDER,
				name: Layouts.NAME_SOUND_PLACE,
				x: 65 - 150,
				y: 490
			},*/
			{ // 奖杯
				type: Layouts.TYPE_JELLY_BUTTON,
				name: Layouts.NAME_BUTTON_MORE_GAMES,
				picture: Images.BUTTON_MORE_GAMES,
				x: 65 - 150,
				y: 490
			},
			{ // 讯息
				type: Layouts.TYPE_JELLY_BUTTON,
				name: Layouts.NAME_BUTTON_CREDITS,
				picture: Images.BUTTON_CREDITS,
				x: 65 - 150,
				y: 595
			},
			{ // 音量設定
				type: Layouts.TYPE_JELLY_BUTTON,
				name: Layouts.NAME_BUTTON_SETTINGS,
				picture: Images.BUTTON_SETTING,
				x: 65 - 150,
				y: 700//775
			},
			{ // 登入入口（音量設定按鈕右邊；點開登入/註冊面板，功能後續接）
				type: Layouts.TYPE_JELLY_BUTTON,
				name: Layouts.NAME_BUTTON_LOGIN,
				picture: Images.BUTTON_A4,
				x: 65 - 150,
				y: 700
			},
			{ // 赞助商（首頁MAIN主畫面）
				type: Layouts.TYPE_LOGO_PLACEHOLDER,
				x: 615,
				y: 740,
				name: "logo"
			}
		];
		this.process = 1;

		this.loadLayout(this.MAIN_MENU_LAYOUT, this);

		this.findGUIObject(Layouts.NAME_BUTTON_PLAY).setHandler(function() { //进入游戏
			return _this.onPlayTouch();
		});
		this.findGUIObject(Layouts.NAME_BUTTON_CREDITS).setHandler(function() { //讯息
			return _this.onCreditsTouch();
		});
		this.findGUIObject(Layouts.NAME_BUTTON_MORE_GAMES).setHandler(function() { //奖杯
			return _this.onCreditsTouch2();
		});
		this.findGUIObject(Layouts.NAME_BUTTON_SETTINGS).setHandler(function() { //音量設定
			return _this.onSettingsTouch();
		});
		this.findGUIObject(Layouts.NAME_BUTTON_LOGIN).setHandler(function() { //登入入口
			return _this.onLoginTouch();
		});
		// 登入按鈕參照：未登入左右輕晃，登入成功後隱藏（不設登出入口）
		this.loginButton = this.findGUIObject(Layouts.NAME_BUTTON_LOGIN);
		this.loginSwayTween = null;
		this.loginEntered = false;

		//this.soundButtonPlace = this.findGUIObject(Layouts.NAME_SOUND_PLACE); //音效开关
		//this.setSoundButton();

		// 向上弹出的图像
		//this.monsters = this.findGUIObject("monsters");

		this.update(0);
	}
	// 弹出动画效果
	MainMenuState.prototype.init = function() {
		_super.prototype.init.call(this);

		// 上方LOGO
		this.title = this.findGUIObject("title");
		createjs.Tween.get(this.title).wait(1000).to({
			y: 80
		}, 1000, createjs.Ease.cubicOut).to({
			rotation: 0
		}, 1000, createjs.Ease.cubicOut);
		// 向上弹出的图像
		/*createjs.Tween.get(this.findGUIObject("monsters")).wait(300).to({
			y: 680
		}, 1500, createjs.Ease.cubicOut);*/

		/*createjs.Tween.get(this.soundButtonPlace).wait(1500).to({// 聲音控制
			x: 65,
			rotation: 360
		}, 350, createjs.Ease.backOut);*/
		
		createjs.Tween.get(this.findGUIObject(Layouts.NAME_BUTTON_CREDITS)).wait(1650).to({// 讯息
			x: 65,
			rotation: 360
		}, 350, createjs.Ease.backOut);
		
		createjs.Tween.get(this.findGUIObject(Layouts.NAME_BUTTON_MORE_GAMES)).wait(1800).to({ // 奖杯
			x: 65,
			rotation: 360
		}, 350, createjs.Ease.backOut);

		createjs.Tween.get(this.findGUIObject(Layouts.NAME_BUTTON_SETTINGS)).wait(1950).to({ // 音量設定
			x: 65,
			rotation: 360
		}, 350, createjs.Ease.backOut);

		var _menu = this;
		var _loginBtn = this.loginButton;
		// 開機已還原 session（上次登入過）：直接隱藏登入按鈕，不進待機搖晃
		if (Session.get() && Session.get().token) {
			_loginBtn.visible = false;
		}
		createjs.Tween.get(_loginBtn).wait(2100).to({ // 登入入口進場
			x: 200,
			rotation: 360
		}, 350, createjs.Ease.backOut).call(function() {
			_menu.loginEntered = true;
			_menu.applyLoginButtonVisibility();
		});

		createjs.Tween.get(this.findGUIObject(Layouts.NAME_BUTTON_PLAY)).wait(2100).to({ // 游戏
			y: 700,
			rotation: 360
		}, 350, createjs.Ease.backOut);

		createjs.Tween.get(this.findGUIObject(Layouts.NAME_BUTTON_PLAY), { // 游戏动画效果
			loop: true
		}).to({
			scaleX: +1.10,
			scaleY: +1.10
		}, 150, createjs.Ease.cubicOut).to({
			scaleX: +0.90,
			scaleY: +0.90
		}, 300, createjs.Ease.cubicIn).to({
			scaleX: 1,
			scaleY: 1
		}, 150, createjs.Ease.linear).wait(2000);

		// 主畫面動態背景：進到主選單就從 0 秒播一次，播完交棒給循環片段一直循環
		// 影片實體在建構子 loadLayout 時就產生了，metadata 一拿到也會自己起播，這裡是補一次確保時機正確
		this.menuBgVideo = this.findGUIObject("menu_bg_video");
		if (this.menuBgVideo && this.menuBgVideo.restart) {
			this.menuBgVideo.restart();
		}
	};

	// 從別的頁面（例如訊息頁、設定面板）回到主選單：同一個實例被 resume，把影片重新播一次；
	// 若剛在設定面板切換過語系，all 圖集已重載，這裡重建標題圖換上新語系美術字。
	MainMenuState.prototype.resume = function() {
		_super.prototype.resume.call(this);

		if (this.title && this.title.refreshPicture) {
			this.title.refreshPicture();
		}

		if (this.menuBgVideo && this.menuBgVideo.restart) {
			this.menuBgVideo.restart();
		}
	};

	// 離開主選單：影片停掉、斷開來源、移除元素，把解碼資源還回去
	// 每次進主選單都是 new MainMenuState()，所以不必留著重建，直接收乾淨比較不會累積
	MainMenuState.prototype.cleanup = function() {
		_super.prototype.cleanup.call(this);

		if (this.menuBgVideo && this.menuBgVideo.destroy) {
			this.menuBgVideo.destroy();
		}

		this.menuBgVideo = null;
	};

	MainMenuState.prototype.onSoundTouch = function() {
		DNSoundManager.g_instance.setSoundEnabled(!DNSoundManager.g_instance.isSoundEnabled());
		this.setSoundButton();
	};
	//声音按钮
	MainMenuState.prototype.setSoundButton = function() {
		var _this = this;
		this.soundButtonPlace.removeAllChildren();

		var enabled = DNSoundManager.g_instance.isSoundEnabled();

		var sound_button = new DNFlatButton(enabled ? Images.BUTTON_SOUND_ON : Images.BUTTON_SOUND_OFF,
			function() {
				return _this.onSoundTouch();
			});
		this.soundButtonPlace.addChild(sound_button);
		this.addGuiObject(sound_button);
	};
	// 讯息
	MainMenuState.prototype.onCreditsTouch = function() {
		DNStateManager.g_instance.pushState(new CreditsState());
	};
	// 奖杯
	MainMenuState.prototype.onCreditsTouch2 = function() {
		AccessToPersonalData.update();
	};
	// 音量設定面板
	MainMenuState.prototype.onSettingsTouch = function() {
		DNStateManager.g_instance.pushState(new SettingsState());
	};
	// 登入／註冊面板（先開版面骨架，帳號密碼與後端功能後續再接）
	MainMenuState.prototype.onLoginTouch = function() {
		DNStateManager.g_instance.pushState(new LoginState());
	};

	// 依登入狀態切換按鈕顯示：已登入隱藏並停止搖晃；未登入進場完成後開始左右輕晃
	MainMenuState.prototype.applyLoginButtonVisibility = function() {
		if (!this.loginButton) {
			return;
		}
		var sess = Session.get();
		var loggedIn = !!(sess && sess.token);
		this.loginButton.visible = !loggedIn;
		if (loggedIn) {
			this.stopLoginSway();
		} else if (this.loginEntered) {
			this.startLoginSway();
		}
	};

	// 待機左右搖晃：以進場落點 x=200 為基準，中點→右→左→中點，sineInOut 平滑來回，循環播放
	MainMenuState.prototype.startLoginSway = function() {
		if (!this.loginButton || this.loginSwayTween) {
			return;
		}
		var baseX = 200;
		var _btn = this.loginButton;
		_btn.x = baseX; // 上次停在搖晃半途時先回中點，避免新循環從偏移位置起跑
		this.loginSwayTween = createjs.Tween.get(_btn, { loop: true })
			.to({ x: baseX + 9 }, 700, createjs.Ease.sineInOut)
			.to({ x: baseX - 9 }, 1400, createjs.Ease.sineInOut)
			.to({ x: baseX }, 700, createjs.Ease.sineInOut);
	};

	// 停止搖晃並清掉按鈕上的補間，避免隱藏後背景還在跑；
	// 進場完成前不動補間：此時按鈕上只有開機進場動畫，session 401 晚到清除時才不會把進場一併殺掉
	MainMenuState.prototype.stopLoginSway = function() {
		if (this.loginButton && this.loginEntered) {
			createjs.Tween.removeTweens(this.loginButton);
		}
		this.loginSwayTween = null;
	};
	//进入游戏地图
	MainMenuState.prototype.onPlayTouch = function() {
		DNStateManager.g_instance.pushState(new CoolTransitionInState(new SelectLevelState()));
	};

	MainMenuState.prototype.update = function(dt) {
		_super.prototype.update.call(this, dt);

		// 每幀對齊登入狀態：面板登入成功關閉後回到主選單，按鈕在這裡隱藏；
		// 若 session 失效被清除，也會重新顯示
		this.applyLoginButtonVisibility();

		this.process -= dt * 0.9;

		if (this.process <= 0) {
			this.process = 0;
		}

		// 向上弹出的图像
		//this.monsters.rotation = Math.sin(this.liveTime * 7) * 14 * this.process;

		if (this.liveTime > 3) {
			this.title.rotation = +Math.sin((this.liveTime - 3) * 2) * 1.9;
		}
	};
	return MainMenuState;
})(DNGameState);

// FIXME 
var CreditsState = (function(_super) {
	__extends(CreditsState, _super);
	// 这里要放什么讯息呢？改成開源訊息？
	function CreditsState() {
		_super.call(this);
		this.hiddingNow = false;

		//  shading
		this.shader = new createjs.Shape();
		this.shader.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH, Constants.SCREEN_HEIGHT);
		this.shader.graphics.endFill();
		this.addChild(this.shader);
		this.shader.alpha = 0;
		this.shader.y = -this.y;
		createjs.Tween.get(this.shader).to({
			alpha: 1.0
		}, 500, createjs.Ease.linear);

		this.container = new createjs.Container();
		this.addChild(this.container);
		this.container.alpha = 0;
		createjs.Tween.get(this.container).to({
			alpha: 1.0
		}, 500, createjs.Ease.linear);

		var texts = [ //info
			"開源訊息","開源訊息","開源訊息"
		];

		var strings = DNStringManager.getInstance();
		var padY = (Constants.SCREEN_HEIGHT - Constants.ASSETS_HEIGHT) / 2;
		this.padY = padY;

		var pic = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.WINDOW);// 说明框背景
		this.container.addChild(pic);
		pic.x = Constants.ASSETS_WIDTH / 2;
		pic.y = (Constants.ASSETS_HEIGHT / 2) + padY;
		
		for (var i = 0; i < texts.length; i++) {
			var line = new createjs.Text(texts[i], "bold 16px Verdana", "#222222");
			line.textAlign = "center";
			this.container.addChild(line);

			line.x = Constants.ASSETS_WIDTH / 2;
			line.y = 175 + (i * 40) + (Constants.SCREEN_HEIGHT - Constants.ASSETS_HEIGHT) / 2; // (700-700) /2
			//line.y = i * 40 + (Constants.SCREEN_HEIGHT - Constants.ASSETS_HEIGHT) / 2;
		}
	}
	
	CreditsState.prototype.onMouseDown = function(x, y) {
		this.hide();
	};

	CreditsState.prototype.hide = function() {
		if (!this.hiddingNow) {
			createjs.Tween.removeTweens(this.shader);

			createjs.Tween.get(this.shader).to({
				alpha: 0.0
			}, 400, createjs.Ease.linear).call(function() {
				return DNStateManager.g_instance.popState();
			});
			createjs.Tween.get(this.container).to({
				alpha: 0.0
			}, 400, createjs.Ease.linear);
			this.hiddingNow = true;
		}
	};

	CreditsState.prototype.alignByCenter = function() {
		//  do nothing
	};
	return CreditsState;
})(DNGameState);

// 蛋殼冒險積分記錄方案 奖杯页面面板布局
var CreditsState2 = (function(_super) {
	__extends(CreditsState2, _super);
	// 讯息页面
	function CreditsState2() {
		_super.call(this);
		this.hiddingNow = false;

		//  shading
		this.shader = new createjs.Shape();
		this.shader.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH, Constants.SCREEN_HEIGHT);
		this.shader.graphics.endFill();
		this.addChild(this.shader);
		this.shader.alpha = 0;
		this.shader.y = -this.y;
		createjs.Tween.get(this.shader).to({
			alpha: 1.0
		}, 500, createjs.Ease.linear);

		this.container = new createjs.Container();
		this.addChild(this.container);
		this.container.alpha = 0;
		createjs.Tween.get(this.container).to({
			alpha: 1.0
		}, 500, createjs.Ease.linear);

		var strings = DNStringManager.getInstance();
		var padY = (Constants.SCREEN_HEIGHT - Constants.ASSETS_HEIGHT) / 2;
		this.padY = padY;

		var pic = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.WINDOW);// 说明框背景
		this.container.addChild(pic);
		pic.x = Constants.ASSETS_WIDTH / 2;
		pic.y = (Constants.ASSETS_HEIGHT / 2) + padY;

		// 標題
		this.titleText = this._createText(strings.getString(Strings.LB_TITLE),
			Constants.ASSETS_WIDTH / 2, 175 + padY, "center", "#222222", 24);
		this.container.addChild(this.titleText);

		// 欄標：帳號 / 總分 / 總星數
		this.headerRow = new createjs.Container();
		this.headerRow.addChild(this._createText(strings.getString(Strings.LB_COL_ACCOUNT), 200, 210 + padY, "left", "#5a4a2a", 20));
		this.headerRow.addChild(this._createText(strings.getString(Strings.LB_COL_SCORE), 400, 210 + padY, "center", "#5a4a2a", 20));
		this.headerRow.addChild(this._createText(strings.getString(Strings.LB_COL_STARS), 520, 210 + padY, "center", "#5a4a2a", 20));
		this.container.addChild(this.headerRow);

		// 前十名列與自身區塊分層，方便重繪清空
		this.rowsLayer = new createjs.Container();
		this.meLayer = new createjs.Container();
		this.container.addChild(this.rowsLayer);
		this.container.addChild(this.meLayer);

		// 載入中／錯誤狀態列
		this.statusText = this._createText(strings.getString(Strings.LB_LOADING),
			Constants.ASSETS_WIDTH / 2, 320 + padY, "center", "#7a6a4a", 22);
		this.container.addChild(this.statusText);

		this.loadLeaderboard();
	}
	
	CreditsState2.prototype.onMouseDown = function(x, y) {
		this.hide();
	};

	CreditsState2.prototype.hide = function() {
		if (!this.hiddingNow) {
			createjs.Tween.removeTweens(this.shader);

			createjs.Tween.get(this.shader).to({
				alpha: 0.0
			}, 400, createjs.Ease.linear).call(function() {
				return DNStateManager.g_instance.popState();
			});
			createjs.Tween.get(this.container).to({
				alpha: 0.0
			}, 400, createjs.Ease.linear);
			this.hiddingNow = true;
		}
	};

	CreditsState2.prototype.alignByCenter = function() {
		//  do nothing
	};

	// 文字元件工廠：統一對齊與基線
	CreditsState2.prototype._createText = function(text, x, y, align, color, size) {
		var t = new createjs.Text(text, "bold " + (size || 22) + "px Verdana", color || "#222222");
		t.textAlign = align || "center";
		t.textBaseline = "middle";
		t.x = x;
		t.y = y;
		return t;
	};

	// 打後端排行端點；帶 session token 時一併回自身資訊
	CreditsState2.prototype.loadLeaderboard = function() {
		var _this = this;
		var sess = Session.get();
		var url = "/api/leaderboard";
		if (sess && sess.token) {
			url += "?token=" + encodeURIComponent(sess.token);
		}
		fetch(url)
			.then(function(resp) {
				return resp.json().catch(function() {
					return {};
				}).then(function(data) {
					return { status: resp.status, data: data };
				});
			})
			.then(function(result) {
				var data = result.data || {};
				if (data.ok) {
					_this.renderBoard(data.board || []);
					_this.renderMe(data.me || null);
					_this.statusText.text = "";
				} else {
					_this.showError();
				}
			})
			.catch(function() {
				_this.showError();
			});
	};

	// 繪製前十名；前三名用金／銀／銅色名次，並在名次左側放對應皇冠
	CreditsState2.prototype.renderBoard = function(board) {
		var _this = this;
		this.rowsLayer.removeAllChildren();
		var padY = this.padY;
		var rankColors = ["#ff0000", "#001cac", "#00aa87"];// 前三名的顏色
		var crownNames = [Images.CROWN_1, Images.CROWN_2, Images.CROWN_3];
		var rowStartY = 240 + padY;// 第一行高度
		var rowStep = 33;// 行距
		var crownScale = 0.5; // 皇冠原格 64×64，縮小一半左右擺在名次前
		var crownX = 110; // 皇冠中心水平位置（名次左側）

		board.forEach(function(entry, i) {
			var rank = i + 1;
			var color = rank <= 3 ? rankColors[rank - 1] : "#222222";
			var y = rowStartY + i * rowStep;

			if (rank <= 3) {
				var crown = DNAssetsManager.g_instance.getCenteredImage(crownNames[i]);
				crown.scaleX = crown.scaleY = crownScale;
				crown.x = crownX;
				crown.y = y - 20;
				_this.rowsLayer.addChild(crown);
			}

			_this.rowsLayer.addChild(_this._createText(rank + ".", 160, y, "center", color, 16));
			_this.rowsLayer.addChild(_this._createText(entry.username || "", 200, y, "left", "#222222", 16));
			_this.rowsLayer.addChild(_this._createText(String(entry.totalScore || 0), 400, y, "center", "#222222", 16));
			_this.rowsLayer.addChild(_this._createText(String(entry.starTotal || 0), 520, y, "center", "#222222", 16));
		});
	};

	// 繪製自身區塊（右下角紅字）；未登入顯示提示列
	CreditsState2.prototype.renderMe = function(me) {
		var strings = DNStringManager.getInstance();
		this.meLayer.removeAllChildren();
		var padY = this.padY;
		var meX = 500;

		if (!me) {
			this.meLayer.addChild(this._createText(strings.getString(Strings.LB_ANONYMOUS),
				meX - 140, 570 + padY, "right", "#b03a2e", 20));
			return;
		}

		var hello = strings.getString(Strings.LB_HELLO_PREFIX) + (me.account || "") +
			strings.getString(Strings.LB_HELLO_SUFFIX);
		var levels = strings.getString(Strings.LB_LEVELS_PREFIX) + (me.levelsCompleted || 0);
		var scoreLead = strings.getString(Strings.LB_SCORE_LEAD_PREFIX) + (me.scoreLeadPercent || 0) +
			strings.getString(Strings.LB_LEAD_SUFFIX);
		var starLead = strings.getString(Strings.LB_STAR_LEAD_PREFIX) + (me.starLeadPercent || 0) +
			strings.getString(Strings.LB_LEAD_SUFFIX);

		this.meLayer.addChild(this._createText(hello, meX - 140, 570 + padY, "right", "#b03a2e", 16));
		this.meLayer.addChild(this._createText(levels, meX, 570 + padY, "right", "#b03a2e", 16));
		this.meLayer.addChild(this._createText(scoreLead, meX, 598 + padY, "right", "#b03a2e", 16));
		this.meLayer.addChild(this._createText(starLead, meX, 626 + padY, "right", "#b03a2e", 16));
	};

	CreditsState2.prototype.showError = function() {
		this.statusText.text = DNStringManager.getInstance().getString(Strings.LB_ERROR);
		this.statusText.color = "#b03a2e";
	};

	return CreditsState2;
})(DNGameState);

// 音量設定面板：比照訊息/獎盃彈出視窗（深色半透明遮罩 + Container 淡入）
// 內含音樂、音效兩條滑桿與全域靜音開關；文字走多語係 i18n.js
var SettingsState = (function(_super) {
	__extends(SettingsState, _super);

	function SettingsState() {
		var _this = this;
		_super.call(this);
		this.hiddingNow = false;

		//  shading：全螢幕半透明遮罩，點到遮罩即關閉面板
		this.shader = new createjs.Shape();
		this.shader.graphics.beginFill("#000000");
		this.shader.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH, Constants.SCREEN_HEIGHT);
		this.shader.graphics.endFill();
		this.addChild(this.shader);
		this.shader.alpha = 0;
		this.shader.y = -this.y;
		createjs.Tween.get(this.shader).to({
			alpha: 0.75
		}, 500, createjs.Ease.linear);

		this.container = new createjs.Container();
		this.addChild(this.container);
		this.container.alpha = 0;
		createjs.Tween.get(this.container).to({
			alpha: 1.0
		}, 500, createjs.Ease.linear);

		var sm = DNSoundManager.g_instance;
		var strings = DNStringManager.getInstance();
		var panelCX = Constants.ASSETS_WIDTH / 2;
		var panelCY = Constants.ASSETS_HEIGHT / 2;
		var offsetY = (Constants.SCREEN_HEIGHT - Constants.ASSETS_HEIGHT) / 2;

		// 說明框背景（WINDOW），置中
		var pic = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.WINDOW);
		this.container.addChild(pic);
		pic.x = panelCX;
		pic.y = panelCY - 15 + offsetY;

		// 標題（置頂，整體版面往上靠）
		var title = new createjs.Text(strings.getString(Strings.SETTINGS_TITLE), "bold 30px Verdana", "#222222");
		title.textAlign = "center";
		title.x = panelCX;
		title.y = 160 + offsetY;
		this.container.addChild(title);

		// 音量設置小標
		var sectionLabel = new createjs.Text(strings.getString(Strings.SETTINGS_SECTION), "bold 26px Verdana", "#222222");
		sectionLabel.textAlign = "left";
		sectionLabel.x = panelCX - 180;
		sectionLabel.y = 220 + offsetY;
		this.container.addChild(sectionLabel);

		// 音樂標籤
		var musicLabel = new createjs.Text(strings.getString(Strings.SETTINGS_MUSIC), "bold 24px Verdana", "#222222");
		musicLabel.textAlign = "left";
		musicLabel.x = panelCX - 160;
		musicLabel.y = 270 + offsetY;
		this.container.addChild(musicLabel);
		// 音樂滑桿列
		this.musicSlider = new DNVOLSlider(panelCX + 20, 310 + offsetY, sm.getMusicVolume(), function(v) {
			sm.setMusicVolume(v);
		});
		this.musicSlider.scaleX = 1.15;
		this.container.addChild(this.musicSlider);
		this.addGuiObject(this.musicSlider);

		// 音效標籤
		var sfxLabel = new createjs.Text(strings.getString(Strings.SETTINGS_SFX), "bold 24px Verdana", "#222222");
		sfxLabel.textAlign = "left";
		sfxLabel.x = panelCX - 160;
		sfxLabel.y = 360 + offsetY;
		this.container.addChild(sfxLabel);
		// 音效滑桿列
		this.sfxSlider = new DNVOLSlider(panelCX + 20, 400 + offsetY, sm.getSfxVolume(), function(v) {
			sm.setSfxVolume(v);
		});
		this.sfxSlider.scaleX = 1.15;
		this.container.addChild(this.sfxSlider);
		this.addGuiObject(this.sfxSlider);

		// 全部靜音開關（check_on＝勾選＝已靜音 / check_off＝未勾＝聲音開啟）
		this.muteToggle = new DNFlatButton(sm.isSoundEnabled() ? Images.CHECK_OFF : Images.CHECK_ON, function() {
			sm.setSoundEnabled(!sm.isSoundEnabled());
			_this.refreshMuteToggle();
		});
		this.muteToggle.x = panelCX - 100;
		this.muteToggle.y = 450 + offsetY;
		this.container.addChild(this.muteToggle);
		this.addGuiObject(this.muteToggle);

		var muteLabel = new createjs.Text(strings.getString(Strings.SETTINGS_MUTE), "bold 24px Verdana", "#222222");
		muteLabel.textAlign = "left";
		muteLabel.x = panelCX - 50;
		muteLabel.y = 440 + offsetY;
		this.container.addChild(muteLabel);

		// 語言設置列：文字在左，四顆語言圖標緊接文字後面同列（不另開一列置中）
		var langLabel = new createjs.Text(strings.getString(Strings.SETTINGS_LANG), "bold 26px Verdana", "#222222");
		langLabel.textAlign = "left";
		langLabel.x = panelCX - 180;
		langLabel.y = 500 + offsetY;
		this.container.addChild(langLabel);

		// 四國語言圖標：圖集 35~38 格（cn／tw／en／ja）；
		// 點擊切換語系，重載 all 圖集後重開本面板，刷新文字與高亮狀態。
		var langEntries = [
			{ lang: "cn", pic: Images.IN_CN },
			{ lang: "tw", pic: Images.IN_TW },
			{ lang: "en", pic: Images.IN_EN },
			{ lang: "ja", pic: Images.IN_JA }
		];
		var langBtnW = 40;
		var langBtnH = 40;
		var langGap = 16;
		var langLabelBounds = langLabel.getBounds ? langLabel.getBounds() : null;
		var langLabelW = langLabelBounds ? langLabelBounds.width : 104;
		var langStartX = langLabel.x + langLabelW + 24 + langBtnW / 2;
		var langBtnY = 500 + offsetY;
		var currentLang = strings.language;
		var _thisSettings = this;

		for (var li = 0; li < langEntries.length; li++) {
			(function(entry) {
				var langBtn = new DNLangPlaceholderButton(entry.pic, langBtnW, langBtnH, function() {
					// 已經是目前語系不重複載入
					if (DNStringManager.getInstance().language == entry.lang) {
						return;
					}
					DNStringManager.getInstance().setLanguage(entry.lang);
					// 重載 all 圖集（新語系美術圖），完成後關掉舊面板、重開一張刷新文字與高亮；
					// 若載圖期間面板已被點遮罩關閉（hiddingNow=true），回呼時不再疊開新面板，避免堆疊混亂。
					DNAssetsManager.g_instance.reloadAtlas("all", function() {
						if (_thisSettings.hiddingNow) {
							return;
						}
						DNStateManager.g_instance.popState();
						DNStateManager.g_instance.pushState(new SettingsState());
					});
				});
				langBtn.x = langStartX + li * (langBtnW + langGap);
				langBtn.y = langBtnY;
				langBtn.setSelected(currentLang == entry.lang);
				_thisSettings.container.addChild(langBtn);
				_thisSettings.addGuiObject(langBtn);
			})(langEntries[li]);
		}

		// 登出遊戲列：文字在左，登出圖示緊接其後；未登入變淡且不可點，登入後原圖色可點
		var logoutLabel = new createjs.Text(strings.getString(Strings.SETTINGS_LOGOUT), "bold 26px Verdana", "#222222");
		logoutLabel.textAlign = "left";
		logoutLabel.x = panelCX - 180;
		logoutLabel.y = 560 + offsetY;
		this.container.addChild(logoutLabel);

		var logoutLabelBounds = logoutLabel.getBounds ? logoutLabel.getBounds() : null;
		var logoutLabelW = logoutLabelBounds ? logoutLabelBounds.width : 104;
		this.logoutBtn = new DNLangPlaceholderButton(Images.BUTTON_LOGOUT, 40, 40, function() {
			// 登出：清除工作階段、記住的帳號密碼，並把本地存檔解绑回匿名模式；隨後關閉面板回到主選單
			Session.clear();
			LoginState._clearRemember();
			GameData.getInstance().unbindSession();
			_thisSettings.hide();
		});
		this.logoutBtn.x = logoutLabel.x + logoutLabelW + 24 + 20;
		this.logoutBtn.y = 560 + offsetY;
		this.container.addChild(this.logoutBtn);
		this.addGuiObject(this.logoutBtn);
		this.refreshLogoutButton();
	}

	// 依登入狀態刷新登出按鈕：已登入原圖亮色可點；未登入變淡且停用命中
	SettingsState.prototype.refreshLogoutButton = function() {
		if (!this.logoutBtn) {
			return;
		}
		var sess = Session.get();
		var loggedIn = !!(sess && sess.token);
		this.logoutBtn.enabled = loggedIn;
		this.logoutBtn.setSelected(loggedIn);
	};

	SettingsState.prototype.refreshMuteToggle = function() {
		var sm = DNSoundManager.g_instance;
		// 勾選＝已靜音：聲音開啟時顯示未勾，靜音時顯示已勾
		this.muteToggle.setPicture(sm.isSoundEnabled() ? Images.CHECK_OFF : Images.CHECK_ON);
	};

	// 滑桿與開關自己處理觸控；點到其餘區域（遮罩）才關閉面板
	SettingsState.prototype.onMouseDown = function(x, y) {
		var handled = false;
		for (var i = 0; i < this.gui.length; i++) {
			this.gui[i].onMouseDown(x, y);
			if (DNGUIObject.wasHandlerThisFrame) {
				handled = true;
			}
		}
		DNGUIObject.wasHandlerThisFrame = false;
		if (!handled) {
			this.hide();
		}
	};

	SettingsState.prototype.onMouseMove = function(x, y) {
		for (var i = 0; i < this.gui.length; i++) {
			this.gui[i].onMouseMove(x, y);
		}
	};

	SettingsState.prototype.onMouseUp = function(x, y) {
		for (var i = 0; i < this.gui.length; i++) {
			this.gui[i].onMouseUp(x, y);
		}
	};

	SettingsState.prototype.hide = function() {
		if (!this.hiddingNow) {
			createjs.Tween.removeTweens(this.shader);

			createjs.Tween.get(this.shader).to({
				alpha: 0.0
			}, 400, createjs.Ease.linear).call(function() {
				return DNStateManager.g_instance.popState();
			});
			createjs.Tween.get(this.container).to({
				alpha: 0.0
			}, 400, createjs.Ease.linear);
			this.hiddingNow = true;
		}
	};

	SettingsState.prototype.alignByCenter = function() {
		//  do nothing
	};
	return SettingsState;
})(DNGameState);

// 繪製登入面板用的長型輸入框：米黃紙底 + 黑色圓角細框（對應參考圖框樣式，canvas 直接畫，不佔圖集）。
// 回傳 createjs.Container，框以原點為中心；boxW/boxH 為邏輯像素尺寸，另存文字層供輸入內容疊顯示。
function createLoginInputBox(boxW, boxH, placeholder) {
	var box = new createjs.Container();
	box.boxW = boxW;
	box.boxH = boxH;
	box.placeholder = placeholder || "";

	var fill = new createjs.Shape();
	fill.graphics.beginFill("#efe6c8"); // 米黃紙底
	fill.graphics.drawRoundRect(-boxW / 2, -boxH / 2, boxW, boxH, 8);
	fill.graphics.endFill();
	box.addChild(fill);

	var rim = new createjs.Shape();
	rim.graphics.beginStroke("#2b2b2b").setStrokeStyle(2);
	rim.graphics.drawRoundRect(-boxW / 2, -boxH / 2, boxW, boxH, 8);
	rim.graphics.endFill();
	box.addChild(rim);

	// 框內文字層：account 明碼顯示，password 一律以 **** 遮蔽（內容仍存在 DOM input）。
	// 空值時顯示灰色佔位提示（比照 HTML input placeholder），有值時還原深色。
	var textLayer = new createjs.Text(box.placeholder, "bold 22px Verdana",
		box.placeholder ? "#9c8f6e" : "#222222");
	textLayer.textAlign = "left";
	textLayer.textBaseline = "middle";
	textLayer.x = -boxW / 2 + 16;
	textLayer.y = 0;
	box.addChild(textLayer);
	box.textLayer = textLayer;

	return box;
}

// 把邏輯座標（舞台邏輯像素，ASSETS 座標系；傳入框的中心點與寬高）換算成畫面 CSS 像素，
// 回傳值 left/top 為框左上角落的 CSS 位置，供隱藏 DOM input 對位。
// 對照 canvas.js resizeTo：SCALE = SCREEN_SCALE / PIXEL_RATIO，水平置中、垂直置頂（marginTop=0）。
function loginStageToCss(centerX, centerY, boxW, boxH) {
	var sm = DNStateManager.g_instance;
	var scale = Constants.SCREEN_SCALE / Constants.PIXEL_RATIO;
	var cssW = Constants.ASSETS_WIDTH * scale;
	var left = (window.innerWidth - cssW) / 2 + (centerX - boxW / 2) * scale;
	var top = (centerY - boxH / 2) * scale;
	return { left: left, top: top, scale: scale };
}

// 登入／註冊面板：版面比照 SettingsState（深色半透明遮罩 + 紙張背景 Container 淡入）。
// 帳號欄明碼可輸入、密碼欄以 **** 遮蔽；實際輸入由隱藏 DOM input 承接，canvas 只負責顯示。
// 後端（Supabase）登入/註冊功能後續再接。
var LoginState = (function(_super) {
	__extends(LoginState, _super);

	// 「記住帳號密碼」本地儲存鍵；比照語系設定的 localStorage 慣例，try/catch 包住避免私密模式爆掉
	var REMEMBER_KEY = "eggshell_cat_login_remember";
	var REMEMBER_ACCOUNT_KEY = "eggshell_cat_login_account";
	var REMEMBER_PASSWORD_KEY = "eggshell_cat_login_password";

	function LoginState() {
		var _this = this;
		_super.call(this);
		this.hiddingNow = false;
		this.activeField = null; // "account" | "password"
		this.domInputs = [];     // 面板建立的隱藏 input，關閉時統一回收
		this.authMode = "login"; // "login" | "register"，決定提交按鈕打哪一支後端 API
		this.authBusy = false;   // API 往返期間鎖住提交按鈕，避免重複送出
		this.rememberMe = LoginState._loadRemember(); // 記住帳密勾選狀態（localStorage）

		// shading：全螢幕半透明遮罩，點到遮罩即關閉面板
		this.shader = new createjs.Shape();
		this.shader.graphics.beginFill("#000000");
		this.shader.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH, Constants.SCREEN_HEIGHT);
		this.shader.graphics.endFill();
		this.addChild(this.shader);
		this.shader.alpha = 0;
		this.shader.y = -this.y;
		createjs.Tween.get(this.shader).to({
			alpha: 0.75
		}, 500, createjs.Ease.linear);

		this.container = new createjs.Container();
		this.addChild(this.container);
		this.container.alpha = 0;
		createjs.Tween.get(this.container).to({
			alpha: 1.0
		}, 500, createjs.Ease.linear);

		var strings = DNStringManager.getInstance();
		var panelCX = Constants.ASSETS_WIDTH / 2;
		var panelCY = Constants.ASSETS_HEIGHT / 2;
		var offsetY = (Constants.SCREEN_HEIGHT - Constants.ASSETS_HEIGHT) / 2;

		// 說明框背景（WINDOW），置中
		var pic = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.WINDOW);
		this.container.addChild(pic);
		pic.x = panelCX;
		pic.y = panelCY - 15 + offsetY;

		// 標題（置頂）
		var title = new createjs.Text(strings.getString(Strings.LOGIN_TITLE), "bold 30px Verdana", "#222222");
		title.textAlign = "center";
		title.x = panelCX;
		title.y = 160 + offsetY;
		this.container.addChild(title);

		// 帳號列：標籤在輸入框正上方，框橫向鋪滿（比照參考圖排版）
		var accountLabel = new createjs.Text(strings.getString(Strings.LOGIN_ACCOUNT), "bold 24px Verdana", "#222222");
		accountLabel.textAlign = "left";
		accountLabel.x = panelCX - 170;
		accountLabel.y = 240 + offsetY;
		this.container.addChild(accountLabel);

		this.accountBox = createLoginInputBox(380, 56, strings.getString(Strings.LOGIN_ACCOUNT_PH));
		this.accountBox.x = panelCX;
		this.accountBox.y = 300 + offsetY;
		this.container.addChild(this.accountBox);

		// 密碼列：標籤在輸入框正上方，框橫向鋪滿
		var passwordLabel = new createjs.Text(strings.getString(Strings.LOGIN_PASSWORD), "bold 24px Verdana", "#222222");
		passwordLabel.textAlign = "left";
		passwordLabel.x = panelCX - 170;
		passwordLabel.y = 360 + offsetY;
		this.container.addChild(passwordLabel);

		this.passwordBox = createLoginInputBox(380, 56, strings.getString(Strings.LOGIN_PASSWORD_PH));
		this.passwordBox.x = panelCX;
		this.passwordBox.y = 420 + offsetY;
		this.container.addChild(this.passwordBox);

		// 建立兩個隱藏 DOM input 承接實際輸入（canvas 無法直接接鍵盤／行動端鍵盤）；
		// 點到哪一格就把焦點交給哪個 input，畫面文字層同步刷新。
		this.accountInput = this.createDomInput("account", "text", this.accountBox, panelCX, 300 + offsetY, false);
		this.passwordInput = this.createDomInput("password", "password", this.passwordBox, panelCX, 420 + offsetY, true);

		// 之前勾選記住帳密時，開面板自動預填帳號與密碼，並同步畫面文字層
		if (this.rememberMe) {
			var savedAccount = LoginState._loadSavedAccount();
			var savedPassword = LoginState._loadSavedPassword();
			if (savedAccount) {
				this.accountInput.value = savedAccount;
			}
			if (savedPassword) {
				this.passwordInput.value = savedPassword;
			}
			this.refreshFieldText("account");
			this.refreshFieldText("password");
		}

		// 記住帳號密碼勾選列：圖示比照設定頁 CHECK_ON／CHECK_OFF；點擊切換本輪狀態，
		// 真正寫入／清除 localStorage 留到登入或註冊成功送出時處理。
		this.rememberToggle = new DNFlatButton(this.rememberMe ? Images.CHECK_ON : Images.CHECK_OFF, function() {
			_this.rememberMe = !_this.rememberMe;
			_this.refreshRememberToggle();
		});
		this.rememberToggle.x = panelCX - 105;
		this.rememberToggle.y = 475 + offsetY;
		this.container.addChild(this.rememberToggle);
		this.addGuiObject(this.rememberToggle);

		var rememberLabel = new createjs.Text(strings.getString(Strings.LOGIN_REMEMBER), "bold 22px Verdana", "#222222");
		rememberLabel.textAlign = "left";
		rememberLabel.x = panelCX - 55;
		rememberLabel.y = 465 + offsetY;
		this.container.addChild(rememberLabel);

		// 視窗縮放／旋轉時重新對位隱藏 input
		this._onResize = function() {
			_this.relayoutDomInputs();
		};
		window.addEventListener("resize", this._onResize);

		// EaselJS 0.7.1 的合成 event.preventDefault() 不會轉發到原生事件；若不攔下原生按下，
		// 瀏覽器預設會把焦點從程式 focus() 的隱藏 input 拉回 body，導致點框後無法打字。
		// capture 階段攔下落在 canvas 上的原生 mousedown/touchstart，取消預設焦點切換；
		// 落在 input 本身上的按下事件不攔，保留原生聚焦行為。
		this._onNativeDown = function(e) {
			if (e.target && e.target.tagName === "CANVAS") {
				e.preventDefault();
			}
		};
		document.addEventListener("mousedown", this._onNativeDown, true);
		document.addEventListener("touchstart", this._onNativeDown, true);

		// 預設先聚焦帳號欄，方便直接打字測試；延遲到面板淡入與 DOM 對位完成後再 focus
		createjs.Tween.get({}).wait(120).call(function() {
			if (!_this.hiddingNow) {
				_this.focusField("account");
			}
		});

		// 登入／註冊按鈕：button_a1（左緣）+ button_a2（中間拉伸條）+ button_a3（右緣）三段拼組。
		// a1/a3 固定原寬，a2 做中間段水平拉伸；整體置中，圖示疊一層文字。
		var submitBtnW = 240;
		var submitBtnH = 80;
		var submitBtnY = 555 + offsetY;
		var edgeW = 22; // a1/a3 影格寬度
		var submitBtn = new createjs.Container();
		submitBtn.x = panelCX;
		submitBtn.y = submitBtnY;

		var edgeL = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.BUTTON_A1);
		edgeL.x = -submitBtnW / 2 + edgeW / 2;
		submitBtn.addChild(edgeL);

		var edgeR = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.BUTTON_A3);
		edgeR.x = submitBtnW / 2 - edgeW / 2;
		submitBtn.addChild(edgeR);

		var middle = DNAssetsManager.g_instance.getImage(Images.BUTTON_A2);
		var midW = submitBtnW - edgeW * 2 + 2; // 左右各多蓋 1px，遮住 a1/a3 內緣透出的白線縫
		var midBounds = middle && middle.getBounds ? middle.getBounds() : null;
		// a2 原影格寬 1px，按原寬比例拉伸填滿中間段；影格缺載時用 midW 兜底
		middle.scaleX = midBounds && midBounds.width > 0 ? midW / midBounds.width : midW;
		// 中間條未走 proxy 置中（getImage 不會自動補 bounds 偏移），需自行把拉伸後的
		// 寬高對齊容器中心：水平 -midW/2、垂直依 bounds 高度置中，避免藍體偏右、上下跑位。
		middle.x = -midW / 2;
		middle.y = midBounds && midBounds.height > 0 ? -midBounds.height / 2 : -submitBtnH / 2;
		submitBtn.addChild(middle);

		var submitText = new createjs.Text(strings.getString(Strings.LOGIN_SUBMIT), "bold 24px Verdana", "#ffffff");
		submitText.textAlign = "center";
		submitText.textBaseline = "middle";
		submitText.x = 0;
		submitText.y = 0;
		submitBtn.addChild(submitText);
		this.submitText = submitText;

		// 觸控 hitTest 用獨立不可見形狀包整支按鈕（三段拼組本身沒有統一邊界），
		// 補回 bounds，供 DNFlatButton.hitTestSmart 讀取整支按鈕寬高。
		var hitShape = new createjs.Shape();
		hitShape.graphics.beginFill("#000000");
		hitShape.graphics.drawRect(-submitBtnW / 2, -submitBtnH / 2, submitBtnW, submitBtnH);
		hitShape.graphics.endFill();
		hitShape.alpha = 0;
		submitBtn.addChild(hitShape);
		submitBtn.setBounds(-submitBtnW / 2, -submitBtnH / 2, submitBtnW, submitBtnH);

		this.submitButton = new DNFlatButton(Images.BUTTON_A1, function() {
			_this.handleSubmit();
		});
		// 覆蓋建構式預設帶入的單格 a1，改用三段拼組的 submitBtn 當按鈕圖片與邊界。
		// 建構式已先把 a1 proxy 掛進來，直接換 picture 不會自動拔舊圖；先移除殘留子項，
		// 否則舊 a1 會留在按鈕原點（面板左上角）露出一截直條。
		if (this.submitButton.picture && this.submitButton.picture.parent) {
			this.submitButton.picture.parent.removeChild(this.submitButton.picture);
		}
		this.submitButton.picture = submitBtn;
		this.submitButton.addChild(submitBtn);
		this.container.addChild(this.submitButton);
		this.addGuiObject(this.submitButton);

		// 狀態列：API 往返的載入中／成功／錯誤訊息，置中顯示在提交按鈕下方
		this.statusText = new createjs.Text("", "bold 18px Verdana", "#222222");
		this.statusText.textAlign = "center";
		this.statusText.textBaseline = "middle";
		this.statusText.x = panelCX;
		this.statusText.y = 600 + offsetY;
		this.container.addChild(this.statusText);

		// 模式切換列：登入 ⇄ 註冊；文字本身不可點，另疊一層透明 hitShape 包整列偵測命中
		this.toggleBtn = new createjs.Container();
		this.toggleBtn.x = panelCX;
		this.toggleBtn.y = 624 + offsetY;
		this.toggleText = new createjs.Text("", "18px Verdana", "#7a5c2e");
		this.toggleText.textAlign = "center";
		this.toggleText.textBaseline = "middle";
		this.toggleBtn.addChild(this.toggleText);
		var toggleHit = new createjs.Shape();
		toggleHit.graphics.beginFill("#000000");
		toggleHit.graphics.drawRect(-160, -16, 320, 32);
		toggleHit.graphics.endFill();
		toggleHit.alpha = 0;
		this.toggleBtn.addChild(toggleHit);
		this.toggleBtn.setBounds(-160, -16, 320, 32);
		this.container.addChild(this.toggleBtn);

		this.applyAuthMode();
	}

	// 建立隱藏 DOM input 承接實際輸入；type=password 時畫面一律以 **** 顯示。
	// field: "account" | "password"；box 為對應的 canvas 框容器，用來對位與刷新文字層。
	LoginState.prototype.createDomInput = function(field, inputType, box, centerX, centerY, isPassword) {
		var _this = this;
		var input = document.createElement("input");
		input.type = inputType;
		// 關閉瀏覽器自動填入／密碼管理器偵測：autocomplete 設 off、name 避開 username/password 慣用字，
		// 並標記第三方密碼套件略過；初始唯讀讓瀏覽器載入時跳過填入，聚焦後再解除唯讀。
		input.setAttribute("autocomplete", "off");
		input.name = "eggshell-" + field;
		input.setAttribute("data-lpignore", "true");   // LastPass
		input.setAttribute("data-form-type", "other");  // 1Password
		input.readOnly = true;
		input.maxLength = 32;
		// 外觀近乎透明，只留可聚焦與可打字；實際可見內容由 canvas 文字層負責
		input.style.position = "absolute";
		input.style.opacity = "0";
		input.style.border = "none";
		input.style.outline = "none";
		input.style.background = "transparent";
		input.style.padding = "0";
		input.style.margin = "0";
		input.style.zIndex = "9999";
		input.style.fontSize = "16px";
		// 對位到 canvas 框：依舞台座標換算 CSS 像素（left/top 為框左上角）
		var pos = loginStageToCss(centerX, centerY, box.boxW, box.boxH);
		input.style.left = pos.left + "px";
		input.style.top = pos.top + "px";
		input.style.width = box.boxW * pos.scale + "px";
		input.style.height = box.boxH * pos.scale + "px";
		input.centerX = centerX;
		input.centerY = centerY;

		input.addEventListener("focus", function() {
			input.removeAttribute("readonly");
			_this.focusField(field);
		});
		input.addEventListener("blur", function() {
			// 失焦後還原唯讀，避免下次開面板又被自動填入
			input.readOnly = true;
		});
		input.addEventListener("mousedown", function() {
			input.removeAttribute("readonly");
		});
		input.addEventListener("input", function() {
			_this.refreshFieldText(field);
		});
		input.addEventListener("keydown", function(e) {
			// Enter 直接觸發登入／註冊（後端功能待接）
			if (e.key === "Enter") {
				e.preventDefault();
				_this.submitButton.func();
			}
		});

		document.body.appendChild(input);
		this.domInputs.push(input);

		box.input = input;
		box.field = field;
		box.isPassword = isPassword;
		return input;
	};

	// 切換當前聚焦欄位，並把焦點交給對應隱藏 input
	LoginState.prototype.focusField = function(field) {
		this.activeField = field;
		var input = field === "account" ? this.accountInput : this.passwordInput;
		if (input && document.activeElement !== input) {
			try {
				input.focus();
			} catch (err) {
				// 部分 WebView 聚焦失敗不影響骨架版面
			}
		}
		this.refreshFieldText(field);
	};

	// 視窗縮放後，依最新舞台尺寸重新對位兩個隱藏 input
	LoginState.prototype.relayoutDomInputs = function() {
		this.placeDomInput(this.accountInput, this.accountBox);
		this.placeDomInput(this.passwordInput, this.passwordBox);
	};

	// 把單個 input 對位到對應 canvas 框的畫面 CSS 位置
	LoginState.prototype.placeDomInput = function(input, box) {
		if (!input || !box) {
			return;
		}
		var pos = loginStageToCss(input.centerX, input.centerY, box.boxW, box.boxH);
		input.style.left = pos.left + "px";
		input.style.top = pos.top + "px";
		input.style.width = box.boxW * pos.scale + "px";
		input.style.height = box.boxH * pos.scale + "px";
	};

	// 依 input 實際值刷新 canvas 文字層；密碼一律用 **** 遮蔽
	LoginState.prototype.refreshFieldText = function(field) {
		var box = field === "account" ? this.accountBox : this.passwordBox;
		var input = field === "account" ? this.accountInput : this.passwordInput;
		if (!box || !input) {
			return;
		}
		var shown = box.isPassword ? "*".repeat(input.value.length) : input.value;
		if (shown.length === 0) {
			// 空值：顯示灰色佔位提示（比照 HTML placeholder），不寫入實際值
			box.textLayer.text = box.placeholder || "";
			box.textLayer.color = "#9c8f6e";
		} else {
			box.textLayer.text = shown;
			box.textLayer.color = "#222222";
		}
	};

	// 依目前模式（login/register）刷新按鈕文字與切換列文字；不動輸入框內容
	LoginState.prototype.applyAuthMode = function() {
		var strings = DNStringManager.getInstance();
		var isLogin = this.authMode === "login";
		if (this.submitText) {
			this.submitText.text = strings.getString(isLogin ? Strings.LOGIN_BTN_LOGIN : Strings.LOGIN_BTN_REGISTER);
		}
		if (this.toggleText) {
			this.toggleText.text = strings.getString(isLogin ? Strings.LOGIN_SWITCH_REGISTER : Strings.LOGIN_SWITCH_LOGIN);
		}
	};

	// 顯示狀態列訊息；空字串清空提示
	LoginState.prototype.setAuthStatus = function(text, color) {
		if (!this.statusText) {
			return;
		}
		this.statusText.text = text || "";
		this.statusText.color = color || "#222222";
	};

	// 後端錯誤代碼 → 多語字串；未知代碼退回伺服器錯誤
	LoginState.prototype.authErrorMessage = function(code) {
		var map = {
			account_exists: Strings.LOGIN_ERROR_ACCOUNT_EXISTS,
			invalid_credential: Strings.LOGIN_ERROR_INVALID,
			weak_password: Strings.LOGIN_ERROR_WEAK,
			account_too_short: Strings.LOGIN_ERROR_ACCOUNT_SHORT,
			server_error: Strings.LOGIN_ERROR_SERVER
		};
		var key = map[code] || Strings.LOGIN_ERROR_SERVER;
		return DNStringManager.getInstance().getString(key);
	};

	// 切換登入／註冊模式：清空狀態提示，保留已輸入的帳密
	LoginState.prototype.toggleAuthMode = function() {
		if (this.authBusy) {
			return;
		}
		this.authMode = this.authMode === "login" ? "register" : "login";
		this.setAuthStatus("", "#222222");
		this.applyAuthMode();
	};

	// 切換列命中判定：比照 DNFlatButton.hitTestSmart，先把容器中心換成舞台像素再除
	// SCREEN_SCALE 還原成邏輯座標，再用 bounds 半寬高判定（onMouseDown 收到的是邏輯座標）
	LoginState.prototype.hitToggle = function(x, y) {
		if (!this.toggleBtn) {
			return false;
		}
		var pos = this.toggleBtn.localToGlobal(0, 0);
		pos.x /= Constants.SCREEN_SCALE;
		pos.y /= Constants.SCREEN_SCALE;
		var b = this.toggleBtn.getBounds();
		if (!b) {
			return false;
		}
		var halfW = b.width / 2 * this.toggleBtn.scaleX;
		var halfH = b.height / 2 * this.toggleBtn.scaleY;
		return pos.x - halfW <= x && x <= pos.x + halfW &&
			pos.y - halfH <= y && y <= pos.y + halfH;
	};

	// 提交：讀取兩個隱藏 input，依模式打 /api/auth/login 或 /api/auth/register
	LoginState.prototype.handleSubmit = function() {
		var _this = this;
		if (this.authBusy || this.hiddingNow) {
			return;
		}

		var account = (this.accountInput && this.accountInput.value || "").trim();
		var password = this.passwordInput && this.passwordInput.value || "";
		if (!account || !password) {
			this.setAuthStatus(DNStringManager.getInstance().getString(Strings.LOGIN_STATUS_EMPTY), "#b03a2e");
			return;
		}

		this.authBusy = true;
		this.submitButton.enabled = false;
		this.setAuthStatus(DNStringManager.getInstance().getString(Strings.LOGIN_STATUS_LOADING), "#7a6a4a");

		var path = this.authMode === "register" ? "/api/auth/register" : "/api/auth/login";
		fetch(path, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ account: account, password: password })
		}).then(function(resp) {
			return resp.json().catch(function() {
				return {};
			}).then(function(data) {
				return { ok: resp.ok, data: data };
			});
		}).then(function(result) {
			var data = result.data || {};
			if (data.ok) {
				var loginAccount = data.account || account;
				Session.persist(loginAccount, data.token);
				GameData.getInstance().bindSession(loginAccount);
				_this._persistRemember(account, password);
				_this.setAuthStatus(DNStringManager.getInstance().getString(Strings.LOGIN_STATUS_SUCCESS), "#2e7d32");
				createjs.Tween.get({}).wait(700).call(function() {
					_this.hide();
				});
			} else {
				_this.setAuthStatus(_this.authErrorMessage(data.error), "#b03a2e");
				_this.authBusy = false;
				_this.submitButton.enabled = true;
			}
		}).catch(function() {
			_this.setAuthStatus(DNStringManager.getInstance().getString(Strings.LOGIN_ERROR_NETWORK), "#b03a2e");
			_this.authBusy = false;
			_this.submitButton.enabled = true;
		});
	};

	// 勾選鈕圖示刷新：CHECK_ON 已勾 / CHECK_OFF 未勾，比照設定頁靜音開關寫法
	LoginState.prototype.refreshRememberToggle = function() {
		this.rememberToggle.setPicture(this.rememberMe ? Images.CHECK_ON : Images.CHECK_OFF);
	};

	// 依勾選狀態寫入或清除本地帳密；localStorage 失敗（私密模式／空間滿）靜默略過
	LoginState.prototype._persistRemember = function(account, password) {
		try {
			if (this.rememberMe) {
				window.localStorage.setItem(REMEMBER_KEY, "1");
				window.localStorage.setItem(REMEMBER_ACCOUNT_KEY, account);
				window.localStorage.setItem(REMEMBER_PASSWORD_KEY, password);
			} else {
				LoginState._clearRemember();
			}
		} catch (e) {}
	};

	// 靜態讀取／清除：供建構式預填、取消勾選與內部清理使用
	LoginState._loadRemember = function() {
		try {
			return window.localStorage.getItem(REMEMBER_KEY) === "1" &&
				!!window.localStorage.getItem(REMEMBER_ACCOUNT_KEY);
		} catch (e) {
			return false;
		}
	};

	LoginState._loadSavedAccount = function() {
		try {
			return window.localStorage.getItem(REMEMBER_ACCOUNT_KEY) || "";
		} catch (e) {
			return "";
		}
	};

	LoginState._loadSavedPassword = function() {
		try {
			return window.localStorage.getItem(REMEMBER_PASSWORD_KEY) || "";
		} catch (e) {
			return "";
		}
	};

	LoginState._clearRemember = function() {
		try {
			window.localStorage.removeItem(REMEMBER_KEY);
			window.localStorage.removeItem(REMEMBER_ACCOUNT_KEY);
			window.localStorage.removeItem(REMEMBER_PASSWORD_KEY);
		} catch (e) {}
	};

	// 點擊命中判定：座標落在帳號或密碼框內就切換聚焦，不視為「點到遮罩」
	LoginState.prototype.hitInputBox = function(box, x, y) {
		if (!box) {
			return false;
		}
		var local = box.globalToLocal(x, y);
		return local.x >= -box.boxW / 2 && local.x <= box.boxW / 2 &&
			local.y >= -box.boxH / 2 && local.y <= box.boxH / 2;
	};

	// 滑桿與按鈕自己處理觸控；點到輸入框只切換聚焦；點到其餘區域（遮罩）才關閉面板
	LoginState.prototype.onMouseDown = function(x, y) {
		var handled = false;
		for (var i = 0; i < this.gui.length; i++) {
			this.gui[i].onMouseDown(x, y);
			if (DNGUIObject.wasHandlerThisFrame) {
				handled = true;
			}
		}
		DNGUIObject.wasHandlerThisFrame = false;

		if (!handled) {
			if (this.hitInputBox(this.accountBox, x, y)) {
				this.focusField("account");
				handled = true;
			} else if (this.hitInputBox(this.passwordBox, x, y)) {
				this.focusField("password");
				handled = true;
			}
		}

		if (!handled && this.hitToggle(x, y)) {
			this.toggleAuthMode();
			handled = true;
		}

		if (!handled) {
			this.hide();
		}
	};

	LoginState.prototype.onMouseMove = function(x, y) {
		for (var i = 0; i < this.gui.length; i++) {
			this.gui[i].onMouseMove(x, y);
		}
	};

	LoginState.prototype.onMouseUp = function(x, y) {
		for (var i = 0; i < this.gui.length; i++) {
			this.gui[i].onMouseUp(x, y);
		}
	};

	LoginState.prototype.hide = function() {
		if (!this.hiddingNow) {
			createjs.Tween.removeTweens(this.shader);

			// 關面板前先把焦點從隱藏 input 移開，避免鍵盤／游標卡在已關閉的欄位上
			this.releaseFocus();

			createjs.Tween.get(this.shader).to({
				alpha: 0.0
			}, 400, createjs.Ease.linear).call(function() {
				return DNStateManager.g_instance.popState();
			});
			createjs.Tween.get(this.container).to({
				alpha: 0.0
			}, 400, createjs.Ease.linear);
			this.hiddingNow = true;
		}
	};

	// 解除當前 input 焦點
	LoginState.prototype.releaseFocus = function() {
		if (document.activeElement && document.activeElement.blur) {
			try {
				document.activeElement.blur();
			} catch (err) {
				// ignore
			}
		}
	};

	// 狀態被彈出（popState）時回收所有隱藏 DOM input，避免殘留在頁面上
	LoginState.prototype.cleanup = function() {
		_super.prototype.cleanup.call(this);
		this.releaseFocus();
		if (this._onResize) {
			window.removeEventListener("resize", this._onResize);
			this._onResize = null;
		}
		if (this._onNativeDown) {
			document.removeEventListener("mousedown", this._onNativeDown, true);
			document.removeEventListener("touchstart", this._onNativeDown, true);
			this._onNativeDown = null;
		}
		for (var i = 0; i < this.domInputs.length; i++) {
			var el = this.domInputs[i];
			if (el && el.parentNode) {
				el.parentNode.removeChild(el);
			}
		}
		this.domInputs = [];
	};

	LoginState.prototype.alignByCenter = function() {
		//  do nothing
	};
	return LoginState;
})(DNGameState);

/// <reference path="references.ts" />
var DNAssetsManager = (function() {
	function DNAssetsManager(manifest, sound_manifest, athlases, localizable_images, progress_callback) {
		this.imageNameToSpriteSheetName = new Object();
		DNAssetsManager.g_instance = this;

		this.athlases = athlases;

		this.localizableImages = localizable_images;

		this.manifest = manifest;
		this.soundManifest = sound_manifest;

		this.progressCallBack = progress_callback;

		this.startDownLoad();
	}
	DNAssetsManager.prototype.startDownLoad = function() {
		var _this = this;
		this.loader = new createjs.LoadQueue();

		this.loader.addEventListener("progress", function(e) { // 事件监听器
			return _this.progressCallBack(e);
		});
		this.loader.addEventListener("complete", function(e) { // 事件监听器
			return _this.handleComplete(e);
		});

		createjs.Sound.registerManifest(this.soundManifest, "assets/sound/"); // 注册音效清单

		this.loader.installPlugin(createjs.SoundJS);
		this.loader.loadManifest(this.manifest);
	};

	DNAssetsManager.prototype.handleComplete = function(event) {
		var sm = DNStringManager.getInstance();
		for (var i = 0; i < this.athlases.length; i++) {
			var obj = this.athlases[i];

			// 保留圖集原始圖名（裸名），重載語系圖時比對用；images[0] 之後會換成圖片物件
			obj["imageName"] = obj["images"][0];

			// manifest 裡 all 圖集以語系檔名（all.cn 等）作為 id，取圖時先解析；
			// 其餘圖集沿用原名。
			var atlasImageName = obj["imageName"];
			var resolvedName = sm.resolveAtlasImage(atlasImageName);
			obj["images"] = [this.getBitmap(resolvedName).image];

			// 方案 B：每格 frame 往內縮 1px（x+1, y+1, w-2, h-2），
			// 排除邊緣那圈被縮放／取樣帶出來的像素；寬高不足 3px 的細框不縮，避免變成 0。
			var frames = obj["frames"];
			if (frames && frames.length) {
				for (var f = 0; f < frames.length; f++) {
					var fr = frames[f];
					if (fr && fr.length === 4 && fr[2] >= 3 && fr[3] >= 3) {
						fr[0] += 1;
						fr[1] += 1;
						fr[2] -= 2;
						fr[3] -= 2;
					}
				}
			}

			var sprite_sheet = new createjs.SpriteSheet(obj);

			var animation_names = sprite_sheet.getAnimations();

			for (var nm = 0; nm < animation_names.length; nm++) {
				this.imageNameToSpriteSheetName[animation_names[nm]] = sprite_sheet;
			}
		}

		DNStateManager.g_instance.allAssetsLoaded();
	};

	DNAssetsManager.prototype.getResult = function(name) {
		return this.loader.getResult(name);
	};

	// 切換語系時重載指定圖集（目前只用於 all）：先移除舊 id 的載入結果，
	// 再以新語系圖檔建立 SpriteSheet 並刷新快取。原 frame 座標已在初次
	// handleComplete 縮過 1px，這裡直接沿用，不再二次縮邊。
	DNAssetsManager.prototype.reloadAtlas = function(atlasImageName, completeCallback) {
		var _this = this;
		var sm = DNStringManager.getInstance();

		var targetAtlas = null;
		for (var i = 0; i < this.athlases.length; i++) {
			var atlas = this.athlases[i];
			var rawName = atlas && (atlas["imageName"] || (atlas["images"] && atlas["images"][0]));
			if (rawName == atlasImageName) {
				targetAtlas = atlas;
				break;
			}
		}
		if (!targetAtlas) {
			if (completeCallback) completeCallback(false);
			return;
		}

		var resolvedName = sm.resolveAtlasImage(atlasImageName);
		var srcPath = "assets/art/" + resolvedName + ".png";

		// 清掉舊語系圖的載入項目與結果快取，避免 getResult 還拿到舊圖。
		// 初次 manifest 的 id 是當下語系解析名（all.cn 等），這裡把四語系名與裸名都清一次。
		var cleanupIds = [atlasImageName, resolvedName, "all.cn", "all.tw", "all.en", "all.ja"];
		for (var ci = 0; ci < cleanupIds.length; ci++) {
			try {
				this.loader.remove(cleanupIds[ci]);
				if (this.loader._loadedResults) {
					delete this.loader._loadedResults[cleanupIds[ci]];
				}
			} catch (e) {}
		}

		var preload = new createjs.LoadQueue();
		preload.addEventListener("complete", function() {
			var source = preload.getResult(resolvedName);
			if (source == null) {
				console.warn("語系圖集載入失敗：" + srcPath);
				if (completeCallback) completeCallback(false);
				return;
			}

			// 重建該圖集：images 換成新圖；frame 沿用已縮邊的座標
			targetAtlas["images"] = [source];
			var sprite_sheet = new createjs.SpriteSheet(targetAtlas);
			var animation_names = sprite_sheet.getAnimations();
			for (var nm = 0; nm < animation_names.length; nm++) {
				_this.imageNameToSpriteSheetName[animation_names[nm]] = sprite_sheet;
			}

			if (completeCallback) completeCallback(true);
		});
		preload.addEventListener("error", function() {
			console.warn("語系圖集載入錯誤：" + srcPath);
			// 載入失敗仍回呼重開面板，避免設定畫面卡住；圖集維持舊語系內容
			if (completeCallback) completeCallback(false);
		});
		preload.loadManifest([{ src: srcPath, id: resolvedName }]);
	};

	// 定义 DNAssetsManager 原型的一个新方法：getBitmap
	DNAssetsManager.prototype.getBitmap = function(name) {
		// 先從 loader 取原始資源；偶發載入失敗（網路中斷、解碼超時、檔案 404）時 getResult 會回 null。
		// 這裡先擋一道，避免上層 getCenteredImage 直接讀 null.getBounds().width 拋 TypeError 把整個主選單打斷。
		var source = this.loader.getResult(name);

		// 載入結果為空：回傳一張空白 Bitmap 佔位，版面流程能繼續往下走；
		// 對應的背景/圖示會缺圖，但其上層影片背景仍會正常接力顯示。
		if (source == null) {
			console.warn("圖片資源未載入成功，以空白佔位代替：" + name);
			var empty_bitmap = new createjs.Bitmap();
			empty_bitmap.visible = false;
			return empty_bitmap;
		}

		// 使用 this.loader.getResult(name) 获取指定名称的资源，并使用它创建一个新的 createjs.Bitmap 对象
		var bitmap = new createjs.Bitmap(source);

		// 检查新创建的 bitmap 对象是否有边界信息
		if (!bitmap.getBounds()) {
			// 如果 bitmap 对象没有边界信息，则在控制台打印消息，并显示出 bitmap 的名称
			console.log("bitmap error", name);
		}

		// 返回创建的 bitmap 对象
		return bitmap;
	};

	DNAssetsManager.prototype.getImage = function(name) {
		if (this.localizableImages.indexOf(name) != -1) {
			name = DNStringManager.getInstance().getLanguagePrefix() + name;
		}

		if (this.imageNameToSpriteSheetName[name]) {
			return this.getSprite(name);
		}

		return this.getBitmap(name);
	};

	DNAssetsManager.prototype.getCenteredImage = function(name) {
		var image = this.getImage(name);

		// 防護：getImage 回傳的若是空白佔位 Bitmap（getBitmap 已對 null 結果兜底），
		// 它沒有 bounds，這裡直接回傳，不要再讀 getBounds().width，避免拋 null.width 錯誤。
		var bounds = image && image.getBounds ? image.getBounds() : null;
		if (!bounds) {
			return image;
		}

		image.x = -bounds.width / 2;
		image.y = -bounds.height / 2;

		return image;
	};

	DNAssetsManager.prototype.getCenteredImageWithProxy = function(name) {
		var proxy = new createjs.Container();

		proxy.addChild(this.getCenteredImage(name));

		return proxy;
	};

	DNAssetsManager.prototype.getSprite = function(name) {
		var sprite = new createjs.Sprite(this.imageNameToSpriteSheetName[name], name);

		sprite.stop();

		return sprite;
	};

	return DNAssetsManager;
})();

/// <reference path="references.ts" />
var DNFontDef = (function() {
	function DNFontDef() {}
	DNFontDef.GUI_FONT = {
		name: "font_gui/",
		letterDist: -8
	};
	DNFontDef.SCORE_FONT = {
		name: "font_score/",
		letterDist: -6
	};
	return DNFontDef;
})();

// Game Config
var DNGameConfig = (function() {
	/**
	 * 设置
	 */
	function DNGameConfig() {}

	DNGameConfig.pauseGame = function() {
		DNStateManager.g_instance.onPause();
	};

	DNGameConfig.resumeGame = function() {
		DNStateManager.g_instance.onResume();
	};

	DNGameConfig.restartGame = function() {
		DNStateManager.g_instance.onRestart();
	};

	DNGameConfig.soundChange = function(sound_on) {
		DNSoundManager.g_instance.setSoundEnabled(sound_on);
	};

	// 通用外部連結開啟：分頁開新視窗；被擋時退回原視窗跳轉
	DNGameConfig.openUrl = function(url) {
		if (!url) {
			return;
		}
		var win = window.open(url, '_blank');
		if (!win) {
			window.location.href = url;
		}
	};

	// 相容舊呼叫：未指定廣告時預設開清單第一筆網址
	DNGameConfig.goLogo = function() {
		var ad = (typeof Ads !== "undefined" && Ads.list && Ads.list[0]) || null;
		DNGameConfig.openUrl(ad ? ad.url : null);
	};

	DNGameConfig.haveBranding = (typeof Ads !== "undefined" && !!Ads.list && Ads.list.length > 0);
	return DNGameConfig;
})();

// 果冻按钮类型
var DNJellyButton = (function(_super) {
	__extends(DNJellyButton, _super);

	function DNJellyButton(name, callback) {
		_super.call(this);
		this.selected = false;
		this.func = null;
		this.enabled = true;

		this.picture = DNAssetsManager.g_instance.getCenteredImageWithProxy(name);
		this.addChild(this.picture);

		this.func = callback;
	}
	DNJellyButton.prototype.getPicture = function() {
		return this.picture;
	};

	DNJellyButton.prototype.setHandler = function(callback) {
		this.func = callback;
	};

	DNJellyButton.prototype.forceUpdate = function(dt) {
		_super.prototype.forceUpdate.call(this, dt);

		if (this.jellier) {
			this.jellier.update(dt);

			if (this.jellier.isDead()) {
				this.jellier = null;
			}
		}
	};

	DNJellyButton.prototype.select = function() {
		if (!this.selected) {
			this.picture.scaleX = this.picture.scaleY = 1;

			this.jellier = new Jellier(this.picture, 15, 0);
			this.selected = true;
		}
	};

	DNJellyButton.prototype.deselect = function() {
		if (this.selected) {
			this.selected = false;
		}
	};

	DNJellyButton.prototype.onMouseDown = function(x, y) {
		if (this.hitTestSmart(x, y)) {
			this.liveTime = 0;

			this.select();
		}
	};

	DNJellyButton.prototype.onMouseUp = function(x, y) {
		if (this.hitTestSmart(x, y) && this.selected) {
			if (!DNGUIObject.wasHandlerThisFrame) {
				DNGUIObject.wasHandlerThisFrame = true;

				if (this.func) {
					this.func();
				}

				//  run action
				DNSoundManager.g_instance.play(Sounds.CLICK);
			}
		}

		this.deselect();
	};

	DNJellyButton.prototype.onMouseMove = function(x, y) {
		if (!this.hitTestSmart(x, y)) {
			this.deselect();
		}
	};

	DNJellyButton.prototype.hitTestSmart = function(x, y) {
		if (!this.enabled) {
			return;
		}

		if (!this.parent || !this.visible) {
			return false;
		}

		var pos = this.picture.localToGlobal(0, 0);

		pos.x /= Constants.SCREEN_SCALE;
		pos.y /= Constants.SCREEN_SCALE;

		var w = this.picture.getBounds().width * 0.6 * this.scaleX;
		var h = this.picture.getBounds().height * 0.6 * this.scaleY;

		return pos.x < x + w && pos.x > x - w && pos.y < y + h && pos.y > y - h;
	};

	DNJellyButton.prototype.setEnabled = function(enabled) {
		this.enabled = enabled;
	};
	return DNJellyButton;
})(DNGUIObject);

// 进入前的加载进度条（沙与金：金色渐变 + 刻度，埃及题材）
//
// 版面（以容器原点为 0，PreloaderState 会把整组摆到画面正中央）：
//   y=-36  小字 L O A D I N G
//   y=-2   大号百分比
//   y=46   刻度（走过的换成金色并拉长）
//   y=62   胶囊状轨道 + 金色填充
//
// 所有颜色都收在下面的色票常量里，不再由外部传参；换主题只改色票，不必动结构。
var DNLoadingBar = (function(_super) {
	__extends(DNLoadingBar, _super);

	// 版面尺寸全部集中在这里，之后要微调只改这行
	var BAR_W = 300; // 轨道宽度
	var BAR_H = 16; // 轨道高度
	var BAR_Y = 62; // 轨道上缘
	var BAR_R = 8; // 圆角半径
	var TICK_COUNT = 24; // 刻度间隔数（实际画 25 根）
	var TICK_TOP = 46; // 刻度上缘
	var TICK_H_DIM = 7; // 还没走到的刻度长度
	var TICK_H_LIVE = 12; // 已走过的刻度长度
	// 沙与金的色票：这套样式的识别色全集中在这里，要换色改这几行就好
	var C_LABEL = "#a98a55"; // 小字标题
	var C_PERCENT = "#f4e0b6"; // 百分比
	var C_TRACK = "#1b1409"; // 轨道底色（深褐，像刻在石头上的沟槽）
	var C_RIM = "rgba(150,115,60,0.85)"; // 轨道细边
	var C_TICK_DIM = "rgba(120,96,56,0.45)"; // 还没走到的刻度（压暗，不抢眼）
	var C_TICK_LIVE = "rgba(245,196,92,0.85)"; // 已走过的刻度
	var C_GOLD = ["#ffeab8", "#f5c25c", "#d98a2a"]; // 填充渐层：米白 → 金 → 铜
	var C_SHEEN = "rgba(255,246,214,0.55)"; // 填充上缘的亮线
	var C_HEAD = "#ffd678"; // 前端光点（比填充亮一阶，才像在发光）

	// back_color 只拿来做遮罩底色；其余颜色全部走上面的色票，
	// 这样换主题不必再追着四个参数跑
	function DNLoadingBar(back_color) {
		_super.call(this);

		this.maxWidth = BAR_W;
		this.deltaY = BAR_H;
		this._liveCount = -1;

		// 遮罩：把背后还在跑的画面盖成一块底色（沿用原本的做法）
		this.overrideBar = new createjs.Shape();
		this.overrideBar.graphics.beginFill(back_color);
		this.overrideBar.graphics.drawRect(-BAR_W / 2 - 8, -70, BAR_W + 16, 200);
		this.overrideBar.graphics.endFill();
		this.addChild(this.overrideBar);

		// 小字标题
		this.labelLoading = new createjs.Text("L O A D I N G", "13px Georgia, serif", C_LABEL);
		this.labelLoading.textAlign = "center";
		this.labelLoading.y = -36;
		this.addChild(this.labelLoading);

		// 百分比：画面上真正的主角，用衬线体才有沙与金的古典感
		this.labelPercentDownload = new createjs.Text("0%", "bold 40px Georgia, serif", C_PERCENT);
		this.labelPercentDownload.textAlign = "center";
		this.labelPercentDownload.y = -2;
		this.addChild(this.labelPercentDownload);

		// 刻度：先铺一层暗的当底，再逐根叠上金色（金色那批一开始全部隐藏）
		// 不用遮罩裁切，是因为进度推进时只要切 visible，不必每帧重绘图形
		this.ticksDim = new createjs.Shape();
		this.tickLights = [];
		for (var i = 0; i <= TICK_COUNT; i++) {
			var tx = -BAR_W / 2 + BAR_W * (i / TICK_COUNT);

			this.ticksDim.graphics.beginFill(C_TICK_DIM).drawRect(tx - 1, TICK_TOP, 2, TICK_H_DIM);

			var live = new createjs.Shape();
			live.graphics.beginFill(C_TICK_LIVE).drawRect(tx - 1, TICK_TOP, 2, TICK_H_LIVE);
			live.visible = false;
			this.addChild(live);
			this.tickLights.push(live);
		}
		this.addChild(this.ticksDim);

		// 轨道：深褐底 + 细金边，像刻在石头上的沟槽
		var track = new createjs.Shape();
		track.graphics.beginFill(C_TRACK);
		track.graphics.drawRoundRect(-BAR_W / 2, BAR_Y, BAR_W, BAR_H, BAR_R);
		this.addChild(track);

		var rim = new createjs.Shape();
		rim.graphics.beginStroke(C_RIM).setStrokeStyle(1);
		rim.graphics.drawRoundRect(-BAR_W / 2, BAR_Y, BAR_W, BAR_H, BAR_R);
		this.addChild(rim);

		// 填充与上缘亮线：宽度跟着进度变，所以在 setProgress 里重建
		this.loadingShape = new createjs.Shape();
		this.addChild(this.loadingShape);

		this.sheen = new createjs.Shape();
		this.addChild(this.sheen);

		// 前端光点：外圈淡、内圈实，两层就够了，太多层在低阶手机会糊
		this.headGlow = new createjs.Shape();
		this.headGlow.graphics.beginFill(C_HEAD).drawCircle(0, 0, 11);
		this.headGlow.alpha = 0.16;
		this.addChild(this.headGlow);

		this.headDot = new createjs.Shape();
		this.headDot.graphics.beginFill(C_HEAD).drawCircle(0, 0, 3.85);
		this.addChild(this.headDot);

		this.setProgress(0);
	}

	// 启动时加载进度讯息
	DNLoadingBar.prototype.setProgress = function(progress) {
		progress = Math.max(0, Math.min(1, progress));
		var percent = Math.round(progress * 100);

		this.labelPercentDownload.text = percent + "%";

		// 刻度：走过的换成金色那根。只在跨越刻度时才动，避免每一帧都扫一遍
		var liveCount = Math.floor(progress * TICK_COUNT + 0.000001);
		if (liveCount !== this._liveCount) {
			for (var i = 0; i < this.tickLights.length; i++) {
				this.tickLights[i].visible = i <= liveCount;
			}
			this._liveCount = liveCount;
		}

		// 填充：宽度变了要重建图形，右端才是圆的
		// （若用 scaleX 拉，圆角会被横向压成椭圆形，一看就知道是硬拉伸的）
		var w = BAR_W * progress;
		this.loadingShape.graphics.clear();
		// 百分比四舍五入到 0 时整条不画，否则文字写着 0%、左端却冒出细金条，像坏了
		if (percent > 0) {
			this.loadingShape.graphics.beginLinearGradientFill(C_GOLD, [0, 0.55, 1], -BAR_W / 2, 0, BAR_W / 2, 0);
			this.loadingShape.graphics.drawRoundRect(-BAR_W / 2, BAR_Y, w, BAR_H, Math.min(BAR_R, w / 2));
			this.loadingShape.graphics.endFill();
		}

		// 上缘亮线：让金色有厚度；进度太短时画不出来，直接跳过
		this.sheen.graphics.clear();
		if (w > 8) {
			this.sheen.graphics.beginFill(C_SHEEN);
			this.sheen.graphics.drawRoundRect(-BAR_W / 2 + 1, BAR_Y + 2, w - 2, 3, 2);
			this.sheen.graphics.endFill();
		}

		// 前端光点：0% 时藏起来，不然轨道左端会莫名其妙亮一颗
		var showHead = percent > 0;
		this.headGlow.visible = showHead;
		this.headDot.visible = showHead;
		if (showHead) {
			var hx = -BAR_W / 2 + w - 3;
			this.headGlow.x = hx;
			this.headGlow.y = BAR_Y + BAR_H / 2;
			this.headDot.x = hx;
			this.headDot.y = BAR_Y + BAR_H / 2;
		}
	};

	return DNLoadingBar;
})(createjs.Container);

// LOGO占位
var DNLogoPlaceholder = (function(_super) {
	__extends(DNLogoPlaceholder, _super);

	function DNLogoPlaceholder(max_width, max_height) {
		_super.call(this);
		this.scaleCalculated = false;

		this.maxWidth = max_width;
		this.maxHeight = max_height;

		// 廣告設定保留點擊網址來源；輪播播放器等圖片就緒後由 _ensureCarousel 接上，
		// 圖片缺失或播放器建不起來時，兜底顯示靜態 logo.png
		this.ad = (typeof Ads !== "undefined") ? Ads.pickRandom() : null;
		this.carousel = null;
		this.visible = true;

		if (Constants.DEBUG_MODE) {
			var shape = new createjs.Shape();
			shape.graphics.beginFill("#ff0000");
			shape.graphics.drawRect(0, 0, max_width, max_height);
			shape.graphics.endFill();

			shape.x = -max_width / 2;
			shape.y = -max_height / 2;

			this.addChild(shape);
		} else {
			this.player = null;
			this.picture = null;
			this._ensurePicture();
		}

		this.calcScale();
	}
	DNLogoPlaceholder.prototype.calcScale = function() {
		// 輪播容器：以目前播放器圖框邊界等比縮進槽位上限
		if (this.carousel && this.carousel.player && this.carousel.player.container) {
			try {
				var cb = this.carousel.player.container.getBounds();
				if (cb) {
					var cScale = Math.min(this.maxWidth / cb.width, this.maxHeight / cb.height);
					if (cScale < 1) {
						this.carousel.container.scaleX = this.carousel.container.scaleY = cScale;
					}
				}
			} catch (e) {
				console.log("error, logo placeholder carousel scale");
			}
			return;
		}

		if (!this.scaleCalculated) {
			if (!this.picture || !this.picture.getBounds()) {
				return;
			}

			try {
				var scale = Math.min(this.maxWidth / this.picture.getBounds().width, this.maxHeight / this
					.picture.getBounds().height);
				if (scale < 1) {
					this.picture.scaleX = this.picture.scaleY = scale;
				}

				this.scaleCalculated = true;
			} catch (e) {
				console.log("error, logo placeholder pic");
			}
		}
	};

	// 輪播層延遲建立：建構時廣告圖可能還沒預載完成，每幀 update 重試；
	// 至少一筆廣告圖可取得後才開 carousel，否則續用靜態 logo 兜底。
	DNLogoPlaceholder.prototype._ensureCarousel = function() {
		if (this.carousel) {
			return;
		}
		if (typeof Ads === "undefined" || !Ads.list || !Ads.list.length) {
			return;
		}
		if (typeof DNAssetsManager === "undefined" || !DNAssetsManager.g_instance) {
			return;
		}

		var assets = DNAssetsManager.g_instance;
		var ready = null;
		for (var i = 0; i < Ads.list.length; i++) {
			if (assets.getResult(Ads.list[i].image)) {
				ready = Ads.list[i];
				break;
			}
		}
		if (!ready) {
			this._ensurePicture();
			return;
		}

		var carousel = Ads.createCarousel();
		carousel.start();
		if (!carousel.player || !carousel.player.container) {
			// 圖已在但圖組規格無效（播放器建不起來），退回靜態 logo
			this._ensurePicture();
			return;
		}

		this.carousel = carousel;
		this.ad = carousel.ad;
		if (this.picture) {
			this.removeChild(this.picture);
			this.picture = null;
		}
		this.addChild(carousel.container);
		this.scaleCalculated = false;
	};

	// 靜態 logo 圖層延遲建立：讀取頁占位建構時 g_instance 還沒就緒，
	// 每幀 update 重試，等資源管理器與圖片結果都到位再掛上。
	DNLogoPlaceholder.prototype._ensurePicture = function() {
		if (this.picture) {
			return;
		}
		if (typeof DNAssetsManager === "undefined" || !DNAssetsManager.g_instance) {
			return;
		}

		var assets = DNAssetsManager.g_instance;
		if (!assets.getResult(Images.LOGO)) {
			return;
		}

		var probe = assets.getImage(Images.LOGO);
		if (!probe || !probe.getBounds()) {
			return;
		}

		this.picture = assets.getCenteredImageWithProxy(Images.LOGO);
		if (this.picture) {
			this.addChild(this.picture);
		}
		this.scaleCalculated = false;
	};

	DNLogoPlaceholder.prototype.update = function(dt) {
		_super.prototype.update.call(this, dt);

		this._ensureCarousel();
		if (!this.carousel || !this.carousel.player || !this.carousel.player.container) {
			// 輪播尚未就緒／播放器缺失：移出並銷毀空殼輪播，退回靜態 logo 兜底，下幀再重試
			if (this.carousel) {
				if (this.carousel.container && this.carousel.container.parent) {
					this.removeChild(this.carousel.container);
				}
				this.carousel.destroy();
				this.carousel = null;
			}
			this._ensurePicture();
		}
		this.calcScale();
	};

	DNLogoPlaceholder.prototype.onMouseDown = function(x, y) {
		if (this.hitTestSmart(x, y)) {
			if (this.carousel) {
				this.carousel.openLink();
				return;
			}
			DNGameConfig.openUrl(this.ad ? this.ad.url : null);
		}
	};

	DNLogoPlaceholder.prototype.onDead = function() {
		if (this.carousel) {
			this.carousel.destroy();
			this.carousel = null;
		}
		_super.prototype.onDead.call(this);
	};

	DNLogoPlaceholder.prototype.hitTestSmart = function(x, y) {
		if (!this.parent || !this.visible) {
			return false;
		}

		var hitPic = this.picture || (this.carousel && this.carousel.player && this.carousel.player.container);
		if (!hitPic || !hitPic.getBounds()) {
			return false;
		}

		var pos = this.localToGlobal(0, 0);

		pos.x /= Constants.SCREEN_SCALE;
		pos.y /= Constants.SCREEN_SCALE;

		var w = hitPic.getBounds().width * 0.5 * this.scaleX;
		var h = hitPic.getBounds().height * 0.5 * this.scaleY;

		return pos.x < x + w && pos.x > x - w && pos.y < y + h && pos.y > y - h;
	};
	return DNLogoPlaceholder;
})(DNGUIObject);

/// <reference path="references.ts" />
var DNPlaceholder = (function(_super) {
	__extends(DNPlaceholder, _super);

	function DNPlaceholder() {
		_super.call(this);
	}
	return DNPlaceholder;
})(DNGUIObject);

// 語言按鈕：對應 all 圖集 35~38 格（cn／tw／en／ja），可點擊切換語系；
// 目前語系保持原亮，其餘調暗提示未選中。
var DNLangPlaceholderButton = (function(_super) {
	__extends(DNLangPlaceholderButton, _super);

	function DNLangPlaceholderButton(name, placeholderW, placeholderH, callback) {
		_super.call(this);
		this.enabled = true;
		this.func = null;
		this.wasHandlerThisFrame = false;
		this.placeholderW = placeholderW || 72;
		this.placeholderH = placeholderH || 72;
		this.picture = DNAssetsManager.g_instance.getCenteredImageWithProxy(name);
		this.addChild(this.picture);
		this.func = callback || null;
	}

	DNLangPlaceholderButton.prototype.setHandler = function(callback) {
		this.func = callback;
	};

	// selected=true 為目前語系（原亮）；其餘按鈕調暗
	DNLangPlaceholderButton.prototype.setSelected = function(selected) {
		if (this.picture) {
			this.picture.alpha = selected ? 1.0 : 0.45;
		}
	};

	DNLangPlaceholderButton.prototype.onMouseDown = function(x, y) {
		if (this.hitTestSmart(x, y)) {
			this.wasHandlerThisFrame = false;
			if (!DNGUIObject.wasHandlerThisFrame) {
				DNGUIObject.wasHandlerThisFrame = true;
				this.wasHandlerThisFrame = true;
				if (this.func) this.func();
				DNSoundManager.g_instance.play(Sounds.CLICK);
			}
		}
	};

	DNLangPlaceholderButton.prototype.onMouseMove = function(x, y) {};
	DNLangPlaceholderButton.prototype.onMouseUp = function(x, y) {};

	DNLangPlaceholderButton.prototype.hitTestSmart = function(x, y) {
		if (!this.enabled || !this.parent || !this.visible) {
			return false;
		}

		var bounds = this.picture && this.picture.getBounds ? this.picture.getBounds() : null;
		var w = bounds ? bounds.width * 0.5 * this.scaleX : this.placeholderW * 0.5;
		var h = bounds ? bounds.height * 0.5 * this.scaleY : this.placeholderH * 0.5;

		var pos = this.localToGlobal(0, 0);
		pos.x /= Constants.SCREEN_SCALE;
		pos.y /= Constants.SCREEN_SCALE;

		return pos.x < x + w && pos.x > x - w && pos.y < y + h && pos.y > y - h;
	};

	return DNLangPlaceholderButton;
})(DNGUIObject);

// 进度条（游戏/剩余时间）
var DNProgressBar = (function(_super) {
	__extends(DNProgressBar, _super);

	function DNProgressBar(back, front) {
		_super.call(this);
		this.shape = new createjs.Shape();
		this.width = 0;

		if (back) {
			this.addChild(DNAssetsManager.g_instance.getImage(back));
		}

		var front_pic = DNAssetsManager.g_instance.getImage(front);
		this.addChild(front_pic);
		this.width = front_pic.getBounds().width;

		this.shape.graphics.beginFill("#000000");
		this.shape.graphics.drawRect(0, 0, front_pic.getBounds().width, front_pic.getBounds().height);
		this.shape.graphics.endFill();
		front_pic.mask = this.shape;
	}
	DNProgressBar.prototype.setProgress = function(progress) {
		if (progress > 1) {
			progress = 1;
		}

		this.shape.x = (progress - 1) * this.width;
	};
	return DNProgressBar;
})(DNGUIObject);

// 静态图片
var DNStaticPicture = (function(_super) {
	__extends(DNStaticPicture, _super);

	function DNStaticPicture(name) {
		_super.call(this);

		this.pictureName = name;
		this.picture = DNAssetsManager.g_instance.getCenteredImageWithProxy(name);
		this.addChild(this.picture);
	}

	// 語系切換後重建內層圖：all 圖集已重載，依原圖名重新取新語系 Sprite/Bitmap。
	DNStaticPicture.prototype.refreshPicture = function() {
		if (this.picture && this.picture.parent) {
			this.picture.parent.removeChild(this.picture);
		}
		this.picture = DNAssetsManager.g_instance.getCenteredImageWithProxy(this.pictureName);
		this.addChild(this.picture);
	};
	return DNStaticPicture;
})(DNGUIObject);

// 音量滑桿：軌道（slider）＋拖曳鈕（slider_btn），支援點擊定位與按住拖曳；
// value 為 0~1，改動時回呼 onChange(value)。座標以舞台 700×800 為準。
var DNVOLSlider = (function(_super) {
	__extends(DNVOLSlider, _super);

	function DNVOLSlider(x, y, value, onChange) {
		_super.call(this);
		this.onChange = onChange || function() {};
		this.dragging = false;

		// 軌道圖片（getCenteredImageWithProxy 已把原點置中）
		this.track = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.SLIDER);
		this.addChild(this.track);

		var track_bounds = this.track.getBounds();
		this.trackW = track_bounds ? track_bounds.width : 322;
		this.trackH = track_bounds ? track_bounds.height : 22;

		// 滑桿鈕（置中原點）
		this.btn = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.SLIDER_BTN);
		this.addChild(this.btn);

		this.x = x;
		this.y = y;
		this.setValue(value);
	}

	DNVOLSlider.prototype.setValue = function(value) {
		value = Math.max(0, Math.min(1, parseFloat(value) || 0));
		this.value = value;
		// 鈕沿軌道水平移動，左右各保留半個鈕寬的邊距，避免鈕貼出軌道外
		this.btn.x = (value - 0.5) * this.trackW;
	};

	DNVOLSlider.prototype._displayW = function() {
		return this.trackW * (this.scaleX || 1);
	};

	DNVOLSlider.prototype._valueFromX = function(x) {
		var pos = this.localToGlobal(0, 0);
		pos.x /= Constants.SCREEN_SCALE;
		var localX = x - pos.x;
		return Math.max(0, Math.min(1, localX / this._displayW() + 0.5));
	};

	DNVOLSlider.prototype._hitTrack = function(x, y) {
		var pos = this.localToGlobal(0, 0);
		pos.x /= Constants.SCREEN_SCALE;
		pos.y /= Constants.SCREEN_SCALE;
		var halfW = this._displayW() / 2;
		var halfH = this.trackH * (this.scaleY || 1) / 2;
		return x >= pos.x - halfW && x <= pos.x + halfW && y >= pos.y - halfH && y <= pos.y + halfH;
	};

	DNVOLSlider.prototype.onMouseDown = function(x, y) {
		if (this._hitTrack(x, y)) {
			this.dragging = true;
			this.setValue(this._valueFromX(x));
			this.onChange(this.value);
			DNGUIObject.wasHandlerThisFrame = true;
		}
	};

	DNVOLSlider.prototype.onMouseMove = function(x, y) {
		if (this.dragging) {
			this.setValue(this._valueFromX(x));
			this.onChange(this.value);
		}
	};

	DNVOLSlider.prototype.onMouseUp = function(x, y) {
		this.dragging = false;
	};

	return DNVOLSlider;
})(DNGUIObject);

// 等比縮放鋪滿的背景圖（cover）
// 用途：主選單這種滿版背景。原圖可能不是 700×800 的比例（例如 1024×1024），
// 照原尺寸 1:1 貼上去會被 canvas 裁掉一大圈（等於放大看中間一塊）；
// 這裡改成先算一個等比縮放比，讓圖剛好蓋滿目標框，長寬比不變、絕不拉扁。
// 多出來的那一邊要裁多少、往哪邊靠，交給 fit_align（left / center / right）
// 和 fit_offset_x / fit_offset_y（像素級偏移）決定。
var DNFitPicture = (function(_super) {
	__extends(DNFitPicture, _super);

	/**
	 * name：圖檔名（Images.XXX）
	 * target_width / target_height：要鋪滿的框，單位是舞台座標（預設 700×800）
	 * align：left（靠左，裁掉右邊）/ center（置中，左右各裁一半）/ right（靠右，裁掉左邊）
	 * offset_x / offset_y：在對位結果上再推的偏移量，單位是舞台像素（等同畫面像素），正值往右、往下
	 */
	function DNFitPicture(name, target_width, target_height, align, offset_x, offset_y) {
		_super.call(this);

		var image = DNAssetsManager.g_instance.getCenteredImage(name);
		var bounds = image.getBounds();

		// 圖沒載到或尺寸為 0 時不硬算，直接把原圖掛上去，避免整塊背景消失
		if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
			console.warn("背景圖尺寸異常，改用原尺寸：" + name);
			this.addChild(image);
			return;
		}

		// 對位與等比縮放的算式集中在 applyFit，影片層也用同一份，選項只需要調一處
		DNFitPicture.applyFit(image, bounds.width, bounds.height, target_width, target_height,
			align, offset_x, offset_y);

		this.addChild(image);
	}

	/**
	 * 共用的等比鋪滿 + 對位算式（圖片層與影片層共用）
	 * bitmap：要擺放的 createjs.Bitmap（或任何有 scaleX / scaleY / x / y 的顯示物件）
	 * source_width / source_height：來源的原始寬高（圖片用 getBounds，影片用 videoWidth / videoHeight）
	 * 回傳：{ scale, width, height, x, y }，方便呼叫端寫 log 或做後續判斷
	 */
	DNFitPicture.applyFit = function(bitmap, source_width, source_height, target_width, target_height,
		align, offset_x, offset_y) {
		// 取兩軸中較大的縮放比 → 兩個方向都蓋滿（cover）；
		// scaleX 與 scaleY 用同一個值，長寬比維持不變
		var fit_scale = Math.max(target_width / source_width, target_height / source_height);

		bitmap.scaleX = fit_scale;
		bitmap.scaleY = fit_scale;

		// 縮放後圖在舞台上的實際寬高
		var draw_width = source_width * fit_scale;
		var draw_height = source_height * fit_scale;

		// 對位模式：沒給或給了不認識的值，就回退到內建預設（預設靠左）
		var align_mode = align;
		if (align_mode !== "left" && align_mode !== "center" && align_mode !== "right") {
			align_mode = DNFitPicture.DEFAULT_ALIGN;
		}

		var dx = DNFitPicture.toOffset(offset_x, DNFitPicture.DEFAULT_OFFSET_X);
		var dy = DNFitPicture.toOffset(offset_y, DNFitPicture.DEFAULT_OFFSET_Y);

		// 容器原點落在「框的中心」，所以框的左邊界是 -target_width/2
		if (align_mode === "left") {
			// 左緣貼齊框的左緣 → 多出來的寬度全部裁在右邊
			bitmap.x = -target_width / 2;
		} else if (align_mode === "right") {
			// 右緣貼齊框的右緣 → 多出來的寬度全部裁在左邊
			bitmap.x = target_width / 2 - draw_width;
		} else {
			// 置中 → 左右各裁一半
			bitmap.x = -draw_width / 2;
		}

		// 垂直方向固定置中，再用 offset_y 上下微調
		bitmap.x += dx;
		bitmap.y = -draw_height / 2 + dy;

		return {
			scale: fit_scale,
			width: draw_width,
			height: draw_height,
			x: bitmap.x,
			y: bitmap.y
		};
	};

	/**
	 * 把外部設定轉成可用的像素值
	 * 沒給（undefined / null / 空字串）或不是數字時，回退到 fallback
	 */
	DNFitPicture.toOffset = function(value, fallback) {
		var n = parseFloat(value);
		return isNaN(n) ? fallback : n;
	};

	// ── 內建對位選項（改這三個值就能調整整個遊戲的預設，佈局那邊不用寫）──
	// DEFAULT_ALIGN：left / center / right
	DNFitPicture.DEFAULT_ALIGN = "left";
	// DEFAULT_OFFSET_X：水平偏移，正值往右、負值往左，單位像素
	DNFitPicture.DEFAULT_OFFSET_X = 0;
	// DEFAULT_OFFSET_Y：垂直偏移，正值往下、負值往上，單位像素
	DNFitPicture.DEFAULT_OFFSET_Y = 0;

	return DNFitPicture;
})(DNGUIObject);

// 等比縮放鋪滿的「影片」背景
// 對位算式直接沿用 DNFitPicture.applyFit，所以 fit_align / fit_offset_x / fit_offset_y
// 的意思跟圖片背景完全一樣，全域預設也共用 DNFitPicture.DEFAULT_ALIGN 那三個值。
// 播放方式有兩種，看有沒有指定「循環片段」：
//   A. 有 loop_video（推薦）：主片播一次 → 交棒給循環片段，讓瀏覽器原生 loop 一直播
//      長度直接讀檔案，不需要寫秒數；原生 loop 是解碼層連續的，接縫最乾淨
//   B. 沒有 loop_video：靠 loop_tail_ms 決定
//        loop_tail_ms = 0    → 整支播一次就停在最後一格
//        loop_tail_ms = 800  → 整支播一次後，只把最後 800 毫秒反覆重播
//        設定值 >= 影片總長   → 交給瀏覽器 loop，等於整支無限循環
// 底層另外留著原本的 jpg：影片還沒就緒、解不出來、或被瀏覽器擋掉自動播放時，畫面就靠它撐。
var DNVideoPicture = (function(_super) {
	__extends(DNVideoPicture, _super);

	/**
	 * video_src：主片路徑（播一次）；傳 null / 空字串時跳過主片，直接循環播放 loop_video_src
	 * loop_video_src：循環片段路徑（接在主片之後無限循環，長度直接讀檔案、不寫死）；沒有就傳 null
	 * loop_tail_ms：沒有循環片段時，尾段要重播幾毫秒（0 = 播完停在最後一格）
	 */
	function DNVideoPicture(video_src, target_width, target_height, align, offset_x, offset_y, loop_tail_ms,
		loop_video_src) {
		_super.call(this);

		var _this = this;

		this.target_width = target_width;
		this.target_height = target_height;
		this.align = align;
		this.offset_x = offset_x;
		this.offset_y = offset_y;
		this.ready = false; // 影片尺寸拿到了沒
		this.alive = true; // 這個物件還活著嗎（離開主選單後設 false，避免非同步 callback 亂打）

		// 尾段重播設定：網址參數 ?tail=... 優先，沒帶就照佈局設定，再沒有就用內建預設
		var tail_override = DNVideoPicture.getUrlTailOverride();
		this.loop_tail_ms = DNVideoPicture.toTailMs(tail_override !== null ? tail_override : loop_tail_ms,
			DNVideoPicture.DEFAULT_LOOP_TAIL_MS);
		this.tail_seconds = 0; // 換算成秒的尾段長度，metadata 到手後才會有值
		this.tail_enabled = false; // 目前是不是尾段重播模式
		this.tail_raf = null; // 尾段監看用的動畫幀回呼
		this.tail_cache = null; // 尾段第一幀的離屏畫布（回跳時用來擋 seek 的空窗）
		this.tail_cache_bitmap = null; // 上面那張畫布的顯示物件，蓋在影片層上
		this.tail_cache_ready = false;

		// video_src 為空（null / undefined / 空字串）：不建主片，直接走循環段一直循環。
		// 這是單影片重複播放的用法：只給 loop_video_src，主片傳 null 即可跳過開場。
		this.has_main_video = !!video_src;

		var video = null;
		if (this.has_main_video) {
			video = document.createElement("video");
			video.src = video_src;
			video.muted = true; // 一定要靜音：行動端才肯放行自動播放，也不會跟 SoundJS 搶聲音
			video.preload = "auto";
			video.loop = false; // 尾段重播由我們自己控，不交給瀏覽器（整支循環時才會改成 true）
			video.setAttribute("playsinline", ""); // iPhone 不要跳全螢幕播放器
			video.setAttribute("webkit-playsinline", ""); // 舊 WebView 認的是這個寫法
			video.setAttribute("muted", "");
			video.setAttribute("aria-hidden", "true");

			// 這支 video 只當「貼圖來源」：畫面外、1×1、透明、不吃點擊
			video.style.position = "fixed";
			video.style.left = "-9999px";
			video.style.top = "0px";
			video.style.width = "1px";
			video.style.height = "1px";
			video.style.opacity = "0";
			video.style.pointerEvents = "none";

			// 掛進 body：行動端對「沒掛在文件上的 video」解碼很不穩定
			document.body.appendChild(video);

			this.video = video;

			// 用影片當貼圖來源包成 Bitmap；metadata 還沒到之前先不畫，讓底層 jpg 頂著
			this.bitmap = new createjs.Bitmap(video);
			this.bitmap.visible = false;
			this.addChild(this.bitmap);
		} else {
			// 沒有主片：主片圖層留空，不佔解碼資源
			this.video = null;
			this.bitmap = null;
		}

		// ── 循環片段（選用）：雙緩衝 ping-pong ──
		// 為什麼要兩支：原生 loop 的做法是「播到尾端 → 把時間跳回 0 → 重開解碼」，
		// 那一下會頓一格（就是之前看到的循環接縫）。這裡改成兩支輪流上場：
		//   A 播到尾 → B 早就停在 0 秒把第一幀解好 → 顯示 B、收掉 A → A 趁接下來一整個循環的時間慢慢 seek 回 0。
		// 也就是「正在顯示的那一支永遠不做 seek」，所以接縫在畫面上消失。
		// 兩支都不設 loop，改由各自的 ended 事件輪流接手；長度一樣直接讀檔案，沒有寫死秒數。
		this.loop_video_src = loop_video_src || null;
		this.loop_videos = []; // [0] 主力、[1] 預備，輪流上場
		this.loop_bitmaps = []; // 兩支各自的顯示層，對位參數完全相同
		this.loop_zero = []; // 該支是不是「停在 0 秒、第一幀已解好」，可以上場
		this.loop_active = 0; // 目前上場的是哪一支
		this.loop_preload_ready = false; // 有沒有升級成完整預載
		this.switched = false; // 主片交棒了沒
		this.loop_waiting = false; // 是不是正在等循環片段就緒

		if (this.loop_video_src) {
			for (var loop_index = 0; loop_index < 2; loop_index++) {
				this.createLoopVideo(loop_index);
			}

			// 沒有主片、直接循環：循環段不用等到主片快播完才預載，開場就完整下載，
			// 第一幀解好後由 onLoopMaybeReady 直接交棒上場。
			if (!this.has_main_video) {
				this.loop_waiting = true;
				this.prepareLoopVideo();
			}
		}

		if (this.has_main_video) {
			video.addEventListener("loadedmetadata", function() {
				if (!_this.alive) {
					return;
				}
				_this.applyFit();
				_this.applyTailMode(); // 先決定播放方式

				if (_this.tail_enabled) {
					// 尾段模式：先花幾十毫秒把尾段首幀存成一張畫布，存好再從頭播
					// （這段時間影片層先隱藏，畫面由底層 jpg 頂著）
					_this.captureTailFrame();
				} else {
					_this.restart();
				}
			});

			// 解不出來（檔案壞、編碼不支援）就維持隱藏，畫面交給底層 jpg
			video.addEventListener("error", function() {
				console.warn("影片背景載入失敗，改用底層靜圖：" + video_src);
			});

			// 快到結尾時才把循環片段完整下載（避免兩支大檔一開始就搶頻寬）
			// 用 timeupdate 而不是 rAF：這裡只是提前預載，250ms 的精度對 3 秒的窗口來說完全夠，
			// 也省下一個每幀都在跑的監看。
			video.addEventListener("timeupdate", function() {
				if (!_this.alive || !_this.loop_video_src) {
					return;
				}

				var duration = video.duration;
				if (!duration || isNaN(duration)) {
					return;
				}

				if (duration - video.currentTime <= DNVideoPicture.LOOP_PRELOAD_AHEAD) {
					_this.prepareLoopVideo();
				}
			});

			// 播完之後的處理，取決於尾段設定
			video.addEventListener("ended", function() {
				if (!_this.alive) {
					return;
				}

				// 有循環片段：主片播完就交棒
				// 交棒點就抓在 ended 這一刻（不再提前 0.03 秒），所以主片的最後一格一定會播完，
				// 一格都不少；ended 之後 Chromium 會保留最後一格畫面，不會黑，等循環片段接手即可。
				if (_this.loop_video_src) {
					_this.switchToLoop();
					return;
				}

				// 尾段重播模式：正常情況 rAF 會在撞到結尾前就把時間拉回去，
				// 這裡是保險（例如切到背景時 rAF 被節流、或偶爾漏了一幀）
				if (_this.tail_enabled) {
					var duration = video.duration;
					if (duration && !isNaN(duration)) {
						_this.maskTailSeek(); // 先蓋上尾段首幀，再 seek，避免閃一格空白
						try {
							video.currentTime = duration - _this.tail_seconds;
						} catch (e) {}
					}
					var promise = video.play();
					if (promise && promise["catch"]) {
						promise["catch"](function() {});
					}
					return;
				}

				// 沒有尾段設定 → pause 之後 video 會保留最後一格畫面，Bitmap 每幀照畫這一格
				video.pause();
			});
		}
	}

	/**
	 * 拿到影片實際尺寸後才做等比鋪滿
	 * EaselJS 的 Bitmap 算邊界時讀的是 image.width / image.height，
	 * 所以 video 元素要先把 videoWidth / videoHeight 寫進這兩欄
	 */
	DNVideoPicture.prototype.applyFit = function() {
		var v = this.video;
		if (!v || !v.videoWidth || !v.videoHeight) {
			return null;
		}

		v.width = v.videoWidth;
		v.height = v.videoHeight;

		var result = DNFitPicture.applyFit(this.bitmap, v.videoWidth, v.videoHeight, this.target_width,
			this.target_height, this.align, this.offset_x, this.offset_y);

		this.bitmap.visible = true;
		this.ready = true;

		return result;
	};

	/**
	 * 決定播放方式（metadata 到手後呼叫；改設定時也可以再叫一次）
	 * 有循環片段 → 主片播一次後交棒，交給那一段原生 loop
	 * 沒有循環片段 → 看 loop_tail_ms：不重播（停在最後一格）／只重播尾段／整支循環
	 */
	DNVideoPicture.prototype.applyTailMode = function() {
		var v = this.video;
		if (!v || !this.alive) {
			return;
		}

		var duration = v.duration;
		if (!duration || isNaN(duration)) {
			return;
		}

		// 有循環片段：不用尾段重播那一套（seek 才有接縫，原生 loop 沒有）
		if (this.loop_video_src) {
			this.tail_enabled = false;
			this.tail_seconds = 0;
			this.stopTailWatch();
			v.loop = false;
			// 交棒與預載交給 timeupdate / ended 兩個事件處理，不再另外掛 rAF 監看
			return;
		}

		// 毫秒換成秒
		var tail_seconds = this.loop_tail_ms / 1000;

		// 設定比整支影片還長（或剛好等於）→ 等於整支循環，交給瀏覽器自己 loop 最無縫
		if (this.loop_tail_ms > 0 && tail_seconds >= duration) {
			this.tail_seconds = duration;
			this.tail_enabled = false;
			this.stopTailWatch();
			v.loop = true;
			return;
		}

		v.loop = false;
		this.tail_seconds = tail_seconds;
		this.tail_enabled = this.loop_tail_ms > 0;

		if (this.tail_enabled) {
			this.startTailWatch();
		} else {
			this.stopTailWatch();
		}
	};

	/**
	 * 建立第 index 支循環片段（0 = 主力、1 = 預備，輪流上場）
	 * 兩支都只是「畫面來源」：靜音、畫面外、1×1、不吃點擊。
	 * 刻意不設 loop：原生 loop 會自己 seek 回 0，那一下就是頓感的來源；
	 * 這裡靠各自的 ended 事件把棒子交給另一支。
	 */
	DNVideoPicture.prototype.createLoopVideo = function(index) {
		var _this = this;
		var lv = document.createElement("video");

		lv.src = this.loop_video_src;
		lv.muted = true;
		lv.preload = "metadata"; // 一開始只要尺寸，快到主片結尾才升級完整預載
		lv.loop = false; // 關鍵：不用原生 loop
		lv.setAttribute("playsinline", "");
		lv.setAttribute("webkit-playsinline", "");
		lv.setAttribute("muted", "");
		lv.setAttribute("aria-hidden", "true");
		lv.style.position = "fixed";
		lv.style.left = "-9999px";
		lv.style.top = "0px";
		lv.style.width = "1px";
		lv.style.height = "1px";
		lv.style.opacity = "0";
		lv.style.pointerEvents = "none";

		document.body.appendChild(lv);

		// 第一幀解出來了 → 這支可以隨時上場
		lv.addEventListener("loadeddata", function() {
			if (!_this.alive) {
				return;
			}

			_this.loop_zero[index] = true;
			_this.onLoopMaybeReady();
		});

		// 停在 0 秒的 seek 做完了 → 重新標記成可上場（背景 rewind 完成的通知）
		lv.addEventListener("seeked", function() {
			if (!_this.alive) {
				return;
			}

			if (lv.currentTime < 0.05) {
				_this.loop_zero[index] = true;
				_this.onLoopMaybeReady();
			}
		});

		// 自己這一段播完：換另一支上場（這就是 ping-pong 的棒次交接）
		lv.addEventListener("ended", function() {
			if (!_this.alive || _this.loop_videos[index] !== lv) {
				return;
			}

			if (_this.loop_active !== index) {
				return; // 已經換人了，這是舊棒次的殘響，忽略
			}

			_this.swapLoop();
		});

		lv.addEventListener("error", function() {
			console.warn("循環片段載入失敗（第 " + (index + 1) + " 支）：" + _this.loop_video_src);
		});

		this.loop_videos[index] = lv;
		this.loop_bitmaps[index] = null;
		this.loop_zero[index] = false;
	};

	/**
	 * 建立第 index 支的顯示層（對位參數跟主片、跟 jpg 完全同一套）
	 * 延後建立的理由跟主片一樣：EaselJS 的 Bitmap 算邊界要讀 image.width / height，
	 * 得等 metadata 到手、知道 videoWidth / videoHeight 之後才能算。
	 */
	DNVideoPicture.prototype.ensureLoopBitmap = function(index) {
		var lv = this.loop_videos[index];
		if (!lv || !lv.videoWidth || !lv.videoHeight) {
			return null;
		}

		if (this.loop_bitmaps[index]) {
			return this.loop_bitmaps[index];
		}

		lv.width = lv.videoWidth;
		lv.height = lv.videoHeight;

		var bitmap = new createjs.Bitmap(lv);
		bitmap.visible = false;
		DNFitPicture.applyFit(bitmap, lv.videoWidth, lv.videoHeight, this.target_width, this.target_height,
			this.align, this.offset_x, this.offset_y);

		this.addChild(bitmap); // 加在最後 → 蓋在 main 片那層之上

		this.loop_bitmaps[index] = bitmap;
		return bitmap;
	};

	/**
	 * 這支能不能上場：第一幀解好、停在 0 秒、而且真的有資料
	 */
	DNVideoPicture.prototype.isLoopUsable = function(index) {
		var lv = this.loop_videos[index];
		if (!lv) {
			return false;
		}

		// seeking 中的那一支不能算可用：seek 還沒落地時雖然 currentTime 已經是新值，
		// 但解碼器可能還交不出那一幀，硬切就會閃一格。
		return this.loop_zero[index] === true && !!lv.videoWidth && lv.readyState >= 2 && lv.seeking !== true;
	};

	/**
	 * 讓第 index 支從 0 秒起播（呼叫時它的畫面已經在台上了，所以不再動 seek）
	 */
	DNVideoPicture.prototype.playLoopVideo = function(index) {
		var lv = this.loop_videos[index];
		if (!lv) {
			return;
		}

		// 正常情况下它已經停在 0；防禦性處理萬一有偏差，也不要讓它從中間開始
		if (lv.currentTime > 0.05) {
			try {
				lv.currentTime = 0;
			} catch (e) {}
		}

		var promise = lv.play();
		if (promise && promise["catch"]) {
			promise["catch"](function() {}); // 被擋就維持目前畫面，不會壞掉
		}
		return promise;
	};

	/**
	 * 把第 index 支收回幕後並倒回 0 秒
	 * 這段 seek 是在「它已經不顯示」的前提下做的，所以不會閃；
	 * 而且它有整整一個循環的時間（end.mp4 約 4 秒多）可以慢慢做，下次上場前一定來得及。
	 */
	DNVideoPicture.prototype.rewindLoopVideo = function(index) {
		var lv = this.loop_videos[index];
		if (!lv) {
			return;
		}

		try {
			lv.pause();
		} catch (e) {}

		// 本來就停在 0 的話不會發生 seek，也就不會有 seeked 事件；
		// 這時候要是把就緒旗標清掉，這支就永遠上不了場了，所以直接保持原狀。
		if (lv.currentTime <= 0.05) {
			return;
		}

		this.loop_zero[index] = false; // 先標成不可用，seek 完成後由 seeked 事件改回來

		try {
			lv.currentTime = 0;
		} catch (e) {}
	};

	/**
	 * 只要有任何一支「變得可以上場」，就在這裡補動作：
	 * 還在等交棒 → 再試一次交棒；已經在循環 → 再試一次換棒
	 */
	DNVideoPicture.prototype.onLoopMaybeReady = function() {
		if (!this.alive || !this.loop_waiting) {
			return;
		}

		if (this.switched) {
			this.swapLoop();
		} else {
			this.switchToLoop();
		}
	};

	/**
	 * 把循環片段升級成完整預載（只在快輪到它時才做，避免一開始就兩支大檔搶頻寬）
	 * 兩支都升：第二支請求同一個網址，多數瀏覽器會直接吃 HTTP 快取，不會真的抓兩次。
	 */
	DNVideoPicture.prototype.prepareLoopVideo = function() {
		if (this.loop_preload_ready || !this.alive) {
			return;
		}

		this.loop_preload_ready = true;

		for (var i = 0; i < this.loop_videos.length; i++) {
			var lv = this.loop_videos[i];
			if (!lv) {
				continue;
			}

			lv.preload = "auto";

			try {
				// load() 會依 preload 開始下載，之後 loadeddata 會把 loop_zero 標起來
				lv.load();
			} catch (e) {}
		}
	};

	/**
	 * 交棒：主片播完的那一格之後，換成循環片段
	 * 做法是「先露、後收」（先把循環片段的第一幀顯示出來，再把主片收掉），
	 * 兩層都在 canvas 上、同一套對位，所以中間不會出現空白或黑閃。
	 */
	DNVideoPicture.prototype.switchToLoop = function() {
		if (this.switched || !this.alive) {
			return;
		}

		var av = this.video;
		if (!this.loop_video_src) {
			return;
		}

		// 沒有主片（單影片循環模式）：沒有主片可以停，直接把循環段推上台即可。
		if (!av) {
			// 循環片段還沒解出第一幀：先維持等待，等它就緒再切。
			if (!this.isLoopUsable(this.loop_active)) {
				this.loop_waiting = true;
				this.prepareLoopVideo();
				return;
			}

			var idx0 = this.loop_active;
			var bitmap0 = this.ensureLoopBitmap(idx0);
			if (!bitmap0) {
				this.loop_waiting = true;
				return;
			}

			bitmap0.visible = true;

			this.switched = true;
			this.loop_waiting = false;
			this.ready = true; // 循環段已上場，後續 restart 可以正常重置循環段
			this.stopTailWatch();

			this.playLoopVideo(idx0);
			return;
		}

		// 循環片段還沒解出第一幀：先讓主片停在最後一格（畫面不會黑），等它就緒再切。
		// 順手把預載推上去，避免設定成 metadata 時一直等不到資料。
		if (!this.isLoopUsable(this.loop_active)) {
			this.loop_waiting = true;
			this.prepareLoopVideo();
			return;
		}

		var idx = this.loop_active;
		var bitmap = this.ensureLoopBitmap(idx);
		if (!bitmap) {
			this.loop_waiting = true;
			return;
		}

		// 先露、後收
		bitmap.visible = true;
		this.bitmap.visible = false;

		this.switched = true;
		this.loop_waiting = false;
		this.stopTailWatch();

		try {
			av.pause(); // 主片停在最後一格，不再佔用解碼
		} catch (e) {}

		this.playLoopVideo(idx);
	};

	/**
	 * 換棒：目前這支播完，改由另一支從 0 秒接手
	 * 換完之後，剛下場的那一支在幕後 rewind，等下下輪再上場。
	 */
	DNVideoPicture.prototype.swapLoop = function() {
		if (!this.alive || !this.switched) {
			return;
		}

		var cur_index = this.loop_active;
		var next_index = 1 - cur_index;

		// 下一支還沒準備好 → 目前這支停在最後一格撐著（不黑，只是定住一兩格），等它就緒
		if (!this.isLoopUsable(next_index)) {
			this.loop_waiting = true;
			return;
		}

		var next_bitmap = this.ensureLoopBitmap(next_index);
		if (!next_bitmap) {
			this.loop_waiting = true;
			return;
		}

		var cur_bitmap = this.loop_bitmaps[cur_index];

		// 同一幀的時間點換人：先露新的，再收舊的，畫面沒有空窗
		next_bitmap.visible = true;
		if (cur_bitmap) {
			cur_bitmap.visible = false;
		}

		this.loop_active = next_index;
		this.loop_waiting = false;

		this.playLoopVideo(next_index);

		// 下場的那一支馬上開始在幕後倒帶，等下下輪
		this.rewindLoopVideo(cur_index);
	};

	/**
	 * 把「尾段的第一幀」預先畫成一張離屏畫布
	 * 為什麼要這個：每次回跳都是一次 seek，seek 那幾毫秒影片交不出新畫面，
	 * canvas 上就會閃一格空白（就是你看到的閃爍）。先把尾段首幀存起來，
	 * 回跳時改畫這一張，畫面看到的是「本來就該出現的那一格」，所以就接上了。
	 * 抓完才起播，所以啟動時會多花幾十毫秒（這段時間由底層 jpg 頂著，兩張幾乎一樣看不出來）。
	 */
	DNVideoPicture.prototype.captureTailFrame = function() {
		var _this = this;
		var v = this.video;

		if (!v || !this.alive || !this.tail_enabled) {
			// 沒有主片（單影片循環）時不走尾段抓幀；其餘情況 fallback 到 restart 重開
			if (v) {
				this.restart();
			}
			return;
		}

		var duration = v.duration;
		if (!duration || isNaN(duration)) {
			this.restart();
			return;
		}

		var tail_start = duration - this.tail_seconds;
		if (tail_start < 0) {
			tail_start = 0;
		}

		var finished = false;

		// seek 到位後才抓幀：這時 video 上就是尾段的第一幀
		var finish = function(capture) {
			if (finished) {
				return;
			}
			finished = true;
			v.removeEventListener("seeked", on_seeked);

			if (capture && _this.alive) {
				try {
					var canvas = document.createElement("canvas");
					canvas.width = v.videoWidth;
					canvas.height = v.videoHeight;
					canvas.getContext("2d").drawImage(v, 0, 0, canvas.width, canvas.height);

					var cache_bitmap = new createjs.Bitmap(canvas);
					cache_bitmap.visible = false;
					// 用同一套對位算式，位置跟影片層完全重合
					DNFitPicture.applyFit(cache_bitmap, canvas.width, canvas.height, _this.target_width,
						_this.target_height, _this.align, _this.offset_x, _this.offset_y);

					_this.tail_cache = canvas;
					_this.tail_cache_bitmap = cache_bitmap;
					_this.addChild(cache_bitmap); // 加在影片之後 → 蓋在影片層上
					_this.tail_cache_ready = true;
				} catch (e) {
					_this.tail_cache_ready = false;
					console.warn("尾段首幀快取失敗，回跳時可能還是會閃一下：" + e);
				}
			}

			_this.restart();
		};

		var on_seeked = function() {
			finish(true);
		};

		// 抓幀這一小段先不顯示影片層，免得進場時閃一下尾段畫面
		if (this.bitmap) {
			this.bitmap.visible = false;
		}

		v.addEventListener("seeked", on_seeked);
		// 保險：seeked 沒來（例如解碼失敗）也不要卡住，300 毫秒後照樣起播
		window.setTimeout(function() {
			finish(false);
		}, 300);

		try {
			v.currentTime = tail_start;
		} catch (e) {
			finish(false);
		}
	};

	/**
	 * 回跳遮罩：seek 的空窗期改畫「尾段第一幀」
	 * 沒有快取（例如抓幀失敗）就略過，行為回到原本那樣
	 */
	DNVideoPicture.prototype.maskTailSeek = function() {
		if (!this.tail_cache_ready || !this.tail_cache_bitmap) {
			return;
		}

		var _this = this;
		var v = this.video;
		if (!v) {
			return;
		}

		this.tail_cache_bitmap.visible = true;

		var restore = function() {
			v.removeEventListener("seeked", restore);
			if (!_this.alive) {
				return;
			}
			if (_this.tail_cache_bitmap) {
				_this.tail_cache_bitmap.visible = false;
			}
		};

		v.addEventListener("seeked", restore);
		// 保險：seeked 一直沒來也不要讓遮罩卡在畫面上
		window.setTimeout(restore, 400);
	};

	/**
	 * 尾段監看：每幀看一次播放時間，快撞到結尾時把時間拉回「結尾 - 尾段長度」
	 * 用 rAF 而不是 timeupdate，因為 timeupdate 只有約 250ms 精度，抓不準 800ms 這種細區間
	 */
	DNVideoPicture.prototype.startTailWatch = function() {
		var _this = this;
		if (this.tail_raf !== null || !this.alive || !this.tail_enabled) {
			return;
		}

		var raf = window.requestAnimationFrame || function(callback) {
			return window.setTimeout(callback, 16);
		};

		var tick = function() {
			if (!_this.alive || !_this.tail_enabled || !_this.video) {
				_this.tail_raf = null;
				return;
			}

			_this.tail_raf = raf(tick);

			var v = _this.video;
			var duration = v.duration;
			if (!duration || isNaN(duration)) {
				return;
			}

			// 提前約一個影格回跳：真的撞上 ended 的話，瀏覽器會先 pause，
			// 那一瞬間畫面可能閃一格空白，所以寧可早一點點跳
			if (v.currentTime >= duration - DNVideoPicture.TAIL_JUMP_MARGIN) {
				var tail_start = duration - _this.tail_seconds;

				// 先蓋上尾段首幀再 seek，遮住解碼空窗 → 就不會閃
				_this.maskTailSeek();

				try {
					v.currentTime = tail_start > 0 ? tail_start : 0;
				} catch (e) {}
			}
		};

		this.tail_raf = raf(tick);
	};

	DNVideoPicture.prototype.stopTailWatch = function() {
		if (this.tail_raf === null) {
			return;
		}

		var caf = window.cancelAnimationFrame || window.clearTimeout;
		caf(this.tail_raf);
		this.tail_raf = null;
	};

	/**
	 * 執行中改尾段設定（單位毫秒；0 = 播完停在最後一格）
	 * 回傳實際生效的值，方便呼叫端確認
	 */
	DNVideoPicture.prototype.setLoopTail = function(ms) {
		this.loop_tail_ms = DNVideoPicture.toTailMs(ms, DNVideoPicture.DEFAULT_LOOP_TAIL_MS);
		this.applyTailMode();
		return this.loop_tail_ms;
	};

	/**
	 * 從 0 秒開始播一次（重複進出主選單也能重新播）
	 */
	DNVideoPicture.prototype.restart = function() {
		var _this = this;
		var v = this.video;
		if (!this.alive) {
			return;
		}

		// 單影片循環模式（主片為 null）：沒有主片可以重播，直接重置循環段並從第 1 支起播。
		if (!v) {
			if (!this.loop_video_src) {
				return;
			}

			// 兩支循環片段都收掉畫面、暫停並倒回 0，棒次歸零，下次從第 1 支開始
			this.switched = false;
			this.loop_waiting = false;
			this.loop_active = 0;

			for (var li = 0; li < this.loop_bitmaps.length; li++) {
				if (this.loop_bitmaps[li]) {
					this.loop_bitmaps[li].visible = false;
				}
			}

			for (var lj = 0; lj < this.loop_videos.length; lj++) {
				this.rewindLoopVideo(lj);
			}

			// 循環段還沒解好第一幀：先標記等待，就緒後由 onLoopMaybeReady 交棒
			if (!this.isLoopUsable(0)) {
				this.loop_waiting = true;
				this.prepareLoopVideo();
				return;
			}

			var loop_bitmap = this.ensureLoopBitmap(0);
			if (!loop_bitmap) {
				this.loop_waiting = true;
				this.prepareLoopVideo();
				return;
			}

			loop_bitmap.visible = true;
			this.switched = true;
			this.loop_waiting = false;
			this.ready = true;

			var loop_promise = this.playLoopVideo(0);
			if (loop_promise && loop_promise["catch"]) {
				loop_promise["catch"](function() {
					if (!_this.alive) {
						return;
					}
					if (loop_bitmap) {
						loop_bitmap.visible = false;
					}
					_this.bindFirstGesture();
				});
			}
			return;
		}

		if (!this.ready) {
			return;
		}

		// 已經交棒給循環片段的，起播前先切回主片：
		// 兩支循環片段都收掉畫面、暫停並倒回 0，棒次也歸零，下次交棒從第 1 支開始
		if (this.switched || this.loop_waiting) {
			this.switched = false;
			this.loop_waiting = false;
			this.loop_active = 0;

			for (var i = 0; i < this.loop_bitmaps.length; i++) {
				if (this.loop_bitmaps[i]) {
					this.loop_bitmaps[i].visible = false;
				}
			}

			for (var j = 0; j < this.loop_videos.length; j++) {
				this.rewindLoopVideo(j);
			}
		}

		try {
			v.currentTime = 0;
		} catch (e) {
			// 部分舊 WebView 在 metadata 邊界會丟錯，不影響之後的 play
		}

		// 起播就把影片層露出來（抓尾段首幀時曾暫時隱藏過）
		if (this.ready && this.bitmap) {
			this.bitmap.visible = true;
		}

		var promise = v.play();
		if (promise && promise["catch"]) {
			// 被自動播放政策擋掉時（iPhone 低耗電模式很常見）：
			// 先退回 jpg，等玩家第一次碰畫面再試著播
			promise["catch"](function() {
				if (!_this.alive) {
					return;
				}
				if (_this.bitmap) {
					_this.bitmap.visible = false;
				}
				_this.bindFirstGesture();
			});
		}

		// 尾段重播模式：重新起播時把監看也接回來
		if (this.tail_enabled) {
			this.startTailWatch();
		}

		// 有循環片段：交棒與預載都由 timeupdate / ended 事件負責，這裡不需要再接監看
	};

	/**
	 * 註冊一次性「玩家碰畫面」重試，成功就自動卸掉監聽
	 */
	DNVideoPicture.prototype.bindFirstGesture = function() {
		var _this = this;
		if (this.gestureHandler) {
			return;
		}

		this.gestureHandler = function() {
			_this.unbindGesture();
			if (!_this.alive) {
				return;
			}

			// 單影片循環模式：沒有主片 bitmap，直接重試循環段即可
			if (!_this.video) {
				_this.restart();
				return;
			}

			if (!_this.ready) {
				return;
			}
			_this.bitmap.visible = true;
			_this.restart();
		};

		document.addEventListener("pointerdown", this.gestureHandler, true);
		document.addEventListener("touchstart", this.gestureHandler, true);
	};

	DNVideoPicture.prototype.unbindGesture = function() {
		if (!this.gestureHandler) {
			return;
		}
		document.removeEventListener("pointerdown", this.gestureHandler, true);
		document.removeEventListener("touchstart", this.gestureHandler, true);
		this.gestureHandler = null;
	};

	/**
	 * 離開主選單時呼叫：停掉、斷開來源、移除元素，把解碼資源還回去
	 */
	DNVideoPicture.prototype.destroy = function() {
		this.alive = false;
		this.unbindGesture();
		this.stopTailWatch();

		var v = this.video;
		if (v) {
			try {
				v.pause();
			} catch (e) {}
			v.removeAttribute("src");
			try {
				v.load(); // 斷開來源後重載，讓瀏覽器釋放解碼緩衝
			} catch (e) {}
			if (v.parentNode) {
				v.parentNode.removeChild(v);
			}
		}

		// 循環片段（兩支）也是同一個收法
		for (var i = 0; i < this.loop_videos.length; i++) {
			var lv = this.loop_videos[i];
			if (!lv) {
				continue;
			}

			try {
				lv.pause();
			} catch (e) {}

			lv.removeAttribute("src");

			try {
				lv.load(); // 斷開來源後重載，讓瀏覽器釋放解碼緩衝
			} catch (e) {}

			if (lv.parentNode) {
				lv.parentNode.removeChild(lv);
			}
		}

		this.video = null;
		this.bitmap = null;
		this.loop_videos = [];
		this.loop_bitmaps = [];
		this.loop_zero = [];
		this.loop_active = 0;
		this.switched = false;
		this.loop_waiting = false;
		this.tail_cache = null;
		this.tail_cache_bitmap = null;
		this.tail_cache_ready = false;
	};

	/**
	 * 把外部設定轉成可用的毫秒值
	 * 沒給（undefined / null / 空字串）、不是數字、或負數，都回退到 fallback
	 */
	DNVideoPicture.toTailMs = function(value, fallback) {
		var n = parseFloat(value);
		if (isNaN(n) || n < 0) {
			return fallback;
		}
		return n;
	};

	/**
	 * 網址參數覆寫：?tail=800 可以在不改程式、不重新建置的情況下試不同尾段長度
	 * 沒帶這個參數就完全照佈局設定走
	 */
	DNVideoPicture.getUrlTailOverride = function() {
		try {
			var match = /(?:^|[?&])tail=(-?\d+(?:\.\d+)?)/.exec(window.location.search || "");
			if (match) {
				return parseFloat(match[1]);
			}
		} catch (e) {
			// 某些舊環境沒有 window.location.search，直接忽略
		}
		return null;
	};

	// 內建預設尾段長度（毫秒）：0 = 播完停在最後一格，不重播
	DNVideoPicture.DEFAULT_LOOP_TAIL_MS = 0;
	// 尾段回跳的提前量（秒）：抓在真的 ended 之前一點，避免 pause → seek 之間閃一格空白
	DNVideoPicture.TAIL_JUMP_MARGIN = 0.04;
	// 主片剩這麼多秒時，才把循環片段完整預載（避免兩支大檔一開始就搶頻寬）
	// 交棒本身不靠提前量，改成 ended 事件精準觸發，所以舊的 SWITCH_MARGIN 已移除
	DNVideoPicture.LOOP_PRELOAD_AHEAD = 3;

	return DNVideoPicture;
})(DNGUIObject);

/// <reference path="references.ts" />
var DNStringManager = (function() {

	// 支援的語系清單；預設 cn。圖集 all 依語系拆成 all.cn / all.tw / all.en / all.ja.png
	var LANG_KEY = "eggshell_cat_language";
	var SUPPORTED_LANGS = ["cn", "tw", "en", "ja"];

	function _loadSavedLang() {
		try {
			var saved = window.localStorage.getItem(LANG_KEY);
			if (saved && SUPPORTED_LANGS.indexOf(saved) != -1) {
				return saved;
			}
		} catch (e) {}
		return "cn";
	}

	function _saveLang(lang) {
		try {
			window.localStorage.setItem(LANG_KEY, lang);
		} catch (e) {}
	}

	function DNStringManager() {
		this.container = new createjs.Container();
		this.strings = new Object();
		this.allStrings = null;
		this.allStrings = g_strings;

		// 預設語系：中文（cn）；有存過選擇則還原
		this.setLanguage(_loadSavedLang());
	}
	DNStringManager.getInstance = function() {
		return DNStringManager.g_instance;
	};

	DNStringManager.prototype.getString = function(string_id) {
		if (!this.strings) {
			return "!!!";
		}

		return this.strings[string_id] || "???";
	};

	DNStringManager.prototype.setLanguage = function(lang) {
		// 不合法的語系退回預設 cn，避免 allStrings[lang] 為空導致整包文字變 ???
		if (SUPPORTED_LANGS.indexOf(lang) == -1) {
			lang = "cn";
		}
		this.strings = this.allStrings[lang];
		this.language = lang;
		_saveLang(lang);
	};

	DNStringManager.prototype.getLanguagePrefix = function() {
		// 其餘美術素材沿用裸幀名；語系差異集中在 all 圖集檔名（見 resolveAtlasImage）
		return "";
	};

	// 依目前語系解析圖集來源圖檔名：all -> all.<lang>；其餘圖集名原樣回傳。
	// 回傳值會在資源管理器裡補 .png 副檔名，例如 all.cn.png。
	DNStringManager.prototype.resolveAtlasImage = function(atlasImageName) {
		if (atlasImageName == "all") {
			return "all." + this.language;
		}
		return atlasImageName;
	};


	DNStringManager.g_instance = new DNStringManager();
	return DNStringManager;
})();

// 结尾动画（例如：完成关卡！）
var EndRoundEffect = (function(_super) {
	__extends(EndRoundEffect, _super);

	function EndRoundEffect(name) {
		_super.call(this);
		this.stage = 0;

		this.addChild(DNAssetsManager.g_instance.getCenteredImageWithProxy(name));

		this.x = Constants.ASSETS_WIDTH / 2;
		this.y = 400;

		this.setScale(0);
		this.alpha = -1;

		createjs.Tween.get(this).wait(200).to({
			rotation: 360
		}, 700, createjs.Ease.cubicOut);
	}
	EndRoundEffect.prototype.update = function(dt) {
		_super.prototype.update.call(this, dt);

		switch (this.stage) {
			case 0: {
				this.alpha += dt * 4.0;

				this.setScale(this.scaleX + dt * 2);

				if (this.scaleX > 1.0) {
					this.setScale(1);

					this.alpha = 1;
					this.liveTime = 0;
					this.stage = 1;

					createjs.Tween.get(this).wait(1400).to({
						alpha: 0
					}, 500, createjs.Ease.linear);
				}
			}
			break;

			case 1: {
				this.setScale(1.0 + Math.sin(this.liveTime * 5.0) * 0.07);
			}
			break;
		}
	};

	EndRoundEffect.prototype.setScale = function(scale) {
		this.scaleX = this.scaleY = scale;
	};
	return EndRoundEffect;
})(DNGameObject);

/// <reference path="references.ts" />
var FlyingPoints = (function(_super) {
	__extends(FlyingPoints, _super);

	function FlyingPoints(value) {
		_super.call(this);
		this.delay = 0.2;
		this.wasShow = false;

		this.label = new DNTextField("p" + value.toString(), DNFontDef.SCORE_FONT);
		this.addChild(this.label);

		this.label.x = -this.label.getBounds().width / 2;
		this.label.y = -this.label.getBounds().height / 2;

		this.scaleX = this.scaleY = 0.1;
		this.visible = false;
	}
	FlyingPoints.prototype.getLabel = function() {
		return this.label;
	};

	FlyingPoints.prototype.update = function(dt) {
		this.delay -= dt;

		if (this.delay > 0) {
			return;
		} else {
			if (!this.wasShow) {
				this.wasShow = true;

				createjs.Tween.get(this).to({
					scaleX: 1,
					scaleY: 1
				}, 400, createjs.Ease.backOut);
				this.visible = true;
			}
		}

		_super.prototype.update.call(this, dt);

		if (this.liveTime > 0.5) {
			this.y -= dt * 70;

			this.alpha -= dt * 1.5;

			if (this.alpha <= 0) {
				this.kill();
			}
		}
	};
	return FlyingPoints;
})(DNGameObject);

/// <reference path="references.ts" />
// 工作階段：登入成功後保存帳號＋session token；localStorage 持久化，重整頁面後仍帶著。
// 後端重啟或 token 失效時，收到 401 由 GameData 清除，回到匿名本地模式。
var Session = (function() {
	var SESSION_KEY = "EGGSHELL_SESSION_V1";

	function current() {
		if (window.EGGSHELL_SESSION && window.EGGSHELL_SESSION.token) {
			return window.EGGSHELL_SESSION;
		}
		try {
			var raw = window.localStorage.getItem(SESSION_KEY);
			return raw ? JSON.parse(raw) : null;
		} catch (e) {
			return null;
		}
	}

	function persist(account, token) {
		var sess = { account: account, token: token };
		window.EGGSHELL_SESSION = sess;
		try {
			window.localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
		} catch (e) {}
	}

	function clear() {
		window.EGGSHELL_SESSION = null;
		try {
			window.localStorage.removeItem(SESSION_KEY);
		} catch (e) {}
	}

	return { get: current, persist: persist, clear: clear };
})();

var GameData = (function() {

	function GameData() {
		this.STARS_ITEM_NAME = "STARS_ITEM_NAME";
		this.SCORE_ITEM_NAME = "SCORE_ITEM_NAME1";
		this.LEVELS_COMPLETED_NAME = "LEVELS_COMPLETED_NAME";
		this.levelsCompleted = 0;
		this.scorePerLevel = [];
		this.starsPerLevel = [];
		this.levels = Levels.levels;
		this.sessionAccount = ""; // 已登入帳號；本地存檔鍵依帳號後綴區分，匿名留空
	}
	GameData.getInstance = function() {
		if (this.instance == null) {
			this.instance = new GameData();
		}

		return this.instance;
	};
	// 已登入時本地存檔鍵加上帳號後綴，不同帳號不共用；匿名沿用原始鍵名
	GameData.prototype._namespacedKey = function(base) {
		return this.sessionAccount ? base + ":" + this.sessionAccount : base;
	};
	// 在GameData对象原型上定义一个名为save的方法，用于保存游戏数据到浏览器的localStorage中。
	// FIXME 更改为储存至服务器
	GameData.prototype.save = function() {
		try {
			// 将levelsCompleted属性（一个数字或数组）转换为字符串，并保存到localStorage中，键名为this.LEVELS_COMPLETED_NAME。
			window.localStorage.setItem(this._namespacedKey(this.LEVELS_COMPLETED_NAME), this.levelsCompleted.toString()); // 已完成的关卡
			// 将starsPerLevel属性（一个对象或数组）转换为JSON字符串，并保存到localStorage中，键名为this.STARS_ITEM_NAME。
			window.localStorage.setItem(this._namespacedKey(this.STARS_ITEM_NAME), JSON.stringify(this.starsPerLevel)); // 关卡得星状态
			// 将scorePerLevel属性（一个对象或数组）转换为JSON字符串，并保存到localStorage中，键名为this.SCORE_ITEM_NAME。
			window.localStorage.setItem(this._namespacedKey(this.SCORE_ITEM_NAME), JSON.stringify(this.scorePerLevel)); // 关卡计分状态
		} catch (e) {
			// 如果在保存过程中发生错误，将错误信息保存在e变量中，但不进行任何操作或抛出错误。这是一种处理错误的常用方式，但也可能会隐藏某些问题。
		}
	};

	GameData.prototype.load = function() {
		try {
			for (var i = 0; i < GameData.getTotalLevels(); i++) {
				this.starsPerLevel.push(0);
				this.scorePerLevel.push(0);
			}

			if (window.localStorage.getItem(this._namespacedKey(this.STARS_ITEM_NAME))) {
				this.starsPerLevel = JSON.parse(window.localStorage.getItem(this._namespacedKey(this.STARS_ITEM_NAME)));
			}

			if (window.localStorage.getItem(this._namespacedKey(this.SCORE_ITEM_NAME))) {
				this.scorePerLevel = JSON.parse(window.localStorage.getItem(this._namespacedKey(this.SCORE_ITEM_NAME)));
			}

			//  unary "+" to convert string to number
			this.levelsCompleted = +window.localStorage.getItem(this._namespacedKey(this.LEVELS_COMPLETED_NAME)) || 0;
			// 一致性校正：LEVELS_COMPLETED_NAME 是「已通關關卡數」的唯一依據，
			// 未通關的關卡一律不得有星等，避免舊版或殘留 localStorage 讓地圖誤顯示金星。
			var need_fix = false;
			for (var k = 0; k < GameData.getTotalLevels(); k++) {
				if (k >= this.levelsCompleted && this.starsPerLevel[k]) {
					this.starsPerLevel[k] = 0;
					need_fix = true;
				}
			}
			if (need_fix) {
				this.save(); // 校正結果寫回，之後載入即為乾淨狀態
			}
		} catch (e) {}
	};

	GameData.prototype.onWinLevel = function(level, score, stars) {
		this.scorePerLevel[level] = Math.max(score, this.scorePerLevel[level]);
		this.starsPerLevel[level] = Math.max(stars, this.starsPerLevel[level]);
		if (level == this.levelsCompleted) {
			this.levelsCompleted = level + 1;

			if (this.levelsCompleted > GameData.getTotalLevels()) {
				this.levelsCompleted = GameData.getTotalLevels();
			}
		}

		this.save();
		this.pushToServer(); // 已登入才推送後端；匿名模式此呼叫內部直接略過
	};

	// 登入成功後綁定帳號：改讀該帳號的本地存檔，再拉伺服器存檔以伺服器為準覆蓋本地
	GameData.prototype.bindSession = function(account) {
		this.sessionAccount = account || "";
		this.load();
		this.syncFromServer();
	};

	// 登出後解绑：回到匿名本地存檔鍵（無帳號後綴），重新讀回匿名存檔
	GameData.prototype.unbindSession = function() {
		this.sessionAccount = "";
		this.load();
	};

	// 伺服器為準：下拉同步／上傳回包時，以伺服器存檔完整取代本地；
	// 本地快取（含離線尚未上傳的進度）不得壓過伺服器。分數擋負數，星等夾 0–3。
	GameData.prototype.applyServerSave = function(save) {
		if (!save) {
			return;
		}
		var total = GameData.getTotalLevels();
		var serverScores = save.scorePerLevel || [];
		var serverStars = save.starsPerLevel || [];

		this.scorePerLevel = [];
		this.starsPerLevel = [];
		for (var i = 0; i < total; i++) {
			var s = i < serverScores.length ? serverScores[i] : 0;
			var st = i < serverStars.length ? serverStars[i] : 0;
			this.scorePerLevel[i] = Math.max(0, s || 0);
			this.starsPerLevel[i] = Math.min(3, Math.max(0, st || 0));
		}

		this.levelsCompleted = Math.min(total, Math.max(0, save.levelsCompleted || 0));

		// 一致性校正：未通關關卡一律不得有星等
		for (var k = 0; k < total; k++) {
			if (k >= this.levelsCompleted && this.starsPerLevel[k]) {
				this.starsPerLevel[k] = 0;
			}
		}

		this.save();
	};

	// 開機／登入後拉伺服器存檔；401 表示 token 失效，清除 session 回到匿名本地模式
	GameData.prototype.syncFromServer = function() {
		var _this = this;
		var sess = Session.get();
		if (!sess || !sess.token) {
			return;
		}
		fetch("/api/save?token=" + encodeURIComponent(sess.token))
			.then(function(resp) {
				return resp.json().catch(function() {
					return {};
				}).then(function(data) {
					return { status: resp.status, data: data };
				});
			})
			.then(function(result) {
				if (result.status === 401) {
					Session.clear();
					return;
				}
				if (result.data && result.data.ok) {
					_this.applyServerSave(result.data.save);
				}
			})
			.catch(function() {});
	};

	// 過關後推送存檔；後端逐關取 max 寫回，回傳伺服器存檔後以其為準覆蓋本地
	GameData.prototype.pushToServer = function() {
		var _this = this;
		var sess = Session.get();
		if (!sess || !sess.token) {
			return;
		}
		fetch("/api/save/update", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				token: sess.token,
				levelsCompleted: this.levelsCompleted,
				scorePerLevel: this.scorePerLevel,
				starsPerLevel: this.starsPerLevel
			})
		}).then(function(resp) {
			return resp.json().catch(function() {
				return {};
			}).then(function(data) {
				return { status: resp.status, data: data };
			});
		}).then(function(result) {
			if (result.status === 401) {
				Session.clear();
				return;
			}
			if (result.data && result.data.ok) {
				_this.applyServerSave(result.data.save);
			}
		}).catch(function() {});
	};

	GameData.prototype.getTotalScore = function() {
		var total = 0;

		for (var i = 0; i < GameData.getTotalLevels(); i++) {
			total += this.scorePerLevel[i];
		}

		return total;
	};

	GameData.prototype.getTotalStars = function() {
		var count = 0;

		for (var i = 0; i < GameData.getTotalLevels(); i++) {
			count += this.getStarsByLevel(i);
		}

		return count;
	};

	GameData.prototype.getStarsByLevel = function(level) {
		return this.starsPerLevel[level];
	};

	GameData.prototype.levelsAvailable = function() {
		if (Constants.DEBUG_MODE) {
			return GameData.getTotalLevels();
		}

		return this.levelsCompleted + 1;
	};

	GameData.getTotalLevels = function() {
		return Levels.levels.length;
	};
	GameData.instance = null;
	return GameData;
})();

/// <reference path="references.ts" />
var Jellier = (function(_super) {
	__extends(Jellier, _super);

	function Jellier(obj, speed, delay, max_scale) {
		_super.call(this);
		this.jellyScale = 0.1;
		this.maxScale = 0.2;

		if (max_scale) {
			this.maxScale = max_scale;
		}

		this.origScale = obj.scaleX;

		this.speed = speed;
		this.obj = obj;

		this.delay = delay;
	}
	Jellier.prototype.update = function(dt) {
		if (this.delay > 0) {
			this.delay -= dt;
			return;
		}

		_super.prototype.update.call(this, dt);

		var tm = this.liveTime * this.speed;

		this.jellyScale = this.maxScale * (Math.PI * 3 - tm) / (Math.PI * 3);

		var scale = Math.sin(tm) * this.jellyScale;

		this.obj.scaleX = this.origScale + scale;
		this.obj.scaleY = this.origScale - scale;

		if (tm >= Math.PI * 3) {
			this.obj.scaleX = this.obj.scaleY = 1.0 * this.origScale;

			this.kill();
		}
	};
	return Jellier;
})(DNGameObject);

// 布局
var Layouts = (function() {
	function Layouts() {}
	Layouts.TYPE_SKEW = "skew";
	Layouts.TYPE_STATIC_PICTURE = "static_picture";
	// 等比縮放後鋪滿目標框的背景圖（cover）：長寬比不變，多出的一邊交給 canvas 邊界裁掉
	Layouts.TYPE_FIT_PICTURE = "fit_picture";
	// 同上，但來源是影片：只播一次，播完停在最後一格
	Layouts.TYPE_FIT_VIDEO = "fit_video";
	Layouts.TYPE_BUTTON = "button";
	Layouts.TYPE_PLACEHOLDER = "placeholder";
	Layouts.TYPE_LOGO_PLACEHOLDER = "TYPE_LOGO_PLACEHOLDER"; // 赞助商
	Layouts.TYPE_FLAT_BUTTON = "flat_button";
	Layouts.TYPE_JELLY_BUTTON = "jelly_button";
	Layouts.TYPE_TEXT_FIELD = "textfield";
	Layouts.TYPE_PROGRESS_BAR = "progress_bar";

	Layouts.NAME_BUTTON_PLAY = "play";
	Layouts.NAME_BUTTON_CREDITS = "credits";
	Layouts.NAME_SOUND_PLACE = "sound";
	Layouts.NAME_BUTTON_EXIT = "exit";
	Layouts.NAME_BUTTON_RESTART = "restart";
	Layouts.NAME_PANEL = "panel";
	Layouts.NAME_CAPTION = "caption";
	Layouts.NAME_BUTTON_MORE_GAMES = "more_games";
	Layouts.NAME_BUTTON_EV = "ev";
	Layouts.NAME_BUTTON_SETTINGS = "settings";
	Layouts.NAME_BUTTON_LOGIN = "login";
	return Layouts;
})();

/// <reference path="references.ts" />
var LevelDef = (function() {
	function LevelDef() {}
	return LevelDef;
})();

// 获胜状态面板布局
var WinState = (function(_super) {
	__extends(WinState, _super);

	function WinState(level, stars_count, score) {
		var _this = this;
		_super.call(this);
		this.WIN_LAYOUT = [{
			type: Layouts.TYPE_STATIC_PICTURE,
			picture: Images.WINDOW,
			x: 350,
			y: 380,
			name: Layouts.NAME_PANEL,
			children: [{
					type: Layouts.TYPE_PLACEHOLDER,
					x: 0,
					y: -70,
					name: "perfect_star"
				},
				{
					type: Layouts.TYPE_STATIC_PICTURE,
					picture: Images.CAPTION_LEVEL_COMPLETED,
					x: 0,
					y: -170,
					name: "caption"
				},
				{
					type: Layouts.TYPE_JELLY_BUTTON,
					name: Layouts.NAME_BUTTON_EXIT,
					picture: Images.BUTTON_EXIT,
					x: -120,
					y: 140
				},
				{
					type: Layouts.TYPE_JELLY_BUTTON,
					name: Layouts.NAME_BUTTON_PLAY,
					picture: Images.BUTTON_PLAY,
					x: +120,
					y: 140
				},
				{
					type: Layouts.TYPE_STATIC_PICTURE,
					picture: Images.CAPTION_SCORE,
					x: -60, // 與下方「總分」標籤對齊（兩張圖同為 94×27）
					y: -10 + 15
				},
				{
					type: Layouts.TYPE_TEXT_FIELD,
					x: 50,
					y: -10 - 27 / 2 + 15,
					name: "current_score",
					text: "004524",
					font: "font_gui/",
					letter_dist: -8
				},
				{
					type: Layouts.TYPE_STATIC_PICTURE,
					picture: Images.TOTAL_SCORE,
					x: -60,
					y: 40 + 15
				},
				{
					type: Layouts.TYPE_TEXT_FIELD,
					x: 50,
					y: 40 - 27 / 2 + 15,
					name: "total_score",
					text: "004524",
					font: "font_gui/",
					letter_dist: -8
				},
				{// 赞助商（通關窗）
					type: Layouts.TYPE_LOGO_PLACEHOLDER,
					x: 0,
					y: 335,
					max_width: 200,
					max_height: 100
				}
			]
		}];
		this.panel = new createjs.Container();
		this.hiddingNow = false;
		this.tmpScore = 0;
		this.tmpTotalScore = 0;

		this.level = level;

		GameData.getInstance().onWinLevel(level, score, stars_count);

		this.addShader();
		this.loadLayout(this.WIN_LAYOUT, this);

		this.totalScore = GameData.getInstance().getTotalScore();
		this.score = score;
		this.tmpTotalScore = this.totalScore - score;

		if (this.tmpTotalScore < 0) {
			this.tmpTotalScore = 0;
		}

		if (this.totalScore < 0) {
			this.totalScore = 0;
		}

		if (this.score < 0) {
			this.score = 0;
		}

		this.findGUIObject(Layouts.NAME_BUTTON_PLAY).setHandler(function() {
			return _this.onPlayTouch();
		});

		this.findGUIObject(Layouts.NAME_BUTTON_EXIT).setHandler(function() {
			return _this.onExitTouch();
		});

		this.scoreLabel = (this.findGUIObject("current_score"));
		this.totalScoreLabel = (this.findGUIObject("total_score"));
		this.totalScoreLabel.setText(Utils.ScoreString(this.tmpTotalScore));

		this.caption = this.findGUIObject("caption");
		Utils.RunShowAnim(this.caption, 1100);

		if (stars_count > 0) {
			// 三星制：有幾顆就畫幾顆大星，置中排列並逐顆彈出
			var star_row = new createjs.Container();
			star_row.scaleX = star_row.scaleY = 0.78;
			this.findGUIObject("perfect_star").addChild(star_row);
			for (var si_i = 0; si_i < stars_count; si_i++) {
				var star = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.BIG_STAR);
				star.x = (si_i - (stars_count - 1) / 2) * 130;
				star_row.addChild(star);
				Utils.RunShowAnim(star, 1200 + si_i * 220);
				createjs.Tween.get(star).wait(1200 + si_i * 220).to({
					rotation: 360
				}, 800, createjs.Ease.cubicOut);
			}
		}

		this.panel = this.findGUIObject(Layouts.NAME_PANEL);
		this.panel.alpha = 0.0;
		createjs.Tween.get(this.panel).to({
			alpha: 1
		}, 200, createjs.Ease.linear);

		//  380
		this.panel.y = 1100;
		createjs.Tween.get(this.panel).to({
			y: 400
		}, 1100, createjs.Ease.circOut);

		DNSoundManager.g_instance.play(Sounds.POPUP, 0.35);

		createjs.Tween.get(this).wait(1800).call(function() {
			return DNSoundManager.g_instance.play(Sounds.SCORE, 0.5);
		});
		createjs.Tween.get(this).wait(2300).call(function() {
			return DNSoundManager.g_instance.play(Sounds.SCORE, 0.5);
		});
	}
	WinState.prototype.hide = function() {
		if (!this.hiddingNow) {
			createjs.Tween.removeTweens(this.shader);
			createjs.Tween.get(this.shader).to({
				alpha: 0.0
			}, 400, createjs.Ease.linear).call(function() {
				return DNStateManager.g_instance.popState();
			});

			createjs.Tween.get(this.panel).to({
				scaleX: 1.3,
				scaleY: 1.3
			}, 300, createjs.Ease.backIn);
			createjs.Tween.get(this.panel).to({
				alpha: 0
			}, 300, createjs.Ease.linear);

			this.hiddingNow = true;
		}
	};

	WinState.prototype.update = function(dt) {
		_super.prototype.update.call(this, dt);

		if (this.liveTime > 1.8) {
			this.tmpScore += Math.round(dt * this.score * 2);

			if (this.tmpScore > this.score) {
				this.tmpScore = this.score;
			}

			this.scoreLabel.setText(Utils.ScoreString(this.tmpScore));
		}

		if (this.liveTime > 2.3) {
			this.tmpTotalScore += Math.round(dt * this.score * 2);

			if (this.tmpTotalScore > this.totalScore) {
				this.tmpTotalScore = this.totalScore;
			}

			this.totalScoreLabel.setText(Utils.ScoreString(this.tmpTotalScore));
		}
	};

	WinState.prototype.onPlayTouch = function() {
		if (this.level + 1 >= GameData.getTotalLevels()) {
			DNStateManager.g_instance.pushState(new CoolTransitionInState(new SelectLevelState()));
		} else {
			DNStateManager.g_instance.pushState(new CoolTransitionInState(new PlayState(this.level + 1)));
		}
	};

	WinState.prototype.onExitTouch = function() {
		DNStateManager.g_instance.pushState(new CoolTransitionInState(new SelectLevelState()));
	};
	return WinState;
})(DNGameState);

// 失败状态面板布局
var LoseState = (function(_super) {
	__extends(LoseState, _super);

	function LoseState(level) {
		var _this = this;
		_super.call(this);
		this.LOSE_LAYOUT = [{
			type: Layouts.TYPE_STATIC_PICTURE,
			picture: Images.WINDOW,// 说明框背景
			x: 350,
			y: 380,
			name: Layouts.NAME_PANEL,
			children: [{
					type: Layouts.TYPE_STATIC_PICTURE,
					picture: Images.CAPTION_LEVEL_FAILED,
					x: 0,
					y: -130,
					name: "caption"
				},
				{
					type: Layouts.TYPE_JELLY_BUTTON,
					name: Layouts.NAME_BUTTON_EXIT,
					picture: Images.BUTTON_EXIT,// HOME按钮
					x: -120,
					y: 140
				},
				{
					type: Layouts.TYPE_JELLY_BUTTON,
					name: Layouts.NAME_BUTTON_RESTART,
					picture: Images.BUTTON_RESTART,// 重置按钮
					x: +120,
					y: 140
				},
				{// 赞助商（失敗窗）
					type: Layouts.TYPE_LOGO_PLACEHOLDER,
					x: 0,
					y: 335,
					max_width: 200,
					max_height: 100
				}
			]
		}];
		this.panel = new createjs.Container();
		this.hiddingNow = false;

		this.level = level;

		this.addShader();
		this.loadLayout(this.LOSE_LAYOUT, this);

		this.findGUIObject(Layouts.NAME_BUTTON_RESTART).setHandler(function() {
			return _this.onRestartTouch();
		});

		this.findGUIObject(Layouts.NAME_BUTTON_EXIT).setHandler(function() {
			return _this.onExitTouch();
		});

		this.caption = this.findGUIObject("caption");
		Utils.RunShowAnim(this.caption, 1200);

		this.panel = this.findGUIObject(Layouts.NAME_PANEL);
		this.panel.alpha = 0.0;
		createjs.Tween.get(this.panel).to({
			alpha: 1
		}, 200, createjs.Ease.linear);

		//  380
		this.panel.y = 1100;
		createjs.Tween.get(this.panel).to({
			y: 400
		}, 1100, createjs.Ease.circOut);

		DNSoundManager.g_instance.play(Sounds.POPUP, 0.35);
	}
	
	LoseState.prototype.hide = function() {
		if (!this.hiddingNow) {
			createjs.Tween.removeTweens(this.shader);
			createjs.Tween.get(this.shader).to({
				alpha: 0.0
			}, 400, createjs.Ease.linear).call(function() {
				return DNStateManager.g_instance.popState();
			});

			createjs.Tween.get(this.panel).to({
				scaleX: 1.3,
				scaleY: 1.3
			}, 300, createjs.Ease.backIn);
			createjs.Tween.get(this.panel).to({
				alpha: 0
			}, 300, createjs.Ease.linear);

			this.hiddingNow = true;
		}
	};

	LoseState.prototype.update = function(dt) {
		_super.prototype.update.call(this, dt);
	};

	LoseState.prototype.onRestartTouch = function() {
		DNStateManager.g_instance.pushState(new CoolTransitionInState(new PlayState(this.level)));
	};

	LoseState.prototype.onExitTouch = function() {
		DNStateManager.g_instance.pushState(new CoolTransitionInState(new SelectLevelState()));
	};
	return LoseState;
})(DNGameState);

// 呼叫 EVState页面
var EVState = (function(_super) {
	__extends(EVState, _super);

	function EVState(reason_pic, level) {
		var _this = this;
		_super.call(this);
		this.hiddingNow = false;
		this.LOSE_LAYOUT = [{
			type: Layouts.TYPE_STATIC_PICTURE,
			picture: Images.WINDOW,// 说明框背景
			x: 350,
			y: 380,
			name: Layouts.NAME_PANEL,
			children: [{
					type: Layouts.TYPE_STATIC_PICTURE,
					picture: Images.CAPTION_LEVEL_FAILED,// 显示文字图像
					x: 0,
					y: -130,
					name: "caption"
				},
				{// HOME按钮
					type: Layouts.TYPE_JELLY_BUTTON,
					name: Layouts.NAME_BUTTON_EXIT,
					picture: Images.BUTTON_EXIT,
					x: -120 - 20,
					y: 140
				},
				{// EV按钮
					type: Layouts.TYPE_JELLY_BUTTON,
					name: Layouts.NAME_BUTTON_EV,
					picture: Images.BUTTON_EV,
					x: 0,
					y: 140
				},
				{// 放弃按钮
					type: Layouts.TYPE_JELLY_BUTTON,
					name: Layouts.NAME_BUTTON_RESTART,
					picture: Images.BUTTON_RESTART,
					x: +120 + 20,
					y: 140
				},
				{// 赞助商（失敗窗 第二元素）
					type: Layouts.TYPE_LOGO_PLACEHOLDER,
					x: 0,
					y: 335,
					max_width: 200,
					max_height: 100
				}
			]
		}];
		//  shading
		this.shader = new createjs.Shape();
		
		this.panel = new createjs.Container();

		this.level = level;
		this.reason_pic = reason_pic;

		this.container = new createjs.Container();
		this.addChild(this.container);
		this.container.alpha = 0;
		createjs.Tween.get(this.container).to({
			alpha: 1.0
		}, 500, createjs.Ease.linear);

		this.addShader();
		this.loadLayout(this.LOSE_LAYOUT, this);
		// 重置
		this.findGUIObject(Layouts.NAME_BUTTON_RESTART).setHandler(function() {
			return _this.onRestartTouch();
		});
		// EV
		this.findGUIObject(Layouts.NAME_BUTTON_EV).setHandler(function() {
			return _this.onEV();
		});
		// 回地图
		this.findGUIObject(Layouts.NAME_BUTTON_EXIT).setHandler(function() {
			return _this.onExitTouch();
		});

		this.caption = this.findGUIObject("caption");
		Utils.RunShowAnim(this.caption, 1200);

		this.panel = this.findGUIObject(Layouts.NAME_PANEL);
		this.panel.alpha = 0.0;
		createjs.Tween.get(this.panel).to({
			alpha: 1
		}, 200, createjs.Ease.linear);

		//  380
		this.panel.y = 1100;
		createjs.Tween.get(this.panel).to({
			y: 400
		}, 1100, createjs.Ease.circOut);

		DNSoundManager.g_instance.play(Sounds.POPUP, 0.35);
	}
	
	EVState.prototype.hide = function() {
		if (!this.hiddingNow) {
			createjs.Tween.removeTweens(this.shader);
			createjs.Tween.get(this.shader).to({
				alpha: 0.0
			}, 400, createjs.Ease.linear).call(function() {
				return DNStateManager.g_instance.popState();
			});

			createjs.Tween.get(this.panel).to({
				scaleX: 1.3,
				scaleY: 1.3
			}, 300, createjs.Ease.backIn);
			createjs.Tween.get(this.panel).to({
				alpha: 0
			}, 300, createjs.Ease.linear);

			this.hiddingNow = true;
		}
	};

	EVState.prototype.update = function(dt) {
		_super.prototype.update.call(this, dt);
	};
	// EV
	EVState.prototype.onEV = function() {
		this.hide();// 隐藏窗口
		if (this.reason_pic === Images.END_LEVEL_TIME_IS_UP) {
			// 还能加移动时间 Images.END_LEVEL_TIME_IS_UP
			Constants.TEST = 1;
		} else if (this.reason_pic === Images.END_LEVEL_NO_POSSIBLE_MOVES) {
			// 无法移动换成洗牌 Images.END_LEVEL_NO_POSSIBLE_MOVES
			Constants.TEST = 2;
		}
	};
	// 放弃
	EVState.prototype.onRestartTouch = function() {
		this.hide();// 隐藏窗口
		Constants.TEST = 3;
	};
	// 地图
	EVState.prototype.onExitTouch = function() {
		DNStateManager.g_instance.pushState(new CoolTransitionInState(new SelectLevelState()));
	};
	return EVState;
})(DNGameState);

// 地圖景物落地後的震動參數（重物砸地感：幅度小、頻率高、衰減快）
var MAP_SKEW = {
	amp: 6,				// 左右歪斜的最大角度（度）
	phase: 16,			// 震動角速度，越大越急促
	breathe: 0.05,		// 垂直方向的微震幅度
	squash: 0.12,		// 落地瞬間往下的壓扁比例（scaleY）
	squashTime: 0.18,	// 壓扁回彈的時間（秒）
	decay: 0.83			// 震動衰減速度，1 / 1.25 = 約 0.8 秒收完
	// 想要把 decay 改成
	// 0.5 秒收完`2.0`
	// 0.8 秒（現在）`1.25`
	// 1.2 秒晃更久`0.83`
	// 2 秒晃很久`0.5`
};

// 使用立即执行函数表达式 (IIFE) 来定义 MapSkewer 类，这样可以在不污染全局命名空间的情况下创建局部变量。
// 地图上景物（树木/房子/岩石之类）
var MapSkewer = (function(_super) {
	// 使用 __extends 函数（该函数通常在 ES6 的 extends 关键字中用于实现继承）来继承 _super（即 DNGameObject）的属性和方法。
	__extends(MapSkewer, _super);
	// 定义 MapSkewer 类的构造函数，它接受两个参数：obj 和 delay。
	function MapSkewer(obj, delay) {
		// 调用父类（DNGameObject）的构造函数，实现继承。
		_super.call(this);
		// 创建一个新的 createjs.Container 对象作为代理，用于后续的操作。
		this.proxy = new createjs.Container();
		// 设置进程值为 1.0，是控制动画或效果的速度。
		this.process = 1.0;
		// 使用 Utils.RandomRange 函数获取一个随机数，范围在 0 到 10 之间，作为偏移量。
		this.offset = Utils.RandomRange(0, 10);
		// 存储传入的 delay 值。
		this.delay = delay;

		// 设置 obj 的 x 坐标为传入的 obj.x。
		this.x = obj.x;

		// 景觀錨點是圖片中心；景深要用「落地點」＝中心往下到圖片下緣的 y，
		// 也就是中心 y 加上下半段高度（height/2），不能拿中心點跟 NPC 腳底比。
		var _bounds = obj.getBounds ? obj.getBounds() : null;
		var _halfH = (_bounds && typeof _bounds.height === "number" && isFinite(_bounds.height)) ? _bounds.height / 2 : 0;
		// this.y ＝ 落地點（圖片底部），後續 sortDepth 用它當景深鍵值
		this.y = obj.y + _halfH;

		// 把內層圖片相對本層原點置中：中心在原點上方 _halfH，底部對齊原點（落地點）
		obj.y = -_halfH;
		// 将 obj 的 x 坐标设置为 0，进行水平居中。
		obj.x = 0;
		// 将 obj 添加为当前对象的子对象。
		this.addChild(obj);
	}
	// MapSkewer 类原型上的 forceUpdate 方法，接受一个参数 dt（可能是时间差）。
	MapSkewer.prototype.forceUpdate = function(dt) {
		// 更新 delay 值，减去 dt。delay 就是「什麼時候開始震動」，
		// 呼叫端把它設成「落地時刻」，所以下面的 forceLiveTime 也是從落地那一幀才開始算。
		this.delay -= dt;
		// 如果 delay 大于 0，则说明还没到落地时间，直接返回（此時不動歪斜也不壓扁）
		if (this.delay > 0) {
			return;
		}
		// 调用父类的 forceUpdate 方法。
		_super.prototype.forceUpdate.call(this, dt);
		// 震動強度隨時間線性衰減，衰減到 0 就結束
		this.process -= dt * MAP_SKEW.decay;

		if (this.process <= 0) {
			// 收乾淨：歪斜與縮放全部歸位，避免留下看不出來的殘留傾斜
			this.process = 0;
			this.skewX = 0;
			this.scaleX = 1;
			this.scaleY = 1;
			// 调用 kill 方法（只是從更新列表移除，物件仍留在畫面上）
			this.kill();
			return;
		}

		// 落地瞬間的壓扁：前 squashTime 秒疊一個 sin 半波往下壓，時間到剛好回到 0
		var squash = 0;
		if (this.forceLiveTime < MAP_SKEW.squashTime) {
			squash = Math.sin(Math.PI * this.forceLiveTime / MAP_SKEW.squashTime) * MAP_SKEW.squash;
		}

		// 左右快速歪斜（重物砸地的主要視覺），幅度隨 process 衰減
		this.skewX = Math.sin(this.forceLiveTime * MAP_SKEW.phase) * MAP_SKEW.amp * this.process;
		// 壓扁時橫向撐開一點，體積守恆看起來才像真的被壓到
		this.scaleX = 1 + squash * 0.35;
		// 垂直方向：壓扁下沉 + 衰減中的微震
		this.scaleY = 1 + Math.sin(this.forceLiveTime * MAP_SKEW.phase) * MAP_SKEW.breathe * this.process -
			squash;
	};
	// MapSkewer 类原型上的 onDead 方法，目前是空的，没有执行任何操作。可能在后续开发中有用。
	MapSkewer.prototype.onDead = function() {
		//  do nothing（不执行任何操作）
	};
	// 返回定义的 MapSkewer 类。这样外部就可以使用这个类来创建对象了。
	return MapSkewer;
	// 使用 DNGameObject 作为 MapSkewer 的父类。
	// 这样 MapSkewer 就继承了 DNGameObject 的属性和方法。然后立即执行这个
})(DNGameObject);

// 暂停面板布局
var PauseState = (function(_super) {
	__extends(PauseState, _super);

	function PauseState(level) {
		var _this = this;
		_super.call(this);
		this.PAUSE_WINDOW_LAYOUT = [{
			type: Layouts.TYPE_STATIC_PICTURE,
			picture: Images.WINDOW,// 说明框背景
			x: 350,
			y: 380,
			name: Layouts.NAME_PANEL,
			children: [{
					type: Layouts.TYPE_JELLY_BUTTON,
					name: Layouts.NAME_BUTTON_PLAY,
					picture: Images.BUTTON_PLAY,// 继续游戏按钮
					x: 0,
					y: -30,
					scale: 1.4
				},
				{
					type: Layouts.TYPE_JELLY_BUTTON,
					name: Layouts.NAME_BUTTON_EXIT,
					picture: Images.BUTTON_EXIT,// HOME按钮
					x: -120,
					y: 130
				},
				{
					type: Layouts.TYPE_JELLY_BUTTON,
					name: Layouts.NAME_BUTTON_RESTART,
					picture: Images.BUTTON_RESTART,// 重置按钮
					x: 0,
					y: 130
				},
				{
					type: Layouts.TYPE_PLACEHOLDER,
					name: Layouts.NAME_SOUND_PLACE,
					x: 120,
					y: 130
				},
				{
					type: Layouts.TYPE_STATIC_PICTURE,
					name: Layouts.NAME_CAPTION,
					picture: Images.CAPTION_PAUSE,
					x: 0,
					y: -165
				},
				{// 赞助商（暫停窗）
					type: Layouts.TYPE_LOGO_PLACEHOLDER,
					x: 0,
					y: 335,
					max_width: 200,
					max_height: 100
				}
			]
		}];
		this.panel = new createjs.Container();
		this.hiddingNow = false;

		this.level = level;

		this.addShader();

		this.loadLayout(this.PAUSE_WINDOW_LAYOUT, this);

		this.findGUIObject(Layouts.NAME_BUTTON_PLAY).setHandler(function() {
			return _this.hide();
		});
		this.findGUIObject(Layouts.NAME_BUTTON_EXIT).setHandler(function() {
			return _this.onExitTouch();
		});
		this.findGUIObject(Layouts.NAME_BUTTON_RESTART).setHandler(function() {
			return _this.onRestartTouch();
		});

		this.panel = this.findGUIObject(Layouts.NAME_PANEL);
		this.panel.alpha = 0.0;
		createjs.Tween.get(this.panel).to({
			alpha: 1
		}, 200, createjs.Ease.linear);

		//  380
		this.panel.y = 1100;
		createjs.Tween.get(this.panel).to({
			y: 400
		}, 1100, createjs.Ease.circOut);

		this.setSoundButton();

		DNSoundManager.g_instance.play(Sounds.POPUP, 0.35);
	}

	PauseState.prototype.setSoundButton = function() {
		var _this = this;
		if (this.soundButton && this.soundButton.parent) {
			this.soundButton.parent.removeChild(this.soundButton);
		}

		var enabled = DNSoundManager.g_instance.isSoundEnabled();

		this.soundButton = new DNJellyButton(enabled ? Images.BUTTON_SOUND_ON : Images.BUTTON_SOUND_OFF,
			function() {
				return _this.onSoundTouch();
			});
		this.findGUIObject(Layouts.NAME_SOUND_PLACE).addChild(this.soundButton);
		this.addGuiObject(this.soundButton);
	};

	PauseState.prototype.hide = function() {
		if (!this.hiddingNow) {
			createjs.Tween.removeTweens(this.getShader());
			createjs.Tween.get(this.getShader()).wait(200).to({
				alpha: 0.0
			}, 400, createjs.Ease.linear).call(function() {
				return DNStateManager.g_instance.popState();
			});

			createjs.Tween.get(this.panel).wait(400).to({
				alpha: 0
			}, 200, createjs.Ease.linear);

			createjs.Tween.get(this.panel).to({
				y: 1100
			}, 500, createjs.Ease.circIn);

			this.hiddingNow = true;

			DNSoundManager.g_instance.play(Sounds.POPUP, 0.35);
		}
	};

	PauseState.prototype.onRestartTouch = function() {
		DNStateManager.g_instance.pushState(new CoolTransitionInState(new PlayState(this.level)));
	};

	PauseState.prototype.onExitTouch = function() {
		DNStateManager.g_instance.pushState(new CoolTransitionInState(new SelectLevelState()));
	};

	PauseState.prototype.onSoundTouch = function() {
		DNSoundManager.g_instance.setSoundEnabled(!DNSoundManager.g_instance.isSoundEnabled());
		this.setSoundButton();
	};
	return PauseState;
})(DNGameState);

//游戏面板布局
var PlayState = (function(_super) {
	__extends(PlayState, _super);
	
	function PlayState(level) {
		// 将当前对象赋值给 _this，这样在后面的回调函数或闭包中可以访问到外部的 this
		var _this = this;
		Constants.TEST = 0;
		console.log("重置.TEST = 0;");
		// 调用父类的构造函数，这是一种常见的继承模式 
		_super.call(this);
		// 初始化数组，用于存放布局信息 
		this.PLAYSTATE_LAYOUT = [{
				type: Layouts.TYPE_STATIC_PICTURE,
				picture: Images.GUI_TOP,
				x: Constants.ASSETS_WIDTH / 2,
				y: -89 / 2,
				name: "top_panel",
				children: [{
						type: Layouts.TYPE_TEXT_FIELD, // 文字
						x: 10,
						y: -29 + 5,
						name: "level", // 关卡
						text: "25",
						font: "font_gui/",
						letter_dist: -8
					},
					{
						type: Layouts.TYPE_STATIC_PICTURE,
						picture: Images.CAPTION_LEVEL, // 关卡（图像）
						x: -34,
						y: -14 + 5
					},
					{
						type: Layouts.TYPE_TEXT_FIELD,
						x: 192 + 6,
						y: -15 + 8,
						name: "moves", // 可消除
						text: "1",
						font: "font_gui/",
						letter_dist: -8
					},
					{
						type: Layouts.TYPE_STATIC_PICTURE,
						picture: Images.CAPTION_MOVES, // 可消除（图像）
						x: 190 + 8,
						y: 2 + 8,
						name: "caption_moves"
					},
					{
						type: Layouts.TYPE_TEXT_FIELD,
						x: 192 + 6,
						y: -42 + 2,
						name: "score", // 分数
						text: "000000",
						font: "font_gui/",
						letter_dist: -8
					},
					{
						type: Layouts.TYPE_STATIC_PICTURE,
						picture: Images.CAPTION_SCORE, // 分数（图像）
						x: 190 + 8, // 改與「可消除」標籤同 x（兩張同為 94×27，位移補償後左緣一致）
						y: -27 + 2,
						name: "caption_score"
					},
					{
						type: Layouts.TYPE_PROGRESS_BAR,
						picture: Images.TIME_PROGRESS_BAR,
						x: -99 - 220 + 3,
						y: -14 + 2 + 3,
						name: "time_progress_bar" // 时间轴
					},
					{
						type: Layouts.TYPE_STATIC_PICTURE,
						picture: Images.STAR_STICK, // 时间轴标示线
						x: -245,
						y: 0 + 2
					},
					{
						type: Layouts.TYPE_STATIC_PICTURE,
						picture: Images.STAR_MINI_EMPTY, // 黑色星星
						x: -245,
						y: 13
					},
					{
						type: Layouts.TYPE_STATIC_PICTURE, // 2★ 位（時間剩 1/3 門檻，左）
						picture: Images.STAR_MINI,
						x: -245,
						y: 13,
						name: "star_2"
					},
					{
						type: Layouts.TYPE_STATIC_PICTURE, // 3★ 位門檻線（時間剩 2/3）
						picture: Images.STAR_STICK,
						x: -173,
						y: 2
					},
					{
						type: Layouts.TYPE_STATIC_PICTURE, // 3★ 位底色（黑色星星）
						picture: Images.STAR_MINI_EMPTY,
						x: -173,
						y: 13
					},
					{
						type: Layouts.TYPE_STATIC_PICTURE, // 3★ 位（時間剩 2/3 門檻，右）
						picture: Images.STAR_MINI,
						x: -173,
						y: 13,
						name: "star_3"
					},
					{
						type: Layouts.TYPE_TEXT_FIELD, //时间
						x: -267 + 40,
						y: -45,
						name: "time_left",
						text: "00d00",
						font: "font_gui/",
						letter_dist: -8
					},
					{
						type: Layouts.TYPE_STATIC_PICTURE, // 時間（圖像）
						picture: Images.DURATION,
						x: -267 + 30 - 47, // 右緣貼齊時間數字左緣（-257），94 寬取半 47
						y: -30,
						name: "caption_duration"
					}
				]
			},
			{
				type: Layouts.TYPE_STATIC_PICTURE,
				picture: Images.GUI_BOTTOM,
				x: Constants.ASSETS_WIDTH / 2,
				y: Constants.ASSETS_HEIGHT + 70,
				name: "bottom_panel",
				children: [{
						type: Layouts.TYPE_JELLY_BUTTON,
						picture: Images.BUTTON_PAUSE,
						x: 0,
						y: -21,
						name: "button_pause" // 暂停按钮
					},
					{// TODO 下载按钮（下載該關卡背景圖片）
						type: Layouts.TYPE_JELLY_BUTTON,
						picture: Images.MAP_BUTTON_DOWNLOAD,
						x: 280,
						y: -21 + 20,
						name: "button_download" // 下载按钮
					},
					{
						type: Layouts.TYPE_FLAT_BUTTON,
						picture: Images.BUTTON_SHUFFLE,
						x: 150,
						y: -15,
						name: "button_shuffle", // 洗牌按钮
						children: [{
								type: Layouts.TYPE_STATIC_PICTURE,
								x: 35,
								y: -35,
								picture: Images.MINI_BUTTON
							},
							{
								type: Layouts.TYPE_TEXT_FIELD,
								x: 24,
								y: -50,
								name: "shuffle_text", //可用次数文字
								text: "3",
								font: "font_gui/",
								letter_dist: -8,
								scale: 0.9
							}
						]
					},
					{
						type: Layouts.TYPE_PLACEHOLDER,
						x: -150,
						y: -15,
						name: "eye_placeholder" // 眼睛按钮
					}
				]
			}
		];
		// 初始化一个变量，表示游戏状态的时间，初始值为0
		this.stateTime = 0;
		// 定义几个常量，表示游戏的不同状态 
		this.STATE_NORMAL = 0;
		this.STATE_SPAWN = 1;
		this.STATE_SHUFFLE = 2;
		this.STATE_AUTO_MATCH = 3;
		// 初始化一个变量，表示洗牌的次数，初始值为1
		this.shufflesCount = 1;
		// 初始化两个布尔变量，表示等待胜利和等待失败的状态，初始值都为false
		this.waitWin = false;
		this.waitWinTime = 0;
		this.waitLose = false;
		this.waitLoseTime = 0;
		// 初始化一个变量，表示最后一次匹配的时间，初始值为0
		this.lastMatchTime = 0;
		// 初始化一个变量，表示连续匹配的次数，初始值为0
		this.matchInARaw = 0;
		// 初始化一个变量，表示剩余时间，初始值为100
		this.timeLeft = 100;
		// 初始化一个变量，表示总时间，初始值也为100
		this.totalTime = 100;
		// 初始化一个变量，表示临时分数，初始值为0
		this.tmpScore = 0;
		// 初始化一个变量，表示最终分数，初始值为0
		this.score = 0;
		// 初始化一个变量，表示选中的方块对象，初始值为null
		this.selectedChip = null;
		// 创建一个新的 GUI 容器对象，用于存放 GUI 元素（如按钮、图片等）
		this.guiLayer = new createjs.Container(); // gui容器
		// 创建一个新的游戏容器对象，用于存放游戏元素（如方块）
		this.gameLayer = new createjs.Container(); // game容器
		// 创建一个数组，用于存放方块层对象（每个方块都有自己的层）
		this.chipLayers = [];
		// 创建一个新的按钮对象（闭眼状态），点击时会调用 onEyeTouch 方法
		this.buttoEyeClosed = new DNFlatButton(Images.BUTTON_EYE_CLOSED, function() {
			return _this.onEyeTouch();
		});
		// 与上一行类似，创建一个新的按钮对象（睁眼状态）
		this.buttoEyeOpened = new DNFlatButton(Images.BUTTON_EYE_OPENED, function() {
			return _this.onEyeTouch();
		});
		// 星星資格分三檔：3★ 兩顆全亮、2★ 只剩左邊、1★ 全熄（依剩餘時間比例即時更新）
		this.hudStarTier = 3;
		// 初始化一个变量，表示提示时间，初始值为0
		this.hintTime = 0;
		// 初始化一个变量，表示洗牌前的闪烁次数，初始值为0
		this.shiningCountBeforeShuffle = 0;
		// 定义一个数组，包含三个字符串元素：“fruit”，“hands”，“monsters”
		this.universalChips = ["fruit", "hands", "monsters"];
		// 定义一个数组，包含四个元素（可能是游戏中的四个出生点位置）？？
		this.spawnPositions = [
			[-70, 70, 140],
			[770, 630, 140],
			[-70, 70, 650],
			[770, 630, 650]
		];
		// 定义一个数组，包含四个元素（可能是游戏中的四个加成）
		this.bonuses = [null, null, null, null];
		// 初始化一个变量，表示自动匹配的链大小，初始值为0 
		this.autoMatchChainSize = 0;
		// 初始化一个变量，表示最后一次播放声音的时间，初始值为0
		this.lastSoundTime = 0;
		// 将 level 变量赋值给当前对象的 level 属性
		this.level = level;
		// 将当前实例赋值给 PlayState 的静态实例属性 g_instance，这样可以在其他地方访问这个实例
		PlayState.g_instance = this;
		// 在游戏画布上添加背景图像，背景图像的名称由 level 变量决定，通过取模运算获取其名称后缀
		this.addChild(DNAssetsManager.g_instance.getImage("back_" + (level % 50 + 1))); // 关卡背景图像

		this.layersData = Levels.levels[level].field; // 方块数据
		this.totalTime = Levels.levels[level].time; // 时间限制
		this.timeLeft = this.totalTime;
		// 将 gameLayer 添加到游戏画布上
		this.addChild(this.gameLayer);
		// 循环遍历 layersData 数组，为每个方块创建一个新的容器，并添加到 gameLayer 上
		for (var i = 0; i < this.layersData.length; i++) {
			this.chipLayers.push(new createjs.Container());

			this.gameLayer.addChild(this.chipLayers[i]);
		}
		// 将 guiLayer 添加到游戏画布上
		this.addChild(this.guiLayer);
		// 使用 loadLayout 方法加载指定布局到 guiLayer 上
		this.loadLayout(this.PLAYSTATE_LAYOUT, this.guiLayer);
		// 寻找名为 "caption_moves" 的 GUI 对象，并移动其 x 位置，使其位于其自身的宽度的一半处
		var caption_moves = this.findGUIObject("caption_moves");
		caption_moves.x -= caption_moves.getBounds().width / 2;
		// 寻找名为 "caption_score" 的 GUI 对象，并移动其 x 位置，使其位于其自身的宽度的一半处
		var caption_score = this.findGUIObject("caption_score");
		caption_score.x -= caption_score.getBounds().width / 2;
		// 如果 level 的值为0，则将 PlayState 的 eyeOpened 属性设置为 false
		if (level == 0) {
			PlayState.eyeOpened = false;
		}
		// 在 "eye_placeholder" 的 GUI 对象中添加两个按钮：buttoEyeClosed 和 buttoEyeOpened
		this.findGUIObject("eye_placeholder").addChild(this.buttoEyeClosed);
		this.findGUIObject("eye_placeholder").addChild(this.buttoEyeOpened);
		// 将这两个按钮添加到 GUI 对象列表中
		this.addGuiObject(this.buttoEyeClosed);
		this.addGuiObject(this.buttoEyeOpened);
		// 根据 PlayState 的 eyeOpened 属性设置 buttoEyeOpened 的可见性，但toEyeClosed 的可见性则取反
		this.buttoEyeOpened.visible = PlayState.eyeOpened;
		this.buttoEyeClosed.visible = !PlayState.eyeOpened;
		// 寻找名为 "time_progress_bar" 的 GUI 对象，并将其赋值给 timeLeftProgressBar 变量
		this.timeLeftProgressBar = this.findGUIObject("time_progress_bar");
		// 为 "button_pause" GUI 对象设置点击事件处理函数，当点击时，调用 onPauseTouch 方法
		this.findGUIObject("button_pause").setHandler(function() { // 暂停按钮
			return _this.onPauseTouch();
		});
		// 为 "button_download" GUI 对象设置点击事件处理函数，当点击时，调用 onDownload 方法并传入相应的参数
		this.findGUIObject("button_download").setHandler(function() { // 下载按钮
			return _this.onDownload("back_" + (level % 50 + 1));// 关卡背景图像（%50後求餘數）
		});
		// 寻找名为 "time_left" 的 GUI 对象，并将其赋值给 timeLeftLabel 变量
		this.timeLeftLabel = this.findGUIObject("time_left");
		// 寻找名为 "score" 的 GUI 对象，并将其赋值给 scoreLabel 变量
		this.scoreLabel = this.findGUIObject("score");
		// 为 "button_shuffle" GUI 对象设置点击事件处理函数，当点击时，调用 onShuffleTouch 方法
		this.findGUIObject("button_shuffle").setHandler(function() { // 洗牌按钮
			return _this.onShuffleTouch();
		});
		// 寻找名为 "shuffle_text" 的 GUI 对象，并将其赋值给 shuffleLabel 变量，然后设置其文本为 shufflesCount 的值
		this.shuffleLabel = this.findGUIObject("shuffle_text");
		this.shuffleLabel.setText(this.shufflesCount.toString());
		// 将 level 值加1后转换为字符串，并设置为 "level" GUI 对象的文本内容
		this.findGUIObject("level").setText((level + 1).toString());
		// 寻找名为 "moves" 的 GUI 对象，并将其赋值给 movesLeft 变量
		this.movesLeft = this.findGUIObject("moves");
		////////////////////////////
		if (this.level == 0) {// 加载教学
			this.tutorial = new Tutorial();
		}

		this.loadLevel(level);
		if (this.tutorial) {
			// 加载方块
			this.loadTutorialLevel();
		}

		this.recalcEyeState();
		this.recalcData();

		this.setState(this.STATE_SPAWN);

		// 加載 FPS：只有在除錯模式下才建立，正式版不產生這個物件
		if (Constants.DEBUG_MODE) {
			this.addGameObjectAtPos(new FPSCounter(), this, 50, 90);
		}
	}
	PlayState.prototype.totalLayers = function() {
		return this.layersData.length;
	};

	PlayState.prototype.highlightArea = function(left, top, right, bottom) {
		var highlighter = new TutorialHighlighter(left, top, right, bottom);
		this.addGameObjectAt(highlighter, this);

		this.highlighter = highlighter;

		return highlighter;
	};

	PlayState.prototype.loadTutorialLevel = function() { // 定义第一关的教程方法（方块的放置）
		this.chips[3][13][7].setPic("bugs", 0); // 设置位于chips数组中[3][13][7]的元素的pic属性为"bugs"，参数为0
		this.chips[3][9][7].setPic("bugs", 0); // 设置位于chips数组中[3][9][7]的元素的pic属性为"bugs"，参数为0
		this.chips[3][11][7].setPic("snakes", 0); // 设置位于chips数组中[3][11][7]的元素的pic属性为"snakes"，参数为0

		this.chips[2][14][7].setPic("snakes", 0);
		this.chips[2][8][7].setPic("snakes", 3);
		this.chips[2][12][7].setPic("snakes", 3);
		this.chips[2][10][7].setPic("eyes", 0);

		this.chips[1][15][7].setPic("eyes", 0);
		this.chips[1][13][6].setPic("eyes", 5);
		this.chips[1][13][8].setPic("eyes", 5);
		this.chips[1][7][7].setPic("bugs", 5);
		this.chips[1][11][7].setPic("bugs", 5);
		this.chips[1][9][6].setPic("bugs", 8);
		this.chips[1][9][8].setPic("bugs", 8);

		this.chips[0][6][7].setPic("bugs", 4);
		this.chips[0][8][7].setPic("hands", 0);
		this.chips[0][10][7].setPic("monsters", 1);
		this.chips[0][12][7].setPic("hands", 1);
		this.chips[0][14][7].setPic("monsters", 0);
		this.chips[0][16][7].setPic("bugs", 4);
	};

	PlayState.prototype.loadLevel = function(level) {
		//  alloc arrays for chips
		this.chips = new Array(this.layersData.length);
		for (var l = 0; l < this.layersData.length; l++) {
			this.chips[l] = new Array(Constants.FIELD_WIDTH);

			for (var x = 0; x < Constants.FIELD_WIDTH; x++) {
				this.chips[l][x] = new Array(Constants.FIELD_HEIGHT);
			}
		}

		var default_chip_defs = Levels.levels[level].chips;

		var empty_count = 0;

		// 按对角线正确排序
		var count = 0;
		for (var l = 0; l < this.layersData.length; l++) {
			for (var line = 0; line < Constants.FIELD_WIDTH + Constants.FIELD_HEIGHT - 1; line++) {
				var x = line;
				var y = 0;

				while (x >= 0 && y < Constants.FIELD_HEIGHT) {
					if (x < Constants.FIELD_WIDTH) {
						if (this.layersData[l][x][y] == 1) {
							this.createChip(l, x, y);

							//  if here
							if (count < default_chip_defs.length) {
								this.chips[l][x][y].setData(default_chip_defs[count].name,
									default_chip_defs[count].id);
							} else {
								empty_count++;
								this.chips[l][x][y].setData("empty", 0);
							}

							count++;
						}
					}

					x--;
					y++;
				}
			}
		}

		this.zoomField();

		var all_chips = this.collectChipsByMatchPairs();

		Utils.shuffle(all_chips);

		if (empty_count != 0) {
			console.log("MAP BUG! Chips count:", count, "empty count", empty_count);
		}

		if (count % 2 != 0) {
			console.log("警告!奇数的方快数量");
		}

		var tmp_matched_chips = [];
		while (all_chips.length != 0) {
			this.recalcInaccesible();

			var accessible = this.collectAccessibleChips();

			if (accessible.length < 2) {
				console.log("no more accessible place for chips");

				accessible = this.collectNonAccessibleChips();

				if (accessible.length < 2) {
					console.log("no place for NON accesible chips");
					break;
				}
			}

			var chip_1 = accessible[Math.floor(accessible.length * Math.random())];

			var chip_2;

			var counter = 0;
			do {
				chip_2 = accessible[Math.floor(accessible.length * Math.random())];

				if (++counter >= 300) {
					break;
				}
			} while (chip_1 == chip_2);

			var obj_defs = all_chips.pop();

			chip_1.tempMatch(obj_defs[0].name, obj_defs[0].id);

			if (obj_defs.length == 2) {
				chip_2.tempMatch(obj_defs[1].name, obj_defs[1].id);
			} else {
				console.log("spawn bug, no pair for chip", obj_defs[0].name, obj_defs[0].id);
			}

			tmp_matched_chips.push(chip_1, chip_2);
		}

		for (var i = 0; i < tmp_matched_chips.length; i++) {
			var chip = tmp_matched_chips[i];

			this.chips[chip.getLayer()][chip.getIndexX()][chip.getIndexY()] = chip;
			// 召唤方块
			chip.setState(new ChipStateSpawnNew());
		}
	};

	PlayState.prototype.shuffle = function() {
		this.setState(this.STATE_SHUFFLE);

		if (this.selectedChip) {
			this.selectedChip.deselect();
			this.selectedChip = null;
		}

		for (var l = 0; l < this.totalLayers(); l++) {
			for (var x_index = 0; x_index < Constants.FIELD_WIDTH; x_index++) {
				for (var y_index = 0; y_index < Constants.FIELD_HEIGHT; y_index++) {
					var chip = this.chips[l][x_index][y_index];
					if (chip) {
						if (chip.haveShining()) {
							this.shiningCountBeforeShuffle++;
						}
					}
				}
			}
		}

		var all_chips = this.collectChipsByMatchPairs();

		Utils.shuffle(all_chips);

		//---------------
		var tmp_matched_chips = [];
		while (all_chips.length != 0) {
			this.recalcInaccesible();

			var accessible = this.collectAccessibleChips();

			if (accessible.length < 2) {
				accessible = this.collectNonAccessibleChips();
			}

			var chip_1 = accessible[Math.floor(accessible.length * Math.random())];

			var chip_2;

			do {
				chip_2 = accessible[Math.floor(accessible.length * Math.random())];
			} while (chip_1 == chip_2);

			var obj_defs = all_chips.pop();

			chip_1.shuffle(obj_defs[0].name, obj_defs[0].id);

			if (obj_defs.length == 2) {
				chip_2.shuffle(obj_defs[1].name, obj_defs[1].id);
			} else {
				console.log("shuffle bug, no pair for chip", obj_defs[0].name, obj_defs[0].id);

				break;
			}

			tmp_matched_chips.push(chip_1, chip_2);
		}

		for (var i = 0; i < tmp_matched_chips.length; i++) {
			var chip = tmp_matched_chips[i];

			this.chips[chip.getLayer()][chip.getIndexX()][chip.getIndexY()] = chip;
		}

		this.recalcInaccesible();
	};

	PlayState.prototype.collectChipsByMatchPairs = function() {
		var all_chips = [];

		for (var l = 0; l < this.totalLayers(); l++) {
			for (var x_index = 0; x_index < Constants.FIELD_WIDTH; x_index++) {
				for (var y_index = 0; y_index < Constants.FIELD_HEIGHT; y_index++) {
					var chip = this.chips[l][x_index][y_index];

					if (chip) {
						var chip_def = {
							name: chip.getBaseName(),
							id: chip.getID()
						};

						var was_duplicates = false;
						for (var i = 0; i < all_chips.length; i++) {
							if (all_chips[i].length == 2) {
								continue;
							}

							if (all_chips[i].length == 1) {
								if (this.checkMatchByData(all_chips[i][0].name, all_chips[i][0].id, chip_def
										.name, chip_def.id)) {
									all_chips[i].push(chip_def);
									was_duplicates = true;
									break;
								}
							}
						}

						if (!was_duplicates) {
							all_chips.push([chip_def]);
						}
					}
				}
			}
		}

		return all_chips;
	};

	PlayState.prototype.createChip = function(layer, x, y) {
		var chip = new Chip(layer, x, y);

		chip.x = Constants.FIELD_OFFSET_X + Constants.CHIP_WIDTH * x / 2 + layer * Constants.LAYER_OFFSET_X;
		chip.y = Constants.FIELD_OFFSET_Y + Constants.CHIP_HEIGHT * y / 2 + layer * Constants.LAYER_OFFSET_Y;

		this.chips[layer][x][y] = chip;

		this.addGameObjectAt(chip, this.chipLayers[layer]);
	};

	PlayState.prototype.removeChipFromField = function(layer, x_index, y_index) {
		this.chips[layer][x_index][y_index] = null;
	};

	PlayState.prototype.init = function() {
		_super.prototype.init.call(this);

		createjs.Tween.get(this.findGUIObject("top_panel")).wait(1100).to({
			y: +89 / 2
		}, 400, createjs.Ease.circOut);
		createjs.Tween.get(this.findGUIObject("bottom_panel")).wait(1100).to({
			y: Constants.ASSETS_HEIGHT - 70 / 2
		}, 400, createjs.Ease.circOut);
	};

	PlayState.prototype.onEyeTouch = function() {
		PlayState.eyeOpened = !PlayState.eyeOpened;

		this.buttoEyeOpened.visible = PlayState.eyeOpened;
		this.buttoEyeClosed.visible = !PlayState.eyeOpened;

		this.recalcEyeState();

		if (this.tutorial) {
			this.tutorial.onEyeTouch();
		}
	};

	PlayState.prototype.addShiningOnRandomChip = function() { // 点亮随机方块
		if (this.tutorial) {
			var chip = this.chips[1][9][8];

			var pic = chip.shine();

			this.chipLayers[chip.getLayer()].addChild(pic);
			pic.x = chip.x;
			pic.y = chip.y;

			return;
		}

		var chips = this.collectAccessibleChips();

		if (chips.length == 0) {
			return;
		}

		for (var i = 0; i < 30; i++) {
			var chip = chips[Utils.RandomRangeInt(0, chips.length - 1)];

			if (!chip.haveShining()) {
				var pic = chip.shine();

				this.chipLayers[chip.getLayer()].addChild(pic);
				pic.x = chip.x;
				pic.y = chip.y;

				return;
			}
		}
	};

	PlayState.prototype.recalcEyeState = function() {
		for (var l = 0; l < this.totalLayers(); l++) {
			for (var x_index = 0; x_index < Constants.FIELD_WIDTH; x_index++) {
				for (var y_index = 0; y_index < Constants.FIELD_HEIGHT; y_index++) {
					var chip = this.chips[l][x_index][y_index];
					if (chip) {
						chip.setEyeState(PlayState.eyeOpened);
					}
				}
			}
		}
	};
	// 更新状态
	PlayState.prototype.update = function(dt) {
		_super.prototype.update.call(this, dt);

		this.stateTime += dt;
		
		if (this.liveTime - this.lastMatchTime > 3.0) {
			this.matchInARaw = 0;
		}

		// 更新分数
		if (this.tmpScore < this.score) {
			this.tmpScore += 17;
			if (this.tmpScore > this.score) {
				this.tmpScore = this.score;
			}
			this.scoreLabel.setText(Utils.ScoreString(this.tmpScore));
		}

		if (this.waitWin) {// 获胜
			this.waitWinTime += dt;
			if (this.waitWinTime >= 2.5) {
				DNStateManager.g_instance.pushState(new WinState(this.level, this.getStarTier(), this
					.score));
			}
			return;
		}

		// 失败
		if (this.waitLose) {
			console.log("t失败");
			this.waitLoseTime += dt;
			if (this.waitLoseTime >= 2.5) {
				DNStateManager.g_instance.pushState(new LoseState(this.level));
			}
			return;
		}

		if (!this.tutorial) {// 教程
			this.timeLeft -= dt;
			// 星等回饋：右邊 3★ 位、左邊 2★ 位（1★ 是保底，不另外顯示）
			var star_tier = this.getStarTier();
			if (star_tier != this.hudStarTier) {
				this.hudStarTier = star_tier;
				this.setStarSlot("star_3", star_tier >= 3);
				this.setStarSlot("star_2", star_tier >= 2);
			}
		}

		if (this.timeLeft <= 0) {// 剩下的时间
			this.timeLeft = 0;
			this.lose(Images.END_LEVEL_TIME_IS_UP);
		}
		if (Constants.TEST === 2) {
			this.lose(Images.END_LEVEL_NO_POSSIBLE_MOVES);
		}

		this.timeLeftProgressBar.setProgress(this.timeLeft / this.totalTime);
		this.timeLeftLabel.setText(Utils.IntToTimeString(Math.round(this.timeLeft)));// 游戏剩余时间

		switch (this.state) {
			case this.STATE_AUTO_MATCH:// 自动批配
				if (this.stateTime > 0.4) {
					if (!this.matchAny()) {
						this.matchLocked();
					}
					//
					this.stateTime = 0;
					this.autoMatchChainSize--;
					if (this.autoMatchChainSize <= 0) {
						this.setState(this.STATE_NORMAL);
						this.recalcData();
					}
				}
				break;

			case this.STATE_NORMAL:// 正常
				this.hintTime += dt;
				if (this.hintTime >= Constants.HINT_DELAY) {
					this.tryShowHint();
				}
				break;

			case this.STATE_SPAWN:
				if (this.allChipsNormal()) {
					if (this.tutorial) {
						this.tutorial.onSpawnEnded();
					}
					this.setState(this.STATE_NORMAL);
				}
				break;

			case this.STATE_SHUFFLE:// 洗牌
				if (this.allChipsNormal()) {
					for (var i = 0; i < this.shiningCountBeforeShuffle; i++) {
						this.addShiningOnRandomChip(); // 添加闪光随机方块
					}
					this.shiningCountBeforeShuffle = 0;
					if (this.calcMovesCount() == 0) {
						this.matchLocked();
					}
					this.recalcData();
					this.setState(this.STATE_NORMAL);
				}
				break;
		}
	};

	PlayState.prototype.resetHint = function() {
		this.hintTime = 0;
	};

	PlayState.prototype.tryShowHint = function() {
		var pairs = [];

		var accessible_chips = this.collectAccessibleChips();

		for (var i = 0; i < accessible_chips.length; i++) {
			for (var j = i + 1; j < accessible_chips.length; j++) {
				if (this.checkMatch(accessible_chips[i], accessible_chips[j])) {
					pairs.push({
						chip_1: accessible_chips[i],
						chip_2: accessible_chips[j]
					});
				}
			}
		}

		if (pairs.length != 0) {
			var id = Utils.RandomRangeInt(0, pairs.length - 1);

			var chip_1 = pairs[id].chip_1;
			var chip_2 = pairs[id].chip_2;

			this.addGameObjectAtPos(new AutoreleaseEffect("hint_", 51, 0.05), this.chipLayers[chip_1
				.getLayer()], chip_1.x - 1, chip_1.y + 1);
			this.addGameObjectAtPos(new AutoreleaseEffect("hint_", 51, 0.05), this.chipLayers[chip_2
				.getLayer()], chip_2.x - 1, chip_2.y + 1);

			//DNSoundManager.g_instance.play(Sounds.HINT);
			this.hintTime = -0.5;
		}
	};

	PlayState.prototype.setState = function(state) {
		this.state = state;
		this.stateTime = 0;
	};

	PlayState.prototype.allChipsNormal = function() {
		for (var l = 0; l < this.totalLayers(); l++) {
			for (var x_index = 0; x_index < Constants.FIELD_WIDTH; x_index++) {
				for (var y_index = 0; y_index < Constants.FIELD_HEIGHT; y_index++) {
					var chip = this.chips[l][x_index][y_index];
					if (chip && !chip.isNormalState()) {
						return false;
					}
				}
			}
		}
		return true;
	};

	PlayState.prototype.onPauseTouch = function() { // 暂停按钮
		DNStateManager.g_instance.pushState(new PauseState(this.level));
	};

	PlayState.prototype.onDownload = function(imgsrc) { // 下载按钮
		OnDownload.download(imgsrc);
	};

	PlayState.prototype.onMouseDown = function(x, y) {
		if (this.highlighter && !this.highlighter.isDead()) {
			if (!this.highlighter.hitTextMouse(x, y - this.y)) {
				return;
			}
		}

		_super.prototype.onMouseDown.call(this, x, y);

		if (this.waitLose || this.waitWin) {
			return;
		}

		for (var i = 0; i < this.bonuses.length; i++) {
			if (this.bonuses[i]) {
				if (this.bonuses[i].chechMouseClick(x, y)) {
					return;
				}
			}
		}

		if (this.state != this.STATE_NORMAL) {
			return;
		}

		var chip = this.findChipAt(x, y);
		if (chip) {
			//  reset hint on any input
			this.resetHint();

			if (!this.selectedChip) {
				chip.select();
				this.selectedChip = chip;
			} else {
				if (chip == this.selectedChip) {
					chip.deselect();
					this.selectedChip = null;
				} else if (this.checkMatch(this.selectedChip, chip)) {
					this.matchChips(this.selectedChip, chip);
				} else {
					this.selectedChip.deselect();

					chip.select();
					this.selectedChip = chip;
				}
			}
		}
	};
	// 匹配的方块
	PlayState.prototype.matchChips = function(chip_1, chip_2) {
		if (chip_1.y == chip_2.y) {
			chip_1.match(true);
			chip_2.match(false);
		} else {
			chip_1.match(chip_1.y < chip_2.y);
			chip_2.match(chip_1.y > chip_2.y);
		}

		this.addPointsAt(chip_1, chip_2);

		this.selectedChip = null;

		this.checkWin();

		this.recalcData();

		// 快速匹配检查
		this.checkForFastMatching();
		switch (this.matchInARaw) {// 快速匹配
			case 0:
			case 1:
				DNSoundManager.g_instance.play(Sounds.MATCH_1, 0.5);
				break;

			case 2:
				DNSoundManager.g_instance.play(Sounds.MATCH_2, 0.5);
				break;

			case 3:
			default:
				DNSoundManager.g_instance.play(Sounds.MATCH_3, 0.5);
				break;
		}

		if (this.matchInARaw >= 3) {// 快速匹配
			this.matchInARaw = 0;
		}

		if (this.tutorial) {
			this.tutorial.onMatch();
		}
	};
	// 快速匹配检查
	PlayState.prototype.checkForFastMatching = function() {
		if (this.tutorial) {
			if (this.tutorial.checkFastMatching()) {
				this.addShiningOnRandomChip(); // 添加闪光随机方块
				this.tutorial.onGenerateBonusChip(); // 生成奖励方块
			}
			return;
		}

		if (this.matchInARaw == 0) {
			this.matchInARaw++;
		} else {
			if (this.liveTime - this.lastMatchTime < 3.0) {
				this.matchInARaw++;

				if (this.matchInARaw == 3) { //检查时间内是否完成三组方块消除
					this.addShiningOnRandomChip(); // 添加闪光随机方块
				}
			} else {
				this.matchInARaw = 1;
			}
		}

		this.lastMatchTime = this.liveTime;
	};

	PlayState.prototype.recalcData = function() {
		var _this = this;
		this.recalcInaccesible();

		var moves = this.calcMovesCount();
		this.movesLeft.setText(moves.toString());

		if (this.waitLose || this.waitWin) {
			return;
		}
		// 可批配（moves）次数为0，不具有洗牌道具次数
		if (moves == 0 && this.state != this.STATE_AUTO_MATCH) {// 无法移动
			if (this.shufflesCount <= 0) {
				// 无法移动
				this.lose(Images.END_LEVEL_NO_POSSIBLE_MOVES);
				
			} else {
				this.addGameObjectAt(new EndRoundEffect(Images.END_LEVEL_NO_POSSIBLE_MOVES), this);

				var hand_hint = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.HAND);

				this.addChild(hand_hint);

				hand_hint.x = 600;// 手指位置（右下，指向洗牌鈕）
				hand_hint.y = 630;

				hand_hint.alpha = 0;
				hand_hint.scaleX = +0.1;
				//hand_hint.scaleY = -0.1;// 垂直翻轉（原圖手指朝下）
				createjs.Tween.get(hand_hint).wait(1000).to({
					scaleX: 1,// 水平镜射
					//scaleY: -1,// 保持垂直翻轉
					alpha: 1
					
				}, 400, createjs.Ease.backOut).wait(4000).to({
					alpha: 0// 停留 4.0 秒後淡出
					
				}, 300, createjs.Ease.linear).call(function() {
					return _this.removeChild(hand_hint);// 移除
				});

				if (this.tutorial) {
					this.tutorial.onNoMoves();
				}

				// 教學用的黑底遮罩（TutorialHighlighter，alpha 0.6）是在手指娃娃之後才 addChild 的，
				// 會連手指娃娃一起蓋暗；這裡把手指娃娃提回最上層，讓提示保持清楚可見
				if (hand_hint.parent === this) {
					this.setChildIndex(hand_hint, this.getNumChildren() - 1);
				}
			}
		}
	};

	PlayState.prototype.checkMatch = function(chip_1, chip_2) {
		if (chip_1 == chip_2) {
			return false;
		}

		if (chip_1.getBaseName() == chip_2.getBaseName()) {
			if (this.universalChips.indexOf(chip_1.getBaseName()) != -1) {
				return true;
			} else {
				return chip_1.getID() == chip_2.getID();
			}
		}

		return false;
	};

	PlayState.prototype.checkMatchByData = function(name_1, id_1, name_2, id_2) {
		if (name_1 == name_2) {
			if (this.universalChips.indexOf(name_1) != -1) {
				return true;
			} else {
				return id_1 == id_2;
			}
		}

		return false;
	};

	//  should be refactored
	PlayState.prototype.findChipAt = function(x, y) {
		var w = Constants.CHIP_WIDTH / 2 * this.gameLayer.scaleX * 1.7;
		var h = Constants.CHIP_HEIGHT / 2 * this.gameLayer.scaleX * 1.7;

		var res = null;

		var min_distance = 100000000;

		for (var l = this.layersData.length - 1; l >= 0; l--) {
			for (var x_index = 0; x_index < Constants.FIELD_WIDTH; x_index++) {
				for (var y_index = 0; y_index < Constants.FIELD_HEIGHT; y_index++) {
					var chip = this.chips[l][x_index][y_index];

					if (chip && chip.isAccesible()) {
						var chip_pos_x = this.getChipX(chip);
						var chip_pos_y = this.getChipY(chip) + this.y;

						if (x > chip_pos_x - w && x < chip_pos_x + w && y > chip_pos_y - h && y <
							chip_pos_y + h) {
							var distance = (chip_pos_x - x) * (chip_pos_x - x) + (chip_pos_y - y) * (
								chip_pos_y - y);

							if (distance < min_distance) {
								min_distance = distance;

								res = chip;
							}
						}
					}
				}
			}
		}

		return res;
	};

	PlayState.prototype.getChipX = function(chip) {
		return chip.x * this.gameLayer.scaleX + this.gameLayer.x;
	};

	PlayState.prototype.getChipY = function(chip) {
		return chip.y * this.gameLayer.scaleY + this.gameLayer.y;
	};

	PlayState.prototype.calcAccesible = function(chip) {
		var layer = chip.getLayer();
		var x_index = chip.getIndexX();
		var y_index = chip.getIndexY();

		//  check blocked top
		var total = this.totalLayers();

		for (var l = layer + 1; l < total; l++) {
			for (var x = x_index - 1; x < x_index + 2; x++) {
				for (var y = y_index - 1; y < y_index + 2; y++) {
					if (x >= 0 && x < Constants.FIELD_WIDTH && y >= 0 && y < Constants.FIELD_HEIGHT) {
						if (this.chips[l][x][y]) {
							chip.setInaccesible();
							return;
						}
					}
				}
			}
		}

		var blocked_left = false;
		if (x_index - 2 >= 0) {
			for (var y = y_index - 1; y < y_index + 2; y++) {
				if (y < Constants.FIELD_HEIGHT && y >= 0 && this.chips[layer][x_index - 2][y]) {
					blocked_left = true;
					break;
				}
			}
		}

		var blocked_right = false;
		if (x_index + 2 < Constants.FIELD_WIDTH) {
			for (var y = y_index - 1; y < y_index + 2; y++) {
				if (y < Constants.FIELD_HEIGHT && y >= 0 && this.chips[layer][x_index + 2][y]) {
					blocked_right = true;
					break;
				}
			}
		}

		if (blocked_left && blocked_right) {
			chip.setInaccesible();
			return;
		}

		chip.setAccesible();
	};

	PlayState.prototype.recalcInaccesible = function() {
		for (var l = 0; l < this.totalLayers(); l++) {
			for (var x_index = 0; x_index < Constants.FIELD_WIDTH; x_index++) {
				for (var y_index = 0; y_index < Constants.FIELD_HEIGHT; y_index++) {
					var chip = this.chips[l][x_index][y_index];
					if (chip) {
						this.calcAccesible(chip);
					}
				}
			}
		}
	};

	PlayState.prototype.addPointsAt = function(chip_1, chip_2) {
		var points = 150 + this.matchInARaw * 50;

		this.addGameObjectAtPos(new FlyingPoints(points), this, this.getChipX(chip_1), this.getChipY(
			chip_1) - 80 * this.gameLayer.scaleX);
		this.addGameObjectAtPos(new FlyingPoints(points), this, this.getChipX(chip_2), this.getChipY(
			chip_2) - 80 * this.gameLayer.scaleX);

		this.score += points * 2;
	};

	PlayState.prototype.collectAccessibleChips = function() {
		var accessible = [];

		for (var l = 0; l < this.totalLayers(); l++) {
			for (var x_index = 0; x_index < Constants.FIELD_WIDTH; x_index++) {
				for (var y_index = 0; y_index < Constants.FIELD_HEIGHT; y_index++) {
					var chip = this.chips[l][x_index][y_index];

					if (chip && chip.isAccesible()) {
						accessible.push(chip);
					}
				}
			}
		}

		return accessible;
	};

	PlayState.prototype.collectNonAccessibleChips = function() {
		var non_accessible = [];

		for (var l = 0; l < this.totalLayers(); l++) {
			for (var x_index = 0; x_index < Constants.FIELD_WIDTH; x_index++) {
				for (var y_index = 0; y_index < Constants.FIELD_HEIGHT; y_index++) {
					var chip = this.chips[l][x_index][y_index];

					if (chip) {
						non_accessible.push(chip);
					}
				}
			}
		}

		return non_accessible;
	};

	PlayState.prototype.calcMovesCount = function() {
		var counter = 0;

		var accessible_chips = this.collectAccessibleChips();

		for (var i = 0; i < accessible_chips.length; i++) {
			for (var j = i + 1; j < accessible_chips.length; j++) {
				if (this.checkMatch(accessible_chips[i], accessible_chips[j])) {
					counter++;
				}
			}
		}

		return counter;
	};
	// 洗牌
	PlayState.prototype.onShuffleTouch = function() {
		console.log('PlayState.prototype.onShuffleTouch');
		if (this.shufflesCount != 0 && this.state == this.STATE_NORMAL) {
			this.shufflesCount--;
			this.shuffleLabel.setText(this.shufflesCount.toString());
			this.shuffle();
			if (this.tutorial) {
				this.tutorial.onShuffleTouch();
			}
			DNSoundManager.g_instance.play(Sounds.SHUFFLE);
		}
	};

	PlayState.prototype.checkWin = function() {
		for (var l = 0; l < this.totalLayers(); l++) {
			for (var x_index = 0; x_index < Constants.FIELD_WIDTH; x_index++) {
				for (var y_index = 0; y_index < Constants.FIELD_HEIGHT; y_index++) {
					var chip = this.chips[l][x_index][y_index];

					if (chip) {
						return;
					}
				}
			}
		}
		this.win();
	};

	// 星星資格：依通關時剩餘時間比例給 1~3 星（≥2/3 → 3★、≥1/3 → 2★、其餘 1★）
	PlayState.prototype.getStarTier = function() {
		var ratio = this.timeLeft / this.totalTime;
	
		if (ratio >= 2 / 3) {
			return 3;
		}
	
		if (ratio >= 1 / 3) {
			return 2;
		}
	
		return 1;
	};

	// 點亮或熄滅某一顆 HUD 星星（黑色底星常駐，金星在上層淡入淡出）
	PlayState.prototype.setStarSlot = function(name, show) {
		var star = this.findGUIObject(name);

		if (!star) {
			return;
		}

		createjs.Tween.removeTweens(star);
		createjs.Tween.get(star).to({
			alpha: show ? 1 : 0
		}, 300, createjs.Ease.linear);
	};

	PlayState.prototype.win = function() {
		if (this.waitWin || this.waitLose) {
			return;
		}
		this.activateAllBonuses();
		DNSoundManager.g_instance.play(Sounds.WIN, 0.5);
		this.addGameObjectAt(new EndRoundEffect(Images.END_LEVEL_WIN), this);
		this.waitWin = true;
	};

	PlayState.prototype.activateAllBonuses = function() {
		for (var i = 0; i < this.bonuses.length; i++) {
			if (this.bonuses[i]) {
				this.bonuses[i].chechMouseClick(this.bonuses[i].x, this.bonuses[i].y);
			}
		}
	};
	// 失败状态定义
	PlayState.prototype.lose = function(reason_pic) {
		if (this.waitWin || this.waitLose) {
			return;
		}
		if (Constants.TEST === 0) {
			DNStateManager.g_instance.pushState(new EVState(reason_pic, this.level));
			return;
		}
		// 还能加移动时间 Images.END_LEVEL_TIME_IS_UP
		if (Constants.TEST === 1) {
			this.timeLeft += 32;
			Constants.TEST = 3;
			this.waitLose = false;
			DNSoundManager.g_instance.play(Sounds.CLOCK);
			return;
		}
		// 无法移动换成洗牌 Images.END_LEVEL_NO_POSSIBLE_MOVES
		if (Constants.TEST === 2) {
			Constants.TEST = 3;
			this.waitLose = false;
			this.shufflesCount++;
			this.onShuffleTouch();
			return;
		}

		DNSoundManager.g_instance.play(Sounds.LOSE, 0.5);
		this.addGameObjectAt(new EndRoundEffect(reason_pic), this);
		this.waitLose = true;
	};

	PlayState.prototype.zoomField = function() {
		//  looking for left chip
		var left = 1000;
		var right = -1000;
		var top = 1000;
		var bottom = -1000;
		for (var l = 0; l < this.totalLayers(); l++) {
			for (var x_index = 0; x_index < Constants.FIELD_WIDTH; x_index++) {
				for (var y_index = 0; y_index < Constants.FIELD_HEIGHT; y_index++) {
					var chip = this.chips[l][x_index][y_index];

					if (chip) {
						if (chip.x < left) {
							left = chip.x;
						}

						if (chip.x > right) {
							right = chip.x;
						}

						if (chip.y < top) {
							top = chip.y;
						}

						if (chip.y > bottom) {
							bottom = chip.y;
						}
					}
				}
			}
		}

		var scale = Math.min(Math.min(550 / (right - left), 1.4), 470 / (bottom - top));
		this.gameLayer.scaleX = this.gameLayer.scaleY = scale;

		left *= scale;
		right *= scale;
		top *= scale;
		bottom *= scale;

		this.gameLayer.x = Constants.ASSETS_WIDTH / 2 - left - (right - left) / 2;
		this.gameLayer.y = Constants.ASSETS_HEIGHT / 2 - top - (bottom - top) / 2;
	};

	PlayState.prototype.showBonus = function() {
		var _this = this;
		var place_id;

		var counter = 0;

		if (this.tutorial) {
			place_id = 3;
		} else {
			do {
				place_id = Utils.RandomRangeInt(0, 3);

				if (counter++ > 15) {
					return;
				}
			} while (this.bonuses[place_id] != null);
		}

		var bonus;

		if (this.tutorial) { // 第一关教学模式
			bonus = new Bonus(Images.BONUS_POINTS, function() {
				return _this.addPointsForBonus(); // 增加奖励（分数）
			}, true);
		} else {
			// 随机生成奖励
			switch (Utils.RandomRangeInt(0, 7)) {
				case 0:
				case 1:
					// 增加奖励（时间）
					bonus = new Bonus(Images.BONUS_TIME, function() {
						return _this.addTime();
					}, false);
					break;

				case 2:
				case 3:
					// 增加奖励（洗牌）
					bonus = new Bonus(Images.BONUS_SHUFFLE, function() {
						return _this.addShuffle();
					}, false);
					break;

				case 4:
				case 5:
				case 6:
					// 增加奖励（自动匹配）
					bonus = new Bonus(Images.BONUS_AUTO, function() {
						return _this.runAutoMatchChain();
					}, false);
					break;

				case 7:
					// 增加奖励（分数）
					bonus = new Bonus(Images.BONUS_POINTS, function() {
						return _this.addPointsForBonus();
					}, false);
					break;
			}
		}

		this.addChild(bonus);

		bonus.show(this.spawnPositions[place_id][0], this.spawnPositions[place_id][1]);

		bonus.y = this.spawnPositions[place_id][2];

		this.addGameObject(bonus);

		this.bonuses[place_id] = bonus;

		if (this.tutorial) {
			this.tutorial.onShowBonus();
		}
	};

	PlayState.prototype.bonusDead = function(bonus) {
		for (var i = 0; i < this.bonuses.length; i++) {
			if (this.bonuses[i] == bonus) {
				this.bonuses[i] = null;

				return;
			}
		}
	};

	PlayState.prototype.addShuffle = function() { // 增加奖励（洗牌）
		this.shufflesCount++;

		this.shuffleLabel.setText(this.shufflesCount.toString());

		DNSoundManager.g_instance.play(Sounds.BONUS_SCORE, 0.5);
	};

	PlayState.prototype.addTime = function() { // 增加奖励（时间）
		this.timeLeft += 16;

		DNSoundManager.g_instance.play(Sounds.CLOCK);

		// 時間獎勵會讓比例回升，星星段位由 update() 自動即時重算
	};

	PlayState.prototype.addPointsForBonus = function() { // 增加奖励（分数）
		this.score += 1000;

		DNSoundManager.g_instance.play(Sounds.BONUS_SCORE, 0.5);

		var points = new FlyingPoints(1000);

		points.getLabel().scaleX = points.getLabel().scaleY = 1.3;

		this.addGameObjectAtPos(points, this, 320, 200);

		if (this.tutorial) {
			this.tutorial.onRunBonus();
		}
	};

	PlayState.prototype.matchLocked = function() {
		var chip_1 = this.collectAccessibleChips()[0];

		var non_accessible = this.collectNonAccessibleChips();

		for (var i = 0; i < non_accessible.length; i++) {
			if (this.checkMatch(non_accessible[i], chip_1)) {
				this.matchChips(chip_1, non_accessible[i]);

				return;
			}
		}
	};

	PlayState.prototype.runAutoMatchChain = function() { // 增加奖励（自动匹配）
		this.autoMatchChainSize += 3;

		this.setState(this.STATE_AUTO_MATCH);

		DNSoundManager.g_instance.play(Sounds.AUTO_MATCH, 0.65);
	};

	PlayState.prototype.matchAny = function() {
		var accessible_chips = this.collectAccessibleChips();

		//  check no auto bonus generation
		this.matchInARaw = 0;

		for (var i = 0; i < accessible_chips.length; i++) {
			for (var j = i + 1; j < accessible_chips.length; j++) {
				if (this.checkMatch(accessible_chips[i], accessible_chips[j])) {
					this.matchChips(accessible_chips[i], accessible_chips[j]);

					return true;
				}
			}
		}

		return false;
	};

	PlayState.prototype.playDropSound = function() {
		if (this.liveTime - this.lastMatchTime > 0.06) {
			this.lastMatchTime = this.liveTime;

			switch (Utils.RandomRangeInt(0, 2)) {
				case 0:
					DNSoundManager.g_instance.play(Sounds.DROP_1, 0.7);
					break;

				case 1:
					DNSoundManager.g_instance.play(Sounds.DROP_2, 0.7);
					break;

				case 2:
					DNSoundManager.g_instance.play(Sounds.DROP_3, 0.7);
					break;
			}
		}
	};
	PlayState.eyeOpened = true;
	return PlayState;
})(DNGameState);

// 预加载状态
var PreloaderState = (function(_super) {
	console.log('加载 PreloaderState > ' + 5005);
	__extends(PreloaderState, _super);

	function PreloaderState(manifest, sound_manifest, athlases, localizable_images) {
		var _this = this;
		_super.call(this);
		// 进度条
		this.loadingBar = new DNLoadingBar("#000000"); // 美观的配色在 DNLoadingBar 内部，这里只决定遮罩底色

		new DNAssetsManager(manifest, sound_manifest, athlases, localizable_images, function(e) {
			return _this.handleProgress(e);
		});

		this.addChild(this.loadingBar);
		this.loadingBar.x = Constants.ASSETS_WIDTH / 2;
		this.loadingBar.y = Constants.ASSETS_HEIGHT / 2;
	}
	PreloaderState.prototype.handleProgress = function(e) {
		this.loadingBar.setProgress(e.loaded);
	};
	// 預載頁在資源下載途中就會被 update 呼叫 alignByCenter；此時 fill_bottom 等圖還沒進 loader 結果，
	// 若走父類補底圖邏輯會讀到 null、被當成空白佔位，還把 haveFill 標成 true，等圖下載好也不再補。
	// 預載頁本身只顯示進度條，不需要補上下邊緣，這裡直接覆寫為空，同 ShadeIn/ShadeOut 等轉場 State。
	PreloaderState.prototype.alignByCenter = function() {
		//  do nothing
	};
	return PreloaderState;
})(DNGameState);

// 选择关卡按钮
var SelectLevelButton = (function(_super) {
	__extends(SelectLevelButton, _super);
	// 定义一个名为 SelectLevelButton 的函数，该函数接受一个参数 num，表示关卡的编号。
	function SelectLevelButton(num) {
		// 使用闭包，将 this 的上下文保存到 _this 变量中，以便在回调函数中使用。
		var _this = this;
		// 注释说明：Images.OBJ_2_BUTTON1 表示可进入关卡的图标，Images.OBJ_2_BUTTON2 表示不可进入关卡的图标。
		// 使用 _super 调用父类构造函数，根据关卡数量和给定的 num 参数设置初始图片
		_super.call(this, (GameData.getInstance().levelsAvailable() > num ? Images.OBJ_2_BUTTON1 : Images.OBJ_2_BUTTON2));
		// 设置 activeLevel 为 false，表示默认情况下按钮不是激活状态。
		this.activeLevel = false;
		// 设置按钮的点击事件处理函数。当按钮被点击时，会调用 _this.onClick() 方法。
		this.setHandler(function() {
			return _this.onClick();
		});
		// 根据关卡数量和给定的 num 参数判断按钮是否启用。
		var enabled = GameData.getInstance().levelsAvailable() > num;
		// 根据 enabled 的值设置按钮的启用状态。
		this.setEnabled(enabled);
		// 将 num 保存为 levelNum 属性，表示关卡的编号。
		this.levelNum = num;
		// 如果按钮是启用的
		if (enabled) {
			// 创建一个 DNTextField 对象，显示关卡编号（num + 1）。使用 GUI_FONT 作为字体。
			var text = new DNTextField((num + 1).toString(), DNFontDef.GUI_FONT);
			// 将文本字段添加为当前对象的子对象。
			this.getPicture().addChild(text);
			// 设置文本字段的位置，使其居中显示。
			text.x = -text.getBounds().width / 2;
			text.y = -text.getBounds().height / 2 - 9;
			// 三星制：固定畫三格，拿到的顯示實心星、沒拿到的顯示空心星
			var stars_got = GameData.getInstance().getStarsByLevel(num) || 0;
			for (var si = 0; si < 3; si++) {
				var star = DNAssetsManager.g_instance.getCenteredImageWithProxy(si < stars_got ? Images.STAR_MINI : Images.STAR_MINI_EMPTY);
				star.scaleX = star.scaleY = 0.8;
				star.x = (si - 1) * 24;
				star.y = 23;
				this.getPicture().addChild(star);
			}
		}
	}
	// 定义 SelectLevelButton 原型的一个新方法：onMouseDown
	SelectLevelButton.prototype.onMouseDown = function(x, y) {
		// 调用父类（_super）的 onMouseDown 方法，并传递 x 和 y 参数。
		_super.prototype.onMouseDown.call(this, x, y);
		// 将传入的 x 和 y 值保存为 this 的 touchX 和 touchY 属性。
		this.touchX = x;
		this.touchY = y;
	};
	// 定义 SelectLevelButton 原型的一个新方法：onMouseUp
	SelectLevelButton.prototype.onMouseUp = function(x, y) {
		// 如果 x 和 y 与 touchX 和 touchY 的差值大于 30
		if (Math.abs(x - this.touchX) > 30 || Math.abs(y - this.touchY) > 30) {
			this.deselect();// 调用 this 的 deselect 方法
			return;
		}
		// 调用父类（_super）的 onMouseUp 方法，并传递 x 和 y 参数。
		_super.prototype.onMouseUp.call(this, x, y);
	};
	// 定义 SelectLevelButton 原型的一个新方法：onClick
	SelectLevelButton.prototype.onClick = function() {
		// 调用 DNStateManager 的 g_instance 的 pushState 方法，传递一个新的 CoolTransitionInState 实例。
		// 该 CoolTransitionInState 实例内部又包含了新的 PlayState 实例，并将 this 的 levelNum 作为参数传递给 PlayState。
		DNStateManager.g_instance.pushState(new CoolTransitionInState(new PlayState(this.levelNum)));
	};
	return SelectLevelButton;
})(DNJellyButton);

// 选择（地图）关卡状态布局
var SelectLevelState = (function(_super) {
	__extends(SelectLevelState, _super);

	function SelectLevelState() {
		var _this = this;
		_super.call(this);
		this.SELECT_LEVEL_LAYOUT = [{
				type: Layouts.TYPE_STATIC_PICTURE,
				picture: Images.MAP_MENU,
				x: Constants.ASSETS_WIDTH / 2,
				y: -110 / 2,
				name: "panel",
				children: [{//地图面板上标题分数
						type: Layouts.TYPE_STATIC_PICTURE,
						x: -263,
						y: -12,
						picture: Images.CAPTION_SCORE
					},
					{//地图面板上标题分数文字
						type: Layouts.TYPE_TEXT_FIELD,
						x: -212,
						y: -26,
						name: "score",
						text: "004524",
						font: "font_gui/",
						letter_dist: -8
					},
					{//地图面板上星星数量（星星画在标题上）
						type: Layouts.TYPE_TEXT_FIELD,
						x: 162,
						y: -26,
						name: "stars",
						text: "15",
						font: "font_gui/",
						letter_dist: -8
					},
					{// 返回首页按钮
						type: Layouts.TYPE_JELLY_BUTTON,
						picture: Images.BUTTON_EXIT,
						x: 285,
						y: 5,
						name: "button_exit"
					},
					{// 向下按钮
						type: Layouts.TYPE_JELLY_BUTTON,
						picture: Images.MAP_BUTTON_DOWN,
						x: -50 + 4,
						y: 5,
						name: "button_down"
					},
					{// 向上按钮
						type: Layouts.TYPE_JELLY_BUTTON,
						picture: Images.MAP_BUTTON_UP,
						x: 50 + 4,
						y: 5,
						name: "button_up"
					}
				]
			},
			{// 赞助商（选关页面）
				type: Layouts.TYPE_LOGO_PLACEHOLDER,
				x: 95,
				y: 740,
				name: "logo"
			}
		];
		this.layer = new createjs.Container();
		// 景物、關卡按鈕與 NPC 共用這一層：景深照腳底 y 混排，
		// 站位較高（y 較小）的景物才會蓋住 NPC，避免 NPC 整層壓在景物之上
		this.objectsLayer = new createjs.Container();
		// 障礙方格除錯疊層：藍色半透明畫出 32×32 不可通行格，跟著地圖一起捲動
		this.obstacleLayer = new createjs.Container();
		this.objects = [];
		this.levelPoints = [];
		this.scrollingNow = false;

		//  bubbling
		this.addChild(this.layer);

		this.loadLayout(this.SELECT_LEVEL_LAYOUT, this);

		// 大關（章節）名稱：固定靠左對齊在上方面板下方；名稱走多語 i18n.js
		// 靠左對齊是因為各語系字串長度不同（英文最長），置中會讓左邊界隨長度飄移、長串被推出畫面
		// 名稱用系統字型 createjs.Text 繪製（既有 font_gui 只含數字，沒有中文字形）
		var chapterName = Maps.getGroupName(SelectLevelState.currentGroup || 0);
		var chapterFont = "bold 22px Verdana, sans-serif";
		// 這版 EaselJS 描邊只取 color 當描邊色、且描邊後不疊內部填色，
		// 所以用兩層疊放：底層白色描邊、上層深色填字，做出 2px 白邊效果
		this.chapterLabelOutline = new createjs.Text(chapterName, chapterFont, "#FFFFFF");
		this.chapterLabelOutline.textAlign = "left";
		this.chapterLabelOutline.textBaseline = "middle";
		this.chapterLabelOutline.outline = 2;
		this.chapterLabelOutline.x = 30;
		this.chapterLabelOutline.y = 100;
		this.addChild(this.chapterLabelOutline);

		this.chapterLabel = new createjs.Text(chapterName, chapterFont, "#3A2A18");
		this.chapterLabel.textAlign = "left";
		this.chapterLabel.textBaseline = "middle";
		this.chapterLabel.x = 30;
		this.chapterLabel.y = 100;
		this.addChild(this.chapterLabel);

		this.findGUIObject("button_down").setHandler(function() {// 向下按钮
			return _this.onDownTouch();
		});
		this.findGUIObject("button_up").setHandler(function() {// 向上按钮
			return _this.onUpTouch();
		});
		this.findGUIObject("button_exit").setHandler(function() {// 返回首页按钮
			return _this.onExitTouch();
		});

		var curGroup = SelectLevelState.currentGroup || 0;
		for (var i = 0; i < Maps.getPageCount(curGroup); i++) { // 地图底图
			var pic = DNAssetsManager.g_instance.getImage(Maps.getBackName(i, curGroup));
			pic.y = Maps.getPageY(i, curGroup);
			this.layer.addChild(pic);
		}

		this.layer.addChild(this.objectsLayer);
		this.layer.addChild(this.obstacleLayer);

		this.findGUIObject("score").setText(Utils.ScoreString(GameData.getInstance().getTotalScore()));// 分数
		this.findGUIObject("stars").setText(GameData.getInstance().getTotalStars().toString());// 星星数

		if (SelectLevelState.wasLongAnimation) {
			this.layer.y = -Maps.getPageY(SelectLevelState.currentPage, SelectLevelState.currentGroup || 0);
		}
	}
	// 顯示／隱藏地面景物（景觀）。true＝顯示景物；false＝隱藏景物，
	// TODO 改由障礙疊層把不可通行方格用藍色半透明畫出來，方便直觀檢查障礙位置。
	SelectLevelState.SHOW_OBJECTS = true;

	// 載入本頁 NPC 不可通行障礙：在 NPC 進場之前先註冊，
	// 這樣挑落腳點、進場退出時就看得到障礙，不會一開始卡在障礙格裡。
	// 資料來自 js/map-obstacles.js（頁內座標）；addPageObstacle 內部自動加分頁位移。
	SelectLevelState.prototype.loadPageObstacles = function() {
		NpcWalker.g_instance.clearObstacles();
		var curGroup = SelectLevelState.currentGroup || 0;
		var pageObstacles = (typeof MapObstacles !== 'undefined')
			? MapObstacles.getObstacles(SelectLevelState.currentPage, curGroup) : [];
		for (var ob_i = 0; ob_i < pageObstacles.length; ob_i++) {
			var ob = pageObstacles[ob_i];
			NpcWalker.g_instance.addPageObstacle(SelectLevelState.currentPage, ob.x, ob.y, ob.r, curGroup);
		}
		this.drawObstacleLayer(pageObstacles, curGroup);
	};

	// 把本頁障礙畫成藍色半透明方格疊層（除錯用）；座標換算與 addPageObstacle 同一套
	SelectLevelState.prototype.drawObstacleLayer = function(pageObstacles, curGroup) {
		if (!this.obstacleLayer) {
			return;
		}
		this.obstacleLayer.removeAllChildren();
		this.obstacleLayer.visible = !SelectLevelState.SHOW_OBJECTS;
		var pageY = Maps.getPageY(SelectLevelState.currentPage, curGroup);
		for (var i = 0; i < pageObstacles.length; i++) {
			var ob = pageObstacles[i];
			var half = (typeof ob.r === 'number' && ob.r > 0) ? ob.r : 16;
			var rect = new createjs.Shape();
			rect.graphics.beginFill("rgba(60, 130, 255, 0.38)");
			rect.graphics.beginStroke("rgba(30, 90, 220, 0.8)");
			rect.graphics.setStrokeStyle(1);
			rect.graphics.rect(ob.x - half, pageY + ob.y - half, half * 2, half * 2);
			this.obstacleLayer.addChild(rect);
		}
		this.obstacleLayer.visible = !SelectLevelState.SHOW_OBJECTS;
	};

	// 切換景觀顯示：true 顯示景物、隱藏障礙疊層；false 隱藏景物、顯示障礙方格
	SelectLevelState.prototype.setShowObjects = function(show) {
		SelectLevelState.SHOW_OBJECTS = !!show;
		if (this.objectsLayer) {
			this.objectsLayer.visible = SelectLevelState.SHOW_OBJECTS;
		}
		// 景物包裝層（MapSkewer）與原始圖片都跟著切，避免隱藏時殘留
		for (var i = 0; i < this.objects.length; i++) {
			var obj = this.objects[i];
			if (obj) {
				obj.visible = SelectLevelState.SHOW_OBJECTS;
			}
		}
		if (this.obstacleLayer) {
			this.obstacleLayer.visible = !SelectLevelState.SHOW_OBJECTS;
		}
	};

	SelectLevelState.prototype.init = function() {
		_super.prototype.init.call(this);

		// 選關頁天氣特效層（夜晚／下雨／打雷／起霧／降雪）
		// 只在這一個頁面掛上；離開本頁（進關卡、回主選單）由 weather.js 內部偵測後自動卸載
		WeatherSystem.g_instance.attach(this);

		// 先把本頁障礙註冊進走路層，再掛 NPC：NPC 進場挑點、退出障礙時才看得到。
		this.loadPageObstacles();

		// 選關頁的 NPC 走動層：npc01 / npc02 / npc03 三隻在地圖上各自隨機漫步
		// NPC 與景物共用 objectsLayer，照腳底 y 混排景深（y 小的在後、y 大的在前），
		// 站位高於景物格時由景物蓋住 NPC；彼此會互相避讓，不會疊在一起。
		// 三隻都在本頁 gameObjects 裡，進關卡或回主選單時隨本頁一起消失，不必另外卸載
		NpcWalker.g_instance.attach(this);

		if (!SelectLevelState.wasLongAnimation) {
			SelectLevelState.wasLongAnimation = true;
			this.setCurrentPageLong(SelectLevelState.currentPage);
		} else {
			this.setCurrentPage(SelectLevelState.currentPage);
			this.onLongScrollFinished();
		}
	};

	SelectLevelState.prototype.setCurrentPage = function(page) {
		var _this = this;
		if (this.scrollingNow) {
			return;
		}

		this.scrollingNow = true;

		SelectLevelState.currentPage = page;
		var curGroup = SelectLevelState.currentGroup || 0;

		//  hide old buttons
		createjs.Tween.get(this.layer).to({
			y: -Maps.getPageY(page, curGroup)
		}, 650, createjs.Ease.cubicOut).call(function() {
			return _this.onScrollFinished();
		});
	};

	SelectLevelState.prototype.setCurrentPageLong = function(page) {
		var _this = this;
		var curGroup = SelectLevelState.currentGroup || 0;
		var tm = -Maps.getPageY(page, curGroup) / Constants.ASSETS_HEIGHT;

		SelectLevelState.currentPage = page;

		//  hide old buttons
		createjs.Tween.get(this.layer).wait(300).to({
			y: -Maps.getPageY(page, curGroup)
		}, 650 * Math.abs(tm), createjs.Ease.cubicOut).call(function() {
			return _this.onScrollFinished();
		}).call(function() {
			return _this.onLongScrollFinished();
		});
	};

	SelectLevelState.prototype.removeOldObjects = function() {
		if (this.mill) {
			this.mill.kill();
			this.mill = null;
		}

		for (var i = 0; i < this.levelPoints.length; i++) {
			this.levelPoints[i].parent.removeChild(this.levelPoints[i]);
		}
		this.levelPoints = [];

		for (var i = 0; i < this.objects.length; i++) {
			this.objects[i].parent.removeChild(this.objects[i]);
		}
		this.objects = [];
	};
	
	SelectLevelState.prototype.addNewObjects = function() {
		var curGroup = SelectLevelState.currentGroup || 0;
		var coordinates = Maps.getLevelPoints(curGroup, SelectLevelState.currentPage); // 已含頁面位移
		//设置关卡选择按钮
		for (var i = 0; i < coordinates.length; i++) {
			var point = new SelectLevelButton(curGroup * Maps.getPageCount(curGroup) * 10 + SelectLevelState.currentPage * 10 + i);
			this.addGuiObject(point);

			point.x = coordinates[i][0];
			point.y = coordinates[i][1];

			console.log('关卡点座标 > ' + i + ' x:' + point.x + ' y:' + point.y);
			this.levelPoints.push(point);
		}

		var objects = Maps.getObjects(curGroup, SelectLevelState.currentPage); // 已含頁面位移
		for (var i = 0; i < objects.length; i++) { // 地图上景物
			var obj = null;

			if (SelectLevelState.currentPage == 0 && i == 0) {
				this.mill = new WildMill();
				this.addGameObject(this.mill);

				obj = this.mill;
			} else {
				obj = DNAssetsManager.g_instance.getCenteredImageWithProxy(objects[i].pic);
			}

			obj.x = objects[i].x;
			obj.y = objects[i].y;
			obj.visible = SelectLevelState.SHOW_OBJECTS;
			console.log('地图上景物座标 > ' + obj.x + '/' + obj.y);

			this.objects.push(obj);
		}
	};

	SelectLevelState.prototype.onLongScrollFinished = function() {
		createjs.Tween.get(this.findGUIObject("panel")).to({
			y: 89 / 2
		}, 400, createjs.Ease.cubicOut);
	};

	SelectLevelState.prototype.onScrollFinished = function() {
		this.removeOldObjects();

		this.addNewObjects();

		// 載入本頁的 NPC 不可通行障礙（與 init 同一方法；翻頁後重新註冊新頁）
		this.loadPageObstacles();

		// 翻到新分頁後，撤掉上一頁的 NPC，從當前頁 visible=true 名單重新隨機抽 maxPerPage 名上場；
		// 每一個地圖分頁單獨計算，不沿用前一頁的那一批。
		NpcWalker.g_instance.attach(this);

		for (var i = 0; i < this.levelPoints.length; i++) {
			var point = this.levelPoints[i];

			this.objectsLayer.addChild(point);

			point.alpha = 0;
			createjs.Tween.get(point).wait(300 + i * 70).to({
				alpha: 1
			}, 200, createjs.Ease.linear);

			point.scaleX = point.scaleY = 0.1;

			createjs.Tween.get(point).wait(300 + i * 70).to({
				scaleX: 1,
				scaleY: 1
			}, 400, createjs.Ease.backOut);
		}

		// 地圖景物掉落的參數（手感要調就改這裡）
		var DROP = {
			gapMin: 250,		// 相鄰兩顆的最小間隔（毫秒）
			gapMax: 500,		// 相鄰兩顆的最大間隔（毫秒）
			firstDelay: 250,	// 第一顆等多久才開始掉（毫秒）
			fallTime: 320,		// 落下時間（毫秒）
			fallHeight: 240,	// 起點比定位點高多少（相對值，不受頁面位移影響）
			fadeTime: 120		// 落下前段的淡入時間（毫秒）
		};

		// 依隨機順序掉落：先把索引打亂，再逐顆累加 250~500ms 的間隔，
		// 這樣「順序」和「節奏」都隨機，不會變成排隊式一個接一個
		var order = [];
		for (var i = 0; i < this.objects.length; i++) {
			order.push(i);
		}
		Utils.shuffle(order);

		var dropAt = DROP.firstDelay;	// 目前這一顆幾毫秒後開始掉
		var firstLandAt = -1;			// 第一顆落地的時刻，用來對音效
		var wrappers = [];				// 收集景物的包裝層，迴圈跑完再依 y 統一排景深

		for (var n = 0; n < order.length; n++) {
			var obj = this.objects[order[n]];

			this.objectsLayer.addChild(obj);

			// 第二顆之後，每顆都比前一顆晚 250~500ms
			if (n > 0) {
				dropAt += Utils.RandomRange(DROP.gapMin, DROP.gapMax);
			}

			// 色彩與縮放先歸位，避免沿用上一次留下的狀態
			obj.alpha = 1;

			var landAt = dropAt + DROP.fallTime;
			if (firstLandAt < 0) {
				firstLandAt = landAt;
			}

			// 震動從「落地那一刻」才開始：MapSkewer 的 delay 正是這段等待
			var skewer = new MapSkewer(obj, landAt / 1000);
			this.addGameObjectAt(skewer, this.objectsLayer);

			// 落下：從上方 fallHeight 處以重力加速掉到定位點
			var landY = skewer.y;
			skewer.y = landY - DROP.fallHeight;
			skewer.alpha = 0;

			// 記住定位後的 y 並收集起來，景深要靠它排序，不能靠加入容器的先後
			skewer.baseY = landY;
			wrappers.push(skewer);

			// 淡入與落下各用一條 tween，兩者同時起跑，落地時刻才能跟 delay 對齊
			createjs.Tween.get(skewer).wait(dropAt).to({
				alpha: 1
			}, DROP.fadeTime, createjs.Ease.linear);

			createjs.Tween.get(skewer).wait(dropAt).to({
				y: landY
			}, DROP.fallTime, createjs.Ease.quadIn);
		}

		// 排前後景：y 越大（越靠畫面下方）越前面，y 越小（越靠上方選單）越後面。
		// 這裡刻意不用「誰後掉誰在上面」——那是加入容器的順序決定的，跟位置無關，
		// 隨機掉落時就會出現「後掉的那顆壓在原本該在前面的景物上」。
		wrappers.sort(function(a, b) {
			return a.baseY - b.baseY;
		});

		for (var w = 0; w < wrappers.length; w++) {
			// 重新 append 會把它移到容器最上層，所以照 y 由小到大依序疊，
			// 最後疊上去的那個（y 最大）就自然在最前面
			this.objectsLayer.removeChild(wrappers[w]);
			this.objectsLayer.addChild(wrappers[w]);
		}

		// 音效對齊第一顆落地；這一頁沒有景物的話就沿用原本的 330ms
		createjs.Tween.get(this).wait(firstLandAt > 0 ? firstLandAt : 330).call(function() {
			return DNSoundManager.g_instance.play(Sounds.BUTTONS_ON_MAP);
		});

		this.scrollingNow = false;
	};
	// 往下选地图按钮
	SelectLevelState.prototype.onDownTouch = function() {
		if (SelectLevelState.currentPage == 0) {// 页面等于数字0
			return;
		}

		this.setCurrentPage(SelectLevelState.currentPage - 1);
	};
	// 往上选地图按钮（最后一张地图的页码由 Maps.getPageCount() 决定）
	SelectLevelState.prototype.onUpTouch = function() {// 页面超过数字4（增加地图需要修改）
		var curGroup = SelectLevelState.currentGroup || 0;
		if (SelectLevelState.currentPage == Maps.getPageCount(curGroup) - 1) {
			return;
		}

		this.setCurrentPage(SelectLevelState.currentPage + 1);
	};
	// 返回首页按钮
	SelectLevelState.prototype.onExitTouch = function() {
		DNStateManager.g_instance.pushState(new CoolTransitionInState(new MainMenuState()));
	};
	// SelectLevelState 原型的一个新方法：onMouseDown  
	SelectLevelState.prototype.onMouseDown = function(x, y) {
		// 调用父类（_super）的 onMouseDown 方法，并传递 x 和 y 参数。
		_super.prototype.onMouseDown.call(this, x, y);
		// 将传入的 y 值保存为 this 的 touchY 属性。
		this.touchY = y;
		// 将当前 liveTime（可能是当前的时间或者状态持续时间）的值保存为 this 的 touchTime 属性。
		this.touchTime = this.liveTime;
	};
	// SelectLevelState 原型的一个新方法：onMouseMove
	SelectLevelState.prototype.onMouseMove = function(x, y) {
		// 调用父类（_super）的 onMouseMove 方法，并传递 x 和 y 参数。
		_super.prototype.onMouseMove.call(this, x, y);
		// 如果 liveTime（当前时间或者状态持续时间）减去 touchTime（触摸开始的时间）小于0.5秒
		if (this.liveTime - this.touchTime < 0.5) {
			// 如果 y 值与 touchY 值的差小于 -60
			if (y - this.touchY < -60) {
				this.onDownTouch();// 调用 this 的 onDownTouch 方法
			}
			// 如果 y 值与 touchY 值的差大于 +60
			if (y - this.touchY > +60) {
				this.onUpTouch();// 调用 this 的 onUpTouch 方法
			}
		}
	};
	SelectLevelState.currentPage = 0;
	SelectLevelState.currentGroup = 0;

	SelectLevelState.wasLongAnimation = false;
	return SelectLevelState;
})(DNGameState);

/// <reference path="references.ts" />
var ShadeInState = (function(_super) {
	console.log('加载 ShadeInState > ' + 5561);
	__extends(ShadeInState, _super);

	function ShadeInState(next_state) {
		var _this = this;
		_super.call(this);
		this.nextState = null;

		this.nextState = next_state;

		//  shading
		this.shader = new createjs.Shape();
		this.shader.graphics.beginFill("#ffffff");
		this.shader.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH, Constants.SCREEN_HEIGHT);
		this.shader.graphics.endFill();
		this.addChild(this.shader);
		this.shader.alpha = 0;
		createjs.Tween.get(this.shader).to({
			alpha: 1.0
		}, 400, createjs.Ease.linear).call(function() {
			return _this.onFinishShade();
		});
	}
	ShadeInState.prototype.onFinishShade = function() {
		DNStateManager.g_instance.changeState(this.nextState);
		DNStateManager.g_instance.pushState(new ShadeOutState());
	};

	ShadeInState.prototype.setNextState = function(state) {
		this.nextState = state;
	};

	ShadeInState.prototype.alignByCenter = function() {
		//  do nothing
	};
	return ShadeInState;
})(DNGameState);

/// <reference path="references.ts" />
var ShadeOutState = (function(_super) {
	console.log('加载 ShadeOutState > ' + 5530);
	__extends(ShadeOutState, _super);

	function ShadeOutState() {
		var _this = this;
		_super.call(this);

		//  shading
		this.shader = new createjs.Shape();
		this.shader.graphics.beginFill("#ffffff");
		this.shader.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH, Constants.SCREEN_HEIGHT);
		this.shader.graphics.endFill();
		this.addChild(this.shader);
		createjs.Tween.get(this.shader).to({
			alpha: 0
		}, 400, createjs.Ease.linear).call(function() {
			return _this.onFinishShade();
		});
	}
	ShadeOutState.prototype.onFinishShade = function() {
		DNStateManager.g_instance.popState();
	};

	ShadeOutState.prototype.alignByCenter = function() {
		//  do nothing
	};
	return ShadeOutState;
})(DNGameState);

/// <reference path="references.ts" />
var Skewer = (function(_super) {
	console.log('加载 Skewer > ' + 5561);
	__extends(Skewer, _super);

	function Skewer(name) {
		_super.call(this);
		this.proxy = new createjs.Container();

		this.addChild(this.proxy);

		var pic = DNAssetsManager.g_instance.getImage(name);

		pic.x = -pic.getBounds().width / 2;
		pic.y = -pic.getBounds().height;

		this.proxy.addChild(pic);

		this.proxy.y = pic.getBounds().height * 0.5;
	}
	Skewer.prototype.forceUpdate = function(dt) {
		_super.prototype.forceUpdate.call(this, dt);

		this.proxy.skewX = Math.sin(this.forceLiveTime * 4.0) * 6.0;

		this.proxy.scaleY = 1 + Math.sin(this.forceLiveTime * 8.0) * 0.05;
	};
	return Skewer;
})(DNGUIObject);

/// <reference path="references.ts" />
var Skewer2 = (function(_super) {
	console.log('加载 Skewer2 > ' + 5591);
	__extends(Skewer2, _super);

	function Skewer2(clip) {
		_super.call(this);
		this.devider = Utils.RandomRange(0.9, 1.1);

		this.clip = clip;
		//this.forceLiveTime = Math.random() * 0.2;
	}
	Skewer2.prototype.forceUpdate = function(dt) {
		_super.prototype.forceUpdate.call(this, dt);

		this.clip.skewX = Math.sin(this.forceLiveTime * 4.0 * this.devider) * 8.0;

		this.clip.scaleY = 1 + Math.sin(this.forceLiveTime * 8.0 * this.devider) * 0.08;
	};
	return Skewer2;
})(DNGUIObject);

/// <reference path="references.ts" />
var DNSoundManager = (function() {
	console.log('加载 DNSoundManager > ' + 5613);

	// 音量持久化鍵：背景音樂 / 音效各自一筆，0~1 的數字；靜音開關另外存一筆布林
	var SOUND_CFG_MUSIC_KEY = "sound_music_volume";
	var SOUND_CFG_SFX_KEY = "sound_sfx_volume";
	var SOUND_CFG_ENABLED_KEY = "sound_enabled";

	function _clampVolume(v) {
		v = parseFloat(v);
		if (isNaN(v)) {
			return 1;
		}
		return Math.max(0, Math.min(1, v));
	}

	function _loadVolume(key, fallback) {
		try {
			var saved = window.localStorage.getItem(key);
			return saved == null ? fallback : _clampVolume(saved);
		} catch (e) {
			return fallback;
		}
	}

	function _saveVolume(key, v) {
		try {
			window.localStorage.setItem(key, String(v));
		} catch (e) {}
	}

	// 靜音開關讀取：只認明確存過的 "false"，其餘（含 null/舊版殘留）預設開啟
	function _loadEnabled(fallback) {
		try {
			var saved = window.localStorage.getItem(SOUND_CFG_ENABLED_KEY);
			return saved == null ? fallback : saved !== "false";
		} catch (e) {
			return fallback;
		}
	}

	function _saveEnabled(enabled) {
		try {
			window.localStorage.setItem(SOUND_CFG_ENABLED_KEY, enabled ? "true" : "false");
		} catch (e) {}
	}

	function DNSoundManager() {
		// 靜音開關連同兩條音量一併從使用者端還原，重啟遊戲不需重設
		this.soundEnabled = _loadEnabled(true);
		this.initiliazed = false;
		this.focus = true;
		this.hidden = false;
		this.wasSoundEnabled = true;
		this.wasPauseCall = false;
		this.soundsOnFrame = [];
		//  dirty hack
		this.wasMusicPlay = false;

		// 雙通道音量（0~1）：背景音樂與各自短音效獨立控制；持久化到 localStorage
		// _loadVolume/_saveVolume 是 IIFE 閉包內的純函式，直接呼叫，不掛 prototype
		this.musicVolume = _loadVolume(SOUND_CFG_MUSIC_KEY, 1);
		this.sfxVolume = _loadVolume(SOUND_CFG_SFX_KEY, 1);
		this.musicInstance = null; // 背景音樂循環實例引用，事後可單獨調整音量
		this.loopInstances = []; // 循環音效實例清單（如雨聲），隨 sfx 總音量管理
	}
	DNSoundManager.prototype.onLostFocus = function() {
		this.focus = false;
	};

	DNSoundManager.prototype.onFocus = function() {
		this.focus = true;
	};

	DNSoundManager.prototype.init = function() {
		try {
			if (!this.initiliazed) {
				if (!createjs.Sound.initializeDefaultPlugins()) {
					return;
				}

				this.initiliazed = true;
			}
		} catch (e) {}
	};

	DNSoundManager.prototype.isSoundEnabled = function() {
		return this.soundEnabled;
	};

	// 套用目前啟用狀態到引擎靜音；不寫回 localStorage（暫停、切背景等暫時性切換走這裡）
	DNSoundManager.prototype._applyMute = function() {
		var is_mute = !this.soundEnabled || !this.focus || this.hidden;

		try {
			if (createjs.Sound.getMute() == is_mute) {
				return;
			}

			createjs.Sound.setMute(is_mute);
		} catch (e) {}
	};

	// 使用者主動切換音效開關：更新暫存、寫回 localStorage，並即時套用靜音
	DNSoundManager.prototype.setSoundEnabled = function(enabled) {
		this.soundEnabled = enabled;
		_saveEnabled(enabled);
		this._applyMute();
	};

	DNSoundManager.prototype.play = function(name, volume) {
		try {
			if (!volume) {
				volume = 1;
			}

			// 短音效再乘上音效總音量（sfxVolume），個別呼叫端傳的 volume 視為該音效相對音量
			var finalVolume = volume * this.sfxVolume;

			if (this.initiliazed && this.soundEnabled) {
				return createjs.Sound.play(name, createjs.Sound.INTERRUPT_NONE, 0, 0, 0, finalVolume);
			}
		} catch (e) {}

		return null;
	};

	DNSoundManager.prototype.playMusic = function(volume) {
		try {
			if (!volume) {
				volume = 1;
			}

			if (this.initiliazed && this.soundEnabled) {
				if (!this.wasMusicPlay) {
					this.wasMusicPlay = true;
					// 背景音樂乘上音樂總音量（musicVolume），循環 -1
					var music_instance = createjs.Sound.play(Sounds.MUSIC, createjs.Sound.INTERRUPT_NONE, 0,
						0, -1, volume * this.musicVolume);
					this.musicInstance = music_instance;

					if (music_instance.playState == "playFailed") {
						this.wasMusicPlay = false;
						this.musicInstance = null;
						return null;
					}
				}
			}
		} catch (e) {}

		return null;
	};

	// 音樂音量（0~1）：更新暫存、寫回 localStorage，並即時調整已播放的音樂實例
	DNSoundManager.prototype.setMusicVolume = function(v) {
		this.musicVolume = _clampVolume(v);
		_saveVolume(SOUND_CFG_MUSIC_KEY, this.musicVolume);

		if (this.musicInstance) {
			try {
				this.musicInstance.setVolume(this.musicVolume);
			} catch (e) {}
		}
	};

	// 音效音量（0~1）：短音效是播完即釋放，只更新暫存與持久化，之後新播放的音效自動套用；
	// 另有循環音效實例（如雨聲）會暫存於 this.loopInstances，改音量時一併調整
	DNSoundManager.prototype.setSfxVolume = function(v) {
		this.sfxVolume = _clampVolume(v);
		_saveVolume(SOUND_CFG_SFX_KEY, this.sfxVolume);

		if (this.loopInstances) {
			for (var i = 0; i < this.loopInstances.length; i++) {
				var inst = this.loopInstances[i];
				if (inst) {
					try {
						inst.setVolume(this.sfxVolume);
					} catch (e) {}
				}
			}
		}
	};

	// 註冊一支循環音效實例（如雨聲），隨音效總音量一併管理；回傳該實例
	DNSoundManager.prototype.playLoop = function(name, volume) {
		try {
			if (!volume) {
				volume = 1;
			}

			if (this.initiliazed && this.soundEnabled) {
				var inst = createjs.Sound.play(name, createjs.Sound.INTERRUPT_NONE, 0, 0, -1,
					volume * this.sfxVolume);
				if (!this.loopInstances) {
					this.loopInstances = [];
				}
				this.loopInstances.push(inst);
				return inst;
			}
		} catch (e) {}

		return null;
	};

	// 移除已釋放的循環音效實例（雨停/換等級時呼叫）
	DNSoundManager.prototype.releaseLoop = function(inst) {
		if (!inst || !this.loopInstances) {
			return;
		}
		for (var i = this.loopInstances.length - 1; i >= 0; i--) {
			if (this.loopInstances[i] === inst) {
				this.loopInstances.splice(i, 1);
				break;
			}
		}
	};

	DNSoundManager.prototype.getMusicVolume = function() {
		return this.musicVolume;
	};

	DNSoundManager.prototype.getSfxVolume = function() {
		return this.sfxVolume;
	};

	DNSoundManager.prototype.update = function() {
		this.soundsOnFrame.length = 0;

		if (this.initiliazed) {
			if (document.hidden || document["webkitHidden"] || document.msHidden) {
				this.hidden = true;
			} else {
				this.hidden = false;
			}

			this._applyMute();
		}
	};

	DNSoundManager.prototype.playSinglePerFrame = function(name, volume) {
		if (this.soundsOnFrame.indexOf(name) == -1) {
			this.soundsOnFrame.push(name);

			this.play(name, volume);
		}
	};

	DNSoundManager.prototype.onPause = function() {
		this.wasPauseCall = true;

		console.log("on pause");

		this.wasSoundEnabled = this.isSoundEnabled();

		if (this.isSoundEnabled()) {
			this.soundEnabled = false;
			this._applyMute();
		}
	};

	DNSoundManager.prototype.onResume = function() {
		if (this.wasPauseCall) {
			console.log("on resume");

			if (this.wasSoundEnabled) {
				this.soundEnabled = true;
				this._applyMute();
			}

			this.wasPauseCall = false;
		}
	};
	DNSoundManager.g_instance = new DNSoundManager();
	return DNSoundManager;
})();

// 加载音效
var Sounds = (function() {
	function Sounds() {}
	Sounds.MUSIC = "music";
	Sounds.CLICK = "click";
	Sounds.MATCH_1 = "match_1";
	Sounds.MATCH_2 = "match_2";
	Sounds.MATCH_3 = "match_3";
	Sounds.DROP_1 = "drop_1";
	Sounds.DROP_2 = "drop_2";
	Sounds.DROP_3 = "drop_3";
	Sounds.WIN = "win";
	Sounds.LOSE = "lose";
	Sounds.SHUFFLE = "shuffle";
	Sounds.GENERATE_BONUS = "generate_bonus";
	Sounds.SHOW_BONUS = "show_bonus";
	Sounds.CLOCK = "clock";
	Sounds.POPUP = "popup";
	Sounds.SELECT = "select";
	Sounds.AUTO_MATCH = "auto_match";
	Sounds.BONUS_SCORE = "bonus_score";
	Sounds.SCORE = "score";
	Sounds.BUTTONS_ON_MAP = "buttons_on_map";
	Sounds.THUNDER = "thunder";// 打雷
	Sounds.RAIN = "rain";// 下雨

	Sounds.ALL = [
		Sounds.MUSIC,
		Sounds.CLICK,
		Sounds.MATCH_1,
		Sounds.MATCH_2,
		Sounds.MATCH_3,
		Sounds.DROP_1,
		Sounds.DROP_2,
		Sounds.DROP_3,
		Sounds.WIN,
		Sounds.LOSE,
		Sounds.POPUP,
		Sounds.SHUFFLE,
		Sounds.GENERATE_BONUS,
		Sounds.SHOW_BONUS,
		Sounds.CLOCK,
		Sounds.SELECT,
		Sounds.AUTO_MATCH,
		Sounds.BONUS_SCORE,
		Sounds.SCORE,
		Sounds.BUTTONS_ON_MAP,
		Sounds.THUNDER,
		Sounds.RAIN
	];
	return Sounds;
})();

// 加载教学文字
var Strings = (function() {
	// i18n.js
	function Strings() {}
	Strings.TUTORIAL_1 = "TUTORIAL_1";
	Strings.TUTORIAL_2 = "TUTORIAL_2";
	Strings.TUTORIAL_3 = "TUTORIAL_3";
	Strings.TUTORIAL_4 = "TUTORIAL_4";
	Strings.TUTORIAL_5 = "TUTORIAL_5";
	Strings.TUTORIAL_6 = "TUTORIAL_6";
	Strings.TUTORIAL_7 = "TUTORIAL_7";
	Strings.TUTORIAL_8 = "TUTORIAL_8";
	// 大關（章節）名稱，對應 i18n.js 的 CHAPTER_NAME_n
	Strings.CHAPTER_NAME_0 = "CHAPTER_NAME_0";
	// 音量設定面板，對應 i18n.js 的 SETTINGS_*
	Strings.SETTINGS_TITLE = "SETTINGS_TITLE";
	Strings.SETTINGS_SECTION = "SETTINGS_SECTION";
	Strings.SETTINGS_LANG = "SETTINGS_LANG";
	Strings.SETTINGS_MUSIC = "SETTINGS_MUSIC";
	Strings.SETTINGS_SFX = "SETTINGS_SFX";
	Strings.SETTINGS_MUTE = "SETTINGS_MUTE";
	Strings.SETTINGS_LOGOUT = "SETTINGS_LOGOUT";
	// 登入／註冊面板，對應 i18n.js 的 LOGIN_*
	Strings.LOGIN_TITLE = "LOGIN_TITLE";
	Strings.LOGIN_ACCOUNT = "LOGIN_ACCOUNT";
	Strings.LOGIN_PASSWORD = "LOGIN_PASSWORD";
	Strings.LOGIN_SUBMIT = "LOGIN_SUBMIT";
	Strings.LOGIN_ACCOUNT_PH = "LOGIN_ACCOUNT_PH";
	Strings.LOGIN_PASSWORD_PH = "LOGIN_PASSWORD_PH";
	// 註冊／登入模式切換與 API 回饋訊息，對應 i18n.js 的 LOGIN_*
	Strings.LOGIN_BTN_LOGIN = "LOGIN_BTN_LOGIN";
	Strings.LOGIN_BTN_REGISTER = "LOGIN_BTN_REGISTER";
	Strings.LOGIN_SWITCH_REGISTER = "LOGIN_SWITCH_REGISTER";
	Strings.LOGIN_SWITCH_LOGIN = "LOGIN_SWITCH_LOGIN";
	Strings.LOGIN_STATUS_EMPTY = "LOGIN_STATUS_EMPTY";
	Strings.LOGIN_STATUS_LOADING = "LOGIN_STATUS_LOADING";
	Strings.LOGIN_STATUS_SUCCESS = "LOGIN_STATUS_SUCCESS";
	Strings.LOGIN_ERROR_ACCOUNT_EXISTS = "LOGIN_ERROR_ACCOUNT_EXISTS";
	Strings.LOGIN_ERROR_INVALID = "LOGIN_ERROR_INVALID";
	Strings.LOGIN_ERROR_WEAK = "LOGIN_ERROR_WEAK";
	Strings.LOGIN_ERROR_ACCOUNT_SHORT = "LOGIN_ERROR_ACCOUNT_SHORT";
	Strings.LOGIN_ERROR_NETWORK = "LOGIN_ERROR_NETWORK";
	Strings.LOGIN_ERROR_SERVER = "LOGIN_ERROR_SERVER";
	Strings.LOGIN_REMEMBER = "LOGIN_REMEMBER";
	// 獎盃排行榜面板
	Strings.LB_TITLE = "LB_TITLE";
	Strings.LB_COL_ACCOUNT = "LB_COL_ACCOUNT";
	Strings.LB_COL_SCORE = "LB_COL_SCORE";
	Strings.LB_COL_STARS = "LB_COL_STARS";
	Strings.LB_HELLO_PREFIX = "LB_HELLO_PREFIX";
	Strings.LB_HELLO_SUFFIX = "LB_HELLO_SUFFIX";
	Strings.LB_LEVELS_PREFIX = "LB_LEVELS_PREFIX";
	Strings.LB_SCORE_LEAD_PREFIX = "LB_SCORE_LEAD_PREFIX";
	Strings.LB_STAR_LEAD_PREFIX = "LB_STAR_LEAD_PREFIX";
	Strings.LB_LEAD_SUFFIX = "LB_LEAD_SUFFIX";
	Strings.LB_LOADING = "LB_LOADING";
	Strings.LB_ERROR = "LB_ERROR";
	Strings.LB_ANONYMOUS = "LB_ANONYMOUS";
	return Strings;
})();;

// 加载教学
var Tutorial = (function(_super) {
	__extends(Tutorial, _super);

	function Tutorial() {
		_super.call(this);
		this.stage = 0;
		this.matchCounter = 0;
	}
	Tutorial.prototype.onSpawnEnded = function() {
		this.onNextStep();
	};

	Tutorial.prototype.onEyeTouch = function() {
		this.onNextStep();
	};

	Tutorial.prototype.onGenerateBonusChip = function() {
		this.onNextStep();
	};

	Tutorial.prototype.onRunBonus = function() {
		this.onNextStep();
	};

	Tutorial.prototype.checkFastMatching = function() {
		return this.stage == 2 && this.matchCounter == 5;
	};

	Tutorial.prototype.onMatch = function() {
		this.matchCounter++;

		if (this.matchCounter == 3) {
			this.text.text = DNStringManager.getInstance().getString(Strings.TUTORIAL_8);
		}
	};

	Tutorial.prototype.onShowBonus = function() {
		this.onNextStep();
	};

	Tutorial.prototype.onShuffleTouch = function() {
		this.onNextStep();
	};

	Tutorial.prototype.onNoMoves = function() {
		this.onNextStep();
	};

	Tutorial.prototype.hideOldHightlight = function() {
		if (this.highlighter) {
			this.highlighter.hide();
		}

		if (this.hand) {
			createjs.Tween.removeTweens(this.hand);
			createjs.Tween.get(this.hand).to({
				alpha: 0
			}, 300, createjs.Ease.linear);
		}

		if (this.text) {
			this.text.parent.removeChild(this.text);
			this.text = null;
		}
	};

	Tutorial.prototype.showText = function(text, x, y, w) {
		this.text = new createjs.Text(text, "bold 35px Verdana", "#ffffff");

		this.text.textAlign = "center";
		this.text.lineWidth = w;
		this.text.x = x;
		this.text.y = y;
		this.text.alpha = 0;
		PlayState.g_instance.addChild(this.text);
		createjs.Tween.get(this.text).wait(600).to({
			alpha: 1.0
		}, 600, createjs.Ease.linear);
	};

	Tutorial.prototype.onNextStep = function() {
		this.hideOldHightlight();

		switch (this.stage) {
			case 0: {
				this.highlighter = PlayState.g_instance.highlightArea(135, 680, 160 + 105, 650 + 150);

				this.showText(DNStringManager.getInstance().getString(Strings.TUTORIAL_1), 240, 550, 450);
			}
			break;

			case 1: {
				this.highlighter = PlayState.g_instance.highlightArea(105, 260, 600, 540);

				this.showText(DNStringManager.getInstance().getString(Strings.TUTORIAL_2), 350, 550, 450);
			}
			break;

			case 2: {
				this.highlighter = PlayState.g_instance.highlightArea(215, 280, 335, 525);

				this.showText(DNStringManager.getInstance().getString(Strings.TUTORIAL_3), 270, 550, 450);
			}
			break;

			case 3: {
				this.highlighter = PlayState.g_instance.highlightArea(580, 600, 680, 730);

				this.showText(DNStringManager.getInstance().getString(Strings.TUTORIAL_4), 350, 500, 450);
			}
			break;

			case 4:
				this.showText(DNStringManager.getInstance().getString(Strings.TUTORIAL_5), 350, 500, 450);

				break;

			case 5: {
				this.highlighter = PlayState.g_instance.highlightArea(435, 680, 565, 800);

				this.showText(DNStringManager.getInstance().getString(Strings.TUTORIAL_6), 450, 500, 450);
			}
			break;

			case 6: {
				//
				this.showText(DNStringManager.getInstance().getString(Strings.TUTORIAL_7), 350, 500, 450);
			}
			break;
		}

		this.stage++;
	};

	Tutorial.prototype.hide = function() {
		this.liveTime = 0;

		if (this.highlighter) {
			this.highlighter.hide();
		}

		if (this.hand) {
			createjs.Tween.removeTweens(this.hand);
			createjs.Tween.get(this.hand).to({
				alpha: 0
			}, 300, createjs.Ease.linear);
		}

		if (this.text) {
			this.text.parent.removeChild(this.text);
			this.text = null;
		}
	};

	Tutorial.prototype.onDead = function() {
		_super.prototype.onDead.call(this);
	};
	return Tutorial;
})(DNGameObject);

/// <reference path="references.ts" />
var TutorialHighlighter = (function(_super) {
	console.log('加载 TutorialHighlighter > ' + 5977);
	__extends(TutorialHighlighter, _super);

	function TutorialHighlighter(left, top, right, bottom) {
		_super.call(this);

		this.left = left;
		this.right = right;
		this.top = top;
		this.bottom = bottom;

		var shape = new createjs.Shape();
		shape.graphics.beginFill("#000000");
		shape.graphics.drawRect(0, 0, Constants.ASSETS_WIDTH, Constants.ASSETS_HEIGHT);
		shape.graphics.endFill();
		this.addChild(shape);

		var hole = new createjs.Shape();
		hole.graphics.beginFill("#000000");
		hole.graphics.drawRoundRect(left, top, right - left, bottom - top, 10);

		hole.graphics.endFill();
		this.addChild(hole);

		hole.compositeOperation = "destination-out";

		this.cache(0, 0, Constants.ASSETS_WIDTH, Constants.ASSETS_HEIGHT);

		this.alpha = 0.0;
		createjs.Tween.get(this).wait(300).to({
			alpha: 0.6
		}, 600, createjs.Ease.linear);
	}
	TutorialHighlighter.prototype.hide = function() {
		var _this = this;
		createjs.Tween.get(this).to({
			alpha: 0
		}, 400, createjs.Ease.linear).call(function() {
			return _this.kill();
		});
	};

	TutorialHighlighter.prototype.hitTextMouse = function(x, y) {
		return x > this.left && x < this.right && y > this.top && y < this.bottom;
	};
	return TutorialHighlighter;
})(DNGameObject);

// 风车动画 
var WildMill = (function(_super) { // 定义一个立即执行的函数表达式，参数为 _super，代表父类 DNGameObject。
	__extends(WildMill, _super); // 调用内置的 __extends 方法实现继承。这样，WildMill 就会继承 DNGameObject 的属性和方法。  
	function WildMill() { // 定义 WildMill 的构造函数。  
		_super.call(this); // 调用父类 DNGameObject 的构造函数，初始化 WildMill 的基础属性。  

		var mill_1 = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.OBJ_1_14);
		// 从 DNAssetsManager 中获取中心定位的图像资源 OBJ_1_11，并将其赋值给 mill_1。
		this.addChild(mill_1); // 将 mill_1 添加为 WildMill 的子对象，使其显示在屏幕上。

		this.wheel = DNAssetsManager.g_instance.getCenteredImageWithProxy(Images.OBJ_2_WINDMILL);
		// 同上，获取风车轮叶资源 OBJ_2_WINDMILL，并赋值给 wheel。
		this.addChild(this.wheel); // 将 wheel 也添加为 WildMill 的子对象。  

		this.wheel.y = -10; // 设置 wheel 的 y 坐标为 -10，使其位于 WildMill 的上方。  
	};
	WildMill.prototype.update = function(dt) { // 定义 update 方法，用于更新 WildMill 的状态。参数 dt 是时间增量。  
		_super.prototype.update.call(this, dt); // 调用父类 DNGameObject 的 update 方法。  
		this.wheel.rotation += 80 * dt; // 这是动画效果的关键部分，使得风车看起来是在旋转。  
	};
	return WildMill; // 返回 WildMill 类，使其可以被外部引用和使用。  
})(DNGameObject); // 以 DNGameObject 作为参数来调用这个函数，实现 WildMill 继承自 DNGameObject。

// Utils 工具庫單一原始檔：js/Utils.js（此處不再重複宣告，避免覆蓋）

// 显示FPS，主要用于显示游戏中的帧率计数 TODO
// FPSCounter 是一个自执行函数，它接受一个参数 _super，代表父类 DNGameObject。
var FPSCounter = (function(_super) {
	// 使用 __extends 函数实现 FPSCounter 和 _super（即 DNGameObject）之间的继承关系。
	__extends(FPSCounter, _super);
	// 定义 FPSCounter 的构造函数。
	function FPSCounter() {
		// 调用父类 DNGameObject 的构造函数。
		_super.call(this);
		// 文字與黑底之間保留的內距
		this.padding = 6;
		// 半透明黑底：透明度交給 shape.alpha 控制，比 rgba 字串更保險（EaselJS 解析顏色不吃 rgba）
		this.bg = new createjs.Shape();
		this.bg.alpha = 0.55;
		// 黑底要先加，文字後加，圖層順序才會在黑底之上
		this.addChild(this.bg);
		// 创建一个新的文本字段，初始内容为 "0"，字級 14px，三支分別為紅、藍、白
		this.textField = new createjs.Text("0", "normal 14px sans-serif", "#ff0000");
		this.textField2 = new createjs.Text("0", "normal 14px sans-serif", "#ffffff");
		this.textField3 = new createjs.Text("0", "normal 14px sans-serif", "#ffffff");
		// 三支文字共用同一左緣，垂直位置交給 layout() 依實際高度排
		this.textField.x = this.padding;
		this.textField2.x = this.padding;
		this.textField3.x = this.padding;
		// 初始化计数器为 0。
		this.counter = 0;
		// 将文本字段添加到当前对象的子对象列表中。
		this.addChild(this.textField);
		this.addChild(this.textField2);
		this.addChild(this.textField3);
		// 先填一次內容與黑底尺寸，避免第一秒只有文字沒有底
		this.refreshInfo();
	}

	// 依三支文字的實際高度做垂直堆疊（不再靠前導換行硬排），並同步黑底尺寸
	FPSCounter.prototype.layout = function() {
		var pad = this.padding;

		// 取每支文字實際渲染後的外框（含多行）。
		// 注意：getMeasuredWidth() 是對整串含換行的字串做 measureText，會量成「一整行」，
		// 多行時寬度會爆掉；要用 getBounds() 才是每行最大值。
		var b1 = this.textField.getBounds() || { width: 0, height: 0 };
		var b2 = this.textField2.getBounds() || { width: 0, height: 0 };
		var b3 = this.textField3.getBounds() || { width: 0, height: 0 };

		// 由上而下：FPS → 尺寸/語系/網址 → UA/版本
		this.textField.y = pad;
		this.textField2.y = this.textField.y + b1.height;
		this.textField3.y = this.textField2.y + b2.height + 14;

		// 黑底寬度取三支最寬者，高度算到最後一支文字的底部
		var w = Math.max(b1.width, b2.width, b3.width);
		var h = this.textField3.y + b3.height - pad;

		var g = this.bg.graphics;
		g.clear();
		g.beginFill("#000000");
		g.drawRoundRect(0, 0, w + pad * 2, h + pad * 2, 6);
		g.endFill();
	};

	// 更新三支文字的內容，並讓排版與黑底跟著重算
	FPSCounter.prototype.refreshInfo = function() {
		// 更新文本字段的文本为计数器的字符串形式。
		this.textField.text = 'FPS: ' + this.counter.toString();
		// 一行一項，拿掉原本用來對齊的前導換行
		this.textField2.text =
			'width:' + window.screen.width +
			'\nheight:' + window.screen.height +
			'\nlanguage:' + navigator.language +
			'\nurl:' + window.location.href;
		this.textField3.text =
			formatText(navigator.userAgent, 35) +
			'\n\n' + formatText(navigator.appVersion, 35);
		// 文字換了尺寸就會變，排版與黑底要重算
		this.layout();
	};

	// 定义 FPSCounter 的 update 方法，该方法接收一个参数 dt。
	FPSCounter.prototype.update = function(dt) {
		// 调用父类 DNGameObject 的 update 方法。
		_super.prototype.update.call(this, dt);
		// 增加计数器的值。
		this.counter++;
		// 如果 liveTime 大于等于 1.0，则执行以下操作：
		if (this.liveTime >= 1.0) {
			// liveTime 减去 1.0。
			this.liveTime -= 1.0;
			// 每秒刷新一次文字與黑底
			this.refreshInfo();
			// 重置计数器为 0。
			this.counter = 0;
		}
	};
	// 返回 FPSCounter 的构造函数。
	return FPSCounter;
})(DNGameObject);

// 開啟獎盃排行榜面板；實際排行與自身資訊由面板內向 /api/leaderboard 取得
var AccessToPersonalData = (function() {
	function AccessToPersonalData() {};
	AccessToPersonalData.update = function() {
		DNStateManager.g_instance.pushState(new CreditsState2());
	};
	return AccessToPersonalData;
})();

// 下载图片
var OnDownload = (function() {
	function OnDownload() {};
	OnDownload.download = function(imgsrc) {
		console.log('OnDownload > ' + imgsrc);
		var ing = document.getElementById('downloadImg'); // 获取要下载图
		var url = 'assets/art/back/' + imgsrc + '.jpg'; // 获取图片地址

		// 创建一个新的 Date 对象  
		let currentDate = new Date();

		// 创建一个a节点插入的document
		var a = document.createElement('a');
		var event = new MouseEvent('click'); // 拟鼠标cLick点击事件
		// 设置a节点的download属性值,图片名称
		a.download = currentDate.getTime(); //getTime() 万法可返回距 1970 年 1 月 1 日之间的毫秒数
		a.href = url;
		// 将图片的src赋值给a节点的href
		a.dispatchEvent(event);
	};
	return OnDownload;
})();
