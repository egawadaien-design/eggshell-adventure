/**
 * 存檔校驗與合併共用模組（Vercel Serverless 後端）
 * @author [DaiEn]
 * @Date: 2026-11-21
 * @Correction: 2
 *
 * 【功能說明】
 * 對齊本機 SaveController.java 的存檔規則：
 * - 單次存檔陣列長度上限 200 關，避免異常 payload 灌爆資料庫；
 * - 分數只擋負數，不設上限（分數可超過關卡數）；
 * - 星等夾 0–3；
 * - 與庫存檔逐關取 max，舊陣列不足處補 0；
 * - total_score 不接受前端指定，由資料庫觸發器依 score_per_level 加總。
 */

export const MAX_LEVELS = 200;

/**
 * 把前端傳來的值轉成非負整數陣列；starsOnly 時星等夾 0–3。
 * 型別不是陣列或長度超過上限回 null，由呼叫端回 invalid_payload。
 */
export function toNumberArray(value, starsOnly) {
	if (!Array.isArray(value)) {
		return null;
	}
	if (value.length > MAX_LEVELS) {
		return null;
	}
	const out = [];
	for (let i = 0; i < value.length; i++) {
		let v = toInt(value[i], 0);
		v = Math.max(v, 0);
		if (starsOnly) {
			v = Math.min(v, 3);
		}
		out.push(v);
	}
	return out;
}

/** 讀資料列內的整數陣列；非陣列回空陣列，長度受 MAX_LEVELS 限制。 */
export function readIntArray(row, key) {
	const arr = row[key];
	if (!Array.isArray(arr)) {
		return [];
	}
	return arr.slice(0, MAX_LEVELS).map(function(v) {
		return Math.max(0, toInt(v, 0));
	});
}

/** 逐關取 max；舊陣列不足處補 0。 */
export function mergeMax(oldValues, incoming) {
	const length = Math.max(oldValues.length, Math.min(incoming.length, MAX_LEVELS));
	const merged = new Array(length).fill(0);
	for (let i = 0; i < length; i++) {
		const oldVal = i < oldValues.length ? oldValues[i] : 0;
		const newVal = i < incoming.length ? incoming[i] : 0;
		merged[i] = Math.max(oldVal, newVal);
	}
	return merged;
}

/** 組對外存檔 payload；欄位名與前端 GameData 對齊。 */
export function buildSavePayload(row) {
	return {
		levelsCompleted: toInt(row.levels_completed, 0),
		scorePerLevel: readIntArray(row, 'score_per_level'),
		starsPerLevel: readIntArray(row, 'stars_per_level'),
		totalScore: toInt(row.total_score, 0)
	};
}

export function clampInt(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

/** 寬鬆轉整數；無法解析回 fallback。 */
export function toInt(value, fallback) {
	if (value == null) {
		return fallback;
	}
	if (typeof value === 'number') {
		return Number.isFinite(value) ? Math.trunc(value) : fallback;
	}
	const n = parseInt(String(value).trim(), 10);
	return Number.isNaN(n) ? fallback : n;
}
