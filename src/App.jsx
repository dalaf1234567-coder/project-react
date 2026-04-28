import { useState, useEffect, useRef } from "react";
import {
  Mic, MicOff, Camera, ArrowLeftRight, Volume2, WifiOff, X,
  ImageIcon, RotateCcw, Trash2, GraduationCap, ChevronDown,
  ChevronUp, Video, VideoOff, MessageCircle, AlertCircle
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

const css = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:#030712}
.app{font-family:'Noto Sans',sans-serif;background:#030712;color:#f1f5f9;min-height:100vh;display:flex;flex-direction:column;max-width:480px;margin:0 auto;position:relative}
select{background:#1e293b;color:#f1f5f9;border:1px solid #334155;border-radius:10px;padding:8px 10px;font-size:13px;outline:none;cursor:pointer;font-family:inherit}
select:hover{border-color:#475569}
textarea{background:#1e293b;color:#f1f5f9;border:1px solid #334155;border-radius:12px;padding:12px;font-size:14px;outline:none;font-family:inherit;resize:none;width:100%;line-height:1.6}
textarea:focus{border-color:#0891b2}
textarea::placeholder{color:#475569}
button{cursor:pointer;font-family:inherit}

.header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #1e293b}
.logo{display:flex;align-items:center;gap:8px}
.logo-icon{width:32px;height:32px;background:#0891b2;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff}
.logo-name{font-weight:700;font-size:18px;letter-spacing:-.5px}
.badge{display:flex;align-items:center;gap:5px;font-size:11px;padding:4px 10px;border-radius:20px;font-weight:500}
.badge.on{background:#052e16;color:#4ade80;border:1px solid #166534}
.badge.off{background:#450a0a;color:#f87171;border:1px solid #991b1b}
.dot{display:inline-block;width:7px;height:7px;background:#4ade80;border-radius:50%}

.tabs{display:flex;border-bottom:1px solid #1e293b}
.tab{flex:1;padding:10px 4px;font-size:12px;font-weight:500;border:none;background:none;color:#64748b;display:flex;align-items:center;justify-content:center;gap:5px;border-bottom:2px solid transparent;transition:all .2s}
.tab.active{color:#22d3ee;border-bottom-color:#22d3ee}
.tab:hover:not(.active){color:#94a3b8}

.bar-a{background:#0f172a;border-bottom:1px solid #164e63;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;transform:rotate(180deg) scaleX(-1)}
.bar-b{background:#0f172a;border-top:1px solid #78350f;padding:10px 16px;display:flex;align-items:center;justify-content:space-between}
.bar-lbl{font-size:11px;color:#64748b}

.feed{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:12px;min-height:240px;max-height:340px}
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;color:#334155;font-size:13px;text-align:center;gap:8px}
.bwrap{display:flex;flex-direction:column;gap:4px}
.bwrap.A{align-items:flex-end}
.bwrap.B{align-items:flex-start}
.bubble{max-width:82%;border-radius:16px;padding:10px 14px}
.bubble.A{background:#083344;border:1px solid #164e63;border-top-right-radius:4px}
.bubble.B{background:#2d1a08;border:1px solid #78350f;border-top-left-radius:4px}
.b-orig{font-size:14px;font-weight:500;line-height:1.5}
.bubble.A .b-orig{color:#67e8f9}
.bubble.B .b-orig{color:#fcd34d}
.bdiv{border-top:1px solid #1e293b;margin:6px 0}
.b-trans{font-size:13px;color:#cbd5e1;line-height:1.5}
.learn-btn{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;border:1px solid;background:none;font-family:inherit;transition:all .2s;align-self:flex-start}
.bwrap.A .learn-btn{align-self:flex-end}
.learn-btn.A{color:#22d3ee;border-color:#164e63}
.learn-btn.A:hover,.learn-btn.A.open{background:#083344;border-color:#0891b2}
.learn-btn.B{color:#fbbf24;border-color:#78350f}
.learn-btn.B:hover,.learn-btn.B.open{background:#2d1a08;border-color:#d97706}

.lpanel{background:#0f172a;border-radius:14px;padding:14px;border:1px solid #1e293b;max-width:82%;width:100%}
.lp-title{font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px}
.speed-row{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.speed-row span{font-size:11px;color:#64748b;min-width:60px}
.play-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:9px;border-radius:10px;border:1px solid #0891b2;background:#083344;color:#67e8f9;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;transition:all .2s;margin-bottom:10px}
.play-btn:hover{background:#0e4a6b}
.play-btn.going{animation:pulse 1.2s infinite;background:#0891b2;color:#fff}
.phonetic-box{background:#1e293b;border-radius:10px;padding:12px;border-left:3px solid #0891b2;margin-bottom:10px}
.ph-lbl{font-size:10px;color:#0891b2;font-weight:700;margin-bottom:5px;letter-spacing:.5px}
.ph-text{font-size:12px;color:#cbd5e1;line-height:1.7;white-space:pre-wrap}
.ph-load{font-size:12px;color:#64748b;animation:pulse 1.5s infinite}
.prac-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:10px;border-radius:10px;border:2px solid #78350f;background:#2d1a08;color:#fbbf24;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s}
.prac-btn:hover{background:#3d2010;border-color:#d97706}
.prac-btn.going{background:#b45309;border-color:#fbbf24;color:#fff;animation:pulse 1s infinite}
.score-box{background:#1e293b;border-radius:10px;padding:12px;margin-top:10px}
.score-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.score-lbl{font-size:11px;color:#64748b}
.score-num{font-size:20px;font-weight:700}
.score-bar{height:6px;background:#334155;border-radius:3px;overflow:hidden;margin-bottom:6px}
.score-fill{height:6px;border-radius:3px;transition:width .6s}
.fb{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:600}
.fb.g{background:#052e16;color:#4ade80;border:1px solid #166534}
.fb.y{background:#1c1a07;color:#facc15;border:1px solid #713f12}
.fb.r{background:#450a0a;color:#f87171;border:1px solid #991b1b}
.heard{font-size:11px;color:#94a3b8;margin-top:6px}
.heard span{color:#f1f5f9}

.tpill{display:flex;justify-content:center}
.tpill div{background:#1e293b;border-radius:20px;padding:6px 16px;font-size:12px;color:#94a3b8;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.err{margin:0 12px 8px;background:#450a0a;border:1px solid #7f1d1d;color:#fca5a5;font-size:12px;padding:8px 12px;border-radius:10px;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;line-height:1.5}
.warn{margin:0 12px 8px;background:#1c1a07;border:1px solid #713f12;color:#fcd34d;font-size:12px;padding:8px 12px;border-radius:10px;display:flex;align-items:flex-start;gap:8px;line-height:1.5}
.actions{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid #1e293b;background:#030712}
.mic-btn{display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 18px;border-radius:14px;border:2px solid;background:none;font-family:inherit;position:relative;transition:all .2s}
.mic-btn:disabled{opacity:.4;cursor:not-allowed}
.mic-btn.A{border-color:#164e63;color:#22d3ee;transform:rotate(180deg) scaleX(-1)}
.mic-btn.A:hover:not(:disabled){border-color:#0891b2;background:#0c1a26}
.mic-btn.A.rec{background:#0e7490;border-color:#22d3ee;color:#fff}
.mic-btn.B{border-color:#78350f;color:#fbbf24}
.mic-btn.B:hover:not(:disabled){border-color:#d97706;background:#1c1007}
.mic-btn.B.rec{background:#b45309;border-color:#fbbf24;color:#fff}
.mic-lbl{font-size:10px;font-weight:600}
.rdot{position:absolute;top:-4px;right:-4px;width:10px;height:10px;background:#ef4444;border-radius:50%;animation:pulse 1s infinite}
.cbtns{display:flex;flex-direction:column;gap:8px}
.ibtn{width:40px;height:40px;border-radius:50%;background:#1e293b;border:1px solid #334155;display:flex;align-items:center;justify-content:center;color:#94a3b8;transition:all .2s}
.ibtn:hover{background:#334155;color:#f1f5f9}
.clrbtn{background:none;border:none;color:#334155;display:flex;align-items:center}
.clrbtn:hover{color:#64748b}

.pov{position:absolute;bottom:0;left:0;right:0;background:#0f172a;border-top:1px solid #334155;border-radius:20px 20px 0 0;padding:20px 16px;z-index:50;max-height:80vh;overflow-y:auto}
.pov-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.pov-hdr h3{font-size:16px;font-weight:600}
.lrow{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.lrow span{font-size:12px;color:#64748b;white-space:nowrap}
.upz{border:2px dashed #334155;border-radius:14px;padding:36px;display:flex;flex-direction:column;align-items:center;gap:10px;color:#475569;cursor:pointer;transition:all .2s}
.upz:hover{border-color:#475569;color:#64748b}
.prev{width:100%;max-height:160px;object-fit:contain;border-radius:10px;border:1px solid #334155}
.rbox{background:#1e293b;border-radius:12px;padding:14px;margin-top:10px}
.rlbl{font-size:11px;color:#64748b;margin-bottom:3px}
.rorig{font-size:13px;color:#e2e8f0;margin-bottom:10px;line-height:1.5}
.rdivp{border-top:1px solid #334155;padding-top:10px;margin-bottom:3px}
.rtrans{font-size:13px;color:#67e8f9;font-weight:500;line-height:1.5}
.spkbtn{display:flex;align-items:center;gap:5px;font-size:11px;color:#64748b;background:none;border:none;cursor:pointer;margin-top:8px;font-family:inherit}
.spkbtn:hover{color:#94a3b8}
.rstbtn{display:flex;align-items:center;gap:4px;font-size:11px;color:#475569;background:none;border:none;cursor:pointer;margin-top:8px;font-family:inherit}
.proc{text-align:center;font-size:12px;color:#64748b;padding:16px;animation:pulse 1.5s infinite}

/* VIDEO TAB */
.vbody{flex:1;display:flex;flex-direction:column;overflow:hidden}

.vlang-bar{padding:10px 14px;background:#0f172a;border-bottom:1px solid #1e293b;display:flex;flex-direction:column;gap:8px}
.vlang-row{display:flex;align-items:center;gap:8px}
.vlang-lbl{font-size:11px;color:#64748b;white-space:nowrap;min-width:80px;font-weight:600}
.vlang-row select{flex:1;font-size:12px;padding:6px 10px}
.vtip{background:#0c1a26;border:1px solid #164e63;border-radius:10px;padding:8px 10px;font-size:11px;color:#67e8f9;line-height:1.5;display:flex;align-items:flex-start;gap:7px}
.vtip svg{flex-shrink:0;margin-top:1px;opacity:.8}

.vcam-wrap{position:relative;width:100%;background:#000;flex-shrink:0}
.vcam-placeholder{width:100%;height:210px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#334155;gap:10px;font-size:13px;background:#050d18}

/* subtitle overlay */
.sub-overlay{position:absolute;bottom:0;left:0;right:0;padding:10px 12px 12px;background:linear-gradient(transparent,rgba(0,0,0,.88));pointer-events:none;min-height:70px;display:flex;flex-direction:column;justify-content:flex-end;gap:3px}
.sub-interim{font-size:13px;color:rgba(255,255,255,.55);font-style:italic;line-height:1.4;text-shadow:0 1px 4px rgba(0,0,0,.8)}
.sub-original{font-size:12px;color:rgba(200,230,255,.8);line-height:1.4;text-shadow:0 1px 3px rgba(0,0,0,.8)}
.sub-translated{font-size:18px;font-weight:700;color:#fff;line-height:1.4;text-shadow:0 2px 8px rgba(0,0,0,.9),0 0 20px rgba(34,211,238,.35)}
.sub-translating{font-size:15px;font-weight:600;color:rgba(255,255,255,.5);animation:pulse 1s infinite}
.src-badge{position:absolute;top:8px;left:8px;background:rgba(0,0,0,.65);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:3px 8px;font-size:10px;font-weight:700;color:#22d3ee;pointer-events:none}
.rec-badge{position:absolute;top:8px;right:8px;display:flex;align-items:center;gap:5px;background:rgba(220,38,38,.85);border-radius:10px;padding:3px 8px;font-size:10px;font-weight:700;color:#fff}
.rec-dot-anim{width:7px;height:7px;background:#fff;border-radius:50%;animation:pulse 1s infinite;flex-shrink:0}

.sub-history{flex:1;overflow-y:auto;padding:8px 12px;display:flex;flex-direction:column;gap:6px;min-height:100px;max-height:180px}
.sub-empty{display:flex;align-items:center;justify-content:center;height:80px;color:#334155;font-size:12px;text-align:center;line-height:1.5}
.sub-item{background:#0f172a;border-radius:10px;padding:8px 12px;border-left:3px solid #0891b2}
.sub-item-meta{font-size:10px;color:#0891b2;margin-bottom:3px;font-weight:600}
.sub-item-orig{font-size:12px;color:#94a3b8;margin-bottom:3px;line-height:1.4}
.sub-item-trans{font-size:14px;color:#f1f5f9;font-weight:600;line-height:1.4}

.vbottom{padding:12px 14px;border-top:1px solid #1e293b;background:#030712}
.vstart-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:14px;font-size:15px;font-weight:700;border:2px solid;font-family:inherit;transition:all .2s}
.vstart-btn.idle{background:#0f172a;border-color:#164e63;color:#22d3ee}
.vstart-btn.idle:hover{background:#083344;border-color:#0891b2}
.vstart-btn.live{background:#0e7490;border-color:#22d3ee;color:#fff}
.vstart-btn.live:hover{background:#ef4444;border-color:#ef4444}
`;

// ── helpers ──
function leven(a,b){const m=a.length,n=b.length,dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);return dp[m][n];}
function simScore(t,h){const a=t.toLowerCase().replace(/[^\w\s\u3000-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0600-\u06FF]/g,"").trim(),b=h.toLowerCase().replace(/[^\w\s\u3000-\u9FFF\uAC00-\uD7AF\u0400-\u04FF\u0600-\u06FF]/g,"").trim();if(!a||!b)return 0;return Math.max(0,Math.round((1-leven(a,b)/Math.max(a.length,b.length))*100));}

async function myMemoryTranslate(text, from, to) {
  const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
  const d = await r.json();
  if (d.responseStatus === 200 && d.responseData.translatedText) return d.responseData.translatedText;
  throw new Error("translate_fail");
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
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:400,
          messages:[{ role:"user", content:`Buat panduan pengucapan untuk teks ${langName}: "${text}"\nFormat:\n1. IPA: [...]\n2. Baca seperti: [...suku kata pakai bunyi Indonesia...]\n3. Tips: [...satu tips untuk penutur Indonesia]\nGunakan teks biasa saja.` }]
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
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechCode; u.rate = speed;
    u.onstart=()=>setPlaying(true); u.onend=()=>setPlaying(false); u.onerror=()=>setPlaying(false);
    window.speechSynthesis.speak(u);
  };

  const startPrac = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Gunakan Chrome/Edge."); return; }
    const r = new SR(); pracRef.current = r;
    r.lang = speechCode; r.interimResults = false;
    setPracRec(true); setScore(null);
    r.onresult = e => { const h=e.results[0][0].transcript; setHeard(h); setScore(simScore(text,h)); setPracRec(false); };
    r.onend=()=>setPracRec(false); r.onerror=()=>setPracRec(false);
    r.start();
  };

  const sc=s=>s>=80?"#4ade80":s>=50?"#facc15":"#f87171";
  const fb=s=>s>=80?{l:"Sempurna! 🎉",c:"g"}:s>=50?{l:"Hampir! Coba lagi 👍",c:"y"}:{l:"Terus berlatih! 💪",c:"r"};

  return (
    <div className="lpanel">
      <div className="lp-title">📖 Pelajari Pengucapan {flag}</div>
      <div className="speed-row">
        <span>Kecepatan:</span>
        <input type="range" min="0.3" max="1.2" step="0.1" value={speed} onChange={e=>setSpeed(parseFloat(e.target.value))} style={{flex:1,accentColor:"#22d3ee"}}/>
        <span style={{color:"#22d3ee",minWidth:52}}>{speed<=0.5?"🐢 Pelan":speed>=1.1?"⚡ Cepat":"▶ Normal"}</span>
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

// ── VideoTab ──
function VideoTab() {
  const [srcLang, setSrcLang] = useState(LANGS[1]);  // bahasa yang diucapkan (default English)
  const [tgtLang, setTgtLang] = useState(LANGS[0]);  // terjemahan ke (default Indonesia)
  const [isLive, setIsLive] = useState(false);
  const [interim, setInterim] = useState("");
  const [lastOrig, setLastOrig] = useState("");
  const [lastTrans, setLastTrans] = useState("");
  const [translating, setTranslating] = useState(false);
  const [history, setHistory] = useState([]);
  const [camErr, setCamErr] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const srRef = useRef(null);
  const isLiveRef = useRef(false);
  const histEnd = useRef(null);

  useEffect(()=>{ histEnd.current?.scrollIntoView({behavior:"smooth"}); },[history]);
  useEffect(()=>()=>{ stopAll(); },[]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment" }, audio:false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      setCamErr("");
      return true;
    } catch {
      setCamErr("Izin kamera ditolak. Coba tanpa kamera — mikrofon tetap bisa menerjemahkan.");
      return false;
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t=>t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startSpeech = (src, tgt) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setCamErr("Fitur ini butuh Chrome atau Edge."); return; }

    const r = new SR();
    srRef.current = r;
    r.continuous = true;
    r.interimResults = true;
    r.lang = src.speech;  // ← KUNCI: harus spesifik, bukan ""

    r.onresult = async (e) => {
      let iText = "", fText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fText += e.results[i][0].transcript + " ";
        else iText += e.results[i][0].transcript;
      }
      setInterim(iText);
      if (fText.trim()) {
        setInterim("");
        const orig = fText.trim();
        setLastOrig(orig);
        setTranslating(true);
        try {
          const trans = await myMemoryTranslate(orig, src.code, tgt.code);
          setLastTrans(trans);
          setHistory(p => [...p, { id:Date.now(), orig, trans, srcFlag:src.flag, tgtFlag:tgt.flag, srcName:src.name }]);
        } catch {
          setLastTrans("⚠ Gagal — periksa koneksi");
        } finally {
          setTranslating(false);
        }
      }
    };

    r.onerror = (ev) => {
      if (ev.error === "not-allowed") setCamErr("Izin mikrofon ditolak.");
      else if (ev.error === "no-speech") {} // abaikan, akan auto-restart
      else if (ev.error === "network") setCamErr("Tidak ada koneksi internet.");
    };

    // auto-restart agar terus listen
    r.onend = () => {
      if (isLiveRef.current) {
        try { r.start(); } catch {}
      }
    };

    try { r.start(); } catch(e) { setCamErr("Gagal mulai mikrofon: " + e.message); }
  };

  const stopSpeech = () => {
    isLiveRef.current = false;
    try { srRef.current?.stop(); } catch {}
    srRef.current = null;
  };

  const stopAll = () => { stopCamera(); stopSpeech(); };

  const toggle = async () => {
    if (isLive) {
      setIsLive(false);
      isLiveRef.current = false;
      stopAll();
      setInterim(""); setLastOrig(""); setLastTrans("");
    } else {
      isLiveRef.current = true;
      setIsLive(true);
      await startCamera();
      startSpeech(srcLang, tgtLang);
    }
  };

  return (
    <div className="vbody">
      {/* Lang selector */}
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
          <div className="vtip">
            <AlertCircle size={13}/>
            <span>Pilih bahasa yang diucapkan dengan benar sebelum mulai — ini kunci agar terjemahan akurat. Untuk YouTube: dekatkan HP ke speaker.</span>
          </div>
        )}
      </div>

      {camErr && <div className="warn" style={{margin:"6px 12px"}}><AlertCircle size={13} style={{flexShrink:0,marginTop:1}}/><span>{camErr}</span></div>}

      {/* Camera */}
      <div className="vcam-wrap">
        {isLive
          ? <video ref={videoRef} muted playsInline autoPlay style={{width:"100%",minHeight:180,maxHeight:"50vw",objectFit:"cover",display:"block"}}/>
          : <div className="vcam-placeholder">
              <Video size={38} style={{opacity:.2}}/>
              <p style={{fontWeight:600}}>Tekan <span style={{color:"#22d3ee"}}>Mulai</span> untuk buka kamera</p>
              <p style={{fontSize:11,opacity:.5}}>Arahkan ke orang yang bicara</p>
            </div>
        }
        {isLive && <>
          <div className="src-badge">{srcLang.flag} {srcLang.name} → {tgtLang.flag}</div>
          <div className="rec-badge"><span className="rec-dot-anim"/>LIVE</div>
          <div className="sub-overlay">
            {interim && <div className="sub-interim">{interim}...</div>}
            {lastOrig && <div className="sub-original">〔{lastOrig}〕</div>}
            {translating
              ? <div className="sub-translating">⏳ Menerjemahkan...</div>
              : lastTrans && <div className="sub-translated">{tgtLang.flag} {lastTrans}</div>
            }
          </div>
        </>}
      </div>

      {/* History */}
      <div className="sub-history">
        {!history.length
          ? <div className="sub-empty">Hasil terjemahan akan muncul di sini<br/><span style={{opacity:.5,fontSize:11}}>setiap kalimat yang terdeteksi</span></div>
          : <>
            {history.map(h=>(
              <div key={h.id} className="sub-item">
                <div className="sub-item-meta">{h.srcFlag} {h.srcName} → {h.tgtFlag}</div>
                <div className="sub-item-orig">{h.orig}</div>
                <div className="sub-item-trans">{h.trans}</div>
              </div>
            ))}
            <div ref={histEnd}/>
          </>
        }
      </div>

      {/* Start/Stop */}
      <div className="vbottom">
        {history.length > 0 && !isLive && (
          <button onClick={()=>setHistory([])} style={{background:"none",border:"none",color:"#475569",fontSize:12,display:"flex",alignItems:"center",gap:4,marginBottom:8,cursor:"pointer"}}>
            <Trash2 size={12}/> Hapus riwayat
          </button>
        )}
        <button className={`vstart-btn ${isLive?"live":"idle"}`} onClick={toggle}>
          {isLive
            ? <><VideoOff size={18}/> Hentikan Terjemahan</>
            : <><Video size={18}/> Mulai Terjemahan Video</>
          }
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
  const [photoProc, setPhotoProc] = useState(false);
  const [error, setError] = useState("");
  const [openLearn, setOpenLearn] = useState(null);
  const recRef = useRef(null);
  const fileRef = useRef(null);
  const feedEnd = useRef(null);

  useEffect(()=>{
    const on=()=>setIsOnline(true), off=()=>setIsOnline(false);
    window.addEventListener("online",on); window.addEventListener("offline",off);
    return()=>{ window.removeEventListener("online",on); window.removeEventListener("offline",off); };
  },[]);
  useEffect(()=>{ feedEnd.current?.scrollIntoView({behavior:"smooth"}); },[messages,translating,openLearn]);

  const showErr=m=>{setError(m);setTimeout(()=>setError(""),4000);};
  const speak=(text,sc,rate=1)=>{ if(!window.speechSynthesis)return; window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang=sc; u.rate=rate; window.speechSynthesis.speak(u); };

  const startListen=side=>{
    if(!isOnline){showErr("Perlu internet untuk menerjemahkan.");return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){showErr("Gunakan Chrome/Edge.");return;}
    if(listening){recRef.current?.stop();return;}
    const src=side==="A"?langA:langB, tgt=side==="A"?langB:langA;
    const r=new SR(); recRef.current=r; r.lang=src.speech; r.interimResults=false; setListening(side);
    r.onresult=async e=>{
      const orig=e.results[0][0].transcript; setListening(null); setTranslating(true);
      try{ const trans=await myMemoryTranslate(orig,src.code,tgt.code); setMessages(p=>[...p,{id:Date.now(),side,orig,trans,src,tgt}]); speak(trans,tgt.speech); }
      catch{ showErr("Terjemahan gagal. Periksa koneksi."); } finally{ setTranslating(false); }
    };
    r.onend=()=>setListening(null);
    r.onerror=ev=>{setListening(null); showErr(ev.error==="not-allowed"?"Izin mikrofon ditolak.":"Gagal tangkap suara.");};
    r.start();
  };

  const handlePhoto=e=>{ const file=e.target.files[0]; if(!file)return; const reader=new FileReader();
    reader.onload=async ev=>{ const url=ev.target.result; setPhotoImg(url); setPhotoProc(true); setPhotoResult(null); const b64=url.split(",")[1];
      try{ const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:file.type,data:b64}},{type:"text",text:`Extract all text from this image and translate to ${photoTgt.name}. Reply ONLY valid JSON no markdown: {"original":"...","translated":"..."}`}]}]})}); const data=await res.json(); const txt=data.content.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim(); setPhotoResult(JSON.parse(txt)); }
      catch{ setPhotoResult({original:"Tidak ada teks.",translated:"No text found."}); } finally{ setPhotoProc(false); }
    };
    reader.readAsDataURL(file); e.target.value="";
  };

  const toggleLearn=id=>setOpenLearn(p=>p===id?null:id);
  const swapLangs=()=>{const t=langA;setLangA(langB);setLangB(t);};

  return (
    <>
      <style>{css}</style>
      <div className="app">

        <div className="header">
          <div className="logo">
            <div className="logo-icon">L</div>
            <span className="logo-name">LinguaT1</span>
          </div>
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
          <div className="bar-a">
            <select value={langA.code} onChange={e=>setLangA(LANGS.find(l=>l.code===e.target.value))}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}</select>
            <span className="bar-lbl">← Orang lain</span>
          </div>
          <div className="feed">
            {!messages.length&&!translating&&<div className="empty"><Volume2 size={28} style={{opacity:.3}}/><p>Tekan mikrofon untuk mulai bicara</p><p style={{fontSize:11,opacity:.6}}>Tap <strong style={{color:"#22d3ee"}}>Pelajari Ucapan</strong> setelah terjemahan muncul</p></div>}
            {messages.map(m=>(
              <div key={m.id} className={`bwrap ${m.side}`}>
                <div className={`bubble ${m.side}`}>
                  <div className="b-orig">{m.src.flag} {m.orig}</div>
                  <div className="bdiv"/>
                  <div className="b-trans">{m.tgt.flag} {m.trans}</div>
                </div>
                <button className={`learn-btn ${m.side} ${openLearn===m.id?"open":""}`} onClick={()=>toggleLearn(m.id)}>
                  <GraduationCap size={12}/>Pelajari Ucapan {m.tgt.flag}{openLearn===m.id?<ChevronUp size={11}/>:<ChevronDown size={11}/>}
                </button>
                {openLearn===m.id&&<LearnPanel text={m.trans} langName={m.tgt.name} speechCode={m.tgt.speech} flag={m.tgt.flag}/>}
              </div>
            ))}
            {translating&&<div className="tpill"><div>Menerjemahkan...</div></div>}
            <div ref={feedEnd}/>
          </div>
          {error&&<div className="err"><span>{error}</span><X size={13} style={{cursor:"pointer",flexShrink:0}} onClick={()=>setError("")}/></div>}
          <div className="bar-b">
            <select value={langB.code} onChange={e=>setLangB(LANGS.find(l=>l.code===e.target.value))}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}</select>
            <span className="bar-lbl">Kamu →</span>
          </div>
          <div className="actions">
            <button className={`mic-btn A ${listening==="A"?"rec":""}`} onClick={()=>startListen("A")} disabled={translating||(listening&&listening!=="A")}>
              {listening==="A"?<MicOff size={22}/>:<Mic size={22}/>}<span className="mic-lbl">{listening==="A"?"Berhenti":langA.name}</span>{listening==="A"&&<span className="rdot"/>}
            </button>
            <div className="cbtns">
              <button className="ibtn" onClick={swapLangs}><ArrowLeftRight size={15}/></button>
              <button className="ibtn" onClick={()=>{setShowPhoto(true);setPhotoImg(null);setPhotoResult(null);}}><Camera size={15}/></button>
            </div>
            <button className={`mic-btn B ${listening==="B"?"rec":""}`} onClick={()=>startListen("B")} disabled={translating||(listening&&listening!=="B")}>
              {listening==="B"?<MicOff size={22}/>:<Mic size={22}/>}<span className="mic-lbl">{listening==="B"?"Stop":langB.name}</span>{listening==="B"&&<span className="rdot"/>}
            </button>
          </div>
        </>}

        {tab==="video"&&<VideoTab/>}

        {showPhoto&&<div className="pov">
          <div className="pov-hdr"><h3>📷 Terjemah Foto</h3><button className="ibtn" onClick={()=>setShowPhoto(false)}><X size={16}/></button></div>
          <div className="lrow"><span>Terjemahkan ke:</span><select value={photoTgt.code} onChange={e=>setPhotoTgt(LANGS.find(l=>l.code===e.target.value))} style={{flex:1}}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}</select></div>
          {!photoImg
            ?<div className="upz" onClick={()=>fileRef.current?.click()}><ImageIcon size={28}/><span style={{fontSize:14}}>Tap untuk pilih gambar</span></div>
            :<div>
              <img src={photoImg} className="prev" alt="preview"/>
              {photoProc&&<div className="proc">Membaca teks dengan AI...</div>}
              {photoResult&&<div className="rbox">
                <div className="rlbl">Teks asli:</div><div className="rorig">{photoResult.original}</div>
                <div className="rdivp"><div className="rlbl">Terjemahan ({photoTgt.flag} {photoTgt.name}):</div><div className="rtrans">{photoResult.translated}</div></div>
                <button className="spkbtn" onClick={()=>speak(photoResult.translated,photoTgt.speech)}><Volume2 size={12}/>Putar audio</button>
              </div>}
              <button className="rstbtn" onClick={()=>{setPhotoImg(null);setPhotoResult(null);}}><RotateCcw size={12}/>Pilih gambar lain</button>
            </div>
          }
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
        </div>}
      </div>
    </>
  );
}
