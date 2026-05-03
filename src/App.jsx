import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, Camera, ArrowLeftRight, Volume2, WifiOff, X,
  ImageIcon, RotateCcw, Trash2, GraduationCap, ChevronDown,
  ChevronUp, Video, VideoOff, MessageCircle, Zap,
  BookOpen, FileText
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
  // ... tambah bahasa lain jika perlu
];

// ══════════════════════════════════════════════════════════════
//  TRANSLATION ENGINE
// ══════════════════════════════════════════════════════════════
const _tCache = new Map();
async function fastTranslate(text, src, tgt) {
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
    } catch { return t; }
  })();
  _tCache.set(key, promise);
  return promise;
}

// ══════════════════════════════════════════════════════════════
//  CSS STYLES
// ══════════════════════════════════════════════════════════════
const css = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0000;color:#f5f0e8;font-family:'Noto Sans',sans-serif}
.app{max-width:480px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:linear-gradient(160deg,#130000,#0a0000 60%,#1a0a00)}
button{cursor:pointer;font-family:inherit}select{background:#1c0505;color:#fde68a;border:1px solid #7f1d1d;border-radius:10px;padding:8px 10px;font-size:13px;outline:none;cursor:pointer}
.header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(245,158,11,.25)}
.logo{display:flex;align-items:center;gap:10px}
.logo-icon{width:38px;height:38px;background:linear-gradient(135deg,#ef4444,#b91c1c);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;color:#fde68a}
.logo-name{font-weight:800;font-size:19px;background:linear-gradient(90deg,#fbbf24,#f87171);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.badge{display:flex;align-items:center;gap:5px;font-size:11px;padding:4px 10px;border-radius:20px;font-weight:600}
.badge.on{background:rgba(5,46,22,.8);color:#4ade80}
.tabs{display:flex;border-bottom:1px solid rgba(245,158,11,.2);background:#130000}
.tab{flex:1;padding:11px 4px;font-size:12px;font-weight:600;border:none;background:none;color:#7f3d3d;display:flex;align-items:center;justify-content:center;gap:5px;border-bottom:2px solid transparent}
.tab.active{color:#fbbf24;border-bottom-color:#f59e0b}
.bar-a{background:linear-gradient(90deg,#2d0a0a,#1c0505);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;transform:rotate(180deg) scaleX(-1)}
.bar-b{background:linear-gradient(90deg,#1c0505,#2d0a0a);padding:10px 16px;display:flex;align-items:center;justify-content:space-between}
.bar-lbl{font-size:11px;color:#b45309}.feed{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:12px;min-height:240px;max-height:340px}
.bwrap{display:flex;flex-direction:column;gap:4px}.bwrap.A{align-items:flex-end}.bwrap.B{align-items:flex-start}
.bubble{max-width:82%;border-radius:16px;padding:10px 14px}
.bubble.A{background:linear-gradient(135deg,#3d1010,#2d0a0a);border:1px solid rgba(220,38,38,.5);border-top-right-radius:4px}
.bubble.B{background:linear-gradient(135deg,#2d1a00,#1c0f00);border:1px solid rgba(180,83,9,.4);border-top-left-radius:4px}
.b-orig{font-size:14px;font-weight:600;line-height:1.5;color:#fca5a5}.bubble.B .b-orig{color:#fbbf24}
.bdiv{border-top:1px solid rgba(255,255,255,.07);margin:6px 0}
.b-trans{font-size:13px;color:#d4c4a0;line-height:1.5}
.err{margin:0 12px 6px;background:rgba(127,29,29,.4);border:1px solid #7f1d1d;color:#fca5a5;font-size:12px;padding:8px 12px;border-radius:10px;display:flex;justify-content:space-between}
.actions{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid rgba(245,158,11,.2)}
.mic-btn{display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 18px;border-radius:14px;border:2px solid;background:none;position:relative}
.mic-btn.A{border-color:rgba(220,38,38,.5);color:#f87171;transform:rotate(180deg) scaleX(-1)}.mic-btn.B{border-color:rgba(180,83,9,.5);color:#fbbf24}
.mic-btn.rec{animation:pulse 1s infinite;color:#fff}
.mic-lbl{font-size:10px;font-weight:600}
.rdot{position:absolute;top:-4px;right:-4px;width:10px;height:10px;background:#ef4444;border-radius:50%;animation:pulse 1s infinite}
.cbtns{display:flex;flex-direction:column;gap:8px}
.ibtn{width:40px;height:40px;border-radius:50%;background:#1c0505;border:1px solid rgba(245,158,11,.3);display:flex;align-items:center;justify-content:center;color:#b45309}
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
//  ENGINE UNIVERSAL PREPROCESSING (CANGGIH)
//  Menggunakan manipulasi pixel manual untuk Binary Image
// ══════════════════════════════════════════════════════════════

// Fungsi helper untuk manipulasi pixel langsung
// Threshold: Semua pixel di atas threshold jadi Putih, di bawah jadi Hitam
const createBinaryCanvas = (src, invert = false) => {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 1. UPSCALE 400% (Super Resolution)
      // Penting untuk teks kecil
      const scale = 4;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // Matikan smoothing biar tetap tajam
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. AMBIL DATA PIXEL
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // 3. LOOP SETIAP PIXEL
      // Proses: Grayscale -> (Invert jika perlu) -> Threshold (Binarization)
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // A. Grayscale (Rata-rata terbobot)
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // B. Logika Invert
        // Jika invert=true (untuk teks putih), kita balik nilai brightness
        if (invert) {
          gray = 255 - gray;
        }

        // C. Threshold (Binarization)
        // Semua yang terang jadi Putih (255), gelap jadi Hitam (0)
        // Angka 128 adalah titik tengah.
        // Untuk teks yang tipis, bisa dinaikkan jadi 140.
        const threshold = 140; 
        const binary = gray > threshold ? 255 : 0;

        // Terapkan ke pixel
        data[i] = binary;
        data[i + 1] = binary;
        data[i + 2] = binary;
        // Alpha tetap 255
      }

      // 4. TULIS KEMBALI KE CANVAS
      ctx.putImageData(imageData, 0, 0);
      resolve({ canvas, scale });
    };
    img.src = src;
  });
};

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
//  DOCUMENT TAB (UNIVERSAL ENGINE)
// ══════════════════════════════════════════════════════════════
function DocumentTab() {
  const [mode, setMode] = useState("komik");
  const [tgtLang, setTgtLang] = useState(LANGS[0]);
  const [pages, setPages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef(null);
  const resultsEnd = useRef(null);

  const MODES = {
    komik: { icon: "🎭", label: "Komik", hint: "Scan teks warna apapun", multi: true },
    buku: { icon: "📚", label: "Buku", hint: "Scan halaman buku", multi: true },
  };

  useEffect(() => { resultsEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [pages]);

  // ENGINE UTAMA: DUAL PASS (NORMAL + INVERTED)
  const processPage = async (id, imgSrc, tgt) => {
    const updatePage = (patch) => setPages(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    updatePage({ status: "ocr" });

    try {
      if (!window.Tesseract) await loadTesseract();
      
      const worker = await window.Tesseract.createWorker('eng+ind', 1, {
        logger: m => console.log(m.status)
      });
      await worker.setParameters({ tessedit_pageseg_mode: '3' });

      const allLines = [];

      // === PASS 1: NORMAL (Dark Text) ===
      // Menangkap teks hitam di atas putih
      const pass1 = await createBinaryCanvas(imgSrc, false); // false = jangan invert
      const res1 = await worker.recognize(pass1.canvas);
      (res1.data.lines || []).forEach(l => {
        if (l.text.trim().length > 1 && l.confidence > 40) {
          allLines.push({ bbox: l.bbox, text: l.text.trim(), confidence: l.confidence, scale: pass1.scale });
        }
      });

      // === PASS 2: INVERTED (Light Text) ===
      // MENANGKAP TEKS PUTIH!
      // Logika: Kita balik pixel (Putih jadi Hitam).
      // Teks putih di merah: jadi Teks Hitam di Cyan.
      // Threshold: Hitam jadi Hitam, Cyan jadi Putih.
      // Hasil: Teks Hitam di atas Putih. OCR Bisa Baca.
      const pass2 = await createBinaryCanvas(imgSrc, true); // true = INVERT
      const res2 = await worker.recognize(pass2.canvas);
      (res2.data.lines || []).forEach(l => {
        if (l.text.trim().length > 1 && l.confidence > 40) {
          allLines.push({ bbox: l.bbox, text: l.text.trim(), confidence: l.confidence, scale: pass2.scale });
        }
      });

      await worker.terminate();

      // === MERGE RESULTS ===
      // Hapus duplikat berdasarkan posisi (y) dan teks
      const uniqueLines = [];
      const seen = new Set();
      
      // Sort by Y position
      allLines.sort((a,b) => a.bbox.y0 - b.bbox.y0);

      for (const line of allLines) {
        const key = `${Math.round(line.bbox.y0)}-${line.text}`; // Key sederhana
        if (!seen.has(key)) {
          seen.add(key);
          uniqueLines.push(line);
        }
      }

      // === CONVERT TO BUBBLES ===
      const img = new Image();
      img.src = imgSrc;
      await new Promise(r => img.onload = r);
      const W = img.naturalWidth;
      const H = img.naturalHeight;

      if (mode === "komik") {
        const bubbles