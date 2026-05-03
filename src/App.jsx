import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, Camera, ArrowLeftRight, Volume2, WifiOff, X,
  ImageIcon, RotateCcw, Trash2, GraduationCap, ChevronDown,
  ChevronUp, Video, VideoOff, MessageCircle, Zap,
  BookOpen, FileText, Layers
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// KONFIGURASI BAHASA
// ══════════════════════════════════════════════════════════════
const LANGS = [
  { code: "id", name: "Indonesia", flag: "🇮🇩", speech: "id-ID", tess: "ind" },
  { code: "en", name: "English",   flag: "🇺🇸", speech: "en-US", tess: "eng" },
  { code: "ja", name: "日本語",     flag: "🇯🇵", speech: "ja-JP", tess: "jpn" },
  { code: "ko", name: "한국어",     flag: "🇰🇷", speech: "ko-KR", tess: "kor" },
  { code: "zh-CN", name: "中文简体",flag: "🇨🇳", speech: "zh-CN", tess: "chi_sim" },
  { code: "zh-TW", name: "中文繁體",flag: "🇹🇼", speech: "zh-TW", tess: "chi_tra" },
  { code: "es", name: "Español",   flag: "🇪🇸", speech: "es-ES", tess: "spa" },
  { code: "fr", name: "Français",  flag: "🇫🇷", speech: "fr-FR", tess: "fra" },
  { code: "de", name: "Deutsch",   flag: "🇩🇪", speech: "de-DE", tess: "deu" },
  { code: "ar", name: "العربية",   flag: "🇸🇦", speech: "ar-SA", tess: "ara" },
  { code: "pt", name: "Português", flag: "🇧🇷", speech: "pt-BR", tess: "por" },
  { code: "ru", name: "Русский",   flag: "🇷🇺", speech: "ru-RU", tess: "rus" },
  { code: "th", name: "ภาษาไทย",   flag: "🇹🇭", speech: "th-TH", tess: "tha" },
  { code: "vi", name: "Tiếng Việt",flag: "🇻🇳", speech: "vi-VN", tess: "vie" },
  { code: "hi", name: "हिन्दी",    flag: "🇮🇳", speech: "hi-IN", tess: "hin" },
  { code: "ms", name: "Melayu",    flag: "🇲🇾", speech: "ms-MY", tess: "msa" },
  { code: "tr", name: "Türkçe",    flag: "🇹🇷", speech: "tr-TR", tess: "tur" },
  { code: "it", name: "Italiano",  flag: "🇮🇹", speech: "it-IT", tess: "ita" },
  { code: "nl", name: "Nederlands",flag: "🇳🇱", speech: "nl-NL", tess: "nld" },
  { code: "pl", name: "Polski",    flag: "🇵🇱", speech: "pl-PL", tess: "pol" },
  { code: "sv", name: "Svenska",   flag: "🇸🇪", speech: "sv-SE", tess: "swe" },
  { code: "fil",name: "Filipino",  flag: "🇵🇭", speech: "fil-PH", tess: "fil" },
  { code: "uk", name: "Українська",flag: "🇺🇦", speech: "uk-UA", tess: "ukr" },
];

