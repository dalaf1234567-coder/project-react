import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, Camera, ArrowLeftRight, Volume2, WifiOff, X,
  ImageIcon, RotateCcw, Trash2, GraduationCap, ChevronDown,
  ChevronUp, Video, VideoOff, MessageCircle, AlertCircle, Zap
} from "lucide-react";

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

// ── Ultra-fast Google Translate (gtx) — no API key, ~50-150ms ──
async function gtxTranslate(text, src, tgt) {
  if (!text.trim()) return "";
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(text)}`;
  const r = await fetch(url);
  const d = await r.json();
  // response: [[[translated, original, ...],...], ...]
  return d[0].map(x => x[0]).join("") || "";
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
.vbody{flex:1;display:flex;flex-direction:column;overflow:hidden}
.vlang-bar{padding:8px 12px;background:linear-gradient(180deg,#1c0505,#130000);border-bottom:1px solid rgba(245,158,11,.15);display:flex;flex-direction:column;gap:7px}
.vlang-row{display:flex;align-items:center;gap:8px}
.vlang-lbl{font-size:11px;color:#b45309;white-space:nowrap;min-width:90px;font-weight:700;letter-spacing:.02em}
.vlang-row select{flex:1;font-size:12px;padding:6px 8px}
.vcam-wrap{position:relative;width:100%;background:#000;flex-shrink:0}
.vcam-placeholder{width:100%;height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#5a2020;gap:8px;font-size:13px;background:#080000}
.sub-overlay{position:absolute;bottom:0;left:0;right:0;padding:8px 10px 10px;background:linear-gradient(transparent,rgba(10,0,0,.92) 60%);pointer-events:none;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;min-height:80px}
.sub-interim{font-size:13px;color:rgba(255,200,150,.5);font-style:italic;line-height:1.4;text-shadow:0 1px 3px rgba(0,0,0,.9)}
.sub-interim-trans{font-size:16px;font-weight:600;color:rgba(251,191,36,.85);line-height:1.4;text-shadow:0 2px 6px rgba(0,0,0,.9)}
.sub-final{font-size:19px;font-weight:800;color:#fff;line-height:1.35;text-shadow:0 2px 10px rgba(0,0,0,1),0 0 25px rgba(239,68,68,.5);letter-spacing:.01em}
.sub-translating{font-size:15px;font-weight:600;color:rgba(255,255,255,.5);animation:pulse 1s infinite}
.src-badge{position:absolute;top:8px;left:8px;background:rgba(10,0,0,.75);border:1px solid rgba(245,158,11,.4);border-radius:10px;padding:3px 8px;font-size:10px;font-weight:700;color:#fbbf24;pointer-events:none;display:flex;align-items:center;gap:5px}
.rec-badge{position:absolute;top:8px;right:8px;display:flex;align-items:center;gap:5px;background:rgba(220,38,38,.85);border-radius:10px;padding:3px 8px;font-size:10px;font-weight:700;color:#fff;box-shadow:0 0 10px rgba(220,38,38,.5)}
.rdot-anim{width:7px;height:7px;background:#fff;border-radius:50%;animation:pulse 1s infinite;flex-shrink:0}
.latency-badge{position:absolute;bottom:8px;right:8px;background:rgba(10,0,0,.7);border:1px solid rgba(245,158,11,.3);border-radius:8px;padding:2px 7px;font-size:10px;color:#fbbf24;pointer-events:none;font-weight:600}
.sub-history{flex:1;overflow-y:auto;padding:8px 12px;display:flex;flex-direction:column;gap:5px;min-height:90px;max-height:160px}
.sub-empty{display:flex;align-items:center;justify-content:center;height:80px;color:#5a2020;font-size:12px;text-align:center;line-height:1.5}
.sub-item{background:#1c0505;border-radius:9px;padding:7px 11px;border-left:3px solid #f59e0b;display:flex;flex-direction:column;gap:2px}
.sub-item-orig{font-size:11px;color:#7f3d3d;line-height:1.4}
.sub-item-trans{font-size:13px;color:#fde68a;font-weight:600;line-height:1.4}
.vbottom{padding:10px 12px;border-top:1px solid rgba(245,158,11,.15);background:linear-gradient(180deg,#1c0505,#0a0000);display:flex;flex-direction:column;gap:6px}
.vstart-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:14px;font-size:15px;font-weight:700;border:2px solid;font-family:inherit;transition:all .2s}
.vstart-btn.idle{background:linear-gradient(135deg,#2d0a0a,#1c0505);border-color:rgba(239,68,68,.5);color:#f87171}
.vstart-btn.idle:hover{border-color:#ef4444;background:#3d0000;box-shadow:0 0 20px rgba(239,68,68,.25)}
.vstart-btn.live{background:linear-gradient(135deg,#dc2626,#b91c1c);border-color:#ef4444;color:#fff;box-shadow:0 0 20px rgba(220,38,38,.4)}
.vstart-btn.live:hover{background:linear-gradient(135deg,#b91c1c,#991b1b)}
.speed-info{display:flex;align-items:center;justify-content:center;gap:5px;font-size:11px;color:#b45309;opacity:.8}
`

