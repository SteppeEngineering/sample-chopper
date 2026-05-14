# Fixes Needed - 2026-05-14 14:45 PDT

## Issues Reported by Anthony

### 1. Waveform Display Style
**Problem:** Current waveform doesn't look like a conventional waveform
**Expected:** Traditional stereo waveform view - mirrored top/bottom from centerline (like Audacity, Logic, etc.)
**Current behavior:** Unknown from screenshot, but likely single-sided or different visualization

### 2. Waveform Only Shows After Resize
**Problem:** Waveform doesn't render on initial file load - only appears after resizing the browser window
**Root cause:** Likely canvas sizing issue - canvas dimensions not being set properly before first draw
**Expected:** Waveform should render immediately when file is loaded

## Priority
Both are blocking UX issues - fix immediately.

## Screenshot Reference
Screenshot saved showing the issue: file_475---b06a16ab-464c-4e90-9231-6af2ccd885bb.jpg