// ══════════════════════════════════════════════════════════════
//  TURBO TRANSLATION ENGINE
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
        const r2 = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${src}|${tgt}`, signal ? { signal } : undefined);
        const d2 = await r2.json();
        const result = d2.responseData?.translatedText || t;
        _cacheSet(key, result);
        return result;
      } catch { return ""; }
    } finally { _inflight.delete(key); }
  })();
  _inflight.set(key, promise);
  return promise;
}

// ══════════════════════════════════════════════════════════════
//  CSS STYLES
// ══════════════════════════════════════════════════════════════
const css = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0000}
.app{font-family:'Noto Sans',sans-serif;background:linear-gradient(160deg,#130000 0%,#0a0000 60%,#1a0a00 100%);color:#f5f0e8;min-height:100vh;display:flex;flex-direction:column;max-width:480px;margin:0 auto;position:relative}
select{background:#1c0505;color:#fde68a;border:1px solid #7f1d1d;border-radius:10px;padding:8px 10px;font-size:13px;outline:none;cursor:pointer;font-family:inherit}select:hover{border-color:#f59e0b}
button{cursor:pointer;font-family:inherit}
.header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(245,158,11,.25);background:linear-gradient(90deg,#1c0505 0%,#2d0a0a 50%,#1c0505 100%)}
.logo{display:flex;align-items:center;gap:10px}
.logo-icon{width:38px;height:38px;background:linear-gradient(135deg,#ef4444 0%,#b91c1c 100%);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;color:#fde68a}
.logo-name{font-weight:800;font-size:19px;background:linear-gradient(90deg,#fbbf24 0%,#f87171 50%,#fde68a 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.badge{display:flex;align-items:center;gap:5px;font-size:11px;padding:4px 10px;border-radius:20px;font-weight:600}
.badge.on{background:rgba(5,46,22,.8);color:#4ade80;border:1px solid #166534}.badge.off{background:rgba(127,29,29,.3);color:#fca5a5;border:1px solid #7f1d1d}
.dot{display:inline-block;width:7px;height:7px;background:#4ade80;border-radius:50%}
.tabs{display:flex;border-bottom:1px solid rgba(245,158,11,.2);background:#130000}
.tab{flex:1;padding:11px 4px;font-size:12px;font-weight:600;border:none;background:none;color:#7f3d3d;display:flex;align-items:center;justify-content:center;gap:5px;border-bottom:2px solid transparent}
.tab.active{color:#fbbf24;border-bottom-color:#f59e0b}
.bar-a{background:linear-gradient(90deg,#2d0a0a,#1c0505);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;transform:rotate(180deg) scaleX(-1)}
.bar-b{background:linear-gradient(90deg,#1c0505,#2d0a0a);padding:10px 16px;display:flex;align-items:center;justify-content:space-between}
.bar-lbl{font-size:11px;color:#b45309}.feed{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:12px;min-height:240px;max-height:340px}
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;color:#5a2020;font-size:13px;text-align:center;gap:10px}
.bwrap{display:flex;flex-direction:column;gap:4px}.bwrap.A{align-items:flex-end}.bwrap.B{align-items:flex-start}
.bubble{max-width:82%;border-radius:16px;padding:10px 14px}
.bubble.A{background:linear-gradient(135deg,#3d1010,#2d0a0a);border:1px solid rgba(220,38,38,.5);border-top-right-radius:4px}
.bubble.B{background:linear-gradient(135deg,#2d1a00,#1c0f00);border:1px solid rgba(180,83,9,.4);border-top-left-radius:4px}
.b-orig{font-size:14px;font-weight:600;line-height:1.5}.bubble.A .b-orig{color:#fca5a5}.bubble.B .b-orig{color:#fbbf24}
.bdiv{border-top:1px solid rgba(255,255,255,.07);margin:6px 0}.b-trans{font-size:13px;color:#d4c4a0;line-height:1.5}
.learn-btn{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;border:1px solid;background:none;font-family:inherit;align-self:flex-start;color:#f59e0b;border-color:rgba(245,158,11,.4)}
.bwrap.A .learn-btn{align-self:flex-end}
.lpanel{background:linear-gradient(135deg,#1c0505,#1a0a00);border-radius:14px;padding:14px;border:1px solid rgba(245,158,11,.25);max-width:82%;width:100%;box-shadow:0 4px 20px rgba(0,0,0,.5)}
.lp-title{font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
.play-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:10px;border-radius:10px;border:1px solid rgba(239,68,68,.6);background:linear-gradient(135deg,#3d0000,#2d0a0a);color:#fca5a5;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:10px}
.play-btn.going{animation:pulse 1.2s infinite;background:#dc2626;color:#fff}
.prac-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:10px;border-radius:10px;border:2px solid rgba(245,158,11,.5);background:linear-gradient(135deg,#2d1a00,#1c0f00);color:#fbbf24;font-size:13px;font-weight:700;cursor:pointer}
.prac-btn.going{background:#b45309;border-color:#fbbf24;color:#fff;animation:pulse 1s infinite}
.score-box{background:#0a0000;border-radius:10px;padding:12px;margin-top:10px;border:1px solid rgba(255,255,255,.06)}
.err{margin:0 12px 6px;background:rgba(127,29,29,.4);border:1px solid #7f1d1d;color:#fca5a5;font-size:12px;padding:8px 12px;border-radius:10px;display:flex;justify-content:space-between}
.actions{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid rgba(245,158,11,.2)}
.mic-btn{display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 18px;border-radius:14px;border:2px solid;background:none;position:relative}
.mic-btn.A{border-color:rgba(220,38,38,.5);color:#f87171;transform:rotate(180deg) scaleX(-1)}.mic-btn.B{border-color:rgba(180,83,9,.5);color:#fbbf24}
.mic-btn.rec{color:#fff;animation:pulse 1s infinite}.mic-btn.A.rec{background:rgba(220,38,38,.3)}.mic-btn.B.rec{background:rgba(180,83,9,.3)}
.mic-lbl{font-size:10px;font-weight:600}.rdot{position:absolute;top:-4px;right:-4px;width:10px;height:10px;background:#ef4444;border-radius:50%;animation:pulse 1s infinite}
.cbtns{display:flex;flex-direction:column;gap:8px}
.ibtn{width:40px;height:40px;border-radius:50%;background:#1c0505;border:1px solid rgba(245,158,11,.3);display:flex;align-items:center;justify-content:center;color:#b45309}
.clrbtn{background:none;border:none;color:#5a2020;display:flex;align-items:center}
.pov{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(180deg,#1c0505,#130000);border-radius:20px 20px 0 0;padding:20px 16px;z-index:50;max-height:80vh;overflow-y:auto}
.pov-hdr{display:flex;justify-content:space-between;margin-bottom:14px}.pov-hdr h3{color:#fde68a}
.lrow{display:flex;align-items:center;gap:8px;margin-bottom:12px}.lrow span{font-size:12px;color:#b45309;white-space:nowrap}
.upz{border:2px dashed rgba(245,158,11,.3);border-radius:14px;padding:36px;display:flex;flex-direction:column;align-items:center;gap:10px;color:#7f3d3d;cursor:pointer}
.prev{width:100%;max-height:160px;object-fit:contain;border-radius:10px}
.rbox{background:#0a0000;border-radius:12px;padding:14px;margin-top:10px;border:1px solid rgba(245,158,11,.15)}
.rlbl{font-size:11px;color:#b45309;margin-bottom:3px;font-weight:600}
.rorig{font-size:13px;color:#d4c4a0;margin-bottom:10px;line-height:1.5}
.rdivp{border-top:1px solid rgba(255,255,255,.06);padding-top:10px;margin-bottom:3px}
.rtrans{font-size:13px;color:#fbbf24;font-weight:600;line-height:1.5}
.spkbtn{display:flex;align-items:center;gap:5px;font-size:11px;color:#7f3d3d;background:none;border:none;cursor:pointer;margin-top:8px}
.rstbtn{font-size:11px;color:#5a2020;background:none;border:none;cursor:pointer;margin-top:8px;display:flex;align-items:center;gap:4px}
.proc{text-align:center;font-size:12px;color:#7f3d3d;padding:16px;animation:pulse 1.5s infinite}
.vfull{position:relative;flex:1;display:flex;flex-direction:column;overflow:hidden;background:#000;min-height:300px}
.vfull-video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover}
.vfull-placeholder{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#5a2020;padding:24px}
.vfull-top{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;padding:10px 12px;z-index:10;background:linear-gradient(rgba(0,0,0,.75),transparent)}
.vfull-sub{position:absolute;left:0;right:0;bottom:115px;z-index:10;pointer-events:none;text-align:center;padding:0 16px}
.vfull-sub-text{display:inline-block;font-size:22px;font-weight:800;color:#fff;text-shadow:0 2px 14px #000;background:rgba(0,0,0,.55);padding:8px 18px;border-radius:14px}
.vfull-bottom{position:absolute;bottom:0;left:0;right:0;z-index:10;padding:12px 14px 18px;background:linear-gradient(transparent,rgba(0,0,0,.93))}
.vlang-row-h{display:flex;align-items:center;gap:6px}.vlang-row-h select{flex:1;font-size:11px;padding:5px 7px}
.src-badge{background:rgba(10,0,0,.75);border:1px solid rgba(245,158,11,.4);border-radius:10px;padding:3px 8px;font-size:10px;font-weight:700;color:#fbbf24;display:flex;align-items:center;gap:5px}
.rec-badge{display:flex;align-items:center;gap:5px;background:rgba(220,38,38,.85);border-radius:10px;padding:3px 8px;font-size:10px;font-weight:700;color:#fff}
.rdot-anim{width:7px;height:7px;background:#fff;border-radius:50%;animation:pulse 1s infinite}
.vstart-btn{width:100%;padding:14px;border-radius:14px;font-size:15px;font-weight:700;border:2px solid;font-family:inherit}
.vstart-btn.idle{background:linear-gradient(135deg,#2d0a0a,#1c0505);border-color:rgba(239,68,68,.5);color:#f87171}
.vstart-btn.live{background:linear-gradient(135deg,#dc2626,#b91c1c);border-color:#ef4444;color:#fff}
.doc-body{flex:1;display:flex;flex-direction:column;overflow:hidden}
.doc-mode-bar{display:flex;gap:6px;padding:10px 12px;background:linear-gradient(180deg,#1c0505,#130000);border-bottom:1px solid rgba(245,158,11,.15)}
.doc-mode-btn{flex:1;padding:8px 4px;border-radius:10px;border:1px solid rgba(245,158,11,.3);background:none;color:#7f3d3d;font-size:11px;font-weight:700;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer}
.doc-mode-btn.active{background:linear-gradient(135deg,#2d1a00,#1c0f00);border-color:#f59e0b;color:#fbbf24}
.doc-lang-bar{padding:8px 12px;background:#130000;border-bottom:1px solid rgba(245,158,11,.12);display:flex;align-items:center;gap:8px}
.doc-upload-zone{flex:1;margin:14px 12px;border:2px dashed rgba(245,158,11,.3);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;padding:32px 16px;min-height:200px}
.doc-upload-zone:hover{border-color:rgba(245,158,11,.7)}
.doc-results{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:10px}
.doc-results-hdr{display:flex;justify-content:space-between;margin-bottom:2px}.doc-results-hdr span{font-size:12px;font-weight:700;color:#fbbf24}
.doc-clear-btn{background:none;border:1px solid rgba(239,68,68,.3);border-radius:8px;color:#f87171;font-size:11px;padding:3px 8px;cursor:pointer}
.doc-page{background:linear-gradient(135deg,#1c0505,#130000);border:1px solid rgba(245,158,11,.18);border-radius:14px;overflow:hidden;margin-bottom:10px}
.doc-page-hdr{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.05)}
.doc-thumb{width:52px;height:52px;object-fit:cover;border-radius:8px;border:1px solid rgba(245,158,11,.2)}
.doc-page-info{flex:1}.doc-page-num{font-size:12px;font-weight:700;color:#fbbf24;margin-bottom:4px}
.doc-page-status{font-size:11px;font-weight:600}
.doc-page-status.pending,.doc-page-status.ocr,.doc-page-status.translating{color:#f59e0b;animation:pulse 1.5s infinite}
.doc-page-status.done{color:#4ade80}.doc-page-status.error{color:#f87171}
.doc-page-content{padding:10px 12px}
.doc-text-block{border-radius:10px;padding:10px 12px;margin-bottom:8px}
.doc-text-block.orig{background:#0a0000;border-left:3px solid #7f3d3d}
.doc-text-block.trans{background:rgba(45,26,0,.5);border-left:3px solid #f59e0b}
.doc-text-lbl{font-size:10px;font-weight:700;letter-spacing:.8px;margin-bottom:5px}
.doc-text-block.orig .doc-text-lbl{color:#7f3d3d}.doc-text-block.trans .doc-text-lbl{color:#f59e0b}
.doc-text-body{font-size:12px;line-height:1.7;white-space:pre-wrap}
.doc-text-block.orig .doc-text-body{color:#d4c4a0}.doc-text-block.trans .doc-text-body{color:#fde68a}
.comic-canvas-wrap{padding:0 0 4px;display:flex;flex-direction:column;gap:8px}
.comic-canvas{width:100%;display:block;border-radius:10px;border:1px solid rgba(245,158,11,.2)}
.comic-dl-btn{width:100%;padding:11px;border-radius:11px;background:linear-gradient(135deg,#064e3b,#065f46);border:2px solid #10b981;color:#6ee7b7;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px}
.comic-no-bubble{text-align:center;padding:12px;font-size:12px;color:#7f3d3d}
.tpill{display:flex;justify-content:center}.tpill div{background:#1c0505;border:1px solid #7f1d1d;border-radius:20px;padding:6px 16px;font-size:12px;color:#f87171;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
`;

