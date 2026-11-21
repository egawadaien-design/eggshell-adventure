/**
 * 工具函式庫
 * @author DaiEn
 * @Date 2026-11-21
 * @Correction 3
 */

var Utils = (function() {
	function Utils() {}

	// 行動裝置 UA 比對：完整瀏覽器標記，以及舊型號前四碼標記
	var MOBILE_UA_RE = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;
	var MOBILE_UA_PREFIX_RE = /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i;

	// 區間隨機浮點數 [from, to)
	Utils.RandomRange = function(from, to) {
		return from + (to - from) * Math.random();
	};

	// 區間隨機整數 [from, to]
	Utils.RandomRangeInt = function(from, to) {
		return Math.floor(Math.random() * (to - from + 1)) + from;
	};

	// 秒數 → "分d秒"，秒補兩位零
	Utils.IntToTimeString = function(time) {
		var minutes = Math.floor(time / 60);
		var seconds = time % 60;
		var sSeconds = seconds < 10 ? "0" + seconds : seconds.toString();
		return minutes + "d" + sSeconds;
	};

	// 弧度 → 角度
	Utils.RadToGrad = function(rad) {
		return rad * 180 / Math.PI;
	};

	// 角度 → 弧度
	Utils.GradToRad = function(grad) {
		return grad * Math.PI / 180;
	};

	// 把 v 夾在 [min, max] 區間內
	Utils.Clamp = function(v, min, max) {
		return v < min ? min : (v > max ? max : v);
	};

	// 兩點直線距離
	Utils.Distance = function(ax, ay, bx, by) {
		return Math.sqrt(Utils.DistanceSq(ax, ay, bx, by));
	};

	// 兩點距離平方（免開根號，只需比較大小時用它）
	Utils.DistanceSq = function(ax, ay, bx, by) {
		var dx = ax - bx;
		var dy = ay - by;
		return dx * dx + dy * dy;
	};

	// 行動裝置瀏覽器偵測；orientation 存在視為行動裝置，否則比對 UA
	Utils.IsMobileBrowser = function() {
		if (window.orientation !== undefined) {
			return true;
		}
		var ua = navigator.userAgent || navigator.vendor || window.opera || "";
		return MOBILE_UA_RE.test(ua) || MOBILE_UA_PREFIX_RE.test(ua.substr(0, 4));
	};

	// 依裝置像素比與螢幕縮放比換算偏移量
	Utils.ScaledOffset = function(val) {
		var pixelRatio = window.devicePixelRatio || 1;
		return pixelRatio * val / Constants.SCREEN_SCALE;
	};

	// 線段 AB 是否與圓心 C、半徑 r 的圓相交（二次方程判別式 + 參數落點 [0,1] 判定）
	Utils.LineIntersectCircle = function(A, B, C, r) {
		var dx = B.x - A.x;
		var dy = B.y - A.y;
		var lenSq = dx * dx + dy * dy;
		if (lenSq === 0) {
			return false;
		}

		var proj = 2 * (dx * (A.x - C.x) + dy * (A.y - C.y));
		var constant = C.x * C.x + C.y * C.y + A.x * A.x + A.y * A.y
			- 2 * (C.x * A.x + C.y * A.y) - r * r;
		var deter = proj * proj - 4 * lenSq * constant;
		if (deter <= 0) {
			return false;
		}

		var e = Math.sqrt(deter);
		var u1 = (-proj + e) / (2 * lenSq);
		var u2 = (-proj - e) / (2 * lenSq);
		return !((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1));
	};

	// 分數補零至固定六位；六位以上原樣回傳
	Utils.ScoreString = function(score) {
		var text = score.toString();
		return text.length >= 6 ? text : ("00000" + text).slice(-6);
	};

	// 顯示動畫：delay 後淡入 200ms，同時由 0.1 縮放彈回 1，400ms
	Utils.RunShowAnim = function(obj, delay) {
		obj.alpha = 0;
		obj.scaleX = obj.scaleY = 0.1;
		createjs.Tween.get(obj).wait(delay).to({
			alpha: 1
		}, 200, createjs.Ease.linear);
		createjs.Tween.get(obj).wait(delay).to({
			scaleX: 1,
			scaleY: 1
		}, 400, createjs.Ease.backOut);
	};

	// Fisher–Yates 洗牌，直接修改原陣列
	Utils.shuffle = function(arr) {
		for (var i = arr.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var tmp = arr[i];
			arr[i] = arr[j];
			arr[j] = tmp;
		}
	};

	return Utils;
})();
