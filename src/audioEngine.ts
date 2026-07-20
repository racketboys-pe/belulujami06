/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChimeType, BellSettings, SoundType } from './types';

let audioCtx: AudioContext | null = null;

/**
 * Initialize AudioContext from user interaction.
 * Crucial for modern browser permission policies.
 */
export function initAudioContext(): AudioContext {
  if (!audioCtx) {
    // Support standard and legacy webkit audio contexts
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  return audioCtx;
}

/**
 * Synthesizes a beautiful metallic brass bell sound.
 * Uses additive synthesis with non-harmonic overtones.
 */
function playBellNote(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number
) {
  // Classic bell overtone ratios
  const ratios = [1.0, 2.0, 2.4, 3.0, 4.2, 5.4];
  const gains = [1.0, 0.5, 0.35, 0.25, 0.15, 0.08];
  const decayMultipliers = [1.0, 0.8, 0.6, 0.45, 0.3, 0.15];

  const noteGain = ctx.createGain();
  noteGain.gain.setValueAtTime(0, startTime);
  noteGain.gain.linearRampToValueAtTime(volume * 0.25, startTime + 0.01);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  noteGain.connect(destination);

  ratios.forEach((ratio, index) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency * ratio, startTime);

    // Apply specific volume decay to each overtone
    oscGain.gain.setValueAtTime(gains[index], startTime);
    oscGain.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + duration * decayMultipliers[index]
    );

    osc.connect(oscGain);
    oscGain.connect(noteGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  });
}

/**
 * Plays a rapid buzzer ring to simulate a classic physical electric gong bell.
 */
function playElectricGong(
  ctx: AudioContext,
  destination: AudioNode,
  startTime: number,
  totalDuration: number,
  volume: number
) {
  const now = startTime;
  
  // Create a gain node for the entire gong ringing duration
  const gongGain = ctx.createGain();
  gongGain.gain.setValueAtTime(0, now);
  gongGain.gain.linearRampToValueAtTime(volume * 0.18, now + 0.02);
  gongGain.gain.setValueAtTime(volume * 0.18, now + totalDuration - 0.1);
  gongGain.gain.exponentialRampToValueAtTime(0.0001, now + totalDuration);
  gongGain.connect(destination);

  // We combine a triangle wave with a bandpass-filtered noise to get a realistic metallic resonance
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(450, now); // Fundamental buzz frequency

  osc2.type = 'square';
  osc2.frequency.setValueAtTime(580, now); // Metallic ring frequency

  // Add a rapid LFO (vibrato) to simulate the physical hammer striking the bell shell
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(16, now); // 16 strikes per second
  lfoGain.gain.setValueAtTime(40, now); // Pitch variation amplitude

  lfo.connect(lfoGain);
  lfoGain.connect(osc1.frequency);
  lfoGain.connect(osc2.frequency);

  // Filter to round out the harsh digital buzz
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, now);
  filter.Q.setValueAtTime(1.5, now);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gongGain);

  lfo.start(now);
  osc1.start(now);
  osc2.start(now);

  lfo.stop(now + totalDuration);
  osc1.stop(now + totalDuration);
  osc2.stop(now + totalDuration);
}

/**
 * Synthesizes a sweet electronic beep.
 */
function playBeepNote(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.1);
}

/**
 * Main chime synthesization coordinator.
 * Schedules and plays chimes precisely based on selected preset.
 */