// ══════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════
function simScore(t,h){const a=t.toLowerCase().replace(/[^\w\s\u3000-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0600-\u06FF]/g,"").trim(),b=h.toLowerCase().replace(/[^\w\s\u3000-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0600-\u06FF]/g,"").trim();if(!a||!b)return 0;const m=a.length,n=b.length;const dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);return Math.max(0,Math.round((1-dp[m][n]/Math.max(m,n))*100));}

// Loader Tesseract
const loadTesseract = async () => {
  if (window.Tesseract) return window.Tesseract;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.onload = () => resolve(window.Tesseract);
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

// ── LearnPanel ──
function LearnPanel({ text, speechCode, flag }) {
  const [speed, setSpeed] = useState(0.8);
  const [playing, setPlaying] = useState(false);
  const [pracRec, setPracRec] = useState(false);
  const [score, setScore] = useState(null);
  const [heard, setHeard] = useState("");
  const pracRef = useRef(null);

  const playAudio = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang=speechCode; u.rate=speed;
    u.onstart=()=>setPlaying(true); u.onend=()=>setPlaying(false);
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
  const fb=s=>s>=80?{l:"Sempurna! 🎉",c:"g"}:s>=50?{l:"Hampir! 👍",c:"y"}:{l:"Coba lagi 💪",c:"r"};
  return (
    <div className="lpanel">
      <div className="lp-title">📖 Pelajari Pengucapan {flag}</div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:11,color:"#b45309"}}>Speed:</span>
        <input type="range" min="0.3" max="1.2" step="0.1" value={speed} onChange={e=>setSpeed(parseFloat(e.target.value))} style={{flex:1,accentColor:"#22d3ee"}}/>
      </div>
      <button className={`play-btn ${playing?"going":""}`} onClick={playAudio}><Volume2 size={15}/> Dengarkan</button>
      <button className={`prac-btn ${pracRec?"going":""}`} onClick={pracRec?()=>pracRef.current?.stop():startPrac}>
        {pracRec?<><MicOff size={16}/>Stop</>:<><Mic size={16}/>Praktik</>}
      </button>
      {score!==null&&(
        <div className="score-box">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:11,color:"#7f3d3d"}}>Skor</span>
            <span style={{fontSize:20,fontWeight:700,color:sc(score)}}>{score}%</span>
          </div>
          <div style={{height:6,background:"#2d0a0a",borderRadius:3,overflow:"hidden",marginBottom:6}}>
            <div style={{height:6,borderRadius:3,background:sc(score),width:`${score}%`}}/>
          </div>
          <span className={`fb ${fb(score).c}`}>{fb(score).l}</span>
        </div>
      )}
    </div>
  );
}

