'use client';

import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import AgentAvatar from '@/components/brand/AgentAvatar';
import CortexAvatar from '@/components/brand/CortexAvatar';
import { AGENTS, COORDINATOR, type AgentId } from '@/lib/agents/registry';

const AGENT_IDS: AgentId[] = ['scout', 'forge', 'archer', 'atlas', 'sage', 'sentinel'];
const ALL_IDS: (AgentId | 'cortex')[] = ['cortex', ...AGENT_IDS];

/* ── Minimal GIF89a encoder (supports 256 colors, no external deps) ── */
function encodeGIF(frames: ImageData[], width: number, height: number, delay: number): Uint8Array {
  const buf: number[] = [];

  // Helper: write bytes
  const w = (...bytes: number[]) => bytes.forEach(b => buf.push(b & 0xff));
  const w16 = (v: number) => { w(v & 0xff, (v >> 8) & 0xff); };
  const wStr = (s: string) => { for (let i = 0; i < s.length; i++) w(s.charCodeAt(i)); };

  // Build global color table from all frames (median cut simplified → just use first 256 unique)
  const colorMap = new Map<number, number>();
  const palette: [number, number, number][] = [];

  for (const frame of frames) {
    const d = frame.data;
    for (let i = 0; i < d.length; i += 4) {
      // Quantize to 6-bit per channel (64 levels) to reduce colors
      const r = (d[i] >> 2) << 2;
      const g = (d[i + 1] >> 2) << 2;
      const b = (d[i + 2] >> 2) << 2;
      const key = (r << 16) | (g << 8) | b;
      if (!colorMap.has(key) && palette.length < 256) {
        colorMap.set(key, palette.length);
        palette.push([r, g, b]);
      }
    }
  }

  // Pad palette to power of 2
  const palBits = Math.max(2, Math.ceil(Math.log2(Math.max(palette.length, 4))));
  const palSize = 1 << palBits;
  while (palette.length < palSize) palette.push([0, 0, 0]);

  // GIF Header
  wStr('GIF89a');
  w16(width);
  w16(height);
  w(0x80 | ((palBits - 1) & 7) | (((palBits - 1) & 7) << 4)); // GCT flag + color res + size
  w(0); // bg color index
  w(0); // pixel aspect ratio

  // Global Color Table
  for (const [r, g, b] of palette) { w(r, g, b); }

  // Netscape Application Extension (looping)
  w(0x21, 0xff, 0x0b);
  wStr('NETSCAPE2.0');
  w(0x03, 0x01);
  w16(0); // loop forever
  w(0x00);

  // Frames
  for (const frame of frames) {
    // Graphic Control Extension
    w(0x21, 0xf9, 0x04);
    w(0x00); // no transparency
    w16(Math.round(delay / 10)); // delay in centiseconds
    w(0x00); // no transparent color
    w(0x00); // terminator

    // Image Descriptor
    w(0x2c);
    w16(0); // left
    w16(0); // top
    w16(width);
    w16(height);
    w(0x00); // no local color table

    // LZW encode
    const minCodeSize = palBits;
    w(minCodeSize);

    // Map pixels to indices
    const pixels: number[] = [];
    const d = frame.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = (d[i] >> 2) << 2;
      const g = (d[i + 1] >> 2) << 2;
      const b = (d[i + 2] >> 2) << 2;
      const key = (r << 16) | (g << 8) | b;
      pixels.push(colorMap.get(key) ?? 0);
    }

    // LZW compression
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;

    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    const table = new Map<string, number>();

    // Initialize table
    for (let i = 0; i < clearCode; i++) table.set(String(i), i);

    let bitBuf = 0;
    let bitCount = 0;
    const subBlocks: number[] = [];
    const subBuf: number[] = [];

    const writeBits = (code: number, bits: number) => {
      bitBuf |= code << bitCount;
      bitCount += bits;
      while (bitCount >= 8) {
        subBuf.push(bitBuf & 0xff);
        bitBuf >>= 8;
        bitCount -= 8;
        if (subBuf.length === 255) {
          subBlocks.push(255, ...subBuf);
          subBuf.length = 0;
        }
      }
    };

    writeBits(clearCode, codeSize);

    let current = String(pixels[0]);
    for (let i = 1; i < pixels.length; i++) {
      const next = current + ',' + pixels[i];
      if (table.has(next)) {
        current = next;
      } else {
        writeBits(table.get(current)!, codeSize);
        if (nextCode < 4096) {
          table.set(next, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
        } else {
          writeBits(clearCode, codeSize);
          table.clear();
          for (let j = 0; j < clearCode; j++) table.set(String(j), j);
          nextCode = eoiCode + 1;
          codeSize = minCodeSize + 1;
        }
        current = String(pixels[i]);
      }
    }
    writeBits(table.get(current)!, codeSize);
    writeBits(eoiCode, codeSize);

    // Flush remaining bits
    if (bitCount > 0) subBuf.push(bitBuf & 0xff);
    if (subBuf.length > 0) subBlocks.push(subBuf.length, ...subBuf);
    subBlocks.push(0); // block terminator

    for (const b of subBlocks) w(b);
  }

  // Trailer
  w(0x3b);

  return new Uint8Array(buf);
}

