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
  // ... tambahkan bahasa lain jika perlu
];

// ══════════════════════════════════════════════════════════════
//  TRANSLATION ENGINE
// ══════════════════════════════════════════════════════════════
const _tCache = new Map();
function fastTranslate(text, src, tgt) {
  const t = text.trim();
  if (!t || src === tgt) return text;
  const key = `${src}|${tgt}|${t}`;
  if (_tCache.has(key)) return _tCache.get(key);

  const promise = (async () => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${src}&tl=${tgt}&dt=t&q=${encodeURIComponent(t)}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("gtx");
      const d = await r.json();
      const result = d[0].map(x => x[0]).filter(Boolean).join("") || t;
      _tCache.set(key, result);
      return result;
    } catch {
      try {
        const r2 = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${src}|${tgt}`);
        const d2 = await r2.json();
        return d2.responseData?.translatedText || t;
      } catch { return t; }
    }
  })();
  _tCache.set(key, promise);
  return promise;
}

// ══════════════════════════════════════════════════════════════
//  CSS STYLES (Digabung biar rapi)
// ══════════════════════════════════════════════════════════════
const css = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0000;color:#f5f0e8;font-family:'Noto Sans',sans-serif}
.app{max-width:480px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:linear-gradient(160deg,#130000,#0a0000 60%,#1a0a00)}
button{cursor:pointer;font-family:inherit}select{background:#1c0505;color:#fde68a;border:1px solid #7f1d1d;border-radius:10px;padding:8px 10px;font-size:13px;outline:none;cursor:pointer}
select:hover{border-color:#f59e0b}
.header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(245,158,11,.25)}
.logo{display:flex;align-items:center;gap:10px}
.logo-icon{width:38px;height:38px;background:linear-gradient(135deg,#ef4444,#b91c1c);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;color:#fde68a}
.logo-name{font-weight:800;font-size:19px;background:linear-gradient(90deg,#fbbf24,#f87171);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.badge{display:flex;align-items:center;gap:5px;font-size:11px;padding:4px 10px;border-radius:20px;font-weight:600}
.badge.on{background:rgba(5,46,22,.8);color:#4ade80}.badge.off{background:rgba(127,29,29,.3);color:#fca5a5}
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
.b-orig{font-size:14px;font-weight:600;line-height:1.5;color:#fca5a5}.bubble.B .b-orig{color:#fbbf24}
.bdiv{border-top:1px solid rgba(255,255,255,.07);margin:6px 0}
.b-trans{font-size:13px;color:#d4c4a0;line-height:1.5}
.learn-btn{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;border:1px solid;background:none;font-family:inherit;align-self:flex-start;color:#f59e0b;border-color:rgba(245,158,11,.4)}
.bwrap.A .learn-btn{align-self:flex-end}
.lpanel{background:linear-gradient(135deg,#1c0505,#1a0a00);border-radius:14px;padding:14px;border:1px solid rgba(245,158,11,.25);max-width:82%;width:100%}
.play-btn{width:100%;padding:10px;border-radius:10px;border:1px solid rgba(239,68,68,.6);background:linear-gradient(135deg,#3d0000,#2d0a0a);color:#fca5a5;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:6px}
.prac-btn{width:100%;padding:10px;border-radius:10px;border:2px solid rgba(245,158,11,.5);background:linear-gradient(135deg,#2d1a00,#1c0f00);color:#fbbf24;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
.err{margin:0 12px 6px;background:rgba(127,29,29,.4);border:1px solid #7f1d1d;color:#fca5a5;font-size:12px;padding:8px 12px;border-radius:10px;display:flex;justify-content:space-between}
.actions{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid rgba(245,158,11,.2)}
.mic-btn{display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 18px;border-radius:14px;border:2px solid;background:none;position:relative}
.mic-btn.A{border-color:rgba(220,38,38,.5);color:#f87171;transform:rotate(180deg) scaleX(-1)}.mic-btn.B{border-color:rgba(180,83,9,.5);color:#fbbf24}
.mic-btn.rec{animation:pulse 1s infinite;color:#fff}.mic-btn.A.rec{background:rgba(220,38,38,.3)}.mic-btn.B.rec{background:rgba(180,83,9,.3)}
.mic-lbl{font-size:10px;font-weight:600}
.rdot{position:absolute;top:-4px;right:-4px;width:10px;height:10px;background:#ef4444;border-radius:50%;animation:pulse 1s infinite}
.cbtns{display:flex;flex-direction:column;gap:8px}
.ibtn{width:40px;height:40px;border-radius:50%;background:#1c0505;border:1px solid rgba(245,158,11,.3);display:flex;align-items:center;justify-content:center;color:#b45309}
.clrbtn{background:none;border:none;color:#5a2020}
.pov{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(180deg,#1c0505,#130000);border-radius:20px 20px 0 0;padding:20px 16px;z-index:50;max-height:80vh;overflow-y:auto}
.pov-hdr{display:flex;justify-content:space-between;margin-bottom:14px}.pov-hdr h3{color:#fde68a}
.lrow{display:flex;align-items:center;gap:8px;margin-bottom:12px}.lrow span{font-size:12px;color:#b45309;white-space:nowrap}
.upz{border:2px dashed rgba(245,158,11,.3);border-radius:14px;padding:36px;display:flex;flex-direction:column;align-items:center;gap:10px;color:#7f3d3d;cursor:pointer}
.prev{width:100%;max-height:160px;object-fit:contain;border-radius:10px}
.rbox{background:#0a0000;border-radius:12px;padding:14px;margin-top:10px;border:1px solid rgba(245,158,11,.15)}
.rlbl{font-size:11px;color:#b45309;margin-bottom:3px;font-weight:600}
.rorig{font-size:13px;color:#d4c4a0;margin-bottom:10px;line-height:1.5;white-space:pre-wrap}
.rdivp{border-top:1px solid rgba(255,255,255,.06);padding-top:10px;margin-bottom:3px}
.rtrans{font-size:13px;color:#fbbf24;font-weight:600;line-height:1.5;white-space:pre-wrap}
.spkbtn{font-size:11px;color:#7f3d3d;background:none;border:none;cursor:pointer;margin-top:8px;display:flex;align-items:center;gap:5px}
.rstbtn{font-size:11px;color:#5a2020;background:none;border:none;cursor:pointer;margin-top:8px;display:flex;align-items:center;gap:4px}
.proc{text-align:center;font-size:12px;color:#7f3d3d;padding:16px;animation:pulse 1.5s infinite}
.doc-body{flex:1;display:flex;flex-direction:column;overflow:hidden}
.doc-mode-bar{display:flex;gap:6px;padding:10px 12px;background:linear-gradient(180deg,#1c0505,#130000);border-bottom:1px solid rgba(245,158,11,.15)}
.doc-mode-btn{flex:1;padding:8px 4px;border-radius:10px;border:1px solid rgba(245,158,11,.3);background:none;color:#7f3d3d;font-size:11px;font-weight:700;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer}
.doc-mode-btn.active{background:linear-gradient(135deg,#2d1a00,#1c0f00);border-color:#f59e0b;color:#fbbf24}
.doc-lang-bar{padding:8px 12px;background:#130000;border-bottom:1px solid rgba(245,158,11,.12);display:flex;align-items:center;gap:8px}
.doc-upload-zone{flex:1;margin:14px 12px;border:2px dashed rgba(245,158,11,.3);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;padding:32px 16px;min-height:200px}
.doc-results{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:10px}
.doc-results-hdr{display:flex;justify-content:space-between;margin-bottom:2px}.doc-results-hdr span{font-size:12px;font-weight:700;color:#fbbf24}
.doc-clear-btn{background:none;border:1px solid rgba(239,68,68,.3);border-radius:8px;color:#f87171;font-size:11px;padding:3px 8px;cursor:pointer}
.doc-page{background:linear-gradient(135deg,#1c0505,#130000);border:1px solid rgba(245,158,11,.18);border-radius:14px;overflow:hidden;margin-bottom:10px}
.doc-page-hdr{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.05)}
.doc-thumb{width:52px;height:52px;object-fit:cover;border-radius:8px;border:1px solid rgba(245,158,11,.2)}
.doc-page-info{flex:1}.doc-page-num{font-size:12px;font-weight:700;color:#fbbf24;margin-bottom:4px}
.doc-page-status{font-size:11px;font-weight:600}
.doc-page-status.ocr{color:#f59e0b;animation:pulse 1.5s infinite}
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
//  TESSERACT LOADER
// ══════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════
//  ENGINE PREPROCESSING (CANGGIH)
// ══════════════════════════════════════════════════════════════

// Fungsi helper untuk bikin canvas dengan filter CSS
const createProcessedCanvas = (src, invert = false) => {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 1. UpSCALE 2.5x (Agar teks kecil jelas)
      const scale = 2.5;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // 2. Filter CSS Super Strong
      // Grayscale: Ubah jadi hitam putih
      // Contrast: Mempertajam perbedaan teks dan background
      // Invert: Membalik warna (Putih -> Hitam, Merah -> Putih)
      ctx.filter = `grayscale(100%) contrast(250%) brightness(110%) ${invert ? 'invert(100%)' : ''}`;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({ canvas, width: canvas.width, height: canvas.height, scale });
    };
    img.src = src;
  });
};

// ── LearnPanel (Singkat) ──
function LearnPanel({ text, speechCode }) {
  const [speed, setSpeed] = useState(0.8);
  const [playing, setPlaying] = useState(false);
  const pracRef = useRef(null);

  const playAudio = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang=speechCode; u.rate=speed;
    u.onstart=()=>setPlaying(true); u.onend=()=>setPlaying(false);
    window.speechSynthesis.speak(u);
  };
  
  return (
    <div className="lpanel">
      <div style={{fontSize:11,fontWeight:700,color:"#f59e0b",marginBottom:10}}>📖 Pelajari</div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:11,color:"#b45309"}}>Speed:</span>
        <input type="range" min="0.3" max="1.2" step="0.1" value={speed} onChange={e=>setSpeed(parseFloat(e.target.value))} style={{flex:1,accentColor:"#22d3ee"}}/>
      </div>
      <button className={`play-btn ${playing?"going":""}`} onClick={playAudio}><Volume2 size={15}/> {playing?"Playing...":"Listen"}</button>
    </div>
  );
}

// ── ComicCanvas ──
function wrapCanvasText(ctx, text, cx, cy, maxW, lineH) {
  const tokens = text.split(/\s+/); const lines = []; let line = "";
  for (const t of tokens) {
    const test = line + (line ? " " : "") + t;
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
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      (bubbles || []).forEach(b => {
        const x = (b.x/100)*canvas.width, y = (b.y/100)*canvas.height;
        const w = (b.w/100)*canvas.width, h = (b.h/100)*canvas.height;
        if (w < 4 || h < 4) return;
        ctx.fillStyle = "rgba(255,255,255,0.96)"; ctx.fillRect(x, y, w, h);
        const txt = b.translated || b.text || ""; if(!txt) return;
        const fontSize = Math.max(10, Math.min(w / Math.max(txt.length*0.6, 3), h*0.4, 22));
        ctx.font = `700 ${fontSize}px 'Noto Sans',Arial`; ctx.fillStyle = "#0a0000";
        ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        wrapCanvasText(ctx, txt, x+w/2, y+h/2, w, fontSize*1.3);
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
//  DOCUMENT TAB (FIX: DUAL PASS UNIVERSAL)
// ══════════════════════════════════════════════════════════════
function DocumentTab() {
  const [mode, setMode] = useState("komik");
  const [tgtLang, setTgtLang] = useState(LANGS[0]);
  const [pages, setPages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef(null);
  const resultsEnd = useRef(null);

  const MODES = {
    komik: { icon: "🎭", label: "Komik", hint: "Baca teks warna apapun", multi: true },
    buku: { icon: "📚", label: "Buku", hint: "Scan halaman buku", multi: true },
  };

  useEffect(() => { resultsEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [pages]);

  // Engine utama: Dual Pass (Normal + Inverted)
  const processPage = async (id, imgSrc, tgt) => {
    const updatePage = (patch) => setPages(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    updatePage({ status: "ocr" });

    try {
      if (!window.Tesseract) await loadTesseract();
      
      const worker = await window.Tesseract.createWorker('eng+ind', 1, {
        logger: m => console.log(m.status)
      });
      
      // PSM 3 (Auto) lebih stabil untuk blok teks besar & kecil
      await worker.setParameters({ tessedit_pageseg_mode: '3' });

      const allLines = [];

      // === PASS 1: NORMAL (High Contrast) ===
      // Tangkap teks HITAM di atas PUTIH
      const pass1 = await createProcessedCanvas(imgSrc, false);
      const res1 = await worker.recognize(pass1.canvas);
      (res1.data.lines || []).forEach(l => {
        if (l.text.trim().length > 1 && l.confidence > 40) {
          allLines.push({
            bbox: l.bbox, text: l.text.trim(), confidence: l.confidence,
            scale: pass1.scale
          });
        }
      });

      // === PASS 2: INVERTED ===
      // Tangkap teks PUTIH di atas MERAH/HITAM
      // Dengan membalik, teks putih jadi HITAM, background jadi PUTIH
      const pass2 = await createProcessedCanvas(imgSrc, true);
      const res2 = await worker.recognize(pass2.canvas);
      (res2.data.lines || []).forEach(l => {
        if (l.text.trim().length > 1 && l.confidence > 40) {
          allLines.push({
            bbox: l.bbox, text: l.text.trim(), confidence: l.confidence,
            scale: pass2.scale // use scale from pass2
          });
        }
      });

      await worker.terminate();

      // === MERGE & DEDUPLICATE ===
      // Sederhanakan: jika text mirip, ambil yang confidence tinggi
      // Untuk simpelnya, kita ambil semua unik
      const uniqueLines = [];
      const seenTexts = new Set();
      // Sort by confidence desc
      allLines.sort((a,b) => b.confidence - a.confidence);
      
      for (const line of allLines) {
        const key = line.text.toLowerCase().replace(/\s/g,"");
        // Cegah duplikasi teks persis
        if (!seenTexts.has(key)) {
          seenTexts.add(key);
          uniqueLines.push(line);
        }
      }

      // === CONVERT TO BUBBLES / TEXT ===
      const img = new Image();
      img.src = imgSrc;
      await new Promise(r => img.onload = r);
      const W = img.naturalWidth;
      const H = img.naturalHeight;

      if (mode === "komik") {
        const bubbles = uniqueLines.map(line => {
          // bbox adalah pixel di canvas UPSCALED. Kita bagi scale.
          const x0 = line.bbox.x0 / line.scale;
          const y0 = line.bbox.y0 / line.scale;
          const x1 = line.bbox.x1 / line.scale;
          const y1 = line.bbox.y1 / line.scale;
          
          return {
            x: (x0 / W) * 100,
            y: (y0 / H) * 100,
            w: ((x1 - x0) / W) * 100,
            h: ((y1 - y0) / H) * 100,
            text: line.text
          };
        }).filter(b => b.w > 0 && b.h > 0);

        updatePage({ status: "translating", bubbles: bubbles.map(b => ({ ...b, translated: "" })) });
        const translations = await Promise.all(bubbles.map(b => fastTranslate(b.text, "auto", tgt.code)));
        const finalBubbles = bubbles.map((b, i) => ({ ...b, translated: translations[i] || b.text }));
        updatePage({ bubbles: finalBubbles, status: "done" });

      } else {
        // Buku mode
        const fullText = uniqueLines.map(l => l.text).join("\n");
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
    const files = Array.from(e.target.files); if(!files.length) return;
    setProcessing(true);
    const raw = await Promise.all(files.map((file, i) => new Promise(res => {
      const reader = new FileReader();
      reader.onload = ev => res({ id: i, img: ev.target.result });
      reader.readAsDataURL(file);
    })));
    setPages(raw.map(p => ({ ...p, orig: "", trans: "", bubbles: null, status: "pending" })));
    for (const p of raw) await processPage(p.id, p.img, tgtLang);
    setProcessing(false);
    e.target.value = "";
  };

  return (
    <div className="doc-body">
      <div className="doc-mode-bar">
        {Object.entries(MODES).map(([key, md]) => (
          <button key={key} className={`doc-mode-btn ${mode === key ? "active" : ""}`} onClick={()=>{setMode(key); setPages([]);}}>
            <span style={{fontSize:18}}>{md.icon}</span>{md.label}
          </button>
        ))}
      </div>
      <div className="doc-lang-bar">
        <span style={{fontSize:11,color:"#b45309",fontWeight:700}}>Ke:</span>
        <select value={tgtLang.code} onChange={e => setTgtLang(LANGS.find(l => l.code === e.target.value))} style={{flex:1}}>
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
        </select>
      </div>

      {!pages.length && (
        <div className="doc-upload-zone" onClick={() => fileRef.current?.click()}>
          <div style={{fontSize:42}}>📷</div>
          <div style={{fontSize:15,fontWeight:700,color:"#fbbf24"}}>Upload Gambar</div>
          <div style={{fontSize:11,color:"#5a2020",display:"flex",alignItems:"center",gap:4}}>
            <Zap size={11}/> Universal Engine (White/Dark Text)
          </div>
        </div>
      )}

      <div className="doc-results">
        {pages.map((p, i) => (
          <div key={p.id} className={`doc-page ${p.status}`}>
            <div className="doc-page-hdr">
              <img src={p.img} className="doc-thumb" alt=""/>
              <div className="doc-page-info">
                <div className="doc-page-num">Halaman {i + 1}</div>
                <div className={`doc-page-status ${p.status}`}>
                  {p.status === "ocr" && "🔍 Scanning (Dual Mode)..."}
                  {p.status === "done" && "✅ Selesai"}
                </div>
              </div>
            </div>
            {mode === "komik" && p.status === "done" && (
              p.bubbles && p.bubbles.length > 0
                ? <ComicCanvas imgSrc={p.img} bubbles={p.bubbles} pageNum={i + 1}/>
                : <div className="comic-no-bubble">Tidak ada teks</div>
            )}
            {mode !== "komik" && p.status === "done" && (
              <div className="doc-page-content">
                <div className="doc-text-block orig">
                  <div className="doc-text-lbl">📝 ASLI</div>
                  <div className="doc-text-body">{p.orig}</div>
                </div>
                <div className="doc-text-block trans">
                  <div className="doc-text-lbl">TERJEMAHAN</div>
                  <div className="doc-text-body">{p.trans}</div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={resultsEnd}/>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleFiles}/>
    </div>
  );
}

// ── VideoTab & Main App (Singkat) ──
function VideoTab() {
  const [srcLang, setSrcLang] = useState(LANGS[1]); const [tgtLang, setTgtLang] = useState(LANGS[0]);
  const [isLive, setIsLive] = useState(false); const [subtitle, setSubtitle] = useState("");
  const videoRef = useRef(null); const srRef = useRef(null); const streamRef = useRef(null);

  const toggle = async () => {
    if (isLive) {
      setIsLive(false); streamRef.current?.getTracks().forEach(t=>t.stop()); try{srRef.current?.stop()}catch{}; 
    } else {
      setIsLive(true);
      const stream = await navigator.mediaDevices.getUserMedia({video:true}); streamRef.current=stream;
      if(videoRef.current) videoRef.current.srcObject = stream;
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(SR){ const r = new SR(); srRef.current=r; r.continuous=true; r.interimResults=true; r.lang=srcLang.speech;
        r.onresult=async e=>{ let t=""; for(let i=e.resultIndex; i<e.results.length;i++) t+=e.results[i][0].transcript;
          setSubtitle(await fastTranslate(t, srcLang.code, tgtLang.code)); };
        r.start(); }
    }
  };

  return (
    <div className="doc-body" style={{background:"#000",justifyContent:"center",alignItems:"center"}}>
      {isLive && <video ref={videoRef} muted playsInline autoPlay style={{position:"absolute",width:"100%",height:"100%",objectFit:"cover"}}/>}
      {isLive && subtitle && <div style={{position:"absolute",bottom:120,zIndex:10,textAlign:"center",padding:"0 20px"}}><span style={{background:"rgba(0,0,0,0.8)",padding:"8px 16px",borderRadius:"20px",color:"#fff",fontWeight:700}}>{subtitle}</span></div>}
      <div style={{position:"absolute",bottom:20,left:0,right:20,zIndex:20,display:"flex",gap:10}}>
        {!isLive && <select value={srcLang.code} onChange={e=>setSrcLang(LANGS.find(l=>l.code===e.target.value))} style={{flex:1}}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag}</option>)}</select>}
        <button onClick={toggle} style={{flex:2,padding:12,borderRadius:12,background:isLive?"#ef4444":"#fbbf24",color:"#000",fontWeight:700,border:"none"}}>{isLive?"Stop":"Start"}</button>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("talk");
  const [langA, setLangA] = useState(LANGS[0]); const [langB, setLangB] = useState(LANGS[1]);
  const [messages, setMessages] = useState([]); const [listening, setListening] = useState(null);
  const [showPhoto, setShowPhoto] = useState(false); const [photoImg, setPhotoImg] = useState(null);
  const [photoResult, setPhotoResult] = useState(null);
  const recRef = useRef(null); const fileRef = useRef(null);

  const startListen = side => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR || listening) return; const r = new SR(); recRef.current=r; r.lang=(side==="A"?langA:langB).speech; r.interimResults=false; setListening(side);
    r.onresult=async e=>{ const orig=e.results[0][0].transcript; setListening(null); const tgt=side==="A"?langB:langA;
      const trans = await fastTranslate(orig, (side==="A"?langA:langB).code, tgt.code);
      setMessages(p=>[...p,{id:Date.now(),side,orig,trans,src:side==="A"?langA:langB,tgt}]);
    };
    r.start();
  };

  const handlePhoto = async e => {
    const file = e.target.files[0]; if(!file) return; const reader = new FileReader();
    reader.onload = async ev => {
      const url = ev.target.result; setPhotoImg(url); setPhotoResult({original:"Scanning...",translated:""});
      if(!window.Tesseract) await loadTesseract();
      // Gunakan fungsi scan yang sama dengan Dokumen (Dual Pass)
      // Sederhanakan untuk foto: pakai inverted biasa karena biasanya foto dokumen
      const img = new Image(); img.src = url; await new Promise(r=>img.onload=r);
      const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
      const scale=2; canvas.width=img.width*scale; canvas.height=img.height*scale;
      ctx.filter = `grayscale(100%) contrast(250%) invert(100%)`; // Fotokan dokumen biasanya butuh invert
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const w = await window.Tesseract.createWorker('eng+ind',1);
      const {data:{text}} = await w.recognize(canvas); await w.terminate();
      const translated = await fastTranslate(text, "auto", "id");
      setPhotoResult({original:text, translated});
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="logo"><div className="logo-icon">TL</div><span className="logo-name">translaf</span></div>
          <div className="badge on">Online</div>
        </div>
        <div className="tabs">
          <button className={`tab ${tab==="talk"?"active":""}`} onClick={()=>setTab("talk")}><MessageCircle size={14}/>Chat</button>
          <button className={`tab ${tab==="video"?"active":""}`} onClick={()=>setTab("video")}><Video size={14}/>Video</button>
          <button className={`tab ${tab==="doc"?"active":""}`} onClick={()=>setTab("doc")}><BookOpen size={14}/>Dokumen</button>
        </div>

        {tab === "talk" && <>
          <div className="bar-a"><select value={langA.code} onChange={e=>setLangA(LANGS.find(l=>l.code===e.target.value))}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag}</option>)}</select><span className="bar-lbl">← A</span></div>
          <div className="feed">
            {messages.map(m=>(
              <div key={m.id} className={`bwrap ${m.side}`}>
                <div className={`bubble ${m.side}`}><div className="b-orig">{m.orig}</div><div className="bdiv"/><div className="b-trans">{m.trans}</div></div>
              </div>
            ))}
          </div>
          <div className="bar-b"><select value={langB.code} onChange={e=>setLangB(LANGS.find(l=>l.code===e.target.value))}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.flag}</option>)}</select><span className="bar-lbl">B →</span></div>
          <div className="actions">
            <button className={`mic-btn A ${listening==="A"?"rec":""}`} onClick={()=>startListen("A")}><Mic size={22}/><span className="mic-lbl">{langA.name}</span></button>
            <div className="cbtns"><button className="ibtn" onClick={()=>{const t=langA;setLangA(langB);setLangB(t)}}><ArrowLeftRight size={15}/></button><button className="ibtn" onClick={()=>{setShowPhoto(true);setPhotoImg(null)}}><Camera size={15}/></button></div>
            <button className={`mic-btn B ${listening==="B"?"rec":""}`} onClick={()=>startListen("B")}><Mic size={22}/><span className="mic-lbl">{langB.name}</span></button>
          </div>
        </>}

        {tab === "video" && <VideoTab/>}
        {tab === "doc" && <DocumentTab/>}

        {showPhoto && <div className="pov">
          <div className="pov-hdr"><h3>📷 Foto</h3><button className="ibtn" onClick={()=>setShowPhoto(false)}><X size={16}/></button></div>
          {!photoImg ? <div className="upz" onClick={()=>fileRef.current?.click()}><ImageIcon size={28}/> Tap untuk pilih</div> :
          <div>
            <img src={photoImg} className="prev" alt=""/>
            {photoResult && <div className="rbox"><div className="rlbl">Original:</div><div className="rorig">{photoResult.original}</div><div className="rdivp"/><div className="rlbl">Trans:</div><div className="rtrans">{photoResult.translated}</div></div>}
          </div>}
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
        </div>}
      </div>
    </>
  );
}