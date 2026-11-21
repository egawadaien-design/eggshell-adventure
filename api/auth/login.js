/**
 * Vercel Serverless Function: 登入
 * @author [DaiEn]
 * @Date: 2026-11-21
 * @Correction: 2
 *
 * 【功能說明】
 * 前端 POST /api/auth/login，函數依帳號取回雜湊比對密碼；
 * 身分不對外回傳雜湊，成功核發無狀態 session token。
 *
 * 【請求】 POST JSON { account, password }
 * 【成功】 200 { ok: true, account, token }
 * 【失敗】 { ok: false, error: <穩定錯誤代碼> }：
 *   empty_fields / invalid_credential / invalid_payload / server_error
 */

import { getConfig, restHeaders, cors, sendJson, errorBody, queryUser } from '../../_lib/supabase.js';
import { verify } from '../../_lib/password.js';
import { issue } from '../../_lib/token.js';

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

	const account = String(body.account == null ? '' : body.account).trim();
	const password = body.password == null ? '' : String(body.password);

	if (!account || !password) {
		return sendJson(res, errorBody('empty_fields'), 400);
	}

	try {
		const rows = await queryUser(config, account, 'username,password_hash');
		if (rows.length === 0) {
			return sendJson(res, errorBody('invalid_credential'), 401);
		}

		const row = rows[0];
		const storedHash = row.password_hash || '';
		if (!verify(password, storedHash)) {
			return sendJson(res, errorBody('invalid_credential'), 401);
		}

		return sendJson(res, {
			ok: true,
			account: row.username,
			token: issue(row.username)
		}, 200);
	} catch (e) {
		console.error('[auth/login]', e && e.message);
		return sendJson(res, errorBody('server_error'), 500);
	}
}
