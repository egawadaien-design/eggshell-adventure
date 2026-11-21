/**
 * Vercel Serverless Function: 註冊
 * @author [DaiEn]
 * @Date: 2026-11-21
 * @Correction: 2
 *
 * 【功能說明】
 * 前端 POST /api/auth/register，函數在伺服器端檢查帳號未被使用後，
 * 把 PBKDF2 雜湊後的密碼寫入 Supabase users 表，成功核發無狀態 session token。
 * service_role 金鑰只從環境變數讀取，不出現在前端程式碼。
 *
 * 【請求】 POST JSON { account, password }
 * 【成功】 200 { ok: true, account, token }
 * 【失敗】 { ok: false, error: <穩定錯誤代碼> }，代碼對齊本機 AuthController：
 *   empty_fields / account_too_short / weak_password / account_exists /
 *   invalid_payload / server_error
 */

import { getConfig, restHeaders, cors, sendJson, errorBody, queryUser } from '../../_lib/supabase.js';
import { hash } from '../../_lib/password.js';
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
	if (account.length < 3 || account.length > 32) {
		return sendJson(res, errorBody('account_too_short'), 400);
	}
	if (password.length < 6 || password.length > 64) {
		return sendJson(res, errorBody('weak_password'), 400);
	}

	try {
		const existing = await queryUser(config, account, 'username');
		if (existing.length > 0) {
			return sendJson(res, errorBody('account_exists'), 409);
		}

		const row = {
			username: account,
			password_hash: hash(password)
		};
		const resp = await fetch(config.url + '/rest/v1/' + config.usersTable, {
			method: 'POST',
			headers: restHeaders(config.serviceKey, { Prefer: 'return=minimal' }),
			body: JSON.stringify(row)
		});

		if (resp.status === 409) {
			return sendJson(res, errorBody('account_exists'), 409);
		}
		if (!resp.ok) {
			console.error('[auth/register] supabase status=', resp.status);
			return sendJson(res, errorBody('server_error'), 502);
		}

		return sendJson(res, { ok: true, account: account, token: issue(account) }, 200);
	} catch (e) {
		console.error('[auth/register]', e && e.message);
		return sendJson(res, errorBody('server_error'), 500);
	}
}