export function playChime(
  type: ChimeType,
  volume: number,
  onEnd?: () => void
): void {
  const ctx = initAudioContext();
  const now = ctx.currentTime;
  
  // Master compressor to prevent digital clipping
  const compressor = ctx.createDynamicsCompressor();
  compressor.connect(ctx.destination);

  switch (type) {
    case 'westminster': {
      // 8-note simplified school Westminster chime (E Major)
      // Notes: G#4 (415Hz), F#4 (370Hz), E4 (330Hz), B3 (247Hz)
      const notes = [
        { freq: 415.30, duration: 0.65 }, // G#4
        { freq: 369.99, duration: 0.65 }, // F#4
        { freq: 329.63, duration: 0.65 }, // E4
        { freq: 246.94, duration: 0.85 }, // B3
        { freq: 329.63, duration: 0.65 }, // E4
        { freq: 369.99, duration: 0.65 }, // F#4
        { freq: 415.30, duration: 0.65 }, // G#4
        { freq: 329.63, duration: 1.20 }  // E4 (Final lingering ring)
      ];

      let scheduleTime = now;
      notes.forEach((note) => {
        playBellNote(ctx, compressor, note.freq, scheduleTime, note.duration, volume);
        scheduleTime += note.duration - 0.05; // Gentle overlapping
      });

      const totalDurationMs = (scheduleTime - now) * 1000;
      setTimeout(() => {
        onEnd?.();
      }, totalDurationMs);
      break;
    }

    case 'dingdong': {
      // Classic Double Chime (Sol-Do / G5-C5)
      const note1Freq = 783.99; // G5
      const note2Freq = 523.25; // C5

      playBellNote(ctx, compressor, note1Freq, now, 0.7, volume);
      playBellNote(ctx, compressor, note2Freq, now + 0.5, 1.4, volume);

      setTimeout(() => {
        onEnd?.();
      }, 2000);
      break;
    }

    case 'dingdongding': {
      // Ding Dong Ding Chime (Three sweet metal chime notes: G5 - E5 - C5)
      const note1Freq = 783.99; // G5 (Ding)
      const note2Freq = 659.25; // E5 (Dong)
      const note3Freq = 523.25; // C5 (Ding)

      playBellNote(ctx, compressor, note1Freq, now, 0.7, volume);
      playBellNote(ctx, compressor, note2Freq, now + 0.4, 0.7, volume);
      playBellNote(ctx, compressor, note3Freq, now + 0.8, 1.5, volume);

      setTimeout(() => {
        onEnd?.();
      }, 2500);
      break;
    }

    case 'classic': {
      // Physical buzzer electric bell (long continuous ring)
      const ringDuration = 4.0; // 4 seconds of classic school bell
      playElectricGong(ctx, compressor, now, ringDuration, volume);

      setTimeout(() => {
        onEnd?.();
      }, ringDuration * 1000 + 100);
      break;
    }

    case 'beep': {
      // High-pitched sweet Triple Digital Beep
      const beepFreq = 1200; // 1.2 kHz
      const duration = 0.15;
      const spacing = 0.3;

      playBeepNote(ctx, compressor, beepFreq, now, duration, volume);
      playBeepNote(ctx, compressor, beepFreq, now + spacing, duration, volume);
      playBeepNote(ctx, compressor, beepFreq, now + spacing * 2, duration, volume);

      setTimeout(() => {
        onEnd?.();
      }, (spacing * 2 + duration) * 1000 + 50);
      break;
    }

    default:
      onEnd?.();
  }
}

/**
 * Text-to-Speech (TTS) Engine for Indonesia
 * Reads announcements using the browser speech synthesis.
 */
export function speakTTS(
  text: string,
  settings: BellSettings,
  onEnd?: () => void
): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech Synthesis API tidak didukung di browser ini.');
    onEnd?.();
    return;
  }

  // Cancel any ongoing speeches
  window.speechSynthesis.cancel();

  // Prepend prefix to guarantee that any voice speech is polite, human, and starts with:
  // "Assalamualaikum warahmatullahi wabarakatuh, Kepada Seluruh Siswa dan Siswi SDN Ulujami 06 Pagi,"
  const prefix = "Assalamualaikum warahmatullahi wabarakatuh, Kepada Seluruh Siswa dan Siswi SDN Ulujami 06 Pagi, ";
  let fullText = text;
  if (text.trim() !== '') {
    const normalizedText = text.toLowerCase().trim();
    if (!normalizedText.startsWith("waalaikumsalam") && !normalizedText.startsWith("assalamualaikum")) {
      fullText = prefix + text;
    }
  }

  // Create utterance with Indonesian phrasing support
  const utterance = new SpeechSynthesisUtterance(fullText);
  utterance.lang = 'id-ID';
  // Adjust rate slightly down (e.g. multiply by 0.85) to make it speak in a very calm, clear, human, school-announcer voice
  utterance.volume = settings.ttsVolume;
  utterance.rate = settings.ttsRate * 0.85;
  utterance.pitch = settings.ttsPitch;

  // Attempt to select specific Indonesian voice
  const voices = window.speechSynthesis.getVoices();
  if (settings.selectedVoiceName) {
    const selected = voices.find((v) => v.name === settings.selectedVoiceName);
    if (selected) {
      utterance.voice = selected;
    }
  } else {
    // Auto-discover the best Indonesian voice
    const idVoice = voices.find(
      (v) => v.lang.startsWith('id') || v.lang.includes('Indonesia')
    );
    if (idVoice) {
      utterance.voice = idVoice;
    }
  }

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.error('TTS Error:', e);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Plays a custom uploaded audio file (Base64 data URL) using HTMLAudioElement
 */
