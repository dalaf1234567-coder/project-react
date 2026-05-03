import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, Camera, ArrowLeftRight, Volume2, WifiOff, X,
  ImageIcon, RotateCcw, Trash2, GraduationCap, ChevronDown,
  ChevronUp, Video, VideoOff, MessageCircle, Zap,
  BookOpen, FileText, Layers
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// KONFIGURASI API
// ══════════════════════════════════════════════════════════════
// PENTING: Ganti string di bawah ini dengan API Key Anthropic Anda.
// Dapatkan di: https://console.anthropic.com/
const ANTHROPIC_API_KEY = "ISI_DENGAN_API_KEY_ANDA"; 

const LANGS = [
  { code: "id", name: "Indonesia", flag: "🇮🇩", speech: "id-ID" },
  { code: "en", name: "English",   flag: "🇺🇸", speech: "en-US" },
  { code: "ja", name: "日本語",     flag: "🇯🇵", speech: "ja-JP" },
  { code: "ko", name: "한국어",     flag: "🇰🇷", speech: "ko-KR" },
  { code: "zh-CN", name: "中文简体",flag: "🇨🇳", speech: "zh-CN" },
  { code: "zh-TW", name: "中文繁體",flag: "🇹🇼", speech: "zh-TW" },
  { code: "es", name: "Español",   flag: "🇪🇸", speech: "es-ES" },
  { code: "fr", name: "Français",  flag: "🇫🇷", speech: "fr-FR" },
  { code: "de", name: "Deutsch",   flag: "🇩🇪", speech: "de-DE" },
  { code: "ar", name: "العربية",   flag: "🇸🇦", speech: "ar-SA" },
  { code: "pt", name: "Português", flag: "🇧🇷", speech: "pt-BR" },
  { code: "ru", name: "Русский",   flag: "🇷🇺", speech: "ru-RU" },
  { code: "th", name: "ภาษาไทย",   flag: "🇹🇭", speech: "th-TH" },
  { code: "vi", name: "Tiếng Việt",flag: "🇻🇳", speech: "vi-VN" },
  { code: "hi", name: "हिन्दी",    flag: "🇮🇳", speech: "hi-IN" },
  { code: "ms", name: "Melayu",    flag: "🇲🇾", speech: "ms-MY" },
  { code: "tr", name: "Türkçe",    flag: "🇹🇷", speech: "tr-TR" },
  { code: "it", name: "Italiano",  flag: "🇮🇹", speech: "it-IT" },
  { code: "nl", name: "Nederlands",flag: "🇳🇱", speech: "nl-NL" },
  { code: "pl", name: "Polski",    flag: "🇵🇱", speech: "pl-PL" },
  { code: "sv", name: "Svenska",   flag: "🇸🇪", speech: "sv-SE" },
  { code: "fil",name: "Filipino",  flag: "🇵🇭", speech: "fil-PH" },
  { code: "uk", name: "Українська",flag: "🇺🇦", speech: "uk-UA" },
];

// ══════════════════════════════════════════════════════════════
//  TURBO TRANSLATION ENGINE — cache + dedup + abort + fallback
// ══════════════════════════════════════════════════════════════

const _tCache = new Map();
const _MAX_CACHE = 500;
function _cacheSet(k, v) {
  if (_tCache.size >= _MAX_CACHE) _tCache.delete(_tCache.keys().next().value);
  _tCache.set(k, v);
}

const _inflight = new Map();

async function fastTranslate(text, src, tgt, signal) {
  const t = text.trim();
  if (!t || src === tgt) return text;
  const key = `${src}|${tgt}|${t}`;

  if (_tCache.has(key)) return _tCache.get(key);
  if (_inflight.has(key)) return _inflight.get(key);

  const promise = (async () => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(t)}`;
      const r = await fetch(url, signal ? { signal } : undefined);
      if (!r.ok) throw new Error("gtx " + r.status);
      const d = await r.json();
      const result = d[0].map(x => x[0]).filter(Boolean).join("") || t;
      _cacheSet(key, result);
      return result;
    } catch (e) {
      if (e?.name === "AbortError") return "";
      try {
        const r2 = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${src}|${tgt}`,
          signal ? { signal } : undefined
        );
        const d2 = await r2.json();
        const result = d2.responseData?.translatedText || t;
        _cacheSet(key, result);
        return result;
      } catch { return ""; }
    } finally {
      _inflight.delete(key);
    }
  })();

  _inflight.set(key, promise);
  return promise;
}

