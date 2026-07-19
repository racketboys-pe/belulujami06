/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ChimeType = 'westminster' | 'dingdong' | 'dingdongding' | 'classic' | 'beep';
export type SoundType = 'chime' | 'tts' | 'both';

export interface CustomAudioFile {
  id: string;
  name: string;
  dataUrl: string; // Base64 data URL
  size: number; // File size in bytes
}

export interface BellSchedule {
  id: string;
  time: string; // "HH:MM" format
  label: string; // e.g., "Upacara Bendera", "Jam Ke-1", "Istirahat"
  days: number[]; // 1 = Senin, 2 = Selasa, ..., 5 = Jumat, 6 = Sabtu, 0 = Minggu
  soundType: SoundType;
  chimePreset: ChimeType;
  ttsText: string; // Text to be read by Indonesian Speech Synthesis
  isActive: boolean;
  introAudioId?: string; // Optional custom uploaded background audio file ID
}

export interface BellLog {
  id: string;
  timestamp: number; // Unix timestamp in millisecond
  timeStr: string; // e.g., "07:15:02"
  dateStr: string; // e.g., "Senin, 18 Juli 2026"
  label: string;
  type: 'automatic' | 'manual';
  soundType: SoundType;
  details: string; // Describe what played (e.g., "Westminster + TTS")
}

export interface BellSettings {
  ttsVolume: number; // 0 to 1
  ttsRate: number; // 0.5 to 2
  ttsPitch: number; // 0.5 to 2
  chimeVolume: number; // 0 to 1
  selectedVoiceName: string; // Name of speech synthesis voice
  runningText?: string; // Customizable running marquee text
}
