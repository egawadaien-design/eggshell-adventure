/**
 * Vercel Serverless Function: 上傳存檔（逐關取 max 後寫回）
 * @author [DaiEn]
 * @Date: 2026-11-21
 * @Correction: 2
 *
 * 【功能說明】
 * POST /api/save/update，驗證 token 後把前端存檔與庫存檔逐關取 max 寫回；
 * total_score 由資料庫觸發器依 score_per_level 加總，不接受前端直接指定。
 * 對齊本機 SaveController.java 的 update()。
 *
 * 【請求】 POST JSON { token, levelsCompleted, scorePerLevel, starsPerLevel }
 * 【成功】 200 { ok: true, account, save: <合併後存檔> }
 * 【失敗】 { ok: false, error: invalid_session | invalid_payload | server_error }
 */

import { getConfig, restHeaders, cors, sendJson, errorBody, queryUser } from '../../_lib/supabase.js';
import { resolve } from '../../_lib/token.js';
import {
	MAX_LEVELS,
	toNumberArray,
	readIntArray,
	mergeMax,
	buildSavePayload,
	clampInt,
	toInt
} from '../../_lib/save-merge.js';

export default async function handler(req, res) {
	cors(res);

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}
	if (req.method !== 'POST') {
		return sendJson(res, errorBody('server_error'), 405);
	}

	const config = getConfig();
	if (!config) {
		return sendJson(res, errorBody('server_error'), 500);
	}

	let body;
	try {
		body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
	} catch (e) {
		return sendJson(res, errorBody('invalid_payload'), 400);
	}

	const token = body.token == null ? '' : String(body.token);
	const account = resolve(token);
	if (!account) {
		return sendJson(res, errorBody('invalid_session'), 401);
	}

	const incomingScores = toNumberArray(body.scorePerLevel, false);
	const incomingStars = toNumberArray(body.starsPerLevel, true);
	const incomingLevels = clampInt(toInt(body.levelsCompleted, 0), 0, MAX_LEVELS);
	if (incomingScores == null || incomingStars == null) {
		return sendJson(res, errorBody('invalid_payload'), 400);
	}

	try {
		const rows = await queryUser(
			config,
			account,
			'username,levels_completed,score_per_level,stars_per_level,total_score'
		);
		if (rows.length === 0) {
			return sendJson(res, errorBody('invalid_session'), 401);
		}
		const existing = rows[0];

		const mergedScores = mergeMax(readIntArray(existing, 'score_per_level'), incomingScores);
		const mergedStars = mergeMax(readIntArray(existing, 'stars_per_level'), incomingStars);
		const mergedLevels = clampInt(
			Math.max(toInt(existing.levels_completed, 0), incomingLevels),
			0,
			MAX_LEVELS
		);

		const row = {
			levels_completed: mergedLevels,
			score_per_level: mergedScores,
			stars_per_level: mergedStars
		};
		const resp = await fetch(
			config.url + '/rest/v1/' + config.usersTable + '?username=eq.' + encodeURIComponent(account),
			{
				method: 'PATCH',
				headers: restHeaders(config.serviceKey, { Prefer: 'return=representation' }),
				body: JSON.stringify(row)
			}
		);

		if (!resp.ok) {
			console.error('[save/update] supabase status=', resp.status);
			return sendJson(res, errorBody('server_error'), 502);
		}

		let updated = [];
		const respText = await resp.text();
		if (respText) {
			updated = JSON.parse(respText);
		}
		const out = Array.isArray(updated) && updated.length > 0 ? updated[0] : null;

		const save = out != null
			? buildSavePayload(out)
			: buildSavePayload({
				levels_completed: mergedLevels,
				score_per_level: mergedScores,
				stars_per_level: mergedStars,
				total_score: null
			});

		return sendJson(res, { ok: true, account: account, save: save }, 200);
	} catch (e) {
		console.error('[save/update]', e && e.message);
		return sendJson(res, errorBody('server_error'), 500);
	}
}
