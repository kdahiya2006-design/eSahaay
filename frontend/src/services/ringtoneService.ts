/**
 * Web Audio API Ringtone Generator for eSahaay Helpline Call Simulation.
 * Generates an authentic dual-frequency (440Hz + 480Hz) telecommunication ringtone
 * with a realistic 2-second ringing cadence and 2-second interval cycle.
 * Requires zero external audio files and works 100% offline.
 */

class RingtoneService {
  private audioCtx: AudioContext | null = null;
  private isRinging: boolean = false;
  private loopTimer: any = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isMuted: boolean = false;

  private initAudio() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(muted ? 0 : 0.18, this.audioCtx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public startRingtone() {
    if (this.isRinging) return;
    this.initAudio();
    if (!this.audioCtx) return;

    this.isRinging = true;

    // Helper to play one 2-second dual-frequency pulse
    const playBurst = () => {
      if (!this.isRinging || !this.audioCtx) return;

      try {
        const now = this.audioCtx.currentTime;
        const gain = this.audioCtx.createGain();
        gain.connect(this.audioCtx.destination);
        this.gainNode = gain;

        // Soft attack / decay
        const targetVol = this.isMuted ? 0 : 0.18;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(targetVol, now + 0.08);
        gain.gain.setValueAtTime(targetVol, now + 1.85);
        gain.gain.linearRampToValueAtTime(0, now + 1.95);

        // Indian / Telecom Dual Frequencies (440Hz + 480Hz)
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now);

        osc1.connect(gain);
        osc2.connect(gain);

        osc1.start(now);
        osc2.start(now);

        osc1.stop(now + 2.0);
        osc2.stop(now + 2.0);

        this.osc1 = osc1;
        this.osc2 = osc2;
      } catch (err) {
        console.warn('Ringtone audio playback error:', err);
      }
    };

    // Play first burst immediately
    playBurst();

    // Repeat every 4 seconds (2s ringing + 2s pause)
    this.loopTimer = setInterval(() => {
      if (this.isRinging) {
        playBurst();
      }
    }, 4000);
  }

  public stopRingtone() {
    this.isRinging = false;
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.gainNode && this.audioCtx) {
      try {
        this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      } catch {}
    }
    if (this.osc1) {
      try { this.osc1.stop(); } catch {}
      this.osc1 = null;
    }
    if (this.osc2) {
      try { this.osc2.stop(); } catch {}
      this.osc2 = null;
    }
  }

  /**
   * Play an urgent emergency dispatch sound / confirmation beep
   */
  public playDispatchSound() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';

      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.12); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }
}

export const ringtoneService = new RingtoneService();
