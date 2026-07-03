# <p align="center"><img src=assets/hero_bgr.png alt="project logo" width="400"></p>

# <h1 align="center">STARCONVERT</h1>

 <p align="center"> A privacy-first, client-side media converter using WebAssembly to process MP4 video audio extraction, Apple HEIC conversion, and web images (JPEG, PNG, WEBP) directly inside the browser. It runs entirely offline on the user's hardware without uploading files to a cloud server.</p>

<h2>Demo</h2>

![Workflow GIF](assets/demo.gif)
[![Open Live App](https://img.shields.io/badge/🌟_Live_Demo-Click_Here_to_Try-blue?style=for-the-badge&logo=cloudflare&logoColor=white)](https://wasm.z0b1.tech)

## Features
- ### 100% Client-Side Processing
> _Converts files locally in the browser via WebAssembly, ensuring zero server-side file uploads and absolute user privacy._
- ### Cross Format Image Engine 
> _Instantly converts between Apple HEIC, JPEG, PNG and WebP formats without external software._
- ### High Speed Audio Extraction
> _Extracts clean audio tracks from MP4 video files directly within browser runtime._
- ### True Offline Capability 
> _Works completely disconnected from the internet once the page is loaded, utilizing user's native hardware._
- ### Zero File Size Restraints 
> _Bypasses cloud upload limits entirely by streaming data chunks straight through local system memory._

## How to run locally

### Step 1 - Clone Repo & Install Deps
```bash
git clone https://github.com/z0b1/starconvert.git
cd starconvert
npm install 
```
> Make sure you have Node.js(v20 or higher) installed. You can check by running `node -v` in your terminal
### Step 2 - Handle WASM Headers (Crucial)

Because this app uses WebAssembly(`ffmpeg.wasm`/HEIC decoders) inside the browser. Next.js needs to serve specific security headers, or the browser will block the app from accessing shared memory.

Ensure your `next.config.js` (or `next.config.mjs`) in the root directory includes these headers. If it doesnt add them!
```JavaScript
/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
```
### Step 3 - Spin Up the Dev Server
Start the local server with:
```Bash
npm run dev
```
Now, open your browser and head to `http://localhost:3000`. Drop a video or a HEIC file in there, open your browser's inspect tool console, and watch the WebAssembly workers do the heavy lifting entirely on your local hardware.

## How it works

The **hardest** part about processing heavy media files inside a browser is dealing with JavaScript's single threaded nature. If you try to extrac audio from a massive MP4 file or decode a heavy HEIC image on the main UI thread, the entire webpage will freeze up and crash the tab.
To fix this, I built the processing engine in TypeScript, moving all the heavy lifting out of the main thread and into background Web Workers. These workers manage the lifecycle of compiled C/C++ binaries running via **WebAssembly(WASM)**. When you drop a file into the app, it doesnt upload anywhere. My TypeScript code reads the raw file bytes locally using the browsers File API and streams them straight into the WebAssembly isolated memory space(`ffmpeg.wasm` for video and `libheif` for images). Because transcoding happens completely in the background thread, the interface stays perfectly smooth and responsive at flat 60 FPS, even while chewing through large files.

#### Tradeoffs
- Security Header issue: To make the video extraction fast, the app needs multithreading, which relies on a browser feature called `SharedArrayBuffer`. The catch? Modern browsers block this by default. To bypass this, I had to configure strict `COOP` and `COEP` headers in the Next.js setup.
This signals to the browser that the site is fully sandboxed, safely unlocking high performance memory needed for the WASM modules to run.
- Fighting Browser Memory Limits: Since there is no backend handling the load, everything is limited to the browsers memory limits. If you try to load a massive 4K video entirely into regular JavaScript memory all at once, the tab will immediately die. To solve this, my TypeScript architecture handles files as data streams in chunks rather than massive single blocks, keeping the memory footprint small enough to run even on mobile browsers.


