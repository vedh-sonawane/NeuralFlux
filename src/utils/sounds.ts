class SoundManager {
  private soundEffectsEnabled = true;
  private backgroundMusicEnabled = true;
  private soundVolume = 100;
  private musicVolume = 100;
  private audioContext: AudioContext | null = null;
  private backgroundMusicOscillator: OscillatorNode | AudioBufferSourceNode | null = null;
  private backgroundMusicGain: GainNode | null = null;
  private backgroundMusicInterval: number | null = null;
  private backgroundMusicNodes: Array<{ stop: () => void }> = [];

  init() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio context initialized, state:', this.audioContext.state);
      
      // Add click listener to resume audio on first user interaction
      const resumeOnInteraction = async () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          try {
            await this.audioContext.resume();
            console.log('Audio context resumed on user interaction, state:', this.audioContext.state);
            if (this.backgroundMusicEnabled && !this.backgroundMusicOscillator) {
              setTimeout(() => {
                this.startBackgroundMusic().catch(err => console.warn('Error starting background music:', err));
              }, 100);
            }
          } catch (error) {
            console.warn('Error resuming audio context:', error);
          }
        }
      };
      
      // Use a more aggressive approach - listen to multiple events
      const events = ['click', 'touchstart', 'keydown', 'mousedown'];
      events.forEach(eventType => {
        document.addEventListener(eventType, resumeOnInteraction, { once: true, passive: true });
      });
    }
  }

  async resumeAudioContext() {
    if (!this.audioContext) {
      this.init();
    }
    
    if (this.audioContext) {
      try {
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
          console.log('Audio context resumed, state:', this.audioContext.state);
        }
        return this.audioContext.state === 'running';
      } catch (error) {
        console.warn('Error resuming audio context:', error);
        return false;
      }
    }
    return false;
  }

  setSoundEffectsEnabled(enabled: boolean) {
    this.soundEffectsEnabled = enabled;
  }

  setBackgroundMusicEnabled(enabled: boolean) {
    this.backgroundMusicEnabled = enabled;
    if (enabled) {
      this.startBackgroundMusic().catch(err => console.warn('Error starting background music:', err));
    } else {
      this.stopBackgroundMusic();
    }
  }

  setSoundVolume(volume: number) {
    this.soundVolume = Math.max(0, Math.min(100, volume));
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(100, volume));
    if (this.backgroundMusicGain) {
      const volumeValue = (this.musicVolume / 100) * 0.15;
      this.backgroundMusicGain.gain.setValueAtTime(volumeValue, this.audioContext!.currentTime);
    }
  }

  private async startBackgroundMusic() {
    if (!this.audioContext) {
      this.init();
    }
    
    if (!this.audioContext) {
      console.warn('Audio context not available for background music');
      return;
    }
    
    if (this.backgroundMusicOscillator) {
      console.log('Background music already playing');
      return;
    }
    
    // Try to resume, but start music even if suspended (it will work once user interacts)
    await this.resumeAudioContext();
    
    if (this.audioContext.state === 'suspended') {
      console.log('Audio context suspended, music will start on user interaction');
    }
    
    try {
      const masterGain = this.audioContext.createGain();
      const volumeValue = (this.musicVolume / 100) * 0.15;
      masterGain.gain.setValueAtTime(volumeValue, this.audioContext.currentTime);
      masterGain.connect(this.audioContext.destination);
      this.backgroundMusicGain = masterGain;
      
      // crackling wire sounds - white noise with filtering
      const crackleNoise = this.audioContext.createBufferSource();
      const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      crackleNoise.buffer = buffer;
      crackleNoise.loop = true;
      
      const crackleFilter = this.audioContext.createBiquadFilter();
      crackleFilter.type = 'bandpass';
      crackleFilter.frequency.value = 800;
      crackleFilter.Q.value = 2;
      
      const crackleGain = this.audioContext.createGain();
      crackleGain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
      
      // modulate crackle gain for variation
      const crackleLFO = this.audioContext.createOscillator();
      const crackleLFOGain = this.audioContext.createGain();
      crackleLFO.frequency.value = 0.3;
      crackleLFOGain.gain.value = 0.04;
      crackleLFO.connect(crackleLFOGain);
      crackleLFOGain.connect(crackleGain.gain);
      
      crackleNoise.connect(crackleFilter);
      crackleFilter.connect(crackleGain);
      crackleGain.connect(masterGain);
      
      crackleNoise.start();
      crackleLFO.start();
      
      // techy bass drone
      const bassOsc = this.audioContext.createOscillator();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.value = 55;
      
      const bassFilter = this.audioContext.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 200;
      bassFilter.Q.value = 1;
      
      const bassGain = this.audioContext.createGain();
      bassGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      
      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(masterGain);
      
      bassOsc.start();
      
      // beat/drum pattern using noise bursts
      const createBeat = () => {
        const beatNoise = this.audioContext!.createBufferSource();
        const beatBuffer = this.audioContext!.createBuffer(1, this.audioContext!.sampleRate * 0.05, this.audioContext!.sampleRate);
        const beatData = beatBuffer.getChannelData(0);
        for (let i = 0; i < beatBuffer.length; i++) {
          beatData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (beatBuffer.length * 0.3));
        }
        beatNoise.buffer = beatBuffer;
        
        const beatGain = this.audioContext!.createGain();
        beatGain.gain.setValueAtTime(0.4, this.audioContext!.currentTime);
        beatGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.05);
        
        beatNoise.connect(beatGain);
        beatGain.connect(masterGain);
        
        beatNoise.start(this.audioContext!.currentTime);
        beatNoise.stop(this.audioContext!.currentTime + 0.05);
      };
      
      // kick drum pattern (4/4 time)
      let beatCount = 0;
      const beatInterval = window.setInterval(() => {
        if (!this.backgroundMusicEnabled) {
          clearInterval(beatInterval);
          return;
        }
        createBeat();
        beatCount++;
        
        // add variation every 4 beats
        if (beatCount % 4 === 0) {
          setTimeout(() => createBeat(), 100);
        }
      }, 500);
      
      // subtle frequency modulation for techy feel
      const techLFO = this.audioContext.createOscillator();
      const techLFOGain = this.audioContext.createGain();
      techLFO.frequency.value = 0.15;
      techLFOGain.gain.value = 10;
      techLFO.connect(techLFOGain);
      techLFOGain.connect(bassOsc.frequency);
      techLFO.start();
      
      // store references
      this.backgroundMusicOscillator = crackleNoise;
      this.backgroundMusicInterval = beatInterval;
      this.backgroundMusicNodes = [
        { stop: () => { try { crackleNoise.stop(); } catch {} } },
        { stop: () => { try { crackleLFO.stop(); } catch {} } },
        { stop: () => { try { bassOsc.stop(); } catch {} } },
        { stop: () => { try { techLFO.stop(); } catch {} } }
      ];
      
    } catch (error) {
      console.warn('Background music error:', error);
    }
  }

  private stopBackgroundMusic() {
    try {
      this.backgroundMusicNodes.forEach(node => {
        try {
          node.stop();
        } catch (e) {
          // ignore errors when stopping
        }
      });
      this.backgroundMusicNodes = [];
    } catch (error) {
      console.warn('Error stopping background music nodes:', error);
    }
    
    if (this.backgroundMusicOscillator) {
      try {
        if (this.backgroundMusicOscillator instanceof OscillatorNode) {
          this.backgroundMusicOscillator.stop();
        } else if (this.backgroundMusicOscillator instanceof AudioBufferSourceNode) {
          this.backgroundMusicOscillator.stop();
        }
        this.backgroundMusicOscillator = null;
        this.backgroundMusicGain = null;
      } catch (error) {
        console.warn('Error stopping background music:', error);
      }
    }
    if (this.backgroundMusicInterval) {
      clearInterval(this.backgroundMusicInterval);
      this.backgroundMusicInterval = null;
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3, modulation?: { freq: number; depth: number }) {
    if (!this.soundEffectsEnabled) return;
    const volumeMultiplier = this.soundVolume / 100;
    volume = volume * volumeMultiplier;
    
    if (!this.audioContext) {
      this.init();
    }
    
    if (!this.audioContext) {
      console.warn('Audio context not available');
      return;
    }

    // Try to resume immediately - sounds will work once context is resumed
    if (this.audioContext.state === 'suspended') {
      this.resumeAudioContext().catch(() => {});
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      if (modulation) {
        const modulator = this.audioContext.createOscillator();
        const modGain = this.audioContext.createGain();
        modulator.frequency.value = modulation.freq;
        modGain.gain.value = modulation.depth;
        modulator.connect(modGain);
        modGain.connect(oscillator.frequency);
        modulator.start(this.audioContext.currentTime);
        modulator.stop(this.audioContext.currentTime + duration);
      }

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Sound playback error:', error);
    }
  }

  playSubmit() {
    this.playTone(600, 0.08, 'square', 0.25, { freq: 20, depth: 50 });
    setTimeout(() => this.playTone(800, 0.1, 'square', 0.25, { freq: 15, depth: 30 }), 40);
  }

  playRequestSpawn() {
    this.playTone(400, 0.15, 'sawtooth', 0.2, { freq: 8, depth: 100 });
  }

  playRequestExpire() {
    this.playTone(120, 0.25, 'sawtooth', 0.5, { freq: 5, depth: 200 });
    setTimeout(() => this.playTone(80, 0.3, 'sawtooth', 0.4, { freq: 3, depth: 150 }), 80);
  }

  playScore() {
    this.playTone(523, 0.08, 'square', 0.25, { freq: 30, depth: 20 });
    setTimeout(() => this.playTone(659, 0.08, 'square', 0.25, { freq: 30, depth: 20 }), 50);
    setTimeout(() => this.playTone(784, 0.12, 'square', 0.3, { freq: 25, depth: 25 }), 100);
  }

  playGameOver() {
    this.playTone(150, 0.3, 'sawtooth', 0.6, { freq: 2, depth: 300 });
    setTimeout(() => this.playTone(100, 0.35, 'sawtooth', 0.5, { freq: 1.5, depth: 250 }), 150);
    setTimeout(() => this.playTone(60, 0.4, 'sawtooth', 0.4, { freq: 1, depth: 200 }), 300);
  }

  playClick() {
    const variations = [
      () => this.playTone(1000, 0.04, 'square', 0.15, { freq: 50, depth: 100 }),
      () => this.playTone(1200, 0.03, 'square', 0.12, { freq: 60, depth: 80 }),
      () => this.playTone(900, 0.05, 'square', 0.18, { freq: 45, depth: 120 }),
    ];
    const randomVariation = variations[Math.floor(Math.random() * variations.length)];
    randomVariation();
  }

  playHover() {
    this.playTone(800, 0.02, 'sine', 0.08);
  }

  playBack() {
    this.playTone(800, 0.1, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(600, 0.12, 'sawtooth', 0.18), 50);
    setTimeout(() => this.playTone(400, 0.15, 'sawtooth', 0.15), 100);
  }

  playSkip() {
    this.playTone(1000, 0.08, 'sawtooth', 0.25);
    setTimeout(() => this.playTone(700, 0.1, 'sawtooth', 0.22), 40);
    setTimeout(() => this.playTone(400, 0.12, 'sawtooth', 0.18), 80);
  }

  playButtonClick() {
    this.playTone(1100, 0.05, 'square', 0.2, { freq: 55, depth: 90 });
  }

  playNavigation() {
    this.playTone(950, 0.06, 'square', 0.16, { freq: 48, depth: 110 });
  }

  playAnalysisComplete() {
    this.playTone(440, 0.1, 'square', 0.3, { freq: 15, depth: 40 });
    setTimeout(() => this.playTone(554, 0.1, 'square', 0.3, { freq: 15, depth: 40 }), 60);
    setTimeout(() => this.playTone(659, 0.15, 'square', 0.35, { freq: 12, depth: 50 }), 120);
    setTimeout(() => this.playTone(880, 0.2, 'square', 0.4, { freq: 10, depth: 60 }), 200);
  }
}

export const soundManager = new SoundManager();
