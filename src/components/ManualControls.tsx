/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Volume2, Play, AlertOctagon, Megaphone, Check } from 'lucide-react';
import { ChimeType, SoundType, CustomAudioFile } from '../types';

interface ManualControlsProps {
  onManualTrigger: (
    soundType: SoundType,
    chimePreset: ChimeType,
    ttsText: string,
    label: string,
    introAudioId?: string
  ) => void;
  isEngineActive: boolean;
  onActivateEngine: () => void;
  customAudios?: CustomAudioFile[];
}

export default function ManualControls({
  onManualTrigger,
  isEngineActive,
  onActivateEngine,
  customAudios = [],
}: ManualControlsProps) {
  const [customText, setCustomText] = useState('');
  const [selectedChime, setSelectedChime] = useState<string>('westminster');
  const [soundType, setSoundType] = useState<SoundType>('both');
  const [customLabel, setCustomLabel] = useState('Pengumuman Kustom');

  const triggerPreset = (
    label: string,
    soundType: SoundType,
    chime: ChimeType,
    tts: string
  ) => {
    if (!isEngineActive) {
      onActivateEngine();
    }
    onManualTrigger(soundType, chime, tts, label);
  };

  const handleCustomBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;

    if (!isEngineActive) {
      onActivateEngine();
    }

    const isCustom = customAudios.some((a) => a.id === selectedChime);
    const chimePreset = isCustom ? ('westminster' as ChimeType) : (selectedChime as ChimeType);
    const introAudioId = isCustom ? selectedChime : undefined;

    onManualTrigger(
      soundType,
      chimePreset,
      customText.trim(),
      customLabel.trim() || 'Pengumuman Manual',
      introAudioId
    );
    setCustomText('');
  };

  return (
    <div id="manual-controls-root" className="bg-white rounded-2xl p-5 border border-earth-300 shadow-xs flex flex-col gap-5">
      <div className="flex items-center gap-2 border-b border-earth-200/50 pb-3">
        <div className="p-1.5 bg-terracotta-50 rounded-lg text-terracotta-500">
          <Volume2 className="w-5 h-5" />
        </div>
        <span className="font-serif font-bold text-earth-900 text-sm">Pemicu Bel Manual</span>
      </div>

      {/* Grid of standard quick-trigger presets */}
      <div className="grid grid-cols-2 gap-3" id="manual-presets-grid">
        {/* Masuk Kelas */}
        <button
          onClick={() =>
            triggerPreset(
              'Bel Masuk (Manual)',
              'both',
              'dingdong',
              'Bel masuk kelas telah berbunyi. Kepada seluruh siswa siswi silakan memasuki ruang kelas masing-masing, dan kepada bapak ibu guru silakan bersiap memulai pembelajaran.'
            )
          }
          className="p-3 bg-earth-100 hover:bg-earth-200 text-earth-900 border border-earth-300 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-sage-100 text-sage-800 flex items-center justify-center font-bold text-sm">
            🚪
          </div>
          <span className="font-semibold text-xs">Bel Masuk</span>
          <span className="text-[10px] text-earth-700">Dingdong + Suara</span>
        </button>

        {/* Istirahat */}
        <button
          onClick={() =>
            triggerPreset(
              'Bel Istirahat (Manual)',
              'both',
              'westminster',
              'Bel istirahat telah berbunyi. Selamat beristirahat.'
            )
          }
          className="p-3 bg-earth-100 hover:bg-earth-200 text-earth-900 border border-earth-300 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-terracotta-100 text-terracotta-700 flex items-center justify-center font-bold text-sm">
            🥤
          </div>
          <span className="font-semibold text-xs">Bel Istirahat</span>
          <span className="text-[10px] text-earth-700">Westminster + Suara</span>
        </button>

        {/* Pulang */}
        <button
          onClick={() =>
            triggerPreset(
              'Bel Pulang (Manual)',
              'both',
              'classic',
              'Bel pulang sekolah telah berbunyi. Terima kasih atas pembelajaran hari ini. Selamat jalan, semoga selamat sampai di rumah masing-masing.'
            )
          }
          className="p-3 bg-earth-100 hover:bg-earth-200 text-earth-900 border border-earth-300 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-earth-200 text-earth-800 flex items-center justify-center font-bold text-sm">
            🎒
          </div>
          <span className="font-semibold text-xs">Bel Pulang</span>
          <span className="text-[10px] text-earth-700">Buzzer + Suara</span>
        </button>

        {/* Darurat */}
        <button
          onClick={() =>
            triggerPreset(
              'Darurat Evakuasi (Manual)',
              'both',
              'classic',
              'Perhatian! Keadaan darurat. Harap seluruh penghuni sekolah segera menghentikan aktivitas dan keluar meninggalkan gedung dengan tertib menuju lapangan utama.'
            )
          }
          className="p-3 bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-900 border border-terracotta-200 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all active:scale-95 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-terracotta-100 text-terracotta-800 flex items-center justify-center">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <span className="font-semibold text-xs text-terracotta-700">DARURAT</span>
          <span className="text-[10px] text-terracotta-600 font-medium">Evakuasi Segera</span>
        </button>
      </div>

      {/* Custom Broadcast / Text to Speech Announcer */}
      <div className="border-t border-earth-200 pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-earth-700">
          <Megaphone className="w-4 h-4 text-terracotta-500" />
          Siaran Mikrofon / Pengumuman Kustom
        </div>

        <form onSubmit={handleCustomBroadcast} className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-earth-700 uppercase tracking-wider">Judul Aktivitas</label>
              <input
                type="text"
                placeholder="e.g., Pengumuman Upacara"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 bg-earth-50 border border-earth-300 rounded-lg text-xs text-earth-900 focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-earth-700 uppercase tracking-wider">Jenis Suara</label>
              <select
                value={soundType}
                onChange={(e) => setSoundType(e.target.value as SoundType)}
                className="w-full mt-1 px-2 py-1.5 bg-earth-50 border border-earth-300 rounded-lg text-xs text-earth-900 focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600"
              >
                <option value="both">Nada + Suara</option>
                <option value="tts">Hanya Suara (TTS)</option>
                <option value="chime">Hanya Nada</option>
              </select>
            </div>
          </div>

          {soundType !== 'tts' && (
            <div>
              <label className="text-[10px] font-bold text-earth-700 uppercase tracking-wider">Pilih Nada Pengiring</label>
              <select
                value={selectedChime}
                onChange={(e) => setSelectedChime(e.target.value)}
                className="w-full mt-1 px-2 py-1.5 bg-earth-50 border border-earth-300 rounded-lg text-xs text-earth-900 focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600"
              >
                <optgroup label="Nada Preset Bawaan">
                  <option value="westminster">Westminster Chime (Gedung)</option>
                  <option value="dingdong">Dingdong Double Chime (Kelas)</option>
                  <option value="dingdongding">Dingdongding Triple Chime (Rekomendasi)</option>
                  <option value="classic">Gong Listrik Klasik (Buzzer)</option>
                  <option value="beep">Beep Digital Pendek</option>
                </optgroup>
                {customAudios.length > 0 && (
                  <optgroup label="Nada Kustom (Hasil Unggah)">
                    {customAudios.map((file) => (
                      <option key={file.id} value={file.id}>
                        🎵 {file.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-earth-700 uppercase tracking-wider">Isi Pengumuman (Teks-Ke-Suara)</label>
            <textarea
              placeholder="Ketik teks pengumuman bahasa Indonesia di sini..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={3}
              required={soundType !== 'chime'}
              className="w-full mt-1 px-3 py-2 bg-earth-50 border border-earth-300 rounded-lg text-xs text-earth-900 focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-sage-700 hover:bg-sage-800 text-white font-medium text-xs rounded-xl shadow-sm cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Siarkan Sekarang
          </button>
        </form>
      </div>
    </div>
  );
}
