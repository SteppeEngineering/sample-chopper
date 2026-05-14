// Initialize
const audioProcessor = new AudioProcessor();
let waveformRenderer = null;
let playheadInterval = null;

// DOM elements
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const controls = document.getElementById('controls');
const waveformContainer = document.getElementById('waveformContainer');
const waveformCanvas = document.getElementById('waveformCanvas');
const samplesList = document.getElementById('samplesList');
const fileName = document.getElementById('fileName');
const chopCount = document.getElementById('chopCount');
const thresholdSlider = document.getElementById('threshold');
const thresholdValue = document.getElementById('thresholdValue');
const minDurationSlider = document.getElementById('minDuration');
const minDurationValue = document.getElementById('minDurationValue');
const minDistanceSlider = document.getElementById('minDistance');
const minDistanceValue = document.getElementById('minDistanceValue');
const reanalyzeBtn = document.getElementById('reanalyze');
const exportAllBtn = document.getElementById('exportAll');
const playPauseBtn = document.getElementById('playPause');
const playbackTime = document.getElementById('playbackTime');
const samplesContainer = document.getElementById('samplesContainer');

// File upload handlers
uploadBox.addEventListener('click', () => fileInput.click());

uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('drag-over');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('drag-over');
});

uploadBox.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadBox.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
        await processAudioFile(file);
    } else {
        alert('Please drop an audio file (WAV, MP3, AIFF)');
    }
});

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        await processAudioFile(file);
    }
});

// Process audio file
async function processAudioFile(file) {
    try {
        // Show loading state
        uploadBox.innerHTML = '<p>Loading audio file...</p>';

        // Load audio
        await audioProcessor.loadAudioFile(file);

        // Analyze for chop points
        const threshold = parseFloat(thresholdSlider.value);
        const minDuration = parseFloat(minDurationSlider.value);
        const minDistance = parseFloat(minDistanceSlider.value);
        audioProcessor.analyzeForChopPoints(threshold, minDuration, minDistance);

        // Initialize waveform renderer
        if (!waveformRenderer) {
            waveformRenderer = new WaveformRenderer(waveformCanvas, audioProcessor);
        }
        waveformRenderer.updateWaveform();

        // Update UI
        fileName.textContent = audioProcessor.fileName;
        updateChopCount();
        
        // Show controls and waveform
        uploadSection.style.display = 'none';
        controls.style.display = 'block';
        waveformContainer.style.display = 'block';
        samplesList.style.display = 'block';

        // Generate samples list
        updateSamplesList();

        // Start playback time update
        startPlaybackTimeUpdate();

    } catch (error) {
        console.error('Error processing audio:', error);
        alert('Error loading audio file. Please try a different file.');
        uploadBox.innerHTML = `
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p>Drop audio file here or click to browse</p>
            <p class="supported-formats">Supported: WAV, AIFF, MP3</p>
        `;
    }
}

// Update chop count display
function updateChopCount() {
    const count = audioProcessor.chopPoints.length;
    chopCount.textContent = `${count} chop${count !== 1 ? 's' : ''} detected`;
}
window.updateChopCount = updateChopCount;

// Slider handlers
thresholdSlider.addEventListener('input', (e) => {
    thresholdValue.textContent = e.target.value;
});

minDurationSlider.addEventListener('input', (e) => {
    minDurationValue.textContent = e.target.value;
});

minDistanceSlider.addEventListener('input', (e) => {
    minDistanceValue.textContent = e.target.value;
});

// Re-analyze button
reanalyzeBtn.addEventListener('click', () => {
    const threshold = parseFloat(thresholdSlider.value);
    const minDuration = parseFloat(minDurationSlider.value);
    const minDistance = parseFloat(minDistanceSlider.value);
    
    audioProcessor.analyzeForChopPoints(threshold, minDuration, minDistance);
    waveformRenderer.render();
    updateChopCount();
    updateSamplesList();
});

// Play/pause button
playPauseBtn.addEventListener('click', () => {
    if (audioProcessor.isPlaying) {
        audioProcessor.pause();
        playPauseBtn.textContent = '▶ Play';
    } else {
        const startTime = audioProcessor.pauseTime || 0;
        audioProcessor.play(startTime);
        playPauseBtn.textContent = '⏸ Pause';
        waveformRenderer.startPlayheadAnimation();
    }
});

// Playback time update
function startPlaybackTimeUpdate() {
    setInterval(() => {
        const current = audioProcessor.getCurrentTime();
        const duration = audioProcessor.getDuration();
        playbackTime.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
        
        if (audioProcessor.isPlaying && current >= duration) {
            audioProcessor.stop();
            audioProcessor.pauseTime = 0;
            playPauseBtn.textContent = '▶ Play';
        }
    }, 100);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

// Update samples list
function updateSamplesList() {
    const samples = audioProcessor.getChoppedSamples();
    samplesContainer.innerHTML = '';

    samples.forEach((sample, index) => {
        const duration = sample.endTime - sample.startTime;
        const div = document.createElement('div');
        div.className = 'sample-item';
        div.innerHTML = `
            <h4>${sample.name}</h4>
            <div class="duration">${formatTime(duration)}</div>
            <button class="btn btn-small btn-secondary preview-btn" data-index="${index}">▶ Preview</button>
            <button class="btn btn-small btn-primary download-btn" data-index="${index}">⬇ Download</button>
        `;
        samplesContainer.appendChild(div);
    });

    // Add event listeners
    document.querySelectorAll('.preview-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const index = parseInt(e.target.dataset.index);
            const samples = audioProcessor.getChoppedSamples();
            const sample = samples[index];
            
            audioProcessor.stop();
            audioProcessor.pauseTime = sample.startTime;
            audioProcessor.play(sample.startTime);
            playPauseBtn.textContent = '⏸ Pause';
            waveformRenderer.startPlayheadAnimation();
            
            // Auto-stop at end of sample
            setTimeout(() => {
                audioProcessor.pause();
                playPauseBtn.textContent = '▶ Play';
            }, (sample.endTime - sample.startTime) * 1000);
        });
    });

    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const index = parseInt(e.target.dataset.index);
            await downloadSample(index);
        });
    });
}

// Download individual sample
async function downloadSample(index) {
    const samples = audioProcessor.getChoppedSamples();
    const sample = samples[index];
    
    try {
        const sampleBuffer = await audioProcessor.extractSample(sample.startTime, sample.endTime);
        const blob = await audioProcessor.audioBufferToWav(sampleBuffer);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sample.name}.wav`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading sample:', error);
        alert('Error downloading sample');
    }
}

// Export all samples as ZIP
exportAllBtn.addEventListener('click', async () => {
    const samples = audioProcessor.getChoppedSamples();
    
    if (samples.length === 0) {
        alert('No samples to export');
        return;
    }

    try {
        exportAllBtn.textContent = 'Exporting...';
        exportAllBtn.disabled = true;

        // We'll use JSZip library for creating ZIP files
        // For now, download individually (ZIP requires external library)
        for (let i = 0; i < samples.length; i++) {
            await downloadSample(i);
            await new Promise(resolve => setTimeout(resolve, 300)); // Small delay between downloads
        }

        exportAllBtn.textContent = 'Export All Samples';
        exportAllBtn.disabled = false;
        alert(`Downloaded ${samples.length} samples!`);
    } catch (error) {
        console.error('Error exporting:', error);
        alert('Error exporting samples');
        exportAllBtn.textContent = 'Export All Samples';
        exportAllBtn.disabled = false;
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (waveformRenderer) {
        waveformRenderer.setupCanvas();
        waveformRenderer.updateWaveform();
    }
});
