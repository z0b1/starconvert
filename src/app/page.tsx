'use client';

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { heicTo } from 'heic-to';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('mp3');
  const [status, setStatus] = useState<string>('Idle');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  
  // 1. Maintain a ref for FFmpeg, but initialize it as null
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // 2. Safely instantiate FFmpeg only once the browser has loaded the component
  useEffect(() => {
    ffmpegRef.current = new FFmpeg();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setDownloadUrl('');
      setStatus(`Loaded: ${selectedFile.name}`);
      
      if (selectedFile.name.toLowerCase().endsWith('.heic')) {
        setTargetFormat('jpeg');
      } else if (selectedFile.type.startsWith('video/')) {
        setTargetFormat('mp3');
      } else if (selectedFile.type.startsWith('image/')) {
        setTargetFormat('webp');
      }
    }
  };

  const convertFile = async (): Promise<void> => {
    if (!file || !ffmpegRef.current) return;
    setStatus('Processing inside your browser...');
    
    const inputExt = file.name.split('.').pop()?.toLowerCase() || '';
    
    try {
      if (inputExt === 'heic') {
        setStatus('WASM decoding Apple HEIC...');
        const convertedBlob = await heicTo({
          blob: file,
          type: `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}` as any,
          quality: 0.9
        }) as Blob;
        
        setDownloadUrl(URL.createObjectURL(convertedBlob));
        setStatus('Conversion complete!');
        return;
      }

      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg.loaded) {
        setStatus('Loading FFmpeg WebAssembly binaries...');
        await ffmpeg.load();
      }

      const inputName = `input.${inputExt}`;
      const outputName = `output.${targetFormat}`;
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      
      setStatus('Converting files completely offline...');
      await ffmpeg.exec(['-i', inputName, outputName]);
      
      setStatus('Reading optimized data back...');
      const data = await ffmpeg.readFile(outputName);
      
      let mimeType = `image/${targetFormat}`;
      if (targetFormat === 'mp3') mimeType = 'audio/mp3';
      if (targetFormat === 'mp4') mimeType = 'video/mp4';

      // Safe structural buffer conversion for strict browser Blob engines
      let dataBuffer: BlobPart;
      if (typeof data === 'string') {
        dataBuffer = new TextEncoder().encode(data);
      } else {
        const rawBuffer = data.buffer as ArrayBuffer;
        dataBuffer = new Uint8Array(rawBuffer);
      }

      setDownloadUrl(URL.createObjectURL(new Blob([dataBuffer], { type: mimeType })));
      setStatus('Conversion complete!');
    } catch (error) {
      console.error('Error during conversion:', error);
      setStatus('Error during conversion. Please check the console for details.');
    }
  };

  return (
    <main style={{ 
      minHeight: '100vh', 
      backgroundColor: '#020617', 
      color: '#fff', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '24px', 
      fontFamily: 'sans-serif' 
    }}>
      <div style={{ maxWidth: '400px', width: '100%', padding: '24px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.3)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', margin: 'auto' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f43f5e', borderBottom: '1px solid #334155', paddingBottom: '12px', margin: '0 0 16px 0' }}>🌌 StarConvert.wasm</h2>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Select File:</label>
          <input type="file" accept=".mp4,.mp3,.jpeg,.jpg,.webp,.png,.heic" onChange={handleFileChange} style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #475569', boxSizing: 'border-box' }} />
        </div>

        {file && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#cbd5e1' }}>Target Extension:</label>
            <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value)} style={{ backgroundColor: '#1e293b', color: '#fff', padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #475569', cursor: 'pointer' }}>
              {file.name.toLowerCase().endsWith('.heic') ? (
                <>
                  <option value="jpeg">jpeg</option>
                  <option value="jpg">jpg</option>
                  <option value="png">png</option>
                </>
              ) : file.type.startsWith('video/') ? (
                <>
                  <option value="mp3">mp3 (Audio Extract)</option>
                  <option value="mp4">mp4</option>
                </>
              ) : (
                <>
                  <option value="webp">webp</option>
                  <option value="png">png</option>
                  <option value="jpeg">jpeg</option>
                  <option value="jpg">jpg</option>
                </>
              )}
            </select>
          </div>
        )}

        <button onClick={convertFile} disabled={!file} style={{ width: '100%', padding: '12px', fontWeight: 'bold', borderRadius: '6px', border: 'none', backgroundColor: file ? '#e11d48' : '#334155', color: file ? '#fff' : '#64748b', cursor: file ? 'pointer' : 'not-allowed', transition: 'background-color 0.2s' }}>
          Transform File
        </button>

        <div style={{ marginTop: '16px', padding: '12px', borderRadius: '6px', backgroundColor: '#1e293b', fontSize: '14px', color: '#cbd5e1' }}>
          <strong>Status:</strong> {status}
        </div>

        {downloadUrl && (
          <div style={{ marginTop: '16px' }}>
            <a href={downloadUrl} download={`starconvert_${file.name}`} style={{ display: 'block', textAlign: 'center', padding: '12px', backgroundColor: '#0891b2', color: '#fff', fontWeight: 'bold', borderRadius: '6px', textDecoration: 'none' }}>
              📥 Save Converted File
            </a>
          </div>
        )}
      </div>
    </main>
  );
}