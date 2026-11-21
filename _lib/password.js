/**
 * 密碼雜湊共用模組（Vercel Serverless 後端）
 * @author [DaiEn]
 * @Date: 2026-11-21
 * @Correction: 2
 *
 * 【功能說明】
 * PBKDF2WithHmacSHA256，隨機 16 byte salt，儲存格式 base64(salt):base64(hash)。
 * 與本機 Spring Boot 的 auth/PasswordHasher.java 參數完全一致，
 * 兩邊雜湊可互相驗證（同一筆密碼不論由哪一端寫入，另一端都能比對）。
 *
 * 【參數對照 Java 版】
 * - 迭代次數 120000
 * - 金鑰長度 256 bit（32 byte）
 * - salt 長度 16 byte
 * - 編碼：UTF-8 密碼 → PBKDF2；salt 與雜湊皆標準 base64
 */

import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';

const ITERATIONS = 120000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

/** 對明文密碼做雜湊，回傳 salt:hash 字串（可直接入庫）。 */
export function hash(plain) {
	const salt = randomBytes(SALT_LENGTH);
	const derived = pbkdf2Sync(String(plain), salt, ITERATIONS, KEY_LENGTH, 'sha256');
	return salt.toString('base64') + ':' + derived.toString('base64');
}

/** 比對明文密碼與庫存雜湊；常時間比對避免 timing 側通道。 */
export function verify(plain, stored) {
	if (plain == null || !stored) {
		return false;
	}
	const parts = String(stored).split(':', 2);
	if (parts.length !== 2) {
		return false;
	}
	try {
		const salt = Buffer.from(parts[0], 'base64');
		const expected = Buffer.from(parts[1], 'base64');
		const actual = pbkdf2Sync(String(plain), salt, ITERATIONS, KEY_LENGTH, 'sha256');
		if (expected.length !== actual.length) {
			return false;
		}
		return timingSafeEqual(expected, actual);
	} catch (e) {
		return false;
	}
}