function leven(a,b){const m=a.length,n=b.length,dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);return dp[m][n];}
function simScore(t,h){const a=t.toLowerCase().replace(/[^\w\s\u3000-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0600-\u06FF]/g,"").trim(),b=h.toLowerCase().replace(/[^\w\s\u3000-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0600-\u06FF]/g,"").trim();if(!a||!b)return 0;return Math.max(0,Math.round((1-leven(a,b)/Math.max(a.length,b.length))*100));}

async function fastTranslate(text, src, tgt) {
  if (!text.trim() || src === tgt) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(text)}`;
    const r = await fetch(url);
    const d = await r.json();
    return d[0].map(x => x[0]).filter(Boolean).join("") || text;
  } catch {
    // fallback MyMemory
    try {
      const r2 = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`);
      const d2 = await r2.json();
      return d2.responseData?.translatedText || text;
    } catch { return ""; }
  }
}

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
    setPhLoad(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:400,
          messages:[{ role:"user", content:`Buat panduan pengucapan untuk teks ${langName}: "${text}"\nFormat:\n1. IPA: [...]\n2. Baca seperti: [...suku kata pakai bunyi Indonesia...]\n3. Tips: [satu tips]\nGunakan teks biasa saja.` }]
        })
      });
      const d = await res.json();
      setPhonetic(d.content[0]?.text || "");
    } catch { setPhonetic("Gagal memuat panduan."); }
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

