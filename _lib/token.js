/**
 * 無狀態 session token 共用模組（Vercel Serverless 後端）
 * @author [DaiEn]
 * @Date: 2026-11-21
 * @Correction: 2
 *
 * 【為什麼不用記憶體 Map】
 * 本機 Spring Boot 的 SessionStore 是記憶體 token→帳號對應；Serverless Function
 * 每次呼叫可能落在不同實例，彼此不共享記憶體，登入發的 token 別支函數取不到。
 * 所以正式站改用無狀態簽章 token：身分資訊放在 token 本身，用 HMAC-SHA256
 * 簽名，各函數各自驗章即可，不需要多開 sessions 資料表。
 *
 * 【token 格式】
 *   base64url(payload).base64url(HMAC-SHA256(payload, SESSION_SECRET))
 *   payload = { account, exp }
 *
 * 【環境變數】
 * SESSION_SECRET        簽章密鑰，部署後台設定；遺漏時端點回 server_error
 * SESSION_TTL_SECONDS   有效秒數，預設 30 天
 *
 * 【限制】
 * 無狀態 token 在到期前無法伺服器端作廢；登出目前由前端清除本機 session。
 * 若之後要「主動登出即失效」，需改 Supabase sessions 表持久化方案。
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60;

function secret() {
	return process.env.SESSION_SECRET || '';
}

function toB64url(input) {
	return Buffer.from(input).toString('base64url');
}

function sign(payloadB64) {
	return toB64url(createHmac('sha256', secret()).update(payloadB64).digest());
}

/** 核發 token；回傳 opaque 字串，前端不必解析內容。 */
export function issue(account) {
	const ttl = Number(process.env.SESSION_TTL_SECONDS) || DEFAULT_TTL_SECONDS;
	const payload = {
		account: account,
		exp: Math.floor(Date.now() / 1000) + ttl
	};
	const payloadB64 = toB64url(JSON.stringify(payload));
	return payloadB64 + '.' + sign(payloadB64);
}

/** 驗證 token 簽章與到期時間；有效回帳號，無效／過期回 null。 */
export function resolve(token) {
	if (!token || typeof token !== 'string' || !secret()) {
		return null;
	}
	const parts = token.split('.');
	if (parts.length !== 2) {
		return null;
	}
	const payloadB64 = parts[0];
	const signature = parts[1];

	const expected = sign(payloadB64);
	const a = Buffer.from(signature);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) {
		return null;
	}

	let payload;
	try {
		payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
	} catch (e) {
		return null;
	}
	if (!payload || typeof payload.account !== 'string' || !payload.exp) {
		return null;
	}
	if (payload.exp < Math.floor(Date.now() / 1000)) {
		return null;
	}
	return payload.account;
}
