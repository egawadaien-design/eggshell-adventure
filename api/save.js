/**
 * Vercel Serverless Function: 讀取目前 session 對應帳號的存檔
 * @author [DaiEn]
 * @Date: 2026-11-21
 * @Correction: 2
 *
 * 【功能說明】
 * GET /api/save?token=...，驗證無狀態 token 後回傳該帳號存檔。
 * 對齊本機 SaveController.java 的 load()。
 *
 * 【成功】 200 { ok: true, account, save: { levelsCompleted, scorePerLevel,
 *          starsPerLevel, totalScore } }
 * 【失敗】 { ok: false, error: invalid_session | server_error }
 */

import { getConfig, cors, sendJson, errorBody, queryUser } from '../_lib/supabase.js';
import { resolve } from '../_lib/token.js';
import { buildSavePayload } from '../_lib/save-merge.js';

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

	const token = (req.query && req.query.token) || '';
	const account = resolve(token);
	if (!account) {
		return sendJson(res, errorBody('invalid_session'), 401);
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

		return sendJson(res, {
			ok: true,
			account: account,
			save: buildSavePayload(rows[0])
		}, 200);
	} catch (e) {
		console.error('[save]', e && e.message);
		return sendJson(res, errorBody('server_error'), 500);
	}
}