export function playCustomAudio(
  dataUrl: string,
  volume: number,
  onEnd?: () => void
): HTMLAudioElement {
  const audio = new Audio(dataUrl);
  audio.volume = volume;
  audio.onended = () => {
    onEnd?.();
  };
  audio.onerror = (e) => {
    console.error('Error playing custom audio:', e);
    onEnd?.();
  };
  audio.play().catch((err) => {
    console.warn('Playback error for custom audio:', err);
    onEnd?.();
  });
  return audio;
}

/**
 * High-level orchestration function to play both Chime and TTS sequentially
 * if configured, otherwise plays them as requested.
 */
export function playBellNotification(
  soundType: SoundType,
  chimePreset: ChimeType,
  ttsText: string,
  settings: BellSettings,
  customIntroAudioDataUrl?: string,
  onEnd?: () => void
): void {
  // Ensure AudioContext is initialized/resumed on user gesture
  try {
    initAudioContext();
  } catch (error) {
    console.warn('Gagal memicu inisialisasi AudioContext:', error);
  }

  const triggerChime = (callback?: () => void) => {
    if (customIntroAudioDataUrl) {
      playCustomAudio(customIntroAudioDataUrl, settings.chimeVolume, callback);
    } else {
      playChime(chimePreset, settings.chimeVolume, callback);
    }
  };

  const triggerTTS = (callback?: () => void) => {
    if (ttsText.trim() !== '') {
      // SpeechSynthesis works better with a small breather after a chime finishes
      setTimeout(() => {
        speakTTS(ttsText, settings, callback);
      }, 400);
    } else {
      callback?.();
    }
  };

  if (soundType === 'chime') {
    triggerChime(onEnd);
  } else if (soundType === 'tts') {
    triggerTTS(onEnd);
  } else if (soundType === 'both') {
    // Chime plays first, then TTS plays immediately after chime concludes
    triggerChime(() => {
      triggerTTS(onEnd);
    });
  } else {
    onEnd?.();
  }
}

/**
 * Gets the list of Indonesian voices available in the browser.
 */
export function getIndonesianVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) {
    return [];
  }
  const allVoices = window.speechSynthesis.getVoices();
  // Filter for Indonesian (lang starting with id)
  const idVoices = allVoices.filter(
    (v) => v.lang.toLowerCase().startsWith('id') || v.name.toLowerCase().includes('indonesia')
  );
  
  // Return all voices if Indonesian is not found, to allow users to select standard voices as fallback
  return idVoices.length > 0 ? idVoices : allVoices;
}

let silenceOscillator: OscillatorNode | null = null;
let silenceGain: GainNode | null = null;

/**
 * Plays an extremely low-gain, sub-audible oscillator.
 * This registers as active audio output to prevent the browser from sleeping
 * or suspending the tab when it is minimized or running in the background.
 */
export function startSilenceKeepAlive(): void {
  try {
    const ctx = initAudioContext();
    if (!silenceOscillator) {
      silenceOscillator = ctx.createOscillator();
      silenceGain = ctx.createGain();
      
      // Setting a virtually zero volume to make it totally silent (1e-6)
      silenceGain.gain.setValueAtTime(0.000001, ctx.currentTime);
      
      silenceOscillator.type = 'sine';
      silenceOscillator.frequency.setValueAtTime(1, ctx.currentTime); // 1 Hz (sub-audible infrasound)
      
      silenceOscillator.connect(silenceGain);
      silenceGain.connect(ctx.destination);
      
      silenceOscillator.start();
      console.log('🔌 Keep-Alive Audio Latar Belakang Aktif');
    }
  } catch (err) {
    console.warn('Gagal mengaktifkan keep-alive audio:', err);
  }
}

export function stopSilenceKeepAlive(): void {
  try {
    if (silenceOscillator) {
      silenceOscillator.stop();
      silenceOscillator.disconnect();
      silenceOscillator = null;
    }
    if (silenceGain) {
      silenceGain.disconnect();
      silenceGain = null;
    }
    console.log('🛑 Keep-Alive Audio Latar Belakang Nonaktif');
  } catch (err) {
    console.warn('Gagal mematikan keep-alive audio:', err);
  }
}

