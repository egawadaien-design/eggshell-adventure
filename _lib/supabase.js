/**
 * Supabase 代理共用模組（Vercel Serverless 後端）
 * @author [DaiEn]
 * @Date: 2026-11-21
 * @Correction: 2
 *
 * 【功能說明】
 * 給 api/ 下各 Serverless Function 共用：讀環境變數組 Supabase 請求標頭、
 * 統一 CORS 與 JSON 回應、依帳號查 users 表。
 *
 * 【安全分層】
 * - service_role 金鑰只從環境變數 SUPABASE_SERVICE_ROLE_KEY 讀取，
 *   本檔不含任何明文金鑰，可隨函數一起部署；
 * - 前端手上只有 publishable（anon）金鑰，見 js/supabase-config.js。
 *
 * 【環境變數】
 * SUPABASE_URL              Supabase 專案網址
 * SUPABASE_SERVICE_ROLE_KEY service_role 私密金鑰（sb_secret_ 開頭）
 * SUPABASE_USERS_TABLE      使用者資料表名稱，預設 users
 */

const DEFAULT_TABLE = 'users';

/** 讀取後端設定；缺網址或缺私密金鑰時回 null，由呼叫端回 server_error。 */
export function getConfig() {
	const url = process.env.SUPABASE_URL || '';
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
	const usersTable = process.env.SUPABASE_USERS_TABLE || DEFAULT_TABLE;
	if (!url || !serviceKey) {
		return null;
	}
	return { url: url, serviceKey: serviceKey, usersTable: usersTable };
}

/** 組 Supabase REST 標頭；apikey 與 Authorization 都帶，少一個會被拒。 */
export function restHeaders(serviceKey, extra) {
	const headers = {
		'apikey': serviceKey,
		'Authorization': 'Bearer ' + serviceKey,
		'Content-Type': 'application/json'
	};
	if (extra) {
		Object.assign(headers, extra);
	}
	return headers;
}

/** 同源呼叫為主；這裡仍補 CORS 標頭，方便本機跨埠除錯。 */
export function cors(res) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/** 統一 JSON 回應。 */
export function sendJson(res, data, status) {
	res.status(status || 200).json(data);
}

/** 組穩定錯誤代碼回應；對外不暴露 Supabase 內部細節。 */
export function errorBody(code) {
	return { ok: false, error: code };
}

/**
 * 依 username 取一筆使用者。
 * @param {object} config  getConfig() 回傳值
 * @param {string} account 帳號
 * @param {string} select  REST select 欄位清單
 * @returns {Promise<Array>} 資料列陣列；查無資料回空陣列
 */
export async function queryUser(config, account, select) {
	const encoded = encodeURIComponent(account);
	const url = config.url + '/rest/v1/' + config.usersTable +
		'?username=eq.' + encoded + '&select=' + select;
	const resp = await fetch(url, { headers: restHeaders(config.serviceKey) });
	if (!resp.ok) {
		const text = await resp.text().catch(function() { return ''; });
		throw new Error('Supabase query failed: ' + resp.status + ' ' + text);
	}
	const body = await resp.text();
	return body ? JSON.parse(body) : [];
}
