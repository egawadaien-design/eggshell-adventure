/**
 * 蛋殼冒險（EggshellCatWeb）— Supabase 前端設定
 * @author DaiEn
 * @Date 2026-11-21
 * @Correction 1
 *
 * 安全分層：
 *   - 本檔只放 Project URL 與 Publishable（anon）公開金鑰，可隨前端 JS 出埠；
 *   - Secret（service-role）金鑰只存在後端 application.properties，由 Spring Boot
 *     控制器代理呼叫 Supabase REST，嚴禁止寫進 static 目錄任何前端檔案。
 *
 * 對照參考專案：EggshellCatApngTool / static/js/supabase-config.js
 */
window.SUPABASE_CONFIG = {
	enabled: true,
	url: 'https://msabxzkvtlwpxssxlith.supabase.co',
	anonKey: 'sb_publishable_uIiK0zfKfYdhsRBIsnMWYw_GXalaIRv'
};
