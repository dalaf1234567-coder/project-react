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
//  CSS STYLES - LENGKAP
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
.proc{text-align:center;font-size:12px;color:#7f3d3d;padding:16px;animation:pulse 1.5s infinite}
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
//  BINARY IMAGE PROCESSING
// ══════════════════════════════════════════════════════════════
const createBinaryCanvas = (src, invert = false) => {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const scale = 4;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;
        if (invert) gray = 255 - gray;
        const threshold = 140;
        const binary = gray > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = binary;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve({ canvas, scale });
    };
    img.src = src;
  });
};

// ══════════════════════════════════════════════════════════════
//  COMIC CANVAS RENDERER
// ══════════════════════════════════════════════════════════════
function wrapCanvasText(ctx, text, cx, cy, maxW, lineH) {
  const tokens = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  
  for (const token of tokens) {
    const testLine = line ? `${line} ${token}` : token;
    if (ctx.measureText(testLine).width > maxW - 16 && line !== "") {
      lines.push(line);
      line = token;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  
  const totalH = lines.length * lineH;
  const startY = cy - totalH / 2 + lineH * 0.8;
  
  lines.forEach((l, i) => {
    ctx.fillText(l, cx, startY + i * lineH);
  });
}

function ComicCanvas({ imgSrc, bubbles, pageNum }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !imgSrc || !bubbles?.length) {
      setError(!bubbles?.length);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0);
        
        bubbles.forEach(b => {
          if (!b.translated || b.w < 3 || b.h < 2) return;
          
          const x = (b.x / 100) * canvas.width;
          const y = (b.y / 100) * canvas.height;
          const w = (b.w / 100) * canvas.width;
          const h = (b.h / 100) * canvas.height;
          
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.fillRect(x, y, w, h);
          
          const fontSize = Math.max(12, Math.min(w / (b.translated.length * 0.55), h * 0.45, 28));
          ctx.font = `bold ${fontSize}px 'Noto Sans', sans-serif`;
          ctx.fillStyle = "#0a0000";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          wrapCanvasText(ctx, b.translated, x + w/2, y + h/2, w - 12, fontSize * 1.25);
        });
        
        setReady(true);
        setError(false);
      } catch (e) {
        setError(true);
      }
    };
    
    img.onerror = () => setError(true);
    img.src = imgSrc;
  }, [imgSrc, bubbles]);

  const download = useCallback(() => {
    if (!canvasRef.current || !ready) return;
    const a = document.createElement("a");
    a.download = `komik-${pageNum || 'page'}.png`;
    a.href = canvasRef.current.toDataURL("image/png", 0.95);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [ready, pageNum]);

  if (error || !bubbles?.length) {
    return <div className="comic-no-bubble">🤷 Tidak ada teks terdeteksi</div>;
  }

  return (
    <div className="comic-canvas-wrap">
      <canvas ref={canvasRef} className="comic-canvas" />
      {ready && (
        <button className="comic-dl-btn" onClick={download}>
          ⬇ Download Halaman {pageNum}
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  DOCUMENT TAB - ENGINE UTAMA
// ══════════════════════════════════════════════════════════════
function DocumentTab() {
  const [mode, setMode] = useState("komik");
  const [tgtLang, setTgtLang] = useState(LANGS[0]);
  const [pages, setPages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef(null);
  const resultsEnd = useRef(null);

  const MODES = {
    komik: { icon: "🎭", label: "Komik", hint: "Scan teks warna apapun" },
    buku: { icon: "📚", label: "Buku", hint: "Scan halaman buku" },
  };

  useEffect(() => { resultsEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [pages]);

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

      // PASS 1: NORMAL
      const pass1 = await createBinaryCanvas(imgSrc, false);
      const res1 = await worker.recognize(pass1.canvas);
      (res1.data.lines || []).forEach(l => {
        if (l.text.trim().length > 1 && l.confidence > 40) {
          allLines.push({ bbox: l.bbox, text: l.text.trim(), confidence: l.confidence });
        }
      });

      // PASS 2: INVERTED (TEKS PUTIH!)
      const pass2 = await createBinaryCanvas(imgSrc, true);
      const res2 = await worker.recognize(pass2.canvas);
      (res2.data.lines || []).forEach(l => {
        if (l.text.trim().length > 1 && l.confidence > 40) {
          allLines.push({ bbox: l.bbox, text: l.text.trim(), confidence: l.confidence });
        }
      });

      await worker.terminate();

      // MERGE & DEDUPE
      const uniqueLines = [];
      const seen = new Set();
      allLines.sort((a,b) => a.bbox.y0 - b.bbox.y0);

      for (const line of allLines) {
        const key = `${Math.round(line.bbox.y0)}-${line.text.substring(0,20)}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueLines.push(line);
        }
      }

      // GET IMAGE DIMENSIONS
      const img = new Image();
      img.src = imgSrc;
      await new Promise(r => img.onload = r);
      const W = img.naturalWidth;
      const H = img.naturalHeight;

      if (mode === "komik") {
        const bubbles = uniqueLines
          .filter(line => line.text.trim().length > 1)
          .map(line => {
            const x = Math.max(0, (line.bbox.x0 / W) * 100);
            const y = Math.max(0, (line.bbox.y0 / H) * 100);
            const w = Math.min(100, ((line.bbox.x1 - line.bbox.x0) / W) * 100);
            const h = Math.min(100, ((line.bbox.y1 - line.bbox.y0) / H) * 100);
            return { 
              x: Math.round(x * 10) / 10,
              y: Math.round(y * 10) / 10,
              w: Math.max(3, Math.round(w * 10) / 10),
              h: Math.max(2, Math.round(h * 10) / 10),
              text: line.text.trim(),
              confidence: Math.round(line.confidence)
            };
          })
          .filter(b => b.w >= 3 && b.h >= 2 && b.text.length > 1);

        const texts = bubbles.map(b => b.text);
        const translations = await Promise.all(
          texts.map(text => fastTranslate(text, "auto", tgt.code))
        );

        const translatedBubbles = bubbles.map((b, i) => ({
          ...b,
          translated: translations[i]
        }));

        updatePage({ 
          status: "done", 
          bubbles: translatedBubbles, 
          count: translatedBubbles.length,
          imgSrc 
        });
      } else {
        const fullText = uniqueLines
          .map(l => l.text.trim())
          .filter(t => t.length > 2)
          .join('\n\n');
          
        if (fullText) {
          const translated = await fastTranslate(fullText, "auto", tgt.code);
          updatePage({ status: "done", fullText, translated, imgSrc });
        } else {
          updatePage({ status: "error", error: "Tidak ada teks terdeteksi" });
        }
      }

    } catch (e) {
      updatePage({ status: "error", error: e.message });
    }
  };

  const handleFiles = async (files) => {
    setProcessing(true);
    const newPages = Array.from(files).map((file, i) => ({
      id: Date.now() + i,
      file,
      name: file.name,
      status: "loading",
      preview: URL.createObjectURL(file)
    }));
    setPages(newPages);

    for (const page of newPages) {
      await processPage(page.id, page.preview, tgtLang);
    }
    setProcessing(false);
  };

  const clearAll = () => {
    setPages([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="doc-body">
      <div className="doc-mode-bar">
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            className={`doc-mode-btn ${mode === key ? 'active' : ''}`}
            onClick={() => setMode(key)}
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      <div className="doc-lang-bar">
        <span>Terjemah ke:</span>
        <select 
          value={tgtLang.code} 
          onChange={e => setTgtLang(LANGS.find(l => l.code === e.target.value))}
        >
          {LANGS.map(l => (
            <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
          ))}
        </select>
      </div>

      <div className="doc-upload-zone" onClick={() => fileRef.current?.click()}>
        {processing ? (
          <div className="proc">⏳ Memproses...</div>
        ) : pages.length ? (
          <div>✅ {pages.length} halaman selesai</div>
        ) : (
          <>
            <ImageIcon size={32} />
            <div>Klik atau drag gambar/PDF halaman {MODES[mode].hint}</div>
            <div style={{fontSize: '11px', opacity: 0.7}}>Multiple files OK</div>
          </>
        )}
        <input 
          ref={fileRef}
          type="file" 
          multiple 
          accept="image/*,.pdf"
          onChange={e => handleFiles(e.target.files)}
          style={{display: 'none'}}
        />
      </div>

      {pages.length > 0 && (
        <div className="doc-results">
          <div className="doc-results-hdr">
            <span>Hasil ({pages.length} halaman)</span>
            <button className="doc-clear-btn" onClick={clearAll}>
              <Trash2 size={12} /> Clear
            </button>
          </div>
          
          {pages.map(page => (
            <div key={page.id} className="doc-page">
              <div className="doc-page-hdr">
                <img src={page.preview} alt="" className="doc-thumb" />
                <div className="doc-page-info">
                  <div className="doc-page-num">{page.name}</div>
                  <div className={`doc-page-status ${page.status}`}>
                    {page.status === 'ocr' && '🔄 OCR...'}
                    {page.status === 'done' && `✅ Selesai${page.count ? ` (${page.count} bubble)` : ''}`}
                    {page.status === 'error' && '❌ Error'}
                  </div>
                </div>
              </div>

              {page.status === 'done' && (
                <div className="doc-page-content">
                  {mode === "komik" ? (
                    <ComicCanvas 
                      imgSrc={page.imgSrc} 
                      bubbles={page.bubbles} 
                      pageNum={page.name}
                    />
                  ) : (
                    <>
                      <div className="doc-text-block orig">
                        <div className="doc-text-lbl">ASLI</div>
                        <div className="doc-text-body">{page.fullText}</div>
                      </div>
                      <div className="doc-text-block trans">
                        <div className="doc-text-lbl">TERJEMAHAN</div>
                        <div className="doc-text-body">{page.translated}</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={resultsEnd} />
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════
function App() {
  const [tab, setTab] = useState('doc');
  
  return (
    <div className="app">
      <style>{css}</style>
      <div className="header">
        <div className="logo">
          <div className="logo-icon">AI</div>
          <div className="logo-name">TransBot</div>
        </div>
        <div className="badge on">
          <Zap size={12} /> OCR Pro
        </div>
      </div>
      
      <div className="tabs">
        <button className={`tab ${tab === 'voice' ? 'active' : ''}`} onClick={() => setTab('voice')}>
          <Mic size={16} /> Voice
        </button>
        <button className={`tab ${tab === 'doc' ? 'active' : ''}`} onClick={() => setTab('doc')}>
          <ImageIcon size={16} /> Dokumen
        </button>
      </div>
      
      {tab === 'voice' ? (
        <div style={{padding: '20px', textAlign: 'center', color: '#7f3d3d'}}>
          🎤 Voice Chat Mode<br/>
          <small>Coming soon...</small>
        </div>
      ) : (
        <DocumentTab />
      )}
    </div>
  );
}

export default App;