// ── ComicCanvas ──
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
        const fontSize = Math.max(10, Math.min(w / Math.max(txt.length * 0.55, 3), h * 0.35, 22));
        ctx.font = `700 ${fontSize}px 'Noto Sans',Arial`;
        ctx.fillStyle = "#0a0000";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        wrapCanvasText(ctx, txt, x + w / 2, y + h / 2, w, fontSize * 1.3);
      });
      setReady(true);
    };
    img.src = imgSrc;
  }, [imgSrc, bubbles]);

  const download = () => {
    const a = document.createElement("a");
    a.download = `komik-${pageNum}.png`;
    a.href = canvasRef.current.toDataURL("image/png");
    a.click();
  };

  return (
    <div className="comic-canvas-wrap">
      <canvas ref={canvasRef} className="comic-canvas"/>
      {ready && <button className="comic-dl-btn" onClick={download}>⬇ Download</button>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  DOCUMENT TAB (FIX: ADVANCED PREPROCESSING ENGINE)
// ══════════════════════════════════════════════════════════════
function DocumentTab() {
  const [mode, setMode] = useState("komik");
  const [tgtLang, setTgtLang] = useState(LANGS[0]);
  const [pages, setPages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef(null);
  const resultsEnd = useRef(null);

  const MODES = {
    komik: { icon: "🎭", label: "Komik", hint: "Scan teks bubble (Support teks putih)", multi: true },
    buku: { icon: "📚", label: "Buku", hint: "Scan halaman buku", multi: true },
    surat: { icon: "📄", label: "Surat", hint: "Scan surat/kontrak", multi: false },
  };

  useEffect(() => { resultsEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [pages]);

  // -- ENGINE 1: SMART PREPROCESSING --
  // Fungsi ini yang akan memperbaiki masalah teks putih & kecil.
  const smartPreprocess = (src) => {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 1. UPSCALE 300% (Perbesar gambar) -> Biar tulisan kecil "Steve Jobs" jelas
        const scale = 3; 
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // 2. Draw dulu ukuran asli
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 3. PROSES MANIPULASI WARNA (Pixel Manipulation)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let totalBrightness = 0;
        const pixels = [];

        // Hitung brightness rata-rata
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          pixels.push(brightness);
          totalBrightness += brightness;
        }
        
        const avgBrightness = totalBrightness / pixels.length;

        // 4. LOGIKA PEMBALIKAN WARNA (INVERT)
        // Jika rata-rata gelap (background item/merah), maka TEKS biasanya PUTIH.
        // Kita harus balik: Teks Putih -> Hitam, Background Gelap -> Putih.
        // Rumus: 255 - value.
        
        const shouldInvert = avgBrightness < 140; // Angka 140 adalah threshold "gelap"

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          // Konversi ke Grayscale dulu biar simpel
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;

          if (shouldInvert) {
            // Balik warna
            gray = 255 - gray;
          }

          // 5. HIGH CONTRAST (Thresholding)
          // Bikin teks jadi hitam pekat (0) dan background putih polos (255)
          // Threshold 125 dipilih biar abu-abu ilang semua.
          const final = gray > 125 ? 255 : 0;

          data[i] = final;
          data[i + 1] = final;
          data[i + 2] = final;
          // data[i+3] (alpha) biarin aja
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = src;
    });
  };

  const processPage = async (id, imgSrc, tgt) => {
    const updatePage = (patch) => setPages(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    updatePage({ status: "ocr" });

    try {
      if (!window.Tesseract) await loadTesseract();
      
      // JALANKAN ENGINE PREPROCESSING
      const processedImg = await smartPreprocess(imgSrc);

      const worker = await window.Tesseract.createWorker('eng+ind', 1, {
        logger: m => console.log(m.status)
      });

      // PSM 11 untuk komik (sparse text), PSM 3 untuk buku
      const psm = mode === 'komik' ? '11' : '3';
      await worker.setParameters({ tessedit_pageseg_mode: psm });

      const { data: { lines } } = await worker.recognize(processedImg);
      await worker.terminate();

      const validLines = lines.filter(l => l.text.trim().length > 1 && l.confidence > 45);

      if (mode === "komik") {
        const img = new Image();
        img.src = imgSrc;
        await new Promise(res => img.onload = res);
        const W = img.naturalWidth;
        const H = img.naturalHeight;

        const bubbles = validLines.map(line => ({
          x: (line.bbox.x0 / W) * 100 / 3, // Kembali ke skala asli (dibagi 3 karena tadi di upscale 3x)
          y: (line.bbox.y0 / H) * 100 / 3,
          w: ((line.bbox.x1 - line.bbox.x0) / W) * 100 / 3,
          h: ((line.bbox.y1 - line.bbox.y0) / H) * 100 / 3,
          text: line.text.trim()
        })).filter(b => b.w > 0 && b.h > 0);

        updatePage({ status: "translating", bubbles: bubbles.map(b => ({ ...b, translated: "" })) });
        
        const translations = await Promise.all(bubbles.map(b => fastTranslate(b.text, "auto", tgt.code).catch(() => b.text)));
        const finalBubbles = bubbles.map((b, i) => ({ ...b, translated: translations[i] || b.text }));
        updatePage({ bubbles: finalBubbles, status: "done" });

      } else {
        const fullText = validLines.map(l => l.text).join("\n");
        updatePage({ orig: fullText, status: "translating" });
        const translated = await fastTranslate(fullText, "auto", tgt.code);
        updatePage({ orig: fullText, trans: translated || fullText, status: "done" });
      }

    } catch (e) {
      console.error(e);
      updatePage({ orig: "—", trans: "Error: " + e.message, status: "error" });
    }
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setProcessing(true);
    
    const raw = await Promise.all(files.map((file, i) => new Promise(res => {
      const reader = new FileReader();
      reader.onload = ev => res({ id: i, img: ev.target.result });
      reader.readAsDataURL(file);
    })));
    
    setPages(raw.map(p => ({ ...p, orig: "", trans: "", bubbles: null, status: "pending" })));
    
    for (const p of raw) {
      await processPage(p.id, p.img, tgtLang);
    }
    
    setProcessing(false);
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
        <span className="doc-lang-lbl">Ke:</span>
        <select value={tgtLang.code} onChange={e => setTgtLang(LANGS.find(l => l.code === e.target.value))} style={{flex:1}}>
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
        </select>
      </div>

      {processing && pages.length > 0 && (
        <div style={{padding:"0 12px 6px",display:"flex",alignItems:"center",gap:8}}>
           <div style={{flex:1,height:4,background:"#1c0505",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:4,background:"linear-gradient(90deg,#ef4444,#f59e0b)",width:`${Math.round(doneCount/pages.length*100)}%`}}/>
          </div>
          <span style={{fontSize:10,color:"#f59e0b"}}>⚡ {doneCount}/{pages.length}</span>
        </div>
      )}

      {!pages.length && (
        <div className="doc-upload-zone" onClick={() => fileRef.current?.click()}>
          <div style={{fontSize:42}}>{m.icon}</div>
          <div style={{fontSize:15,fontWeight:700,color:"#fbbf24"}}>Upload {m.label}</div>
          <div style={{fontSize:12,color:"#b45309"}}>{m.hint}</div>
          <div style={{fontSize:11,color:"#5a2020",display:"flex",alignItems:"center",gap:4}}><Zap size={11}/> Smart Engine (Auto-Fix Text Color)</div>
        </div>
      )}

      <div className="doc-results">
        {pages.map((p, i) => (
          <div key={p.id} className={`doc-page ${p.status}`}>
            <div className="doc-page-hdr">
              <img src={p.img} className="doc-thumb" alt={`hal${i+1}`}/>
              <div className="doc-page-info">
                <div className="doc-page-num">{mode === "surat" ? "📄" : `Halaman ${i + 1}`}</div>
                <div className={`doc-page-status ${p.status}`}>
                  {p.status === "ocr" && "🔍 Smart Scan..."}
                  {p.status === "translating" && "⚡ Translate..."}
                  {p.status === "done" && "✅ Selesai"}
                  {p.status === "error" && "❌ Gagal"}
                </div>
              </div>
            </div>
            
            {mode === "komik" && p.status === "done" && (
              p.bubbles && p.bubbles.length > 0
                ? <ComicCanvas imgSrc={p.img} bubbles={p.bubbles} pageNum={i + 1}/>
                : <div className="comic-no-bubble">Tidak ada teks terdeteksi</div>
            )}

            {mode !== "komik" && (p.orig || p.status === "done") && (
              <div className="doc-page-content">
                <div className="doc-text-block orig">
                  <div className="doc-text-lbl">📝 ASLI</div>
                  <div className="doc-text-body">{p.orig || "—"}</div>
                </div>
                {p.trans && (
                  <div className="doc-text-block trans">
                    <div className="doc-text-lbl">{tgtLang.flag} TERJEMAHAN</div>
                    <div className="doc-text-body">{p.trans}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={resultsEnd}/>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple={m.multi} style={{display:"none"}} onChange={handleFiles}/>
    </div>
  );
}

// ── VideoTab (Singkat) ──
function VideoTab() {
  const [srcLang, setSrcLang] = useState(LANGS[1]);
  const [tgtLang, setTgtLang] = useState(LANGS[0]);
  const [isLive, setIsLive] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const videoRef = useRef(null);
  const srRef = useRef(null);
  const isLiveRef = useRef(false);
  const streamRef = useRef(null);

  const stopAll = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    try { srRef.current?.stop(); } catch {}
  };

  const toggle = async () => {
    if (isLive) {
      setIsLive(false); isLiveRef.current = false; stopAll();
    } else {
      isLiveRef.current = true; setIsLive(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {}
      
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        const r = new SR();
        srRef.current = r; r.continuous = true; r.interimResults = true; r.lang = srcLang.speech;
        r.onresult = async (e) => {
          let txt = "";
          for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
          const tr = await fastTranslate(txt, srcLang.code, tgtLang.code);
          setSubtitle(tr);
        };
        r.start();
      }
    }
  };

  return (
    <div className="vfull">
      {isLive && <video ref={videoRef} muted playsInline autoPlay className="vfull-video"/>}
      {!isLive && <div className="vfull-placeholder"><Video size={52}/><p style={{color:"#fca5a5"}}>Tekan Mulai</p></div>}
      {isLive && subtitle && <div className="vfull-sub"><span className="vfull-sub-text">{subtitle}</span></div>}
      <div className="vfull-bottom">
        {!isLive && (
          <div className="vlang-row-h">
            <select value={srcLang.code} onChange={e=>setSrcLang(LANGS.find(l=>l.code===e.target.value))}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag}</option>)}</select>
            <span style={{color:"#b45309",fontWeight:700}}>→</span>
            <select value={tgtLang.code} onChange={e=>setTgtLang(LANGS.find(l=>l.code===e.target.value))}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag}</option>)}</select>
          </div>
        )}
        <button className={`vstart-btn ${isLive?"live":"idle"}`} onClick={toggle}>
          {isLive ? <><VideoOff size={18}/> Stop</> : <><Video size={18}/> Mulai</>}
        </button>
      </div>
    </div>
  );
}

// ── Main App ──
export default function App() {
  const [tab, setTab] = useState("talk");
  const [langA, setLangA] = useState(LANGS[0]);
  const [langB, setLangB] = useState(LANGS[1]);
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPhoto, setShowPhoto] = useState(false);
  const [photoImg, setPhotoImg] = useState(null);
  const [photoTgt, setPhotoTgt] = useState(LANGS[1]);
  const [photoResult, setPhotoResult] = useState(null);
  const [error, setError] = useState("");
  const [openLearn, setOpenLearn] = useState(null);
  const recRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(()=>{ const on=()=>setIsOnline(true),off=()=>setIsOnline(false); window.addEventListener("online",on); window.addEventListener("offline",off); return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);}; },[]);
  const showErr=m=>{setError(m);setTimeout(()=>setError(""),4000);};
  const speak=(text,sc)=>{ if(!window.speechSynthesis)return; window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang=sc; window.speechSynthesis.speak(u); };

  const startListen=side=>{
    if(!isOnline){showErr("Perlu internet.");return;} const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){showErr("Gunakan Chrome/Edge.");return;} if(listening){recRef.current?.stop();return;}
    const src=side==="A"?langA:langB,tgt=side==="A"?langB:langA; const r=new SR(); recRef.current=r; r.lang=src.speech; r.interimResults=false; setListening(side);
    r.onresult=async e=>{
      const orig=e.results[0][0].transcript; setListening(null); setTranslating(true);
      try{ const trans=await fastTranslate(orig,src.code,tgt.code); if(trans) setMessages(p=>[...p,{id:Date.now(),side,orig,trans,src,tgt}]); if(trans) speak(trans,tgt.speech); }
      catch(err){ showErr("Gagal."); } finally{ setTranslating(false); }
    };
    r.onerror=()=>setListening(null);
    r.start();
  };

  // Photo Handler pakai engine yang sama (Smart Preprocess)
  const handlePhoto = async e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const url = ev.target.result;
      setPhotoImg(url); setPhotoResult({original:"Memproses...",translated:""});
      try {
        if (!window.Tesseract) await loadTesseract();
        
        // Pakai fungsi smartPreprocess yang sama
        // Kita import manual di sini biar gampang
        const preprocess = (src) => {
          return new Promise(resolve => {
            const img = new Image(); img.crossOrigin = "Anonymous";
            img.onload = () => {
              const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
              const scale = 3; canvas.width = img.width * scale; canvas.height = img.height * scale;
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imageData.data; let totalB = 0;
              for (let i = 0; i < data.length; i += 4) { totalB += (data[i]+data[i+1]+data[i+2])/3; }
              const avg = totalB / (data.length/4);
              for (let i = 0; i < data.length; i += 4) {
                let g = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
                if(avg < 140) g = 255-g;
                const v = g > 125 ? 255 : 0;
                data[i]=v; data[i+1]=v; data[i+2]=v;
              }
              ctx.putImageData(imageData, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            };
            img.src = src;
          });
        };

        const processed = await preprocess(url);
        const worker = await window.Tesseract.createWorker('eng+ind', 1);
        const { data: { text } } = await worker.recognize(processed);
        await worker.terminate();

        if (!text || text.trim().length < 2) throw new Error("No text");
        const translated = await fastTranslate(text, "auto", photoTgt.code);
        setPhotoResult({ original: text, translated });
      } catch (err) { setPhotoResult({ original: "Gagal scan", translated: "" }); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="logo"><div className="logo-icon">TL</div><span className="logo-name">translaf</span></div>
          <div className={`badge ${isOnline?"on":"off"}`}>{isOnline?"Online":"Offline"}</div>
        </div>
        <div className="tabs">
          <button className={`tab ${tab==="talk"?"active":""}`} onClick={()=>setTab("talk")}><MessageCircle size={14}/>Chat</button>
          <button className={`tab ${tab==="video"?"active":""}`} onClick={()=>setTab("video")}><Video size={14}/>Video</button>
          <button className={`tab ${tab==="doc"?"active":""}`} onClick={()=>setTab("doc")}><BookOpen size={14}/>Dokumen</button>
        </div>

        {tab==="talk"&&<>
          <div className="bar-a"><select value={langA.code} onChange={e=>setLangA(LANGS.find(l=>l.code===e.target.value))}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag}</option>)}</select><span className="bar-lbl">← Dia</span></div>
          <div className="feed">
            {messages.map(m=>(
              <div key={m.id} className={`bwrap ${m.side}`}>
                <div className={`bubble ${m.side}`}><div className="b-orig">{m.orig}</div><div className="bdiv"/><div className="b-trans">{m.trans}</div></div>
                <button className={`learn-btn ${m.side} ${openLearn===m.id?"open":""}`} onClick={()=>setOpenLearn(openLearn===m.id?null:m.id)}>Pelajari</button>
                {openLearn===m.id&&<LearnPanel text={m.trans} speechCode={m.tgt.speech} flag={m.tgt.flag}/>}
              </div>
            ))}
            {translating&&<div className="tpill"><div>...</div></div>}
          </div>
          {error&&<div className="err"><span>{error}</span><X size={13} onClick={()=>setError("")}/></div>}
          <div className="bar-b"><select value={langB.code} onChange={e=>setLangB(LANGS.find(l=>l.code===e.target.value))}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag}</option>)}</select><span className="bar-lbl">Kamu →</span></div>
          <div className="actions">
            <button className={`mic-btn A ${listening==="A"?"rec":""}`} onClick={()=>startListen("A")} disabled={!!listening}><Mic size={22}/><span className="mic-lbl">{langA.name}</span></button>
            <div className="cbtns">
              <button className="ibtn" onClick={()=>{const t=langA;setLangA(langB);setLangB(t);}}><ArrowLeftRight size={15}/></button>
              <button className="ibtn" onClick={()=>{setShowPhoto(true);setPhotoImg(null);}}><Camera size={15}/></button>
            </div>
            <button className={`mic-btn B ${listening==="B"?"rec":""}`} onClick={()=>startListen("B")} disabled={!!listening}><Mic size={22}/><span className="mic-lbl">{langB.name}</span></button>
          </div>
        </>}

        {tab==="video"&&<VideoTab/>}
        {tab==="doc"&&<DocumentTab/>}

        {showPhoto&&<div className="pov">
          <div className="pov-hdr"><h3>📷 Scan Foto</h3><button className="ibtn" onClick={()=>setShowPhoto(false)}><X size={16}/></button></div>
          <div className="lrow"><span>Ke:</span><select value={photoTgt.code} onChange={e=>setPhotoTgt(LANGS.find(l=>l.code===e.target.value))} style={{flex:1}}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag}</option>)}</select></div>
          {!photoImg?<div className="upz" onClick={()=>fileRef.current?.click()}><ImageIcon size={28}/><span>Pilih Gambar</span></div>
          :<div>
            <img src={photoImg} className="prev" alt="preview"/>
            {photoResult&&<div className="rbox">
              <div className="rlbl">Teks:</div>
              <div className="rorig">{photoResult.original}</div>
              <div className="rdivp"><div className="rlbl">Terjemahan:</div><div className="rtrans">{photoResult.translated}</div></div>
              <button className="spkbtn" onClick={()=>speak(photoResult.translated,photoTgt.speech)}><Volume2 size={12}/> Play</button>
            </div>}
            <button className="rstbtn" onClick={()=>{setPhotoImg(null);setPhotoResult(null);}}><RotateCcw size={12}/> Ulang</button>
          </div>}
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
        </div>}
      </div>
    </>
  );
}