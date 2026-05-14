class AudioProcessor {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioBuffer = null;
        this.fileName = '';
        this.chopPoints = [];
        this.currentSource = null;
        this.isPlaying = false;
        this.startTime = 0;
        this.pauseTime = 0;
    }

    async loadAudioFile(file) {
        this.fileName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        return this.audioBuffer;
    }

    analyzeForChopPoints(thresholdDB = -40, minSilenceDuration = 50, minDistance = 100) {
        if (!this.audioBuffer) return [];

        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        const threshold = this.dbToLinear(thresholdDB);
        const minSilenceSamples = (minSilenceDuration / 1000) * sampleRate;
        const minDistanceSamples = (minDistance / 1000) * sampleRate;

        const chopPoints = [];
        let silenceStart = -1;
        let lastChopPoint = -minDistanceSamples;

        // Analyze waveform
        for (let i = 0; i < channelData.length; i++) {
            const amplitude = Math.abs(channelData[i]);

            if (amplitude < threshold) {
                // Start of silence region
                if (silenceStart === -1) {
                    silenceStart = i;
                }
            } else {
                // End of silence region
                if (silenceStart !== -1) {
                    const silenceDuration = i - silenceStart;
                    
                    // If silence is long enough and far enough from last chop
                    if (silenceDuration >= minSilenceSamples && 
                        silenceStart - lastChopPoint >= minDistanceSamples) {
                        const chopPoint = silenceStart + Math.floor(silenceDuration / 2);
                        chopPoints.push(chopPoint);
                        lastChopPoint = chopPoint;
                    }
                    
                    silenceStart = -1;
                }
            }
        }

        // Convert sample indices to time in seconds
        this.chopPoints = chopPoints.map(sample => sample / sampleRate);
        return this.chopPoints;
    }

    dbToLinear(db) {
        return Math.pow(10, db / 20);
    }

    getWaveformData(width = 1000) {
        if (!this.audioBuffer) return null;

        const channelData = this.audioBuffer.getChannelData(0);
        const samplesPerPixel = Math.floor(channelData.length / width);
        const waveformData = [];

        for (let i = 0; i < width; i++) {
            const start = i * samplesPerPixel;
            const end = start + samplesPerPixel;
            let min = 1;
            let max = -1;

            for (let j = start; j < end && j < channelData.length; j++) {
                const value = channelData[j];
                if (value < min) min = value;
                if (value > max) max = value;
            }

            waveformData.push({ min, max });
        }

        return waveformData;
    }

    play(startTime = 0) {
        if (!this.audioBuffer) return;

        this.stop();
        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = this.audioBuffer;
        this.currentSource.connect(this.audioContext.destination);
        this.currentSource.start(0, startTime);
        this.startTime = this.audioContext.currentTime - startTime;
        this.isPlaying = true;

        this.currentSource.onended = () => {
            this.isPlaying = false;
        };
    }

    pause() {
        if (this.currentSource && this.isPlaying) {
            this.pauseTime = this.audioContext.currentTime - this.startTime;
            this.stop();
        }
    }

    stop() {
        if (this.currentSource) {
            try {
                this.currentSource.stop();
            } catch (e) {
                // Already stopped
            }
            this.currentSource = null;
        }
        this.isPlaying = false;
    }

    getCurrentTime() {
        if (this.isPlaying) {
            return this.audioContext.currentTime - this.startTime;
        }
        return this.pauseTime;
    }

    getDuration() {
        return this.audioBuffer ? this.audioBuffer.duration : 0;
    }

    async extractSample(startTime, endTime) {
        if (!this.audioBuffer) return null;

        const sampleRate = this.audioBuffer.sampleRate;
        const numberOfChannels = this.audioBuffer.numberOfChannels;
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.floor(endTime * sampleRate);
        const length = endSample - startSample;

        const sampleBuffer = this.audioContext.createBuffer(
            numberOfChannels,
            length,
            sampleRate
        );

        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sourceData = this.audioBuffer.getChannelData(channel);
            const sampleData = sampleBuffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                sampleData[i] = sourceData[startSample + i];
            }
        }

        return sampleBuffer;
    }

    async audioBufferToWav(audioBuffer) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numberOfChannels * bytesPerSample;

        const data = [];
        for (let i = 0; i < audioBuffer.length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = audioBuffer.getChannelData(channel)[i];
                const int16 = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
                data.push(int16 < 0 ? int16 + 0x10000 : int16);
            }
        }

        const dataLength = data.length * bytesPerSample;
        const buffer = new ArrayBuffer(44 + dataLength);
        const view = new DataView(buffer);

        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, dataLength, true);

        let offset = 44;
        for (let i = 0; i < data.length; i++) {
            view.setInt16(offset, data[i], true);
            offset += 2;
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    getChoppedSamples() {
        const samples = [];
        const duration = this.getDuration();

        if (this.chopPoints.length === 0) {
            return [{
                startTime: 0,
                endTime: duration,
                name: `${this.getFileNameWithoutExtension()}_full`
            }];
        }

        // First sample (start to first chop)
        samples.push({
            startTime: 0,
            endTime: this.chopPoints[0],
            name: `${this.getFileNameWithoutExtension()}_001`
        });

        // Middle samples
        for (let i = 0; i < this.chopPoints.length - 1; i++) {
            samples.push({
                startTime: this.chopPoints[i],
                endTime: this.chopPoints[i + 1],
                name: `${this.getFileNameWithoutExtension()}_${String(i + 2).padStart(3, '0')}`
            });
        }

        // Last sample (last chop to end)
        samples.push({
            startTime: this.chopPoints[this.chopPoints.length - 1],
            endTime: duration,
            name: `${this.getFileNameWithoutExtension()}_${String(this.chopPoints.length + 1).padStart(3, '0')}`
        });

        return samples;
    }

    getFileNameWithoutExtension() {
        return this.fileName.replace(/\.[^/.]+$/, '');
    }

    addChopPoint(time) {
        this.chopPoints.push(time);
        this.chopPoints.sort((a, b) => a - b);
    }

    removeChopPoint(index) {
        this.chopPoints.splice(index, 1);
    }
}
