class WaveformRenderer {
    constructor(canvas, audioProcessor) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioProcessor = audioProcessor;
        this.waveformData = null;
        this.hoveredChopIndex = -1;
        this.selectedChopIndex = -1;
        this.playheadPosition = 0;
        
        this.setupCanvas();
        this.setupInteraction();
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    setupInteraction() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            this.handleMouseMove(x);
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            this.handleClick(x);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredChopIndex = -1;
            this.render();
        });
    }

    handleMouseMove(x) {
        const width = this.canvas.width / window.devicePixelRatio;
        const duration = this.audioProcessor.getDuration();
        const chopPoints = this.audioProcessor.chopPoints;

        let closestIndex = -1;
        let closestDistance = Infinity;

        chopPoints.forEach((time, index) => {
            const chopX = (time / duration) * width;
            const distance = Math.abs(chopX - x);
            if (distance < 10 && distance < closestDistance) {
                closestIndex = index;
                closestDistance = distance;
            }
        });

        if (this.hoveredChopIndex !== closestIndex) {
            this.hoveredChopIndex = closestIndex;
            this.render();
        }

        this.canvas.style.cursor = closestIndex !== -1 ? 'pointer' : 'crosshair';
    }

    handleClick(x) {
        if (this.hoveredChopIndex !== -1) {
            // Clicked on existing chop point - remove it
            this.audioProcessor.removeChopPoint(this.hoveredChopIndex);
            this.hoveredChopIndex = -1;
        } else {
            // Clicked on empty space - add chop point
            const width = this.canvas.width / window.devicePixelRatio;
            const duration = this.audioProcessor.getDuration();
            const time = (x / width) * duration;
            this.audioProcessor.addChopPoint(time);
        }
        this.render();
        
        // Trigger chop count update
        if (window.updateChopCount) {
            window.updateChopCount();
        }
    }

    render() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;

        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        if (!this.waveformData) return;

        // Draw waveform
        this.drawWaveform(width, height);

        // Draw chop points
        this.drawChopPoints(width, height);

        // Draw playhead
        if (this.audioProcessor.isPlaying) {
            this.drawPlayhead(width, height);
        }
    }

    drawWaveform(width, height) {
        const midY = height / 2;
        const amplitudeScale = height / 2 - 10;

        this.ctx.fillStyle = '#667eea';
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 1;

        const pixelWidth = width / this.waveformData.length;

        // Draw mirrored waveform (stereo style - top and bottom from centerline)
        this.waveformData.forEach((data, i) => {
            const x = i * pixelWidth;
            
            // Draw positive amplitude (upward from center)
            const positiveHeight = Math.abs(data.max) * amplitudeScale;
            this.ctx.fillRect(x, midY - positiveHeight, Math.max(1, pixelWidth), positiveHeight);
            
            // Draw negative amplitude (downward from center)
            const negativeHeight = Math.abs(data.min) * amplitudeScale;
            this.ctx.fillRect(x, midY, Math.max(1, pixelWidth), negativeHeight);
        });
    }

    drawChopPoints(width, height) {
        const duration = this.audioProcessor.getDuration();
        const chopPoints = this.audioProcessor.chopPoints;

        chopPoints.forEach((time, index) => {
            const x = (time / duration) * width;
            const isHovered = index === this.hoveredChopIndex;

            // Draw vertical line
            this.ctx.strokeStyle = isHovered ? '#ff4444' : '#ff6b6b';
            this.ctx.lineWidth = isHovered ? 3 : 2;
            this.ctx.setLineDash([5, 3]);
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // Draw marker dot at top
            this.ctx.fillStyle = isHovered ? '#ff4444' : '#ff6b6b';
            this.ctx.beginPath();
            this.ctx.arc(x, 10, isHovered ? 6 : 4, 0, 2 * Math.PI);
            this.ctx.fill();

            // Draw time label
            if (isHovered) {
                const timeStr = this.formatTime(time);
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.font = '12px sans-serif';
                const textWidth = this.ctx.measureText(timeStr).width;
                const textX = Math.max(5, Math.min(width - textWidth - 5, x - textWidth / 2));
                this.ctx.fillText(timeStr, textX, 30);
            }
        });
    }

    drawPlayhead(width, height) {
        const currentTime = this.audioProcessor.getCurrentTime();
        const duration = this.audioProcessor.getDuration();
        const x = (currentTime / duration) * width;

        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, height);
        this.ctx.stroke();
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    }

    updateWaveform() {
        // Force canvas setup to ensure proper dimensions
        this.setupCanvas();
        
        // Get waveform data
        this.waveformData = this.audioProcessor.getWaveformData(
            this.canvas.width / window.devicePixelRatio
        );
        
        // Force immediate render
        this.render();
        
        // Request another render on next frame to ensure visibility
        requestAnimationFrame(() => this.render());
    }

    startPlayheadAnimation() {
        const animate = () => {
            if (this.audioProcessor.isPlaying) {
                this.render();
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
}
