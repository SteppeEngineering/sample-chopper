# Sample Chopper Web App

## Goal
Build a web application that automatically chops audio files at silence/low-dB points and lets Anthony export the individual samples.

## Requirements

### Input
- Accept audio file uploads: WAV, AIFF, MP3
- Drag-and-drop interface preferred

### Processing
- Analyze waveform to detect "chop points" at low/zero dB regions
- Algorithm: detect when amplitude drops below threshold (configurable)
- Visual waveform display showing detected chop points

### Features
- Adjustable sensitivity threshold for chop detection
- Visual markers on waveform showing where chops will occur
- Preview individual chopped samples (play them)
- Manual adjustment of chop points (add/remove/move)
- Export all samples as ZIP or individual downloads

### Technical Decisions
- **Client-side only** (Web Audio API + Canvas for waveform) - no backend needed
- Use vanilla JS or lightweight framework (React/Svelte)
- Waveform visualization with chop markers
- Real-time preview

### Deployment
- Static hosting (Cloudflare Pages, Netlify, or Vercel)
- Should be publicly accessible

## Design Notes

### Chop Detection Algorithm
1. Load audio into AudioBuffer
2. Analyze amplitude across the entire file
3. Detect regions where RMS amplitude < threshold for N consecutive samples
4. Mark the center of each quiet region as a chop point
5. Ensure minimum distance between chops (avoid micro-chops)

### UI Flow
1. Upload/drop audio file
2. App analyzes and shows waveform with detected chops
3. User can adjust threshold slider to see more/fewer chops
4. User can manually add/remove/drag chop markers
5. User clicks "Export All" to download ZIP of samples

### Tech Stack Options
- **Option A:** Pure HTML/JS/Canvas (lightweight, no build step)
- **Option B:** React + wavesurfer.js (more polished)
- **Option C:** Svelte (fast, small bundle)

**Recommendation:** Start with Option A for speed, can upgrade to B/C later.

## Deliverables
1. Working web app deployed and accessible
2. URL to access the app
3. Source code in this project directory
4. README with usage instructions