/* ── Recording state ── */
type RecordingState = 'idle' | 'recording' | 'encoding' | 'done';

interface RecordResult {
  agentId: string;
  url: string;
  filename: string;
}

export default function AvatarsPage() {
  const [selected, setSelected] = useState<AgentId | 'cortex' | 'all'>('all');
  const [size, setSize] = useState(200);
  const [bg, setBg] = useState('#0a0a0f');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingAgent, setRecordingAgent] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RecordResult[]>([]);
  const cancelRef = useRef(false);

  const recordAgent = useCallback(async (agentId: string) => {
    const el = document.getElementById(`avatar-${agentId}`);
    if (!el) return;

    setRecordingAgent(agentId);
    setRecordingState('recording');
    setProgress(0);
    cancelRef.current = false;

    const frames: ImageData[] = [];
    const totalFrames = 30; // ~3 seconds at 100ms intervals
    const frameDelay = 100;

    for (let i = 0; i < totalFrames; i++) {
      if (cancelRef.current) break;

      try {
        const canvas = await html2canvas(el, {
          backgroundColor: bg === 'transparent' ? null : bg,
          scale: 1,
          logging: false,
          useCORS: true,
        });

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          frames.push(imgData);
        }
      } catch (err) {
        console.error('Frame capture error:', err);
      }

      setProgress(Math.round(((i + 1) / totalFrames) * 80));
      await new Promise(r => setTimeout(r, frameDelay));
    }

    if (cancelRef.current || frames.length === 0) {
      setRecordingState('idle');
      setRecordingAgent(null);
      return;
    }

    // Encode GIF
    setRecordingState('encoding');
    setProgress(85);

    await new Promise(r => setTimeout(r, 50)); // yield to UI

    try {
      const w = frames[0].width;
      const h = frames[0].height;
      const gifData = encodeGIF(frames, w, h, frameDelay);
      const blob = new Blob([gifData.buffer as ArrayBuffer], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);
      const filename = `3box-${agentId}-avatar.gif`;

      setResults(prev => [...prev.filter(r => r.agentId !== agentId), { agentId, url, filename }]);
      setProgress(100);
      setRecordingState('done');

      // Auto-download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('GIF encoding error:', err);
      setRecordingState('idle');
    }

    setTimeout(() => {
      setRecordingState('idle');
      setRecordingAgent(null);
    }, 2000);
  }, [bg]);

  const recordAll = useCallback(async () => {
    for (const id of ALL_IDS) {
      if (cancelRef.current) break;
      await recordAgent(id);
      await new Promise(r => setTimeout(r, 500)); // pause between
    }
  }, [recordAgent]);

  const downloadPNG = useCallback(async (agentId: string) => {
    const el = document.getElementById(`avatar-${agentId}`);
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: bg === 'transparent' ? null : bg,
        scale: 2, // 2x for crisp PNG
        logging: false,
        useCORS: true,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `3box-${agentId}-avatar.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('PNG capture error:', err);
    }
  }, [bg]);

  const isRecording = recordingState === 'recording' || recordingState === 'encoding';

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: bg }}>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-white/10 w-full justify-center">
        <button
          onClick={() => setSelected('all')}
          className={`px-3 py-1.5 rounded text-xs transition-all ${selected === 'all' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50 hover:text-white/70'}`}
        >
          All
        </button>
        <button
          onClick={() => setSelected('cortex')}
          className={`px-3 py-1.5 rounded text-xs transition-all ${selected === 'cortex' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50 hover:text-white/70'}`}
        >
          Cortex
        </button>
        {AGENT_IDS.map(id => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            className={`px-3 py-1.5 rounded text-xs capitalize transition-all ${selected === id ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50 hover:text-white/70'}`}
          >
            {id}
          </button>
        ))}
        <span className="text-white/20 text-xs">|</span>
        <select
          value={size}
          onChange={e => setSize(Number(e.target.value))}
          className="bg-white/5 text-white/70 text-xs px-2 py-1 rounded border border-white/10"
        >
          <option value={120}>120px</option>
          <option value={160}>160px</option>
          <option value={200}>200px</option>
          <option value={280}>280px</option>
          <option value={360}>360px</option>
        </select>
        <select
          value={bg}
          onChange={e => setBg(e.target.value)}
          className="bg-white/5 text-white/70 text-xs px-2 py-1 rounded border border-white/10"
        >
          <option value="#0a0a0f">Dark (default)</option>
          <option value="#000000">Black</option>
          <option value="#1a1a2e">Navy</option>
          <option value="transparent">Transparent</option>
        </select>
      </div>

      {/* Recording Status Bar */}
      {isRecording && (
        <div className="w-full px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center gap-3 justify-center">
          <div className="w-40 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-cyan-400 text-xs">
            {recordingState === 'recording'
              ? `Recording ${recordingAgent}... ${progress}%`
              : `Encoding GIF... ${progress}%`}
          </span>
          <button
            onClick={() => { cancelRef.current = true; }}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-0.5 rounded bg-red-500/10"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Avatar Display */}
      {selected === 'all' ? (
        <div className="w-full">
          {/* Download All buttons */}
          <div className="flex justify-center gap-3 pt-6 pb-2">
            <button
              onClick={recordAll}
              disabled={isRecording}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 hover:from-cyan-500/30 hover:to-purple-500/30 disabled:opacity-30 transition-all border border-cyan-500/20"
            >
              {isRecording ? 'Recording...' : '⬇ Download All GIFs'}
            </button>
          </div>

          <div className="flex flex-wrap items-start justify-center gap-8 p-8">
            {/* Cortex */}
            <AvatarCard
              agentId="cortex"
              name={COORDINATOR.name}
              role={COORDINATOR.role}
              size={size}
              isRecording={isRecording && recordingAgent === 'cortex'}
              result={results.find(r => r.agentId === 'cortex')}
              onRecordGif={() => recordAgent('cortex')}
              onDownloadPng={() => downloadPNG('cortex')}
              disabled={isRecording}
            >
              <CortexAvatar size={size} pulse />
            </AvatarCard>

            {/* 6 Agents */}
            {AGENT_IDS.map(id => (
              <AvatarCard
                key={id}
                agentId={id}
                name={AGENTS[id].name}
                role={AGENTS[id].role}
                size={size}
                isRecording={isRecording && recordingAgent === id}
                result={results.find(r => r.agentId === id)}
                onRecordGif={() => recordAgent(id)}
                onDownloadPng={() => downloadPNG(id)}
                disabled={isRecording}
              >
                <AgentAvatar agentId={id} size={size} pulse />
              </AvatarCard>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <div
            id={`avatar-${selected}`}
            className="flex items-center justify-center"
            style={{ width: size + 100, height: size + 100 }}
          >
            {selected === 'cortex' ? (
              <CortexAvatar size={size} pulse />
            ) : (
              <AgentAvatar agentId={selected} size={size} pulse />
            )}
          </div>
          <p className="text-white/60 text-lg font-medium mt-6">
            {selected === 'cortex' ? COORDINATOR.name : AGENTS[selected].name}
          </p>
          <p className="text-white/30 text-sm mb-6">
            {selected === 'cortex' ? COORDINATOR.role : AGENTS[selected].role}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => recordAgent(selected)}
              disabled={isRecording}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 disabled:opacity-30 transition-all border border-cyan-500/20"
            >
              {isRecording && recordingAgent === selected ? 'Recording...' : '⬇ Download GIF'}
            </button>
            <button
              onClick={() => downloadPNG(selected)}
              disabled={isRecording}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 disabled:opacity-30 transition-all border border-white/10"
            >
              ⬇ Download PNG
            </button>
          </div>
          {results.find(r => r.agentId === selected) && (
            <a
              href={results.find(r => r.agentId === selected)!.url}
              download={results.find(r => r.agentId === selected)!.filename}
              className="mt-3 text-xs text-green-400 hover:text-green-300"
            >
              ✓ Click to download again
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Avatar Card with download buttons ── */
function AvatarCard({
  agentId, name, role, size, children, isRecording, result, onRecordGif, onDownloadPng, disabled,
}: {
  agentId: string;
  name: string;
  role: string;
  size: number;
  children: React.ReactNode;
  isRecording: boolean;
  result?: RecordResult;
  onRecordGif: () => void;
  onDownloadPng: () => void;
  disabled: boolean;
}) {
  const containerSize = agentId === 'cortex' ? size + 80 : size + 40;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        id={`avatar-${agentId}`}
        className={`flex items-center justify-center rounded-xl transition-all ${
          isRecording ? 'ring-2 ring-cyan-400/40' : ''
        }`}
        style={{ width: containerSize, height: containerSize }}
      >
        {children}
      </div>
      <p className="text-white/50 text-sm font-medium">{name}</p>
      <p className="text-white/25 text-[10px] -mt-2">{role}</p>
      <div className="flex items-center gap-2">
        <button
          onClick={onRecordGif}
          disabled={disabled}
          className="px-2.5 py-1 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-30 transition-all"
        >
          {isRecording ? '●  REC' : 'GIF'}
        </button>
        <button
          onClick={onDownloadPng}
          disabled={disabled}
          className="px-2.5 py-1 rounded text-[10px] font-medium bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 disabled:opacity-30 transition-all"
        >
          PNG
        </button>
        {result && (
          <a
            href={result.url}
            download={result.filename}
            className="text-[10px] text-green-400 hover:text-green-300"
          >
            ✓
          </a>
        )}
      </div>
    </div>
  );
}
