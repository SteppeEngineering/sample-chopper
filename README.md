# 🔪 Sample Chopper

A web application for automatically chopping audio files at silence/low-dB points.

## Features

- **Automatic chop detection** - Analyzes waveform to find silence regions
- **Visual waveform display** - See your audio and chop points
- **Adjustable parameters** - Fine-tune detection sensitivity
- **Manual editing** - Click to add/remove chop points
- **Preview samples** - Play individual chopped samples before exporting
- **Export all samples** - Download all chopped samples as WAV files
- **Client-side processing** - No server needed, works entirely in your browser

## Usage

### 1. Upload Audio File
- Drag and drop an audio file (WAV, MP3, or AIFF) onto the upload area
- Or click to browse and select a file

### 2. Review Chop Points
- The app will automatically analyze the audio and detect silence points
- Waveform displays with red dashed lines showing detected chops
- Hover over chop points to see exact timestamps

### 3. Adjust Parameters (Optional)
- **Silence Threshold (dB)**: How quiet a region must be to be considered silence (-60 to -20 dB)
  - Lower values = quieter regions required
  - Higher values = more chops detected
- **Min Silence Duration (ms)**: Minimum length of silence to trigger a chop (10-200ms)
  - Prevents chopping on brief quiet moments
- **Min Distance Between Chops (ms)**: Minimum spacing between chop points (50-500ms)
  - Prevents creating tiny micro-samples
- Click **Re-analyze** after adjusting to see new chop points

### 4. Manual Editing
- **Click on waveform** to add a chop point
- **Click on existing chop point** (hover to highlight) to remove it

### 5. Preview & Export
- Click **▶ Preview** on any sample to hear it
- Click **⬇ Download** to save individual samples
- Click **Export All Samples** to download all chopped samples at once

## Technical Details

- **Built with**: Vanilla JavaScript, Web Audio API, Canvas API
- **No dependencies**: Pure HTML/CSS/JS, no frameworks required
- **Client-side only**: All processing happens in your browser, no data uploaded
- **Export format**: 16-bit PCM WAV files

## Browser Compatibility

Works in modern browsers with Web Audio API support:
- Chrome/Edge 14+
- Firefox 25+
- Safari 14.1+

## Local Development

Simply open `index.html` in a web browser. No build step or server required.

For development with live reload:
```bash
python3 -m http.server 8000
# Then open http://localhost:8000
```

## Deployment

Deploy to any static hosting service:

### Cloudflare Pages
```bash
# Connect your repository or use Wrangler CLI
wrangler pages publish .
```

### Netlify
```bash
netlify deploy --dir=. --prod
```

### GitHub Pages
Just push to GitHub and enable Pages in repository settings.

## Known Limitations

- Large audio files (>100MB) may be slow to process
- Export all downloads files sequentially (no ZIP yet - would require external library)
- Only supports mono/stereo audio (no multichannel)

## Future Enhancements

- ZIP export (add JSZip library)
- Drag to move chop points
- Keyboard shortcuts
- Custom export format options (MP3, FLAC)
- Batch processing multiple files
- Save/load chop point presets

## License

MIT - Free to use and modify

---

Built for chopping breaks, samples, and beats. Happy chopping! 🎵🔪