function warmTranslateCache(pairs) {
  pairs.forEach(([text, src, tgt]) => fastTranslate(text, src, tgt).catch(() => {}));
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0000}
.app{font-family:'Noto Sans',sans-serif;background:linear-gradient(160deg,#130000 0%,#0a0000 60%,#1a0a00 100%);color:#f5f0e8;min-height:100vh;display:flex;flex-direction:column;max-width:480px;margin:0 auto;position:relative}
select{background:#1c0505;color:#fde68a;border:1px solid #7f1d1d;border-radius:10px;padding:8px 10px;font-size:13px;outline:none;cursor:pointer;font-family:inherit;transition:border-color .2s}
select:hover{border-color:#f59e0b}
select:focus{border-color:#f59e0b;box-shadow:0 0 0 2px rgba(245,158,11,.15)}
button{cursor:pointer;font-family:inherit}
.header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(245,158,11,.25);background:linear-gradient(90deg,#1c0505 0%,#2d0a0a 50%,#1c0505 100%)}
.logo{display:flex;align-items:center;gap:10px}
.logo-icon{width:38px;height:38px;background:linear-gradient(135deg,#ef4444 0%,#b91c1c 100%);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;color:#fde68a;box-shadow:0 0 16px rgba(220,38,38,.5),inset 0 1px 0 rgba(255,255,255,.15)}
.logo-name{font-weight:800;font-size:19px;letter-spacing:-.3px;background:linear-gradient(90deg,#fbbf24 0%,#f87171 50%,#fde68a 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.badge{display:flex;align-items:center;gap:5px;font-size:11px;padding:4px 10px;border-radius:20px;font-weight:600}
.badge.on{background:rgba(5,46,22,.8);color:#4ade80;border:1px solid #166534}
.badge.off{background:rgba(127,29,29,.3);color:#fca5a5;border:1px solid #7f1d1d}
.dot{display:inline-block;width:7px;height:7px;background:#4ade80;border-radius:50%}
.tabs{display:flex;border-bottom:1px solid rgba(245,158,11,.2);background:#130000}
.tab{flex:1;padding:11px 4px;font-size:12px;font-weight:600;border:none;background:none;color:#7f3d3d;display:flex;align-items:center;justify-content:center;gap:5px;border-bottom:2px solid transparent;transition:all .2s;letter-spacing:.01em}
.tab.active{color:#fbbf24;border-bottom-color:#f59e0b;background:linear-gradient(180deg,rgba(245,158,11,.08),transparent)}
.tab:hover:not(.active){color:#fca5a5;background:rgba(239,68,68,.06)}
.bar-a{background:linear-gradient(90deg,#2d0a0a,#1c0505);border-bottom:1px solid rgba(245,158,11,.2);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;transform:rotate(180deg) scaleX(-1)}
.bar-b{background:linear-gradient(90deg,#1c0505,#2d0a0a);border-top:1px solid rgba(245,158,11,.2);padding:10px 16px;display:flex;align-items:center;justify-content:space-between}
.bar-lbl{font-size:11px;color:#b45309;font-weight:500}
.feed{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:12px;min-height:240px;max-height:340px}
.feed::-webkit-scrollbar{width:3px}
.feed::-webkit-scrollbar-thumb{background:#7f1d1d;border-radius:2px}
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;color:#5a2020;font-size:13px;text-align:center;gap:10px;line-height:1.6}
.bwrap{display:flex;flex-direction:column;gap:4px}
.bwrap.A{align-items:flex-end}
.bwrap.B{align-items:flex-start}
.bubble{max-width:82%;border-radius:16px;padding:10px 14px}
.bubble.A{background:linear-gradient(135deg,#3d1010,#2d0a0a);border:1px solid rgba(220,38,38,.5);border-top-right-radius:4px;box-shadow:0 2px 12px rgba(0,0,0,.4)}
.bubble.B{background:linear-gradient(135deg,#2d1a00,#1c0f00);border:1px solid rgba(180,83,9,.4);border-top-left-radius:4px;box-shadow:0 2px 12px rgba(0,0,0,.4)}
.b-orig{font-size:14px;font-weight:600;line-height:1.5}
.bubble.A .b-orig{color:#fca5a5}
.bubble.B .b-orig{color:#fbbf24}
.bdiv{border-top:1px solid rgba(255,255,255,.07);margin:6px 0}
.b-trans{font-size:13px;color:#d4c4a0;line-height:1.5}
.learn-btn{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;border:1px solid;background:none;font-family:inherit;transition:all .2s;align-self:flex-start}
.bwrap.A .learn-btn{align-self:flex-end}
.learn-btn.A,.learn-btn.B{color:#f59e0b;border-color:rgba(245,158,11,.4)}
.learn-btn.A:hover,.learn-btn.A.open,.learn-btn.B:hover,.learn-btn.B.open{background:rgba(245,158,11,.12);border-color:#f59e0b;box-shadow:0 0 8px rgba(245,158,11,.2)}
.lpanel{background:linear-gradient(135deg,#1c0505,#1a0a00);border-radius:14px;padding:14px;border:1px solid rgba(245,158,11,.25);max-width:82%;width:100%;box-shadow:0 4px 20px rgba(0,0,0,.5)}
.lp-title{font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
.speed-row{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.speed-row span{font-size:11px;color:#b45309;min-width:60px}
.play-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:10px;border-radius:10px;border:1px solid rgba(239,68,68,.6);background:linear-gradient(135deg,#3d0000,#2d0a0a);color:#fca5a5;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;margin-bottom:10px}
.play-btn:hover{border-color:#ef4444;background:#4d0000;box-shadow:0 0 12px rgba(239,68,68,.3)}
.play-btn.going{animation:pulse 1.2s infinite;background:#dc2626;color:#fff;border-color:#ef4444}
.phonetic-box{background:#0a0000;border-radius:10px;padding:12px;border-left:3px solid #f59e0b;margin-bottom:10px}
.ph-lbl{font-size:10px;color:#f59e0b;font-weight:700;margin-bottom:5px;letter-spacing:.8px}
.ph-text{font-size:12px;color:#d4c4a0;line-height:1.8;white-space:pre-wrap}
.ph-load{font-size:12px;color:#7f3d3d;animation:pulse 1.5s infinite}
.prac-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:10px;border-radius:10px;border:2px solid rgba(245,158,11,.5);background:linear-gradient(135deg,#2d1a00,#1c0f00);color:#fbbf24;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
.prac-btn:hover{border-color:#f59e0b;background:#3d2000;box-shadow:0 0 12px rgba(245,158,11,.25)}
.prac-btn.going{background:#b45309;border-color:#fbbf24;color:#fff;animation:pulse 1s infinite}
.score-box{background:#0a0000;border-radius:10px;padding:12px;margin-top:10px;border:1px solid rgba(255,255,255,.06)}
.score-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.score-lbl{font-size:11px;color:#7f3d3d}
.score-num{font-size:20px;font-weight:700}
.score-bar{height:6px;background:#2d0a0a;border-radius:3px;overflow:hidden;margin-bottom:6px}
.score-fill{height:6px;border-radius:3px;transition:width .6s}
.fb{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600}
.fb.g{background:#052e16;color:#4ade80;border:1px solid #166534}
.fb.y{background:rgba(180,83,9,.2);color:#fbbf24;border:1px solid #b45309}
.fb.r{background:rgba(127,29,29,.3);color:#f87171;border:1px solid #7f1d1d}
.heard{font-size:11px;color:#7f3d3d;margin-top:6px}
.heard span{color:#fde68a}
.tpill{display:flex;justify-content:center}
.tpill div{background:#1c0505;border:1px solid #7f1d1d;border-radius:20px;padding:6px 16px;font-size:12px;color:#f87171;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.err{margin:0 12px 6px;background:rgba(127,29,29,.4);border:1px solid #7f1d1d;color:#fca5a5;font-size:12px;padding:8px 12px;border-radius:10px;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;line-height:1.5}
.warn{background:rgba(146,64,14,.15);border:1px solid rgba(245,158,11,.3);color:#fde68a;font-size:11px;padding:8px 10px;border-radius:10px;display:flex;align-items:flex-start;gap:7px;line-height:1.5}
.actions{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid rgba(245,158,11,.2);background:linear-gradient(180deg,#1c0505,#130000)}
.mic-btn{display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 18px;border-radius:14px;border:2px solid;background:none;font-family:inherit;position:relative;transition:all .2s}
.mic-btn:disabled{opacity:.35;cursor:not-allowed}
.mic-btn.A{border-color:rgba(220,38,38,.5);color:#f87171;transform:rotate(180deg) scaleX(-1)}
.mic-btn.A:hover:not(:disabled){border-color:#ef4444;background:rgba(220,38,38,.12);box-shadow:0 0 16px rgba(220,38,38,.2)}
.mic-btn.A.rec{background:rgba(220,38,38,.3);border-color:#ef4444;color:#fff;box-shadow:0 0 20px rgba(239,68,68,.4)}
.mic-btn.B{border-color:rgba(180,83,9,.5);color:#fbbf24}
.mic-btn.B:hover:not(:disabled){border-color:#f59e0b;background:rgba(180,83,9,.12);box-shadow:0 0 16px rgba(245,158,11,.2)}
.mic-btn.B.rec{background:rgba(180,83,9,.3);border-color:#fbbf24;color:#fff;box-shadow:0 0 20px rgba(251,191,36,.4)}
.mic-lbl{font-size:10px;font-weight:600;letter-spacing:.02em}
.rdot{position:absolute;top:-4px;right:-4px;width:10px;height:10px;background:#ef4444;border-radius:50%;animation:pulse 1s infinite;box-shadow:0 0 6px #ef4444}
.cbtns{display:flex;flex-direction:column;gap:8px}
.ibtn{width:40px;height:40px;border-radius:50%;background:#1c0505;border:1px solid rgba(245,158,11,.3);display:flex;align-items:center;justify-content:center;color:#b45309;transition:all .2s}
.ibtn:hover{background:#2d1a00;border-color:#f59e0b;color:#fbbf24;box-shadow:0 0 10px rgba(245,158,11,.2)}
.clrbtn{background:none;border:none;color:#5a2020;display:flex;align-items:center}
.clrbtn:hover{color:#f87171}
.pov{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(180deg,#1c0505,#130000);border-top:1px solid rgba(245,158,11,.25);border-radius:20px 20px 0 0;padding:20px 16px;z-index:50;max-height:80vh;overflow-y:auto;box-shadow:0 -8px 40px rgba(0,0,0,.6)}
.pov-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.pov-hdr h3{font-size:16px;font-weight:700;color:#fde68a}
.lrow{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.lrow span{font-size:12px;color:#b45309;white-space:nowrap;font-weight:500}
.upz{border:2px dashed rgba(245,158,11,.3);border-radius:14px;padding:36px;display:flex;flex-direction:column;align-items:center;gap:10px;color:#7f3d3d;cursor:pointer;transition:all .2s}
.upz:hover{border-color:rgba(245,158,11,.6);color:#f59e0b;background:rgba(245,158,11,.04)}
.prev{width:100%;max-height:160px;object-fit:contain;border-radius:10px;border:1px solid rgba(245,158,11,.2)}
.rbox{background:#0a0000;border-radius:12px;padding:14px;margin-top:10px;border:1px solid rgba(245,158,11,.15)}
.rlbl{font-size:11px;color:#b45309;margin-bottom:3px;font-weight:600}
.rorig{font-size:13px;color:#d4c4a0;margin-bottom:10px;line-height:1.5}
.rdivp{border-top:1px solid rgba(255,255,255,.06);padding-top:10px;margin-bottom:3px}
.rtrans{font-size:13px;color:#fbbf24;font-weight:600;line-height:1.5}
.spkbtn{display:flex;align-items:center;gap:5px;font-size:11px;color:#7f3d3d;background:none;border:none;cursor:pointer;margin-top:8px;font-family:inherit}
.spkbtn:hover{color:#fca5a5}
.rstbtn{display:flex;align-items:center;gap:4px;font-size:11px;color:#5a2020;background:none;border:none;cursor:pointer;margin-top:8px;font-family:inherit}
.rstbtn:hover{color:#b45309}
.proc{text-align:center;font-size:12px;color:#7f3d3d;padding:16px;animation:pulse 1.5s infinite}
.vfull{position:relative;flex:1;display:flex;flex-direction:column;overflow:hidden;background:#000;min-height:300px}
.vfull-video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block}
.vfull-placeholder{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#5a2020;text-align:center;padding:24px;background:linear-gradient(160deg,#050000,#0a0000)}
.vfull-top{position:absolute;top:0;left:0;right:0;display:flex;align-items:flex-start;justify-content:space-between;padding:10px 12px;z-index:10;background:linear-gradient(rgba(0,0,0,.75) 0%,transparent 100%)}
.vfull-sub{position:absolute;left:0;right:0;bottom:115px;z-index:10;pointer-events:none;text-align:center;padding:0 16px}
.vfull-sub-text{display:inline-block;font-size:22px;font-weight:800;color:#fff;line-height:1.4;text-shadow:0 2px 14px #000,0 4px 24px #000;letter-spacing:.01em;background:rgba(0,0,0,.55);padding:8px 18px;border-radius:14px}
.vfull-bottom{position:absolute;bottom:0;left:0;right:0;z-index:10;padding:12px 14px 18px;background:linear-gradient(transparent,rgba(0,0,0,.93) 35%);display:flex;flex-direction:column;gap:8px}
.vlang-row-h{display:flex;align-items:center;gap:6px}
.vlang-row-h select{flex:1;font-size:11px;padding:5px 7px}
.src-badge{background:rgba(10,0,0,.75);border:1px solid rgba(245,158,11,.4);border-radius:10px;padding:3px 8px;font-size:10px;font-weight:700;color:#fbbf24;display:flex;align-items:center;gap:5px}
.rec-badge{display:flex;align-items:center;gap:5px;background:rgba(220,38,38,.85);border-radius:10px;padding:3px 8px;font-size:10px;font-weight:700;color:#fff;box-shadow:0 0 10px rgba(220,38,38,.5)}
.rdot-anim{width:7px;height:7px;background:#fff;border-radius:50%;animation:pulse 1s infinite;flex-shrink:0}
.latency-badge{background:rgba(10,0,0,.7);border:1px solid rgba(245,158,11,.3);border-radius:8px;padding:2px 7px;font-size:10px;color:#fbbf24;font-weight:600}
.vstart-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:14px;font-size:15px;font-weight:700;border:2px solid;font-family:inherit;transition:all .2s}
.vstart-btn.idle{background:linear-gradient(135deg,#2d0a0a,#1c0505);border-color:rgba(239,68,68,.5);color:#f87171}
.vstart-btn.idle:hover{border-color:#ef4444;background:#3d0000;box-shadow:0 0 20px rgba(239,68,68,.25)}
.vstart-btn.live{background:linear-gradient(135deg,#dc2626,#b91c1c);border-color:#ef4444;color:#fff;box-shadow:0 0 20px rgba(220,38,38,.4)}
.vstart-btn.live:hover{background:linear-gradient(135deg,#b91c1c,#991b1b)}
.speed-info{display:flex;align-items:center;justify-content:center;gap:5px;font-size:11px;color:#b45309;opacity:.8}
.comic-canvas-wrap{padding:0 0 4px;display:flex;flex-direction:column;gap:8px}
.comic-canvas{width:100%;display:block;border-radius:10px;border:1px solid rgba(245,158,11,.2)}
.comic-dl-btn{width:100%;padding:11px;border-radius:11px;background:linear-gradient(135deg,#064e3b,#065f46);border:2px solid #10b981;color:#6ee7b7;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s}
.comic-dl-btn:hover{background:linear-gradient(135deg,#065f46,#047857);box-shadow:0 0 14px rgba(16,185,129,.35)}
.comic-no-bubble{text-align:center;padding:12px;font-size:12px;color:#7f3d3d}
.doc-body{flex:1;display:flex;flex-direction:column;overflow:hidden}
.doc-mode-bar{display:flex;gap:6px;padding:10px 12px;background:linear-gradient(180deg,#1c0505,#130000);border-bottom:1px solid rgba(245,158,11,.15)}
.doc-mode-btn{flex:1;padding:8px 4px;border-radius:10px;border:1px solid rgba(245,158,11,.3);background:none;color:#7f3d3d;font-size:11px;font-weight:700;font-family:inherit;cursor:pointer;transition:all .2s;display:flex;flex-direction:column;align-items:center;gap:3px}
.doc-mode-btn.active{background:linear-gradient(135deg,#2d1a00,#1c0f00);border-color:#f59e0b;color:#fbbf24;box-shadow:0 0 10px rgba(245,158,11,.2)}
.doc-mode-btn:hover:not(.active){border-color:rgba(245,158,11,.5);color:#fca5a5;background:rgba(245,158,11,.04)}
.doc-lang-bar{padding:8px 12px;background:#130000;border-bottom:1px solid rgba(245,158,11,.12);display:flex;align-items:center;gap:8px}
.doc-lang-lbl{font-size:11px;color:#b45309;font-weight:700;white-space:nowrap}
.doc-upload-zone{flex:1;margin:14px 12px;border:2px dashed rgba(245,158,11,.3);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;transition:all .25s;padding:32px 16px;text-align:center;min-height:200px}
.doc-upload-zone:hover{border-color:rgba(245,158,11,.7);background:rgba(245,158,11,.04);box-shadow:0 0 20px rgba(245,158,11,.08)}
.doc-upload-icon{font-size:42px;line-height:1}
.doc-upload-title{font-size:15px;font-weight:700;color:#fbbf24}
.doc-upload-hint{font-size:12px;color:#b45309;line-height:1.5}
.doc-upload-sub{font-size:11px;color:#5a2020;display:flex;align-items:center;gap:4px}
.doc-results{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:10px}
.doc-results::-webkit-scrollbar{width:3px}
.doc-results::-webkit-scrollbar-thumb{background:#7f1d1d;border-radius:2px}
.doc-results-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:2px}
.doc-results-hdr span{font-size:12px;font-weight:700;color:#fbbf24}
.doc-clear-btn{background:none;border:1px solid rgba(239,68,68,.3);border-radius:8px;color:#f87171;font-size:11px;padding:3px 8px;cursor:pointer;font-family:inherit;transition:all .2s}
.doc-clear-btn:hover{background:rgba(239,68,68,.12);border-color:#ef4444}
.doc-page{background:linear-gradient(135deg,#1c0505,#130000);border:1px solid rgba(245,158,11,.18);border-radius:14px;overflow:hidden;transition:border-color .3s}
.doc-page.done{border-color:rgba(245,158,11,.35)}
.doc-page.error{border-color:rgba(239,68,68,.35)}
.doc-page-hdr{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.05)}
.doc-thumb{width:52px;height:52px;object-fit:cover;border-radius:8px;border:1px solid rgba(245,158,11,.2);flex-shrink:0}
.doc-page-info{flex:1;min-width:0}
.doc-page-num{font-size:12px;font-weight:700;color:#fbbf24;margin-bottom:4px}
.doc-page-status{font-size:11px;font-weight:600}
.doc-page-status.pending,.doc-page-status.ocr,.doc-page-status.translating{color:#f59e0b;animation:pulse 1.5s infinite}
.doc-page-status.done{color:#4ade80}
.doc-page-status.error{color:#f87171}
.doc-page-content{padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.doc-text-block{border-radius:10px;padding:10px 12px}
.doc-text-block.orig{background:#0a0000;border-left:3px solid #7f3d3d}
.doc-text-block.trans{background:rgba(45,26,0,.5);border-left:3px solid #f59e0b}
.doc-text-lbl{font-size:10px;font-weight:700;letter-spacing:.8px;margin-bottom:5px}
.doc-text-block.orig .doc-text-lbl{color:#7f3d3d}
.doc-text-block.trans .doc-text-lbl{color:#f59e0b}
.doc-text-body{font-size:12px;line-height:1.7;white-space:pre-wrap}
.doc-text-block.orig .doc-text-body{color:#d4c4a0}
.doc-text-block.trans .doc-text-body{color:#fde68a;font-weight:500}
.doc-add-btn{width:100%;padding:11px;border-radius:11px;border:1px dashed rgba(245,158,11,.35);background:none;color:#b45309;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;margin-top:2px}
.doc-add-btn:hover{border-color:#f59e0b;color:#fbbf24;background:rgba(245,158,11,.05)}
.doc-progress{padding:0 12px 6px;display:flex;align-items:center;gap:8px}
.doc-progress-bar-wrap{flex:1;height:4px;background:#1c0505;border-radius:2px;overflow:hidden}
.doc-progress-bar-fill{height:4px;background:linear-gradient(90deg,#ef4444,#f59e0b);border-radius:2px;transition:width .4s}
.doc-progress-txt{font-size:10px;color:#f59e0b;white-space:nowrap;font-weight:600}
`;

function leven(a,b){const m=a.length,n=b.length,dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);return dp[m][n];}
function simScore(t,h){const a=t.toLowerCase().replace(/[^\w\s\u3000-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0600-\u06FF]/g,"").trim(),b=h.toLowerCase().replace(/[^\w\s\u3000-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0600-\u06FF]/g,"").trim();if(!a||!b)return 0;return Math.max(0,Math.round((1-leven(a,b)/Math.max(a.length,b.length))*100));}

// ── LearnPanel ──
function LearnPanel({ text, langName, speechCode, flag }) {
  const [speed, setSpeed] = useState(0.8);
  const [playing, setPlaying] = useState(false);
  const [phonetic, setPhonetic] = useState("");
  const [phLoad, setPhLoad] = useState(false);
  const [pracRec, setPracRec] = useState(false);
  const [score, setScore] = useState(null);
  const [heard, setHeard] = useState("");
  const pracRef = useRef(null);

  useEffect(() => { loadPhonetic(); }, []);
  
  const loadPhonetic = async () => {
    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === "ISI_DENGAN_API_KEY_ANDA") {
        setPhonetic("Harap masukkan API Key yang valid di bagian atas kode.");
        return;
    }
    setPhLoad(true);
    setPhonetic(""); 
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { 
          method:"POST", 
          headers:{
              "Content-Type":"application/json",
              "x-api-key": ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({ 
              model:"claude-3-haiku-20240307", // Using a stable model name
              max_tokens:300,
              stream: true,
              messages:[{ role:"user", content:`Panduan pengucapan singkat untuk ${langName}: "${text}"\n1. IPA:[...]\n2. Baca:[bunyi Indonesia]\n3. Tips:[1 tips]\nSingkat saja.` }]
          })
      });
      if(!res.ok||!res.body) throw new Error("Stream error " + res.status);
      
      const reader=res.body.getReader(); 
      const dec=new TextDecoder(); 
      let buf="";
      
      while(true){
        const {done,value}=await reader.read(); 
        if(done) break;
        buf+=dec.decode(value,{stream:true});
        const lines=buf.split("\n"); 
        buf=lines.pop()||"";
        for(const line of lines){
          if(!line.startsWith("data:")) continue;
          const data=line.slice(5).trim(); 
          if(data==="[DONE]") break;
          try{
            const j=JSON.parse(data);
            if(j.type==="content_block_delta"&&j.delta?.type==="text_delta"){
              setPhonetic(p=>p+(j.delta.text||""));
            }
          }catch{}
        }
      }
    } catch (e) { 
        console.error(e);
        setPhonetic("Gagal memuat panduan. Periksa API Key & koneksi."); 
    }
    finally { setPhLoad(false); }
  };
  
  const playAudio = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang=speechCode; u.rate=speed;
    u.onstart=()=>setPlaying(true); u.onend=()=>setPlaying(false); u.onerror=()=>setPlaying(false);
    window.speechSynthesis.speak(u);
  };
  
  const startPrac = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Gunakan Chrome/Edge."); return; }
    const r = new SR(); pracRef.current=r; r.lang=speechCode; r.interimResults=false;
    setPracRec(true); setScore(null);
    r.onresult=e=>{const h=e.results[0][0].transcript;setHeard(h);setScore(simScore(text,h));setPracRec(false);};
    r.onend=()=>setPracRec(false); r.onerror=()=>setPracRec(false); r.start();
  };
  
  const sc=s=>s>=80?"#4ade80":s>=50?"#facc15":"#f87171";
  const fb=s=>s>=80?{l:"Sempurna! 🎉",c:"g"}:s>=50?{l:"Hampir! Coba lagi 👍",c:"y"}:{l:"Terus berlatih! 💪",c:"r"};
  
  return (
    <div className="lpanel">
      <div className="lp-title">📖 Pelajari Pengucapan {flag}</div>
      <div className="speed-row">
        <span>Kecepatan:</span>
        <input type="range" min="0.3" max="1.2" step="0.1" value={speed} onChange={e=>setSpeed(parseFloat(e.target.value))} style={{flex:1,accentColor:"#22d3ee"}}/>
        <span style={{color:"#fca5a5",minWidth:52}}>{speed<=0.5?"🐢 Pelan":speed>=1.1?"⚡ Cepat":"▶ Normal"}</span>
      </div>
      <button className={`play-btn ${playing?"going":""}`} onClick={playAudio}><Volume2 size={15}/>{playing?"Sedang diputar...":"Dengarkan Pengucapan"}</button>
      <div className="phonetic-box">
        <div className="ph-lbl">PANDUAN PENGUCAPAN AI</div>
        {phLoad?<div className="ph-load">Menganalisis...</div>:<div className="ph-text">{phonetic}</div>}
      </div>
      <button className={`prac-btn ${pracRec?"going":""}`} onClick={pracRec?()=>{pracRef.current?.stop();setPracRec(false);}:startPrac}>
        {pracRec?<><MicOff size={16}/>Berhenti Merekam...</>:<><Mic size={16}/>Coba Ucapkan Sekarang</>}
      </button>
      {score!==null&&(
        <div className="score-box">
          <div className="score-row"><span className="score-lbl">Skor Kemiripan</span><span className="score-num" style={{color:sc(score)}}>{score}%</span></div>
          <div className="score-bar"><div className="score-fill" style={{width:`${score}%`,background:sc(score)}}/></div>
          <span className={`fb ${fb(score).c}`}>{fb(score).l}</span>
          {heard&&<div className="heard">Yang terdengar: <span>"{heard}"</span></div>}
          <button className="spkbtn" style={{marginTop:8}} onClick={playAudio}><Volume2 size={12}/>Dengarkan lagi</button>
        </div>
      )}
    </div>
  );
}

// ── ComicCanvas – renders translated bubbles on canvas + download ──
function wrapCanvasText(ctx, text, cx, cy, maxW, lineH) {
  const hasSpc = /\s/.test(text);
  const tokens = hasSpc ? text.split(/\s+/) : Array.from(text);
  const sep = hasSpc ? " " : "";
  const lines = []; let line = "";
  for (const t of tokens) {
    const test = line + (line ? sep : "") + t;
    if (ctx.measureText(test).width > maxW - 8 && line) { lines.push(line); line = t; }
    else line = test;
  }
  if (line) lines.push(line);
  const totalH = lines.length * lineH;
  const startY = cy - totalH / 2 + lineH * 0.72;
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineH));
}

function ComicCanvas({ imgSrc, bubbles, pageNum }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !imgSrc) return;
    setReady(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      (bubbles || []).forEach(b => {
        const x = (b.x / 100) * img.naturalWidth;
        const y = (b.y / 100) * img.naturalHeight;
        const w = (b.w / 100) * img.naturalWidth;
        const h = (b.h / 100) * img.naturalHeight;
        if (w < 4 || h < 4) return;

        ctx.fillStyle = "rgba(255,255,255,0.96)";
        ctx.fillRect(x, y, w, h);

        const txt = b.translated || b.text || "";
        if (!txt) return;
        const fontSize = Math.max(9, Math.min(w / Math.max(txt.length * 0.55, 3), h * 0.3, 20));
        ctx.font = `700 ${fontSize}px 'Noto Sans',Arial,sans-serif`;
        ctx.fillStyle = "#0a0000";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        wrapCanvasText(ctx, txt, x + w / 2, y + h / 2, w, fontSize * 1.35);
      });
      setReady(true);
    };
    img.src = imgSrc;
  }, [imgSrc, bubbles]);

  const download = () => {
    const a = document.createElement("a");
    a.download = `komik-terjemahan-hal${pageNum}.png`;
    a.href = canvasRef.current.toDataURL("image/png");
    a.click();
  };

  return (
    <div className="comic-canvas-wrap">
      <canvas ref={canvasRef} className="comic-canvas"/>
      {ready && (
        <button className="comic-dl-btn" onClick={download}>
          ⬇ Download Halaman {pageNum}
        </button>
      )}
    </div>
  );
}

// ── DocumentTab – Turbo komik / buku / surat translator ──
function DocumentTab() {
  const [mode, setMode] = useState("komik");
  const [tgtLang, setTgtLang] = useState(LANGS[0]);
  const [pages, setPages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef(null);
  const resultsEnd = useRef(null);

  const COMIC_PROMPT = `Analyze this comic page carefully. Detect ALL text areas: speech bubbles, thought bubbles, caption boxes, narration boxes, sound effects.
For each text area return its bounding box as percentage of total image dimensions and the text inside.
Return ONLY valid JSON (no markdown, no extra text):
{"bubbles":[{"x":5,"y":3,"w":28,"h":12,"text":"Hello there"},{"x":55,"y":15,"w":30,"h":10,"text":"Hi!"}]}
x,y = top-left corner as % of image width/height. w,h = width/height %. If no text found return: {"bubbles":[]}`;

  const MODES = {
    komik: { icon: "🎭", label: "Komik", hint: "Upload halaman komik (bisa banyak sekaligus)", multi: true },
    buku: { icon: "📚", label: "Buku", hint: "Upload foto halaman buku atau dokumen panjang", multi: true, prompt: "Extract ALL visible text from this book page in reading order. Include paragraphs, headings, footnotes. Reply ONLY the raw text, nothing else. If no text, reply: NONE" },
    surat: { icon: "📄", label: "Surat/Dokumen", hint: "Upload foto surat, kontrak, atau dokumen tunggal", multi: false, prompt: "Extract ALL visible text from this document/letter, preserving structure and formatting as much as possible. Reply ONLY the raw text, nothing else. If no text, reply: NONE" },
  };

  useEffect(() => { resultsEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [pages]);

  const processPage = async (id, b64, mimeType, tgt, isComic) => {
    const updatePage = (patch) => setPages(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    updatePage({ status: "ocr" });

    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === "ISI_DENGAN_API_KEY_ANDA") {
        updatePage({ status: "error", orig: "API Key tidak valid.", trans: "" });
        return;
    }

    try {
      if (isComic) {
        const ocrRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", headers: { 
              "Content-Type": "application/json",
              "x-api-key": ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-sonnet-20240229", // Good balance for vision
            max_tokens: 1500,
            messages: [{ role: "user", content: [
              { type: "image", source: { type: "base64", media_type: mimeType, data: b64 } },
              { type: "text", text: COMIC_PROMPT }
            ]}]
          })
        });
        
        if (!ocrRes.ok) {
            const errData = await ocrRes.json();
            throw new Error(errData.error?.message || "API Request Failed");
        }
        
        const ocrData = await ocrRes.json();
        let rawJson = (ocrData.content?.[0]?.text || "").trim().replace(/```json\s*|```/g, "").trim();
        let parsed;
        try { parsed = JSON.parse(rawJson); } catch {
          updatePage({ bubbles: [], orig: "Gagal parse JSON", trans: "", status: "error" }); return;
        }
        const bubbles = (parsed.bubbles || []).filter(b => b.text?.trim());
        if (!bubbles.length) {
          updatePage({ bubbles: [], status: "done" }); return;
        }
        updatePage({ status: "translating", bubbles: bubbles.map(b => ({ ...b, translated: "" })) });
        
        const translations = await Promise.all(
          bubbles.map(b => fastTranslate(b.text, "auto", tgt.code).catch(() => b.text))
        );
        const finalBubbles = bubbles.map((b, i) => ({ ...b, translated: translations[i] || b.text }));
        updatePage({ bubbles: finalBubbles, status: "done" });
      } else {
        const prompt = MODES[mode]?.prompt || "";
        const ocrRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", headers: { 
              "Content-Type": "application/json",
              "x-api-key": ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-sonnet-20240229",
            max_tokens: 800,
            messages: [{ role: "user", content: [
              { type: "image", source: { type: "base64", media_type: mimeType, data: b64 } },
              { type: "text", text: prompt }
            ]}]
          })
        });
        
        if (!ocrRes.ok) throw new Error("API Error");
        
        const ocrData = await ocrRes.json();
        const rawText = (ocrData.content?.[0]?.text || "").trim();
        if (!rawText || rawText === "NONE") {
          updatePage({ orig: "Tidak ada teks", trans: "No text found", status: "done" }); return;
        }
        updatePage({ orig: rawText, status: "translating" });
        const translated = await fastTranslate(rawText, "auto", tgt.code);
        updatePage({ orig: rawText, trans: translated || rawText, status: "done" });
      }
    } catch (e) {
      console.error(e);
      updatePage({ orig: "—", trans: "Gagal memproses: " + e.message, status: "error" });
    }
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setProcessing(true);
    const isComic = mode === "komik";
    const raw = await Promise.all(files.map((file, i) => new Promise(res => {
      const reader = new FileReader();
      reader.onload = ev => res({ id: i, img: ev.target.result, b64: ev.target.result.split(",")[1], mimeType: file.type });
      reader.readAsDataURL(file);
    })));
    setPages(raw.map(p => ({ ...p, orig: "", trans: "", bubbles: null, status: "pending" })));
    await Promise.all(raw.map(p => processPage(p.id, p.b64, p.mimeType, tgtLang, isComic)));
    setProcessing(false);
    e.target.value = "";
  };

  const handleAddMore = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const isComic = mode === "komik";
    const startId = pages.length;
    const raw = await Promise.all(files.map((file, i) => new Promise(res => {
      const reader = new FileReader();
      reader.onload = ev => res({ id: startId + i, img: ev.target.result, b64: ev.target.result.split(",")[1], mimeType: file.type });
      reader.readAsDataURL(file);
    })));
    setPages(prev => [...prev, ...raw.map(p => ({ ...p, orig: "", trans: "", bubbles: null, status: "pending" }))]);
    await Promise.all(raw.map(p => processPage(p.id, p.b64, p.mimeType, tgtLang, isComic)));
    e.target.value = "";
  };

  const doneCount = pages.filter(p => p.status === "done").length;
  const m = MODES[mode];

  return (
    <div className="doc-body">
      <div className="doc-mode-bar">
        {Object.entries(MODES).map(([key, md]) => (
          <button key={key} className={`doc-mode-btn ${mode === key ? "active" : ""}`}
            onClick={() => { if (mode !== key) { setMode(key); setPages([]); } }}>
            <span style={{fontSize:18}}>{md.icon}</span>{md.label}
          </button>
        ))}
      </div>

      <div className="doc-lang-bar">
        <span className="doc-lang-lbl">Terjemahkan ke:</span>
        <select value={tgtLang.code} onChange={e => setTgtLang(LANGS.find(l => l.code === e.target.value))} style={{flex:1}}>
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
        </select>
      </div>

      {processing && pages.length > 0 && (
        <div className="doc-progress">
          <div className="doc-progress-bar-wrap">
            <div className="doc-progress-bar-fill" style={{width:`${Math.round(doneCount/pages.length*100)}%`}}/>
          </div>
          <span className="doc-progress-txt">⚡ {doneCount}/{pages.length} halaman</span>
        </div>
      )}

      {!pages.length && (
        <div className="doc-upload-zone" onClick={() => fileRef.current?.click()}>
          <div className="doc-upload-icon">{m.icon}</div>
          <div className="doc-upload-title">Upload {m.label}</div>
          <div className="doc-upload-hint">{m.hint}</div>
          <div className="doc-upload-sub"><Zap size={11}/> Semua halaman diproses paralel — TURBO</div>
        </div>
      )}

      {pages.length > 0 && (
        <div className="doc-results">
          <div className="doc-results-hdr">
            <span>{m.icon} {m.label} — {pages.length} halaman {processing ? "⚡" : "✅"}</span>
            <button className="doc-clear-btn" onClick={() => setPages([])}><Trash2 size={11}/> Reset</button>
          </div>
          {pages.map((p, i) => (
            <div key={p.id} className={`doc-page ${p.status}`}>
              <div className="doc-page-hdr">
                <img src={p.img} className="doc-thumb" alt={`hal${i+1}`}/>
                <div className="doc-page-info">
                  <div className="doc-page-num">{mode === "surat" ? "📄 Dokumen" : `Halaman ${i + 1}`}</div>
                  <div className={`doc-page-status ${p.status}`}>
                    {p.status === "pending" && "⏳ Antri..."}
                    {p.status === "ocr" && "🔍 Membaca teks (AI)..."}
                    {p.status === "translating" && "⚡ Menerjemahkan..."}
                    {p.status === "done" && "✅ Selesai"}
                    {p.status === "error" && "❌ Gagal"}
                  </div>
                </div>
              </div>
              {/* COMIC MODE */}
              {mode === "komik" && p.status === "done" && (
                p.bubbles && p.bubbles.length > 0
                  ? <ComicCanvas imgSrc={p.img} bubbles={p.bubbles} pageNum={i + 1}/>
                  : <div className="comic-no-bubble">Tidak ada teks terdeteksi di halaman ini</div>
              )}

              {/* BOOK / LETTER MODE */}
              {mode !== "komik" && (p.orig || p.status === "done") && (
                <div className="doc-page-content">
                  <div className="doc-text-block orig">
                    <div className="doc-text-lbl">📝 TEKS ASLI</div>
                    <div className="doc-text-body">{p.orig || "—"}</div>
                  </div>
                  {p.trans && (
                    <div className="doc-text-block trans">
                      <div className="doc-text-lbl">{tgtLang.flag} TERJEMAHAN ({tgtLang.name.toUpperCase()})</div>
                      <div className="doc-text-body">{p.trans}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={resultsEnd}/>
          {!processing && m.multi && (
            <button className="doc-add-btn" onClick={() => {
              const inp = document.createElement("input");
              inp.type = "file"; inp.accept = "image/*"; inp.multiple = true;
              inp.onchange = handleAddMore; inp.click();
            }}>+ Tambah Halaman</button>
          )}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" multiple={m.multi} style={{display:"none"}} onChange={handleFiles}/>
    </div>
  );
}

// ── VideoTab – ultra-fast interim translation ──
function VideoTab() {
  const [srcLang, setSrcLang] = useState(LANGS[1]); // English
  const [tgtLang, setTgtLang] = useState(LANGS[0]); // Indonesia
  const [isLive, setIsLive]   = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [latency, setLatency]   = useState(null);
  const [camErr, setCamErr]     = useState("");

  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const srRef       = useRef(null);
  const isLiveRef   = useRef(false);
  const debounceRef = useRef(null);
  const abortRef    = useRef(null);
  const lastInterim = useRef("");
  const clearTimer  = useRef(null);

  useEffect(() => () => stopAll(), []);

  const translateInterim = useCallback(async (text, src, tgt) => {
    if (!text.trim()) return;
    clearTimeout(debounceRef.current);
    if (abortRef.current) { try { abortRef.current.abort(); } catch {} }
    debounceRef.current = setTimeout(async () => {
      if (text !== lastInterim.current) return;
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const t0 = Date.now();
      try {
        const tr = await fastTranslate(text, src, tgt, ctrl.signal);
        if (tr && text === lastInterim.current) {
          setSubtitle(tr);
          setLatency(Date.now() - t0);
        }
      } catch {}
    }, 80);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamErr(""); return true;
    } catch { setCamErr("Kamera tidak bisa dibuka — terjemahan audio tetap jalan."); return false; }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startSpeech = (src, tgt) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setCamErr("Butuh Chrome atau Edge."); return; }
    const r = new SR();
    srRef.current = r;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.lang = src.speech;

    r.onresult = async (e) => {
      let iText = "", fText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fText += e.results[i][0].transcript + " ";
        else iText += e.results[i][0].transcript;
      }
      if (iText) {
        lastInterim.current = iText;
        translateInterim(iText, src.code, tgt.code);
      }
      if (fText.trim()) {
        const orig = fText.trim();
        lastInterim.current = "";
        clearTimeout(debounceRef.current);
        const t0 = Date.now();
        try {
          const trans = await fastTranslate(orig, src.code, tgt.code);
          setSubtitle(trans);
          setLatency(Date.now() - t0);
          clearTimeout(clearTimer.current);
          clearTimer.current = setTimeout(() => setSubtitle(""), 5000);
        } catch { setSubtitle("⚠ Gagal terjemah"); }
      }
    };

    r.onerror = ev => {
      if (ev.error === "not-allowed") setCamErr("Izin mikrofon ditolak di browser.");
      else if (ev.error === "network") setCamErr("Tidak ada koneksi internet.");
    };
    r.onend = () => { if (isLiveRef.current) { try { r.start(); } catch {} } };
    try { r.start(); } catch (e) { setCamErr("Gagal start mikrofon: " + e.message); }
  };

  const stopSpeech = () => {
    isLiveRef.current = false;
    clearTimeout(debounceRef.current);
    clearTimeout(clearTimer.current);
    if (abortRef.current) { try { abortRef.current.abort(); } catch {} abortRef.current = null; }
    try { srRef.current?.stop(); } catch {}
    srRef.current = null;
  };

  const stopAll = () => { stopCamera(); stopSpeech(); };

  const toggle = async () => {
    if (isLive) {
      setIsLive(false); isLiveRef.current = false;
      stopAll();
      setSubtitle(""); setLatency(null);
    } else {
      isLiveRef.current = true; setIsLive(true);
      await startCamera();
      startSpeech(srcLang, tgtLang);
    }
  };

  return (
    <div className="vfull">
      {isLive
        ? <video ref={videoRef} muted playsInline autoPlay className="vfull-video"/>
        : <div className="vfull-placeholder">
            <Video size={52} style={{opacity:.12}}/>
            <p style={{fontWeight:700,fontSize:17,color:"#fca5a5"}}>Tekan Mulai</p>
            <p style={{fontSize:12,opacity:.4,lineHeight:1.6}}>Video fullscreen · subtitle langsung muncul saat ngomong</p>
          </div>
      }

      {isLive && (
        <div className="vfull-top">
          <div className="src-badge"><Zap size={9}/>{srcLang.flag} {srcLang.name} → {tgtLang.flag} {tgtLang.name}</div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {latency && <div className="latency-badge">⚡{latency}ms</div>}
            <div className="rec-badge"><span className="rdot-anim"/>LIVE</div>
          </div>
        </div>
      )}

      {isLive && subtitle && (
        <div className="vfull-sub">
          <span className="vfull-sub-text">{subtitle}</span>
        </div>
      )}

      <div className="vfull-bottom">
        {camErr && <div className="err" style={{margin:"0 0 6px"}}><span>{camErr}</span><X size={12} onClick={()=>setCamErr("")} style={{flexShrink:0}}/></div>}

        {!isLive && (
          <div className="vlang-row-h">
            <select value={srcLang.code} onChange={e=>setSrcLang(LANGS.find(l=>l.code===e.target.value))}>
              {LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
            </select>
            <span style={{color:"#b45309",fontSize:16,fontWeight:700}}>→</span>
            <select value={tgtLang.code} onChange={e=>setTgtLang(LANGS.find(l=>l.code===e.target.value))}>
              {LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
            </select>
          </div>
        )}

        <button className={`vstart-btn ${isLive?"live":"idle"}`} onClick={toggle}>
          {isLive ? <><VideoOff size={18}/>⏹ Hentikan</> : <><Video size={18}/>▶ Mulai Terjemahan Video</>}
        </button>
        {!isLive && <div className="speed-info"><Zap size={11}/>Subtitle langsung muncul saat ngomong · real-time</div>}
      </div>
    </div>
  );
}

// ── Main App ──
export default function App() {
  const [tab, setTab]               = useState("talk");
  const [langA, setLangA]           = useState(LANGS[0]);
  const [langB, setLangB]           = useState(LANGS[1]);
  const [messages, setMessages]     = useState([]);
  const [listening, setListening]   = useState(null);
  const [translating, setTranslating] = useState(false);
  const [isOnline, setIsOnline]     = useState(navigator.onLine);
  const [showPhoto, setShowPhoto]   = useState(false);
  const [photoImg, setPhotoImg]     = useState(null);
  const [photoTgt, setPhotoTgt]     = useState(LANGS[1]);
  const [photoResult, setPhotoResult] = useState(null);
  const [photoProc, setPhotoProc]   = useState(false);
  const [error, setError]           = useState("");
  const [openLearn, setOpenLearn]   = useState(null);
  const recRef  = useRef(null);
  const fileRef = useRef(null);
  const feedEnd = useRef(null);

  const claudeOCR = useCallback(async (dataUrl, onProgress, mimeType = "image/jpeg") => {
    onProgress?.("🤖 Membaca semua teks dengan Claude AI...");
    const b64 = dataUrl.split(",")[1];
    
    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === "ISI_DENGAN_API_KEY_ANDA") {
        throw new Error("API Key tidak valid.");
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { 
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: b64 } },
            { type: "text", text: `Read and extract EVERY SINGLE word of text visible in this image, regardless of text color, background color, font size, or style. Include white text, colored text, small text, overlapping text — all of it. Preserve line breaks and reading order. Reply ONLY with the raw extracted text. If there is truly no text at all, reply: NONE` }
          ]
        }]
      })
    });
    if (!res.ok) throw new Error("Claude API " + res.status);
    const data = await res.json();
    const text = (data.content?.[0]?.text || "").trim();
    if (!text || text === "NONE") throw new Error("Tidak ada teks terdeteksi");
    return text;
  }, []);

  useEffect(()=>{ const on=()=>setIsOnline(true),off=()=>setIsOnline(false); window.addEventListener("online",on); window.addEventListener("offline",off); return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);}; },[]);
  
  useEffect(()=>{
    warmTranslateCache([
      ["Halo","id","en"],["Hello","en","id"],
      ["Terima kasih","id","en"],["Thank you","en","id"],
    ]);
  },[]);
  
  useEffect(()=>{ feedEnd.current?.scrollIntoView({behavior:"smooth"}); },[messages,translating,openLearn]);

  const showErr=m=>{setError(m);setTimeout(()=>setError(""),4000);};
  const speak=(text,sc,rate=1)=>{ if(!window.speechSynthesis)return; window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang=sc; u.rate=rate; window.speechSynthesis.speak(u); };

  const listenAbortRef=useRef(null);
  const startListen=side=>{
    if(!isOnline){showErr("Perlu internet.");return;} const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){showErr("Gunakan Chrome/Edge.");return;} if(listening){recRef.current?.stop();return;}
    const src=side==="A"?langA:langB,tgt=side==="A"?langB:langA; const r=new SR(); recRef.current=r; r.lang=src.speech; r.interimResults=false; setListening(side);
    r.onresult=async e=>{
      const orig=e.results[0][0].transcript; setListening(null); setTranslating(true);
      if(listenAbortRef.current){try{listenAbortRef.current.abort();}catch{}}
      const ctrl=new AbortController(); listenAbortRef.current=ctrl;
      try{
        const trans=await fastTranslate(orig,src.code,tgt.code,ctrl.signal);
        if(trans) setMessages(p=>[...p,{id:Date.now(),side,orig,trans,src,tgt}]);
        if(trans) speak(trans,tgt.speech);
      }
      catch(err){ if(err?.name!=="AbortError") showErr("Terjemahan gagal."); }
      finally{ setTranslating(false); }
    };
    r.onend=()=>setListening(null); r.onerror=ev=>{setListening(null);showErr(ev.error==="not-allowed"?"Izin mikrofon ditolak.":"Gagal tangkap suara.");};
    r.start();
  };

  const handlePhoto = e => {
    const file = e.target.files[0]; if (!file) return;
    const mimeType = file.type || "image/jpeg";
    const reader = new FileReader();
    reader.onload = async ev => {
      const url = ev.target.result;
      setPhotoImg(url); setPhotoProc(true); setPhotoResult(null);
      try {
        setPhotoResult({ original: "🤖 Claude sedang membaca gambar...", translated: "" });
        const onProgress = msg => setPhotoResult(p => ({ ...p, original: msg }));
        const rawText = await claudeOCR(url, onProgress, mimeType);
        if (!rawText || rawText.length < 2) {
          setPhotoResult({ original: "Tidak ada teks terdeteksi.", translated: "No text found." }); return;
        }
        setPhotoResult({ original: rawText, translated: "⏳ Menerjemahkan..." });
        const translated = await fastTranslate(rawText, "auto", photoTgt.code);
        setPhotoResult({ original: rawText, translated: translated || rawText });
      } catch (err) {
        setPhotoResult({ original: "⚠ " + (err?.message || String(err)), translated: "Gagal. Coba lagi." });
      } finally { setPhotoProc(false); }
    };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const toggleLearn=id=>setOpenLearn(p=>p===id?null:id);
  const swapLangs=()=>{const t=langA;setLangA(langB);setLangB(t);};

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="logo">
            <div className="logo-icon">TL</div>
            <span className="logo-name">translaf one</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {tab==="talk"&&messages.length>0&&<button className="clrbtn" onClick={()=>{setMessages([]);setOpenLearn(null);}}><Trash2 size={15}/></button>}
            <div className={`badge ${isOnline?"on":"off"}`}>{isOnline?<><span className="dot"/>Online</>:<><WifiOff size={10}/>Offline</>}</div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab==="talk"?"active":""}`} onClick={()=>setTab("talk")}><MessageCircle size={14}/>Percakapan</button>
          <button className={`tab ${tab==="video"?"active":""}`} onClick={()=>setTab("video")}><Video size={14}/>Video</button>
          <button className={`tab ${tab==="doc"?"active":""}`} onClick={()=>setTab("doc")}><BookOpen size={14}/>Dokumen</button>
        </div>

        {tab==="talk"&&<>
          <div className="bar-a"><select value={langA.code} onChange={e=>setLangA(LANGS.find(l=>l.code===e.target.value))}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}</select><span className="bar-lbl">← Orang lain</span></div>
          <div className="feed">
            {!messages.length&&!translating&&<div className="empty"><Volume2 size={28} style={{opacity:.3}}/><p>Tekan mikrofon untuk mulai bicara</p><p style={{fontSize:11,opacity:.6}}>Tap <strong style={{color:"#fca5a5"}}>Pelajari Ucapan</strong> setelah terjemahan muncul</p></div>}
            {messages.map(m=>(
              <div key={m.id} className={`bwrap ${m.side}`}>
                <div className={`bubble ${m.side}`}><div className="b-orig">{m.src.flag} {m.orig}</div><div className="bdiv"/><div className="b-trans">{m.tgt.flag} {m.trans}</div></div>
                <button className={`learn-btn ${m.side} ${openLearn===m.id?"open":""}`} onClick={()=>toggleLearn(m.id)}><GraduationCap size={12}/>Pelajari Ucapan {m.tgt.flag}{openLearn===m.id?<ChevronUp size={11}/>:<ChevronDown size={11}/>}</button>
                {openLearn===m.id&&<LearnPanel text={m.trans} langName={m.tgt.name} speechCode={m.tgt.speech} flag={m.tgt.flag}/>}
              </div>
            ))}
            {translating&&<div className="tpill"><div>Menerjemahkan...</div></div>}
            <div ref={feedEnd}/>
          </div>
          {error&&<div className="err"><span>{error}</span><X size={13} style={{cursor:"pointer",flexShrink:0}} onClick={()=>setError("")}/></div>}
          <div className="bar-b"><select value={langB.code} onChange={e=>setLangB(LANGS.find(l=>l.code===e.target.value))}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}</select><span className="bar-lbl">Kamu →</span></div>
          <div className="actions">
            <button className={`mic-btn A ${listening==="A"?"rec":""}`} onClick={()=>startListen("A")} disabled={translating||(listening&&listening!=="A")}>{listening==="A"?<MicOff size={22}/>:<Mic size={22}/>}<span className="mic-lbl">{listening==="A"?"Berhenti":langA.name}</span>{listening==="A"&&<span className="rdot"/>}</button>
            <div className="cbtns"><button className="ibtn" onClick={swapLangs}><ArrowLeftRight size={15}/></button><button className="ibtn" onClick={()=>{setShowPhoto(true);setPhotoImg(null);setPhotoResult(null);}}><Camera size={15}/></button></div>
            <button className={`mic-btn B ${listening==="B"?"rec":""}`} onClick={()=>startListen("B")} disabled={translating||(listening&&listening!=="B")}>{listening==="B"?<MicOff size={22}/>:<Mic size={22}/>}<span className="mic-lbl">{listening==="B"?"Stop":langB.name}</span>{listening==="B"&&<span className="rdot"/>}</button>
          </div>
        </>}

        {tab==="video"&&<VideoTab/>}

        {tab==="doc"&&<DocumentTab/>}

        {showPhoto&&<div className="pov">
          <div className="pov-hdr"><h3>📷 Terjemah Foto</h3><button className="ibtn" onClick={()=>setShowPhoto(false)}><X size={16}/></button></div>
          <div className="lrow"><span>Terjemahkan ke:</span><select value={photoTgt.code} onChange={e=>setPhotoTgt(LANGS.find(l=>l.code===e.target.value))} style={{flex:1}}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}</select></div>
          {!photoImg?<div className="upz" onClick={()=>fileRef.current?.click()}><ImageIcon size={28}/><span style={{fontSize:14}}>Tap untuk pilih gambar</span></div>
          :<div><img src={photoImg} className="prev" alt="preview"/>
            {photoProc&&<div className="proc">Membaca teks dengan AI...</div>}
            {photoResult&&<div className="rbox"><div className="rlbl">Teks asli:</div><div className="rorig">{photoResult.original}</div><div className="rdivp"><div className="rlbl">Terjemahan ({photoTgt.flag} {photoTgt.name}):</div><div className="rtrans">{photoResult.translated}</div></div><button className="spkbtn" onClick={()=>speak(photoResult.translated,photoTgt.speech)}><Volume2 size={12}/>Putar audio</button></div>}
            <button className="rstbtn" onClick={()=>{setPhotoImg(null);setPhotoResult(null);}}><RotateCcw size={12}/>Pilih gambar lain</button>
          </div>}
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
        </div>}
      </div>
    </>
  );
}