/**
 * Vercel Serverless Function: 積分排行榜（前十名 + 自身資訊）
 * @author [DaiEn]
 * @Date: 2026-11-21
 * @Correction: 2
 *
 * 【功能說明】
 * GET /api/leaderboard?token=...，讀取 users 表回總積分前十名；帶有效 token 時
 * 另外附自身名次與總分／星數領先百分位。對齊本機 LeaderboardController.java。
 *
 * 【成功】 200 { ok: true, board: [ { username, totalScore, levelsCompleted, starTotal } x10 ],
 *                me: { account, levelsCompleted, totalScore, starTotal, rank,
 *                      scoreLeadPercent, starLeadPercent } | null }
 * 【失敗】 { ok: false, error: server_error }
 *
 * 【效率說明】目前筆數有限，一次取回由函數端排序計算；規模變大後應改 SQL 端
 * order+limit 取前十名，百分位改用 RPC 視窗函式或星數總欄位過濾。
 */

import { getConfig, restHeaders, cors, sendJson, errorBody } from '../_lib/supabase.js';
import { resolve } from '../_lib/token.js';

function sumStars(arr) {
	if (!Array.isArray(arr)) {
		return 0;
	}
	return arr.reduce(function(sum, v) {
		return sum + Math.max(0, Number(v) || 0);
	}, 0);
}

export default async function handler(req, res) {
	cors(res);

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}
	if (req.method !== 'GET') {
		return sendJson(res, errorBody('server_error'), 405);
	}

	const config = getConfig();
	if (!config) {
		return sendJson(res, errorBody('server_error'), 500);
	}

	try {
		const url = config.url + '/rest/v1/' + config.usersTable +
			'?select=id,username,total_score,levels_completed,stars_per_level';
		const resp = await fetch(url, { headers: restHeaders(config.serviceKey) });
		if (!resp.ok) {
			console.error('[leaderboard] supabase status=', resp.status);
			return sendJson(res, errorBody('server_error'), 502);
		}

		const text = await resp.text();
		const rows = text ? JSON.parse(text) : [];
		const all = rows.map(function(r) {
			return {
				id: Number(r.id) || 0,
				username: r.username,
				totalScore: Number(r.total_score) || 0,
				levelsCompleted: Number(r.levels_completed) || 0,
				starTotal: sumStars(r.stars_per_level)
			};
		});

		// 總積分高→低，同分時 id 小（先註冊）在前
		all.sort(function(a, b) {
			if (b.totalScore !== a.totalScore) {
				return b.totalScore - a.totalScore;
			}
			return a.id - b.id;
		});

		const board = all.slice(0, 10).map(function(r) {
			return {
				username: r.username,
				totalScore: r.totalScore,
				levelsCompleted: r.levelsCompleted,
				starTotal: r.starTotal
			};
		});

		const account = resolve(req.query && req.query.token);
		let me = null;
		if (account) {
			const mine = all.find(function(r) { return r.username === account; });
			if (mine) {
				const n = all.length;
				const scoreBetter = all.filter(function(r) { return r.totalScore < mine.totalScore; }).length;
				const starBetter = all.filter(function(r) { return r.starTotal < mine.starTotal; }).length;
				const rank = all.findIndex(function(r) { return r.username === mine.username; }) + 1;
				me = {
					account: mine.username,
					levelsCompleted: mine.levelsCompleted,
					totalScore: mine.totalScore,
					starTotal: mine.starTotal,
					rank: rank,
					scoreLeadPercent: n > 0 ? Math.round(100 * scoreBetter / n) : 0,
					starLeadPercent: n > 0 ? Math.round(100 * starBetter / n) : 0
				};
			}
		}

		return sendJson(res, { ok: true, board: board, me: me }, 200);
	} catch (e) {
		console.error('[leaderboard]', e && e.message);
		return sendJson(res, errorBody('server_error'), 500);
	}
}
