'use client';

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { heicTo } from 'heic-to';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('mp3');
  const [status, setStatus] = useState<string>('Awaiting transmission...');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const [stars, setStars] = useState<Array<{
    id: number; top: string; left: string;
    size: number; delay: string; duration: string;
  }>>([]);

  useEffect(() => {
    ffmpegRef.current = new FFmpeg();
    setStars(Array.from({ length: 120 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: `${Math.random() * 6}s`,
      duration: `${Math.random() * 4 + 3}s`,
    })));
  }, []);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setFile(selectedFile);
      setDownloadUrl('');
      setStatus(`Locked on: ${selectedFile.name}`);

      if (selectedFile.name.toLowerCase().endsWith('.heic')) {
        setTargetFormat('jpeg');
      } else if (selectedFile.type.startsWith('video/')) {
        setTargetFormat('mp3');
      } else if (selectedFile.type.startsWith('image/')) {
        setTargetFormat(selectedFile.type === 'image/webp' ? 'jpeg' : 'webp');
      }
    }
  };

  const getOutputFilename = (originalName: string, format: string): string => {
    const base = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    return `starconvert_${base}.${format}`;
  };

  const convertFile = async (): Promise<void> => {
    if (!file || !ffmpegRef.current) return;

    if (file.size > 500 * 1024 * 1024) {
      setStatus('Error: File too large for in-browser processing (500MB limit).');
      return;
    }

    setIsConverting(true);
    setStatus('Processing in your browser...');

    const inputExt = file.name.split('.').pop()?.toLowerCase() ?? '';

    try {
      if (inputExt === 'heic') {
        setStatus('Decoding Apple HEIC...');
        const mimeTarget = targetFormat === 'jpg' ? 'jpeg' : targetFormat;
        const convertedBlob = await heicTo({
          blob: file,
          type: `image/${mimeTarget}` as 'image/jpeg' | 'image/png',
          quality: 0.9,
        }) as Blob;

        setDownloadUrl(URL.createObjectURL(convertedBlob));
        setStatus('Conversion complete!');
        return;
      }

      const ffmpeg = ffmpegRef.current;

      if (!ffmpeg.loaded) {
  setStatus('Loading FFmpeg WebAssembly...');
  ffmpeg.on('log', ({ message }) => {
    console.log('[ffmpeg]', message);
  });

  // Convert the local public paths into absolute Blob URLs
  const coreURL = await toBlobURL('/ffmpeg/ffmpeg-core.js', 'text/javascript');
  const wasmURL = await toBlobURL('/ffmpeg/ffmpeg-core.wasm', 'application/wasm');

  // Load using the generated blobs
  await ffmpeg.load({
    coreURL,
    wasmURL,
  });
}
      const inputName = `input.${inputExt}`;
      const outputName = `output.${targetFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));
      setStatus('Converting...');
      await ffmpeg.exec(['-threads', '1', '-i', inputName, outputName]);

      setStatus('Finalizing...');
      const data = await ffmpeg.readFile(outputName);

      let mimeType = `image/${targetFormat}`;
      if (targetFormat === 'mp3') mimeType = 'audio/mpeg';
      if (targetFormat === 'mp4') mimeType = 'video/mp4';

      const dataBuffer: BlobPart =
        typeof data === 'string'
          ? new TextEncoder().encode(data)
          : new Uint8Array(data.buffer as ArrayBuffer);

      setDownloadUrl(URL.createObjectURL(new Blob([dataBuffer], { type: mimeType })));
      setStatus('Conversion complete!');
    } catch (error) {
      console.error('Conversion error:', error);
      setStatus(
        error instanceof Error
          ? `Error: ${error.message}`
          : 'Conversion failed. Check the console.'
      );
    } finally {
      setIsConverting(false);
    }
  };

  const isComplete = status === 'Conversion complete!';
  const isError = status.startsWith('Error') || status.startsWith('Conversion failed');

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#04050f',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(76, 29, 149, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(30, 27, 75, 0.25) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(14, 116, 144, 0.08) 0%, transparent 50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {stars.map(s => (
        <span
          key={s.id}
          className="star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            '--dur': s.duration,
            '--delay': s.delay,
          } as React.CSSProperties}
        />
      ))}

      <img
        src="/hero_bgr.png"
        alt="Hack Club"
        style={{
          width: 90,
          marginBottom: 20,
          borderRadius: 14,
          zIndex: 1,
          position: 'relative',
          boxShadow: '0 0 24px rgba(139, 92, 246, 0.4)',
        }}
      />

      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '11px',
        color: '#4c3d8f',
        letterSpacing: '0.2em',
        marginBottom: '20px',
        zIndex: 1,
        position: 'relative',
      }}>
        ✦ HACK CLUB · STARDANCE 2026 ✦
      </div>

      <div className="card" style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: 'rgba(8, 6, 24, 0.9)',
        backdropFilter: 'blur(16px)',
        borderRadius: '20px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>

        <div style={{
          background: 'linear-gradient(135deg, #1a1744 0%, #0a0820 100%)',
          padding: '22px 26px',
          borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          <img
            src="/orphmoji_yippee.png"
            alt="Hack Club"
            style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }}
          />
          <div>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
              fontSize: '17px',
              color: '#ede9fe',
              letterSpacing: '0.02em',
            }}>
              STARCONVERT
            </div>
            <div style={{
              fontSize: '10px',
              color: '#6d5fad',
              fontFamily: "'Space Mono', monospace",
              letterSpacing: '0.1em',
              marginTop: '3px',
            }}>
              WASM · CLIENT-SIDE · NO UPLOADS
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '20px', lineHeight: 1 }}>🌙</div>
        </div>

        <div style={{ padding: '26px' }}>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '10px',
              fontFamily: "'Space Mono', monospace",
              color: '#6d5fad',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              File
            </label>
            <input
              type="file"
              accept=".mp4,.mp3,.jpeg,.jpg,.webp,.png,.heic"
              onChange={handleFileChange}
              style={{
                backgroundColor: '#06051a',
                color: '#c4b5fd',
                padding: '10px 12px',
                width: '100%',
                borderRadius: '10px',
                border: `1px solid ${file ? 'rgba(139, 92, 246, 0.5)' : 'rgba(99, 82, 196, 0.25)'}`,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          {file && (
            <div style={{
              marginBottom: '20px',
              padding: '10px 14px',
              backgroundColor: 'rgba(99, 82, 196, 0.08)',
              borderRadius: '8px',
              border: '1px solid rgba(99, 82, 196, 0.15)',
              fontSize: '12px',
              fontFamily: "'Space Mono', monospace",
              color: '#8b7fd4',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>📄</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </span>
              <span style={{ marginLeft: 'auto', flexShrink: 0, color: '#4c3d8f' }}>
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
          )}

          {file && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '10px',
                fontFamily: "'Space Mono', monospace",
                color: '#6d5fad',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>
                Convert to
              </label>
              <select
                value={targetFormat}
                onChange={(e) => setTargetFormat(e.target.value)}
                style={{
                  backgroundColor: '#06051a',
                  color: '#c4b5fd',
                  padding: '10px 12px',
                  width: '100%',
                  borderRadius: '10px',
                  border: '1px solid rgba(99, 82, 196, 0.35)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237c6fcd' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '32px',
                }}
              >
                {file.name.toLowerCase().endsWith('.heic') ? (
                  <>
                    <option value="jpeg">jpeg</option>
                    <option value="png">png</option>
                  </>
                ) : file.type.startsWith('video/') ? (
                  <>
                    <option value="mp3">mp3 — audio extract</option>
                    <option value="mp4">mp4</option>
                  </>
                ) : (
                  <>
                    {file.type !== 'image/webp' && <option value="webp">webp</option>}
                    {file.type !== 'image/png' && <option value="png">png</option>}
                    {file.type !== 'image/jpeg' && <option value="jpeg">jpeg</option>}
                  </>
                )}
              </select>
            </div>
          )}

          <button
            className="convert-btn"
            onClick={convertFile}
            disabled={!file || isConverting}
            style={{
              width: '100%',
              padding: '14px',
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              fontSize: '13px',
              letterSpacing: '0.06em',
              borderRadius: '10px',
              border: 'none',
              background: !file || isConverting
                ? '#131130'
                : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: !file || isConverting ? '#3d3570' : '#fff',
              cursor: !file || isConverting ? 'not-allowed' : 'pointer',
              boxShadow: file && !isConverting ? '0 4px 20px rgba(124, 58, 237, 0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {isConverting ? '⟳ PROCESSING...' : file ? '✦ TRANSFORM FILE' : 'SELECT A FILE FIRST'}
          </button>

          <div style={{
            marginTop: '16px',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: '#04030f',
            border: `1px solid ${isError ? 'rgba(248, 113, 113, 0.2)' : isComplete ? 'rgba(52, 211, 153, 0.2)' : 'rgba(99, 82, 196, 0.15)'}`,
            fontSize: '12px',
            fontFamily: "'Space Mono', monospace",
            color: isError ? '#f87171' : isComplete ? '#6ee7b7' : '#8b7fd4',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
          }}>
            <span style={{ flexShrink: 0 }}>
              {isError ? '✗' : isComplete ? '✓' : '›'}
            </span>
            {status}
          </div>

          {downloadUrl && file && (
            <a
              href={downloadUrl}
              download={getOutputFilename(file.name, targetFormat)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '14px',
                padding: '14px',
                background: 'linear-gradient(135deg, #0e7490 0%, #0891b2 100%)',
                color: '#e0f2fe',
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                fontSize: '13px',
                letterSpacing: '0.06em',
                borderRadius: '10px',
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(14, 116, 144, 0.3)',
              }}
            >
              ↓ SAVE FILE
            </a>
          )}
        </div>
      </div>

      <div style={{
        marginTop: '24px',
        fontSize: '10px',
        fontFamily: "'Space Mono', monospace",
        color: '#2a2550',
        letterSpacing: '0.12em',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        lineHeight: 1.8,
      }}>
        YOUR FILES NEVER LEAVE THIS DEVICE<br />
        <span style={{ color: '#1e1a40' }}>POWERED BY FFMPEG.WASM + WEBASSEMBLY</span>
        <span style={{ display: 'block', marginTop: '6px' }}>STARCONVERT 2026 BY <a href="https://github.com/z0b1" target="_blank" rel="noopener noreferrer" style={{ color: '#1e1a40', textDecoration: 'underline' }}>z0b1</a></span>
      </div>

    </main>
  );
}