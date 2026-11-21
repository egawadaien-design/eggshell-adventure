/**
 * 狀態管理（Preloader / Play / Map 等狀態切換）
 * @author DaiEn
 * @Date 2026-11-21
 * @Correction 7
 */
var DNStateManager = (function() {
	/**
	 * manifest: 可能包含应用程序或游戏的各种元数据。
	 * sound_manifest: 包含音频文件的元数据。
	 * athlases: 图像数据
	 * localizable_images: 可本地化的图像资源。
	 */
	function DNStateManager(manifest, sound_manifest, athlases, localizable_images) {
		var _this = this;// 保存对当前对象的引用，以便在回调函数中使用
		this.statesConstainer = new createjs.Container();// 创建一个新的容器对象，用于存放游戏对象
		// 这些是状态和时间相关的变量，用于控制游戏的不同状态和行为  
		this.mouseDown = false;// 鼠标是否按下的状态
		this.timeDevider = 1;// 时间分片因子，用于控制时间的流逝速度
		this.liveTime = 0;// 当前游戏时间
		this.isLoading = true;// 是否正在加载资源的标志
		this.lastTime = 0;// 上一次处理时间的时间戳 
		this.lastMouseUpHandlerTime = -1;// 上一次鼠标释放事件处理的时间戳
		this.lastMouseDownHandlerTime = -1;// 上一次鼠标按下事件处理的时间戳
		this.lastMouseMoveHandlerTime = -1;// 上一次鼠标移动事件处理的时间戳

		// 设置DNStateManager的全局实例，这样可以在其他地方通过这个全局实例访问该类的方法和属性
		DNStateManager.g_instance = this;

		// 初始化一个空数组，用于存放游戏状态对象 
		this.states = Array();

		// 通过document对象获取ID为"canvas"的元素，这个元素是一个HTML的canvas元素，用于渲染游戏画面  
		this.canvas = document.getElementById("canvas");

		// 检查当前浏览器是否支持触摸操作（例如，在移动设备上使用手指触摸屏幕）
		this.stage = new createjs.Stage(this.canvas);
		console.log('检查我们是否在支持触摸的浏览器中运行 > ' + this.stage + '/' + 47);

		// 设置舞台对象的属性autoClear为false，表示不清除舞台上的内容，而是保留之前绘制的内容，以便在后续的帧中重用或叠加新内容
		this.stage.autoClear = false;

		// 启用触摸交互功能（如果设备支持），允许在支持触摸的设备上使用触摸操作来与游戏互动（例如，触摸屏幕来控制游戏角色）  
		createjs.Touch.enable(this.stage);
		
		// 启用鼠标悬停事件的处理。当鼠标指针经过舞台上的游戏对象时，会触发mouseOver事件；当鼠标指针离开时，会触发mouseOut事件。
		this.stage.enableMouseOver(5);// 启用鼠标悬停（移过/移出）事件。
		
		// 设置游戏的帧率为60帧每秒。帧率是衡量每秒钟显示多少帧画面的指标，对于平滑的动画效果非常重要。
		createjs.Ticker.setFPS(60);

		// 为Ticker对象添加一个事件监听器，当每一帧被渲染时触发"tick"事件。在事件处理函数中调用_this.update(e)方法来更新游戏状态。 
		createjs.Ticker.addEventListener("tick", function(e) {
			//// 在每一帧渲染时调用update方法来更新游戏状态和动画效果。_this变量保存了对当前对象的引用。 
			return _this.update(e);
		});
		
		// 检查常量Constants.DEBUG_MODE是否为真。如果是真，则将两个事件监听器分别绑定到document对象的onkeydown和onkeyup事件上。
		// 这样可以在键盘按键被按下或释放时调用相应的方法来处理键盘输入。  
		if (Constants.DEBUG_MODE) {
			document.onkeydown = function(e) {// 当键盘按键被按下时触发的事件处理函数。将当前对象的onKeyDown方法绑定到该事件上。
				return _this.onKeyDown(e);// 调用当前对象的onKeyDown方法来处理键盘按键被按下的逻辑。_this变量保存了对当前对象的引用。
			};
			document.onkeyup = function(e) {// 当键盘按键被释放时触发的事件处理函数。将当前对象的onKeyUp方法绑定到该事件上。
				return _this.onKeyUp(e);// 调用当前对象的onKeyUp方法来处理键盘按键被释放的逻辑。
			};
		}
		
		// 这行代码调用pushState方法，并传入一个新的PreloaderState对象作为参数。我们可以推测PreloaderState是一个表示游戏预加载状态的类，
		// 它需要四个参数：manifest、sound_manifest、athlases和localizable_images。这些参数可能是用于预加载游戏资源的数据。
		this.pushState(new PreloaderState(manifest, sound_manifest, athlases, localizable_images));
		
		// 这行代码将statesConstainer对象添加到舞台(stage)上。这意味着在游戏的运行过程中，
		// 所有在statesConstainer容器中的游戏对象将会在舞台上显示。
		this.stage.addChild(this.statesConstainer);
		
		// 根据浏览器的设备像素比率设置一个像素比率常量。如果设备像素比率大于1，则说明设备的分辨率高于显示分辨率。  
		Constants.PIXEL_RATIO = (window.devicePixelRatio ? window.devicePixelRatio : 1);
		
		// 如果当前设备是PC，则设置窗口的resize事件监听器，并在加载时调用onResize方法。 
		if (Constants.g_isPC) {
			window.onresize = (function(e) {
				return _this.onResize(e);
			});
			this.onResize(null);// 在页面加载时立即调用onResize方法。
		} else {// 如果当前设备不是PC（可能是移动设备）
			// 当设备的方向改变时触发orientationchange事件，并调用_this的onOrientationChanged方法。
			window.addEventListener("orientationchange", function() {
				return _this.onOrientationChanged();
			});

			this.onOrientationChanged();// 调用onOrientationChanged方法。
		}
		
		// 添加鼠标移动、按下和释放的事件监听器，当这些事件发生时，都会调用 handleMouse 方法  
		this.stage.addEventListener(Constants.MOUSE_MOVE, (function(e) {
			return _this.handleMouse(e);
		}));
		this.stage.addEventListener(Constants.MOUSE_DOWN, (function(e) {
			return _this.handleMouse(e);
		}));
		this.stage.addEventListener(Constants.MOUSE_UP, (function(e) {
			return _this.handleMouse(e);
		}));
	}
	
	// 当设备的方向改变时，会调用 onOrientationChanged 方法
	// 只负责按新的窗口尺寸重算画布（旋转提示功能已移除）
	DNStateManager.prototype.onOrientationChanged = function() {
		// 根据新的窗口尺寸调整画布的大小
		this.resizeTo(window.innerWidth, window.innerHeight);
	};
	
	// 当窗口大小改变时，会调用 onResize 方法，并传入事件对象 e  
	DNStateManager.prototype.onResize = function(e) {
		// 根据新的窗口尺寸调整画布的大小  
		this.resizeTo(window.innerWidth, window.innerHeight);
	};

	// 定义一个方法来调整画布的大小，使其适应新的窗口尺寸
	DNStateManager.prototype.resizeTo = function(w, h) {
		// 如果宽度小于高度，说明当前是竖屏模式，设置屏幕缩放比例为宽度与资源宽度的比值乘以像素比值  
		if (w < h) {
			Constants.SCREEN_SCALE = w / Constants.ASSETS_WIDTH * Constants.PIXEL_RATIO;
		} else {
			// 否则，选择宽度和高度中较小的那个与资源宽度的比值作为屏幕缩放比例，并乘以像素比值 
			Constants.SCREEN_SCALE = Math.min(w / Constants.ASSETS_WIDTH, h / Constants.ASSETS_HEIGHT) *
				Constants.PIXEL_RATIO;
		}

		// 计算画布的实际高度，等于窗口高度除以屏幕缩放比例再乘以像素比值
		Constants.SCREEN_HEIGHT = h / Constants.SCREEN_SCALE * Constants.PIXEL_RATIO;

		// 设置画布的宽度为资源宽度乘以屏幕缩放比例，高度为窗口高度乘以像素比值
		this.canvas.width = Constants.ASSETS_WIDTH * Constants.SCREEN_SCALE;
		this.canvas.height = h * Constants.PIXEL_RATIO;
		// 设置画布的样式宽度和高度，注意这里需要除以像素比值来得到实际像素值
		this.canvas.style.width = this.canvas.width / Constants.PIXEL_RATIO + "px";
		this.canvas.style.height = this.canvas.height / Constants.PIXEL_RATIO + "px";
		// 设置状态容器（可能是用于显示游戏状态信息的界面元素）的X轴和Y轴缩放比例为屏幕缩放比例
		this.statesConstainer.scaleX = this.statesConstainer.scaleY = Constants.SCREEN_SCALE;
		// 设置画布的左边距为 (窗口宽度 - 资源宽度乘以屏幕缩放比例 / 像素比值) / 2，以使其居中显示在窗口中。上边距为0。
		this.canvas.style.marginLeft = (w - Constants.ASSETS_WIDTH * Constants.SCREEN_SCALE / Constants.PIXEL_RATIO) / 2 + "px";
		this.canvas.style.marginTop = "0px";
	};

	DNStateManager.prototype.allAssetsLoaded = function() {
		var _this = this;
		this.isLoading = false;

		if (window.onpagehide) {
			window.onpagehide = (function(e) {
				return _this.onLostFocus(e);
			});
		}
		if (window.onblur) {
			window.onblur = (function(e) {
				return _this.onLostFocus(e);
			});
		}
		if (window.onpageshow) {
			window.onpageshow = (function(e) {
				return _this.onFocus(e);
			});
		}
		if (window.onfocus) {
			window.onfocus = (function(e) {
				return _this.onFocus(e);
			});
		}

		GameData.getInstance().load();
		GameData.getInstance().syncFromServer(); // 重整後帶著舊 session 時，拉伺服器存檔並以其為準覆蓋本地

		this.changeState(new MainMenuState());
	};

	DNStateManager.prototype.update = function(event) {
		var tm = createjs.Ticker.getTime();
		var delta = (tm - this.lastTime);
		this.lastTime = tm;

		var dt = delta * 0.001 / this.timeDevider;
		// 大幀保護：背景卡頓、切頁或視窗切回來時 delta 可能異常偏大，
		// 鉗在單幀上限內，避免一次累計過多時間讓 NPC 踏步連跳好幾格。
		if (dt > 0.1) {
			dt = 0.1;
		}

		this.liveTime += dt;

		DNSoundManager.g_instance.update();

		if (this.states.length != 0) {
			var top_state = this.states[this.states.length - 1];

			if (!top_state.isInitiliazed()) {
				top_state.init();
			}

			top_state.update(dt);
		}

		for (var i = 0; i < this.states.length; i++) {
			this.states[i].alignByCenter(i == 0);
		}

		for (var i = 0; i < this.states.length; i++) {
			this.states[i].forceUpdate(dt);
		}

		this.stage.update(event);
	};

	DNStateManager.prototype.changeState = function(game_state) {
		while (this.states.length != 0) {
			this.popState();
		}

		this.pushState(game_state);
	};

	DNStateManager.prototype.pushState = function(game_state) {
		this.states.push(game_state);
		this.statesConstainer.addChild(game_state);
	};

	DNStateManager.prototype.popState = function() {
		if (this.states.length != 0) {
			this.states[this.states.length - 1].cleanup();
			this.statesConstainer.removeChild(this.states[this.states.length - 1]);
			this.states.pop();

			if (this.states.length != 0) {
				this.states[this.states.length - 1].resume();
			}
		}
	};

	DNStateManager.prototype.onLostFocus = function(e) {
		DNSoundManager.g_instance.onLostFocus();
	};

	DNStateManager.prototype.onFocus = function(e) {
		DNSoundManager.g_instance.onFocus();
	};

	DNStateManager.prototype.handleMouse = function(event) {
		if (this.states.length == 0) {
			return;
		}

		event.preventDefault();

		var top_state = this.states[this.states.length - 1];

		switch (event.type) {
			case Constants.MOUSE_DOWN: {
				DNSoundManager.g_instance.init();
				DNSoundManager.g_instance.playMusic(0.2);

				if (this.liveTime == this.lastMouseDownHandlerTime) {
					return;
				}
				this.lastMouseDownHandlerTime = this.liveTime;

				this.mouseDown = true;
				top_state.onMouseDown(event.stageX / Constants.SCREEN_SCALE, event.stageY / Constants
					.SCREEN_SCALE);
			}
			break;

			case Constants.MOUSE_UP: {
				if (this.liveTime == this.lastMouseUpHandlerTime) {
					return;
				}
				this.lastMouseUpHandlerTime = this.liveTime;

				this.mouseDown = false;
				top_state.onMouseUp(event.stageX / Constants.SCREEN_SCALE, event.stageY / Constants
					.SCREEN_SCALE);
			}
			break;

			case Constants.MOUSE_MOVE: {
				if (this.liveTime == this.lastMouseMoveHandlerTime) {
					return;
				}
				this.lastMouseMoveHandlerTime = this.liveTime;

				if (this.mouseDown) {
					top_state.onMouseMove(event.stageX / Constants.SCREEN_SCALE, event.stageY / Constants
						.SCREEN_SCALE);
				}
			}
			break;
		}
	};

	DNStateManager.prototype.onKeyDown = function(event) {
		switch (event.keyCode) {
			case 65: {
				this.timeDevider = 5;
			}
			break;

			case 68: {
				this.timeDevider = 10;
			}
			break;
		}

		this.stage.update();
	};

	DNStateManager.prototype.onKeyUp = function(event) {
		switch (event.keyCode) {
			case 65: {
				this.timeDevider = 1;
			}
			break;

			case 68: {
				this.timeDevider = 1;
			}
			break;
		}
	};

	DNStateManager.prototype.onPause = function() {
		if (this.states.length != 0) {
			this.states[this.states.length - 1].onPause();
		}
	};

	DNStateManager.prototype.onResume = function() {
		if (this.states.length != 0) {
			this.states[this.states.length - 1].onResume();
		}
	};

	DNStateManager.prototype.onRestart = function() {
		if (this.states.length != 0) {
			this.states[this.states.length - 1].onRestart();
		}
	};


	// 加载levels.js
	return DNStateManager;
})();