// ── VideoTab – ultra-fast interim translation ──
function VideoTab() {
  const [srcLang, setSrcLang] = useState(LANGS[1]);
  const [tgtLang, setTgtLang] = useState(LANGS[0]);
  const [isLive, setIsLive] = useState(false);

  // subtitle state
  const [interimOrig, setInterimOrig]   = useState("");  // gray — raw speech (partial)
  const [interimTrans, setInterimTrans] = useState("");  // yellow — live translation of partial
  const [finalTrans, setFinalTrans]     = useState("");  // white — confirmed final translation
  const [latency, setLatency]           = useState(null);
  const [history, setHistory]           = useState([]);
  const [camErr, setCamErr]             = useState("");

  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const srRef       = useRef(null);
  const isLiveRef   = useRef(false);
  const debounceRef = useRef(null);     // debounce for interim translate
  const lastInterim = useRef("");
  const histEnd     = useRef(null);

  useEffect(()=>{ histEnd.current?.scrollIntoView({behavior:"smooth"}); },[history]);
  useEffect(()=>()=>stopAll(),[]);

  // Translate interim with debounce 300ms — feels real-time
  const translateInterim = useCallback(async (text, src, tgt) => {
    if (!text.trim()) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (text !== lastInterim.current) return; // stale
      const t0 = Date.now();
      try {
        const tr = await fastTranslate(text, src, tgt);
        if (text === lastInterim.current) { // still current
          setInterimTrans(tr);
          setLatency(Date.now() - t0);
        }
      } catch {}
    }, 300);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment" }, audio:false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamErr(""); return true;
    } catch { setCamErr("Kamera tidak bisa dibuka — terjemahan audio tetap jalan."); return false; }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t=>t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startSpeech = (src, tgt) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setCamErr("Butuh Chrome atau Edge."); return; }

    const r = new SR();
    srRef.current = r;
    r.continuous = true;
    r.interimResults = true;   // ← wajib untuk real-time
    r.maxAlternatives = 1;
    r.lang = src.speech;

    r.onresult = async (e) => {
      let iText = "", fText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fText += e.results[i][0].transcript + " ";
        else iText += e.results[i][0].transcript;
      }

      // Update interim display immediately (no delay)
      if (iText) {
        setInterimOrig(iText);
        lastInterim.current = iText;
        translateInterim(iText, src.code, tgt.code);  // translate partial, debounced 300ms
      }

      // Final result: translate immediately, no debounce
      if (fText.trim()) {
        const orig = fText.trim();
        setInterimOrig(""); setInterimTrans("");
        lastInterim.current = "";
        clearTimeout(debounceRef.current);

        const t0 = Date.now();
        try {
          const trans = await fastTranslate(orig, src.code, tgt.code);
          const ms = Date.now() - t0;
          setFinalTrans(trans);
          setLatency(ms);
          setHistory(p => [...p.slice(-30), { id:Date.now(), orig, trans, tgtFlag:tgt.flag }]);
          // clear final after 5s so screen is clean
          setTimeout(()=>setFinalTrans(""), 5000);
        } catch { setFinalTrans("⚠ Gagal terjemah"); }
      }
    };

    r.onerror = ev => {
      if (ev.error === "not-allowed") setCamErr("Izin mikrofon ditolak di browser.");
      else if (ev.error === "network") setCamErr("Tidak ada koneksi internet.");
      // no-speech: abaikan
    };
    r.onend = () => { if (isLiveRef.current) { try{ r.start(); }catch{} } };
    try { r.start(); } catch(e) { setCamErr("Gagal start mikrofon: " + e.message); }
  };

  const stopSpeech = () => {
    isLiveRef.current = false;
    clearTimeout(debounceRef.current);
    try { srRef.current?.stop(); } catch {}
    srRef.current = null;
  };

  const stopAll = () => { stopCamera(); stopSpeech(); };

  const toggle = async () => {
    if (isLive) {
      setIsLive(false); isLiveRef.current = false;
      stopAll();
      setInterimOrig(""); setInterimTrans(""); setFinalTrans(""); setLatency(null);
    } else {
      isLiveRef.current = true; setIsLive(true);
      await startCamera();
      startSpeech(srcLang, tgtLang);
    }
  };

  return (
    <div className="vbody">
      <div className="vlang-bar">
        <div className="vlang-row">
          <span className="vlang-lbl">🎤 Bahasa orang:</span>
          <select value={srcLang.code} onChange={e=>setSrcLang(LANGS.find(l=>l.code===e.target.value))} disabled={isLive}>
            {LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
        </div>
        <div className="vlang-row">
          <span className="vlang-lbl">📝 Subtitle ke:</span>
          <select value={tgtLang.code} onChange={e=>setTgtLang(LANGS.find(l=>l.code===e.target.value))} disabled={isLive}>
            {LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
        </div>
        {!isLive && (
          <div className="warn">
            <AlertCircle size={12} style={{flexShrink:0,marginTop:2}}/>
            <span>Pilih bahasa yang sedang diucapkan dengan tepat. Untuk YouTube/TV: dekatkan HP ke speaker.</span>
          </div>
        )}
      </div>

      {camErr && <div className="err" style={{margin:"6px 12px 0"}}><span>{camErr}</span><X size={12} onClick={()=>setCamErr("")} style={{flexShrink:0}}/></div>}

      {/* Camera area */}
      <div className="vcam-wrap">
        {isLive
          ? <video ref={videoRef} muted playsInline autoPlay style={{width:"100%",minHeight:170,maxHeight:"48vw",objectFit:"cover",display:"block"}}/>
          : <div className="vcam-placeholder">
              <Video size={36} style={{opacity:.2}}/>
              <p style={{fontWeight:600}}>Tekan <span style={{color:"#fca5a5"}}>Mulai</span> untuk buka kamera</p>
              <p style={{fontSize:11,opacity:.5}}>Terjemahan muncul real-time sambil orang bicara</p>
            </div>
        }

        {isLive && <>
          <div className="src-badge"><Zap size={9}/>{srcLang.flag} {srcLang.name} → {tgtLang.flag}</div>
          <div className="rec-badge"><span className="rdot-anim"/>LIVE</div>
          {latency && <div className="latency-badge">⚡ {latency}ms</div>}

          <div className="sub-overlay">
            {/* Layer 1: Raw interim (gray, italic) */}
            {interimOrig && <div className="sub-interim">{interimOrig}...</div>}

            {/* Layer 2: Live interim translation (yellow) — updates word by word */}
            {interimTrans && !finalTrans && <div className="sub-interim-trans">{tgtLang.flag} {interimTrans}</div>}

            {/* Layer 3: Final confirmed translation (bright white, big) */}
            {finalTrans && <div className="sub-final">{tgtLang.flag} {finalTrans}</div>}
          </div>
        </>}
      </div>

      {/* History */}
      <div className="sub-history">
        {!history.length
          ? <div className="sub-empty">Riwayat subtitle muncul di sini<br/><span style={{opacity:.5,fontSize:11}}>setiap kalimat yang selesai</span></div>
          : <>
              {history.map(h=>(
                <div key={h.id} className="sub-item">
                  <div className="sub-item-orig">{h.orig}</div>
                  <div className="sub-item-trans">{h.tgtFlag} {h.trans}</div>
                </div>
              ))}
              <div ref={histEnd}/>
            </>
        }
      </div>

      {/* Controls */}
      <div className="vbottom">
        {history.length > 0 && !isLive && (
          <button onClick={()=>setHistory([])} style={{background:"none",border:"none",color:"#475569",fontSize:11,display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}>
            <Trash2 size={11}/> Hapus riwayat
          </button>
        )}
        <button className={`vstart-btn ${isLive?"live":"idle"}`} onClick={toggle}>
          {isLive ? <><VideoOff size={18}/>⏹ Hentikan</> : <><Video size={18}/>▶ Mulai Terjemahan Video</>}
        </button>
        {!isLive && <div className="speed-info"><Zap size={11}/>Terjemahan interim real-time ~50-200ms</div>}
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

  useEffect(()=>{ const on=()=>setIsOnline(true),off=()=>setIsOnline(false); window.addEventListener("online",on); window.addEventListener("offline",off); return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);}; },[]);
  useEffect(()=>{ feedEnd.current?.scrollIntoView({behavior:"smooth"}); },[messages,translating,openLearn]);

  const showErr=m=>{setError(m);setTimeout(()=>setError(""),4000);};
  const speak=(text,sc,rate=1)=>{ if(!window.speechSynthesis)return; window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang=sc; u.rate=rate; window.speechSynthesis.speak(u); };

  const startListen=side=>{
    if(!isOnline){showErr("Perlu internet.");return;} const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){showErr("Gunakan Chrome/Edge.");return;} if(listening){recRef.current?.stop();return;}
    const src=side==="A"?langA:langB,tgt=side==="A"?langB:langA; const r=new SR(); recRef.current=r; r.lang=src.speech; r.interimResults=false; setListening(side);
    r.onresult=async e=>{ const orig=e.results[0][0].transcript; setListening(null); setTranslating(true);
      try{ const trans=await fastTranslate(orig,src.code,tgt.code); setMessages(p=>[...p,{id:Date.now(),side,orig,trans,src,tgt}]); speak(trans,tgt.speech); }
      catch{ showErr("Terjemahan gagal."); } finally{ setTranslating(false); } };
    r.onend=()=>setListening(null); r.onerror=ev=>{setListening(null);showErr(ev.error==="not-allowed"?"Izin mikrofon ditolak.":"Gagal tangkap suara.");};
    r.start();
  };

  const handlePhoto=e=>{ const file=e.target.files[0]; if(!file)return; const reader=new FileReader();
    reader.onload=async ev=>{ const url=ev.target.result; setPhotoImg(url); setPhotoProc(true); setPhotoResult(null); const b64=url.split(",")[1];
      try{ const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type,data:b64}},{type:"text",text:`Extract all text from this image and translate to ${photoTgt.name}. Reply ONLY valid JSON no markdown: {"original":"...","translated":"..."}`}]}]})}); const data=await res.json(); const txt=data.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim(); setPhotoResult(JSON.parse(txt)); }
      catch{ setPhotoResult({original:"Tidak ada teks.",translated:"No text found."}); } finally{ setPhotoProc(false); }
    }; reader.readAsDataURL(file); e.target.value=""; };

  const toggleLearn=id=>setOpenLearn(p=>p===id?null:id);
  const swapLangs=()=>{const t=langA;setLangA(langB);setLangB(t);};

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="logo"><img src="data:image/png;base64,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" alt="TransLaf One Logo" style={width:40,height:40,objectFit:"contain"}/>  <span className="logo-name"><span style={{background:"linear-gradient(90deg,#ef4444,#cc1111)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontStyle:"italic"}}>translaf </span><span style={{background:"linear-gradient(90deg,#f5a623,#b8780a)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontStyle:"italic"}}>one</span></span></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {tab==="talk"&&messages.length>0&&<button className="clrbtn" onClick={()=>{setMessages([]);setOpenLearn(null);}}><Trash2 size={15}/></button>}
            <div className={`badge ${isOnline?"on":"off"}`}>{isOnline?<><span className="dot"/>Online</>:<><WifiOff size={10}/>Offline</>}</div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab==="talk"?"active":""}`} onClick={()=>setTab("talk")}><MessageCircle size={14}/>Percakapan</button>
          <button className={`tab ${tab==="video"?"active":""}`} onClick={()=>setTab("video")}><Video size={14}/>Video Subtitle</button>
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
