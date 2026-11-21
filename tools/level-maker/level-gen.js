/**
 * 關卡產生器（核心邏輯）
 * 12×8 字模 → 菱形棋格 → 四層浮雕 → 見證配對 → 輸出 L_n.js
 * 同一份程式同時可用於瀏覽器（window.LevelGen）與 Node（require）
 *
 * 遊戲端規則（對應 game.js）：
 *   FIELD 24×16、CHIP 53×74、LAYER_OFFSET -5/-7
 *   通用型棋子 universalChips = fruit / hands / monsters，同名即可配對，其餘須同名同 id
 *   硬性條件：格數 == chips 張數、每組（通用型按名、其餘按名+id）張數為偶數
 *   位置由 loadLevel 自行配對並放到「當下可拿」的格子，所以只要張數合法就必然可解
 *
 * @author DaiEn
 * @Date 2026-11-15
 * @Correction 1
 */
(function (root, factory) {
	if (typeof module === 'object' && module.exports) {
		module.exports = factory();
	} else {
		root.LevelGen = factory();
	}
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
	'use strict';

	var FIELD_WIDTH = 24;
	var FIELD_HEIGHT = 16;
	var LAYERS = 4;
	var ART_COLS = 12;
	var ART_ROWS = 8;
	var UNIVERSAL = ['fruit', 'hands', 'monsters'];

	// 各類棋子可用的 id 範圍（只取既有 43 關實際出現過的號碼，避免用到不存在的圖）
	var POOL_RANGES = {
		fruit: [0, 3],
		hands: [0, 3],
		monsters: [0, 3],
		snakes: [0, 8],
		eyes: [0, 8],
		plants: [0, 2],
		bugs: [0, 8]
	};

	// 六個已驗證過的字模（12×8，'#' 為棋子）
	var PRESETS = [
		{
			key: 'star',
			label: '星芒',
			scales: [1, 0.84, 0.64, 0.44],
			art: [
				'.....##.....',
				'....####....',
				'..########..',
				'############',
				'..########..',
				'....####....',
				'.....##.....',
				'............'
			]
		},
		{
			key: 'cat',
			label: '蛋殼貓',
			scales: [1, 0.74, 0.56, 0.40],
			art: [
				'##........##',
				'##........##',
				'.##########.',
				'############',
				'##..####..##',
				'############',
				'.##########.',
				'..##....##..'
			]
		},
		{
			key: 'cloud',
			label: '雲上城',
			scales: [1, 0.78, 0.60, 0.44],
			art: [
				'..####......',
				'.########...',
				'############',
				'############',
				'############',
				'.##########.',
				'............',
				'............'
			]
		},
		{
			key: 'tree',
			label: '棕櫚塔',
			scales: [1, 0.76, 0.58, 0.42],
			art: [
				'....####....',
				'...######...',
				'..########..',
				'.##########.',
				'############',
				'############',
				'....####....',
				'....####....'
			]
		},
		{
			key: 'heart',
			label: '心之庭',
			scales: [1, 0.72, 0.54, 0.40],
			art: [
				'..###..###..',
				'.####.####..',
				'############',
				'############',
				'############',
				'.##########.',
				'..########..',
				'....####....'
			]
		},
		{
			key: 'crown',
			label: '王冠',
			scales: [1, 0.70, 0.52, 0.38],
			art: [
				'#....##....#',
				'##..####..##',
				'##..####..##',
				'############',
				'############',
				'############',
				'.##########.',
				'..########..'
			]
		}
	];

	// L_45 ~ L_50 實際用過的 13 種組合，當作預設牌組
	var DEFAULT_POOL = [
		['fruit', 0], ['fruit', 1], ['fruit', 3],
		['hands', 1], ['hands', 3],
		['monsters', 0], ['monsters', 2],
		['snakes', 0], ['snakes', 5],
		['bugs', 2], ['bugs', 7],
		['eyes', 4],
		['plants', 1]
	];

	// ---------------------------------------------------------------- 隨機
	// 自帶 PRNG，讓同一個 seed 在任何環境都產生同一份關卡（不依賴 Math.random）
	function mulberry32(seed) {
		var a = seed >>> 0;
		return function () {
			a = (a + 0x6D2B79F5) >>> 0;
			var t = a;
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	// ---------------------------------------------------------------- SHA-1
	// 只用來產生「地形指紋」，瀏覽器沒有同步的雜湊可用，所以自帶一份實作
	function utf8Bytes(str) {
		var out = [];
		for (var i = 0; i < str.length; i++) {
			var c = str.charCodeAt(i);
			if (c < 0x80) {
				out.push(c);
			} else if (c < 0x800) {
				out.push(0xC0 | (c >> 6), 0x80 | (c & 63));
			} else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < str.length) {
				var low = str.charCodeAt(++i);
				var u = 0x10000 + ((c - 0xD800) << 10) + (low - 0xDC00);
				out.push(0xF0 | (u >> 18), 0x80 | ((u >> 12) & 63), 0x80 | ((u >> 6) & 63), 0x80 | (u & 63));
			} else {
				out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
			}
		}
		return out;
	}

	function sha1Hex(str) {
		var bytes = utf8Bytes(str);
		var words = [];
		var i;
		for (i = 0; i < bytes.length; i++) {
			words[i >> 2] |= bytes[i] << (24 - (i % 4) * 8);
		}
		var bitLen = bytes.length * 8;
		var total = (((bytes.length + 8) >> 6) + 1) << 4; // 補齊到 64 byte 邊界後再加 16 字
		for (i = 0; i < total; i++) {
			if (words[i] === undefined) {
				words[i] = 0;
			}
		}
		words[bytes.length >> 2] |= 0x80 << (24 - (bytes.length % 4) * 8);
		words[total - 1] = bitLen;

		var h0 = 0x67452301;
		var h1 = 0xEFCDAB89;
		var h2 = 0x98BADCFE;
		var h3 = 0x10325476;
		var h4 = 0xC3D2E1F0;

		function rotl(n, s) {
			return (n << s) | (n >>> (32 - s));
		}

		for (i = 0; i < total; i += 16) {
			var w = [];
			for (var t = 0; t < 80; t++) {
				if (t < 16) {
					w[t] = words[i + t] | 0;
				} else {
					w[t] = rotl(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
				}
			}
			var a = h0;
			var b = h1;
			var c = h2;
			var d = h3;
			var e = h4;
			for (t = 0; t < 80; t++) {
				var f, k;
				if (t < 20) {
					f = (b & c) | (~b & d);
					k = 0x5A827999;
				} else if (t < 40) {
					f = b ^ c ^ d;
					k = 0x6ED9EBA1;
				} else if (t < 60) {
					f = (b & c) | (b & d) | (c & d);
					k = 0x8F1BBCDC;
				} else {
					f = b ^ c ^ d;
					k = 0xCA62C1D6;
				}
				var tmp = (rotl(a, 5) + f + e + k + w[t]) | 0;
				e = d;
				d = c;
				c = rotl(b, 30);
				b = a;
				a = tmp;
			}
			h0 = (h0 + a) | 0;
			h1 = (h1 + b) | 0;
			h2 = (h2 + c) | 0;
			h3 = (h3 + d) | 0;
			h4 = (h4 + e) | 0;
		}

		var hex = [h0, h1, h2, h3, h4].map(function (x) {
			return ('00000000' + (x >>> 0).toString(16)).slice(-8);
		}).join('');
		return hex;
	}

	function fingerprint(board) {
		return sha1Hex(JSON.stringify(board)).slice(0, 8);
	}

	// ---------------------------------------------------------------- 棋盤
	function makeBoard() {
		var b = [];
		for (var l = 0; l < LAYERS; l++) {
			var layer = [];
			for (var x = 0; x < FIELD_WIDTH; x++) {
				var col = [];
				for (var y = 0; y < FIELD_HEIGHT; y++) {
					col.push(0);
				}
				layer.push(col);
			}
			b.push(layer);
		}
		return b;
	}

	function occ(board, l, x, y) {
		return l >= 0 && l < LAYERS && x >= 0 && x < FIELD_WIDTH && y >= 0 && y < FIELD_HEIGHT && board[l][x][y] === 1;
	}

	// 與 game.js 的 calcAccesible 同義：上層 3×3 有棋子則壓住；同層左右（x±2,y±1）都堵住才拿不到
	function accessible(board, l, x, y) {
		var up, dx, dy;
		for (up = l + 1; up < LAYERS; up++) {
			for (dx = -1; dx <= 1; dx++) {
				for (dy = -1; dy <= 1; dy++) {
					if (occ(board, up, x + dx, y + dy)) {
						return false;
					}
				}
			}
		}
		var blockedLeft = false;
		var blockedRight = false;
		for (dy = -1; dy <= 1; dy++) {
			if (occ(board, l, x - 2, y + dy)) {
				blockedLeft = true;
			}
			if (occ(board, l, x + 2, y + dy)) {
				blockedRight = true;
			}
		}
		return !(blockedLeft && blockedRight);
	}

	// 12×8 字模 → 四層浮雕；菱形映射 x = 2*col + (row%2)、y = 2*row
	function buildBoard(art, scales) {
		var cols = art[0].length;
		var rows = art.length;
		var board = makeBoard();
		for (var l = 0; l < LAYERS; l++) {
			var s = scales[l] || 1;
			var cx = (cols - 1) / 2;
			var cy = (rows - 1) / 2;
			for (var row = 0; row < rows; row++) {
				for (var col = 0; col < cols; col++) {
					var sr = Math.round(cy + (row - cy) / s);
					var sc = Math.round(cx + (col - cx) / s);
					if (sr < 0 || sr >= rows || sc < 0 || sc >= cols) {
						continue;
					}
					if (art[sr][sc] !== '#') {
						continue;
					}
					var x = 2 * col + (row % 2);
					var y = 2 * row;
					if (x < FIELD_WIDTH && y < FIELD_HEIGHT) {
						board[l][x][y] = 1;
					}
				}
			}
		}
		return board;
	}

	function allCells(board) {
		var cells = [];
		for (var l = 0; l < LAYERS; l++) {
			for (var x = 0; x < FIELD_WIDTH; x++) {
				for (var y = 0; y < FIELD_HEIGHT; y++) {
					if (board[l][x][y] === 1) {
						cells.push({ l: l, x: x, y: y });
					}
				}
			}
		}
		return cells;
	}

	function cellKey(c) {
		return c.l + ':' + c.x + ':' + c.y;
	}

	// loadLevel 擺棋用的對角線順序；輸出 chips 時照這個序，讓檔案讀起來和遊戲一致
	function diagOrder(board) {
		var out = [];
		for (var l = 0; l < LAYERS; l++) {
			for (var line = 0; line < FIELD_WIDTH + FIELD_HEIGHT - 1; line++) {
				var x = line;
				var y = 0;
				while (x >= 0 && y < FIELD_HEIGHT) {
					if (x < FIELD_WIDTH && board[l][x][y] === 1) {
						out.push({ l: l, x: x, y: y });
					}
					x--;
					y++;
				}
			}
		}
		return out;
	}

	// 構造式見證：亂數挑兩個「當下可拿」的格子成對消去，全程走完就代表這盤幾何一定可解
	function witnessPairing(board, cells, tries, rng) {
		for (var t = 0; t < tries; t++) {
			var b = board.map(function (layer) {
				return layer.map(function (col) {
					return col.slice();
				});
			});
			var alive = cells.map(function (c) {
				return { l: c.l, x: c.x, y: c.y, done: false };
			});
			var pairs = [];
			var guard = 0;
			while (pairs.length * 2 < alive.length && guard++ < 12000) {
				var acc = alive.filter(function (a) {
					return !a.done && accessible(b, a.l, a.x, a.y);
				});
				if (acc.length < 2) {
					break;
				}
				var i = Math.floor(rng() * acc.length);
				var j = Math.floor(rng() * (acc.length - 1));
				if (j >= i) {
					j++;
				}
				var a = acc[i];
				var bb = acc[j];
				a.done = true;
				bb.done = true;
				b[a.l][a.x][a.y] = 0;
				b[bb.l][bb.x][bb.y] = 0;
				pairs.push([a, bb]);
			}
			if (pairs.length * 2 === alive.length) {
				return pairs;
			}
		}
		return null;
	}

	// 貪心驗算：照輸出順序把棋子擺上去，模擬「只挑眼前看到的配對」能清掉多少
	function greedyLeft(board, chips, diag) {
		var b = board.map(function (layer) {
			return layer.map(function (col) {
				return col.slice();
			});
		});
		var grid = [];
		var l, x, y;
		for (l = 0; l < LAYERS; l++) {
			grid.push([]);
			for (x = 0; x < FIELD_WIDTH; x++) {
				var col = [];
				for (y = 0; y < FIELD_HEIGHT; y++) {
					col.push(null);
				}
				grid[l].push(col);
			}
		}
		diag.forEach(function (c, i) {
			grid[c.l][c.x][c.y] = chips[i];
		});
		var moves = 0;
		while (true) {
			var acc = diag.filter(function (c) {
				return grid[c.l][c.x][c.y] && accessible(b, c.l, c.x, c.y);
			});
			var hit = null;
			for (var i = 0; i < acc.length && !hit; i++) {
				var p = grid[acc[i].l][acc[i].x][acc[i].y];
				for (var j = i + 1; j < acc.length; j++) {
					var q = grid[acc[j].l][acc[j].x][acc[j].y];
					if (matches(p, q)) {
						hit = [acc[i], acc[j]];
						break;
					}
				}
			}
			if (!hit) {
				break;
			}
			hit.forEach(function (c) {
				grid[c.l][c.x][c.y] = null;
				b[c.l][c.x][c.y] = 0;
			});
			moves++;
		}
		return {
			moves: moves,
			left: diag.filter(function (c) {
				return grid[c.l][c.x][c.y];
			}).length
		};
	}

	// 與 game.js checkMatchByData 同義
	function matches(p, q) {
		if (!p || !q || p.name !== q.name) {
			return false;
		}
		return UNIVERSAL.indexOf(p.name) >= 0 || p.id === q.id;
	}

	// ---------------------------------------------------------------- 驗證
	// 遊戲真正在意的兩件事：格數 == 張數、每組張數為偶數
	function validate(board, chips) {
		var cells = allCells(board);
		var perLayer = [0, 0, 0, 0];
		cells.forEach(function (c) {
			perLayer[c.l]++;
		});
		var groups = {};
		chips.forEach(function (c) {
			var k = c.name + '#' + (UNIVERSAL.indexOf(c.name) >= 0 ? '*' : c.id);
			groups[k] = (groups[k] || 0) + 1;
		});
		var singles = [];
		Object.keys(groups).forEach(function (k) {
			if (groups[k] % 2 !== 0) {
				singles.push(k + ' × ' + groups[k]);
			}
		});
		var kinds = 0;
		chips.forEach(function (c) {
			if (UNIVERSAL.indexOf(c.name) >= 0) {
				kinds = kinds; // 通用型只算一次名，下面用 set 重算
			}
		});
		var set = {};
		chips.forEach(function (c) {
			set[c.name + '#' + c.id] = 1;
		});
		return {
			cells: cells.length,
			chips: chips.length,
			perLayer: perLayer,
			pairs: Math.floor(chips.length / 2),
			empty: cells.length - chips.length,
			singles: singles,
			ok: cells.length === chips.length && chips.length > 0 && singles.length === 0,
			groups: groups,
			kinds: Object.keys(set).length
		};
	}

	// ---------------------------------------------------------------- 輸出
	function emitLevelFile(opts) {
		var board = opts.board;
		var chips = opts.chips;
		var perLayer = opts.perLayer;
		var lines = [];
		var n = opts.levelNo;
		var l, x, y, vals, i;

		lines.push('/**');
		lines.push(' * 第 ' + n + ' 關：' + (opts.name || '未命名') + (opts.desc ? '（' + opts.desc + '）' : ''));
		lines.push(' * 4 層 / ' + chips.length + ' 顆（' + (chips.length / 2) + ' 對），每層 ' + perLayer.join('/'));
		lines.push(' * @author ' + (opts.author || 'DaiEn'));
		lines.push(' * @Date ' + (opts.date || '2026-11-15'));
		lines.push(' * @Correction ' + (opts.correction || 1));
		lines.push(' */');
		lines.push('var L_' + n + ' = (function() {');
		lines.push('\tfunction L_' + n + '() {}');
		lines.push('\tL_' + n + '.level_str = {');
		lines.push('\t\tfield: [');
		for (l = 0; l < LAYERS; l++) {
			lines.push('\t\t\t[');
			for (x = 0; x < FIELD_WIDTH; x++) {
				vals = [];
				for (y = 0; y < FIELD_HEIGHT; y++) {
					vals.push(board[l][x][y]);
				}
				lines.push('\t\t\t\t[' + vals.join(', ') + ']' + (x === FIELD_WIDTH - 1 ? '' : ','));
			}
			lines.push('\t\t\t]' + (l === LAYERS - 1 ? '' : ','));
		}
		lines.push('\t\t],');
		lines.push('\t\tchips: [');
		for (i = 0; i < chips.length; i++) {
			lines.push('\t\t\t{ name: "' + chips[i].name + '", id: ' + chips[i].id + ' }' + (i === chips.length - 1 ? '' : ','));
		}
		lines.push('\t\t],');
		lines.push('\t\ttime: ' + opts.time);
		lines.push('\t};');
		lines.push('');
		lines.push('\treturn L_' + n + ';');
		lines.push('})();');
		return lines.join('\n');
	}

	// ---------------------------------------------------------------- 主流程
	/**
	 * 產生一關
	 * opts = {
	 *   art: ['....', ...] 12×8 字模（必填）
	 *   scales: [1, s2, s3, s4]
	 *   levelNo, name, desc, date, correction
	 *   secPerPair: 每對給幾秒（預設 1.75），或 time 直接指定
	 *   pool: [['fruit',0], ...] 可用的棋子組合
	 *   seed: 亂數種子（同種子 = 同結果）
	 *   attempts: 找牌的嘗試次數（預設 200）
	 * }
	 */
	function generate(opts) {
		var art = opts.art;
		var scales = opts.scales && opts.scales.length === LAYERS ? opts.scales : [1, 0.78, 0.58, 0.42];
		var pool = opts.pool && opts.pool.length ? opts.pool : DEFAULT_POOL;
		var attempts = opts.attempts || 200;
		var seed = opts.seed === undefined ? 20261115 : opts.seed;
		var rng = mulberry32(seed);

		if (!art || art.length !== ART_ROWS || !art[0] || art[0].length !== ART_COLS) {
			throw new Error('字模必須是 ' + ART_ROWS + ' 列 × ' + ART_COLS + ' 欄');
		}

		var board = buildBoard(art, scales);
		var cells = allCells(board);
		var dropped = false;

		// 奇數格會出現落單，直接拔掉最後一格
		if (cells.length % 2 === 1) {
			var last = cells[cells.length - 1];
			board[last.l][last.x][last.y] = 0;
			cells = allCells(board);
			dropped = true;
		}
		if (cells.length < 2) {
			throw new Error('棋子太少（' + cells.length + ' 格），至少需要 2 格');
		}

		var diag = diagOrder(board);
		var best = null;

		for (var t = 0; t < attempts; t++) {
			var pairs = witnessPairing(board, cells, 3, rng);
			if (!pairs) {
				continue;
			}
			var map = {};
			pairs.forEach(function (pair, idx) {
				var combo = pool[(idx * 5 + t) % pool.length];
				var obj = { name: combo[0], id: combo[1] };
				pair.forEach(function (c) {
					map[cellKey(c)] = obj;
				});
			});
			var chips = diag.map(function (c) {
				return map[cellKey(c)];
			});
			var g = greedyLeft(board, chips, diag);
			if (!best || g.left < best.greedy.left) {
				best = { chips: chips, pairs: pairs, greedy: g };
			}
			if (g.left === 0) {
				break;
			}
		}

		if (!best) {
			throw new Error('找不到合法的配對（嘗試 ' + attempts + ' 次），請調整縮放或字模');
		}

		var chips = best.chips;
		var info = validate(board, chips);
		var time = opts.time || Math.max(1, Math.round(info.pairs * (opts.secPerPair || 1.75)));
		var hash = fingerprint(board);

		var text = emitLevelFile({
			board: board,
			chips: chips,
			perLayer: info.perLayer,
			time: time,
			levelNo: opts.levelNo || 51,
			name: opts.name || '未命名',
			desc: opts.desc || '',
			author: opts.author,
			date: opts.date,
				correction: opts.correction
		});

		return {
			board: board,
			cells: cells,
			chips: chips,
			pairs: best.pairs,
			greedy: best.greedy,
			info: info,
			time: time,
			secPerPair: time / info.pairs,
			star3: (time / 3) / info.pairs,
			star2: (time * 2 / 3) / info.pairs,
			hash: hash,
			dropped: dropped,
			seed: seed,
			text: text
		};
	}

	return {
		FIELD_WIDTH: FIELD_WIDTH,
		FIELD_HEIGHT: FIELD_HEIGHT,
		LAYERS: LAYERS,
		ART_COLS: ART_COLS,
		ART_ROWS: ART_ROWS,
		UNIVERSAL: UNIVERSAL,
		POOL_RANGES: POOL_RANGES,
		PRESETS: PRESETS,
		DEFAULT_POOL: DEFAULT_POOL,
		makeBoard: makeBoard,
		accessible: accessible,
		buildBoard: buildBoard,
		allCells: allCells,
		diagOrder: diagOrder,
		matches: matches,
		greedyLeft: greedyLeft,
		validate: validate,
		fingerprint: fingerprint,
		emitLevelFile: emitLevelFile,
		generate: generate
	};
});
