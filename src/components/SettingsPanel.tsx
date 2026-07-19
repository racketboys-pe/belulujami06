/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, Upload, Download, Trash2, Volume2, Settings2, Play, Image, Music, Pause, Sparkles, Lock } from 'lucide-react';
import { BellSettings, BellSchedule, CustomAudioFile } from '../types';
import { getIndonesianVoices, speakTTS } from '../audioEngine';
import { PRESET_SENIN_KAMIS, PRESET_JUMAT, PRESET_UJIAN } from '../constants';
import SchoolLogo from './SchoolLogo';

interface SettingsPanelProps {
  settings: BellSettings;
  onUpdateSettings: (updated: Partial<BellSettings>) => void;
  onLoadPreset: (preset: BellSchedule[]) => void;
  onClearAll: () => void;
  schedules: BellSchedule[];
  logoUrl: string | null;
  onLogoUpdate: (logo: string | null) => void;
  customAudios: CustomAudioFile[];
  onUpdateCustomAudios: (audios: CustomAudioFile[]) => void;
}

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  onLoadPreset,
  onClearAll,
  schedules,
  logoUrl,
  onLogoUpdate,
  customAudios,
  onUpdateCustomAudios,
}: SettingsPanelProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testText, setTestText] = useState('Tes suara bel otomatis siap digunakan.');
  const [isTestPlaying, setIsTestPlaying] = useState(false);

  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [previewAudioObj, setPreviewAudioObj] = useState<HTMLAudioElement | null>(null);

  // State for changing password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const savedPassword = localStorage.getItem('bel_sekolah_admin_password') || 'admin';
    if (currentPassword !== savedPassword) {
      setPasswordError('Kata sandi saat ini salah.');
      return;
    }

    if (newPassword.length < 3) {
      setPasswordError('Kata sandi baru minimal harus 3 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    localStorage.setItem('bel_sekolah_admin_password', newPassword);
    setPasswordSuccess('Kata sandi berhasil diperbarui.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  useEffect(() => {
    // Load voices
    const loadVoices = () => {
      const idVoices = getIndonesianVoices();
      setVoices(idVoices);
      
      // Auto-set first voice if not already configured
      if (!settings.selectedVoiceName && idVoices.length > 0) {
        onUpdateSettings({ selectedVoiceName: idVoices[0].name });
      }
    };

    loadVoices();
    // Chrome registers voices asynchronously
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [settings.selectedVoiceName]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (previewAudioObj) {
        previewAudioObj.pause();
      }
    };
  }, [previewAudioObj]);

  const handlePlayPreview = (id: string, dataUrl: string) => {
    if (playingPreviewId === id) {
      if (previewAudioObj) {
        previewAudioObj.pause();
      }
      setPlayingPreviewId(null);
      setPreviewAudioObj(null);
    } else {
      if (previewAudioObj) {
        previewAudioObj.pause();
      }
      const audio = new Audio(dataUrl);
      audio.volume = settings.chimeVolume;
      audio.onended = () => {
        setPlayingPreviewId(null);
        setPreviewAudioObj(null);
      };
      audio.onerror = () => {
        alert('Gagal memainkan preview file audio ini.');
        setPlayingPreviewId(null);
        setPreviewAudioObj(null);
      };
      audio.play().catch(e => {
        console.warn('Preview error:', e);
        setPlayingPreviewId(null);
        setPreviewAudioObj(null);
      });
      setPlayingPreviewId(id);
      setPreviewAudioObj(audio);
    }
  };

  const handleCustomAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const updatedAudios = [...customAudios];
    let errors: string[] = [];

    const readFile = (file: File) => {
      return new Promise<void>((resolve) => {
        if (file.size > 2.5 * 1024 * 1024) {
          errors.push(`File "${file.name}" terlalu besar (Maksimal 2.5MB untuk efisiensi penyimpanan lokal).`);
          resolve();
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          // Check if same name exists
          const existingIdx = updatedAudios.findIndex(a => a.name === file.name);
          const newAudioObj: CustomAudioFile = {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            dataUrl: base64,
            size: file.size
          };

          if (existingIdx !== -1) {
            updatedAudios[existingIdx] = newAudioObj;
          } else {
            updatedAudios.push(newAudioObj);
          }
          resolve();
        };
        reader.onerror = () => {
          errors.push(`Gagal membaca file "${file.name}".`);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    };

    const promises = Array.from(files).map((file: File) => readFile(file));
    Promise.all(promises).then(() => {
      onUpdateCustomAudios(updatedAudios);
      if (errors.length > 0) {
        alert(errors.join('\n'));
      }
    });

    e.target.value = '';
  };

  const handleRemoveCustomAudio = (id: string) => {
    if (confirm('Hapus nada pengiring kustom ini?')) {
      const updated = customAudios.filter(a => a.id !== id);
      onUpdateCustomAudios(updated);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const handleTestVoice = () => {
    setIsTestPlaying(true);
    speakTTS(testText, settings, () => {
      setIsTestPlaying(false);
    });
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const dataStr = JSON.stringify(schedules, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `bel-sekolah-cadangan-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          if (confirm(`Impor cadangan berhasil dideteksi (${parsed.length} bel). Overwrite jadwal saat ini?`)) {
            onLoadPreset(parsed);
          }
        } else {
          alert('Format cadangan JSON tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca file cadangan: Format JSON rusak.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const loadCombinedPreset = () => {
    if (confirm('Muat jadwal gabungan Senin - Jumat (Total 19 bel)? Jadwal saat ini akan ditimpa.')) {
      // Modify Friday schedules to not conflict but sit nicely
      const combined = [...PRESET_SENIN_KAMIS, ...PRESET_JUMAT];
      onLoadPreset(combined);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file terlalu besar! Maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onLogoUpdate(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    onLogoUpdate(null);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Auto-save Status Alert */}
      <div className="bg-sage-50 border border-sage-200 text-sage-800 rounded-2xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center text-sage-700 shrink-0 font-bold">
            ✓
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold">Penyimpanan Otomatis Aktif (100% Offline)</span>
            <span className="text-[11px] text-earth-700 leading-normal">
              Seluruh perubahan pengaturan, logo, nada kustom, dan jadwal disimpan otomatis langsung ke memori komputer Anda (tidak perlu menekan tombol simpan).
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-sage-200 text-sage-900 px-2.5 py-1 rounded-full uppercase tracking-wider hidden sm:inline-block shrink-0">
          Tersimpan
        </span>
      </div>

      <div id="settings-panel-root" className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* LEFT COLUMN: Voice & Sound Customizations */}
      <div className="flex flex-col gap-5">
        
        {/* Identitas & Logo Sekolah Card */}
        <div className="bg-white rounded-2xl p-5 border border-earth-300 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-earth-200/50 pb-3">
            <div className="p-1.5 bg-terracotta-50 rounded-lg text-terracotta-500">
              <Image className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-earth-900 text-sm">Logo Sekolah</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-earth-300 overflow-hidden bg-earth-50 flex items-center justify-center p-1 shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <SchoolLogo className="w-12 h-12" />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2">
                <label className="px-3 py-1.5 bg-sage-700 hover:bg-sage-800 text-white rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all text-center">
                  Unggah Logo (PNG/JPG)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-2.5 py-1.5 bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-700 rounded-lg text-xs font-semibold cursor-pointer border border-terracotta-200 active:scale-95 transition-all"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <span className="text-[10px] text-earth-700 leading-normal">
                Format PNG/JPG, direkomendasikan logo transparan sekolah Anda.
              </span>
            </div>
          </div>
        </div>

        {/* Teks Berjalan Card */}
        <div className="bg-white rounded-2xl p-5 border border-earth-300 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-earth-200/50 pb-3">
            <div className="p-1.5 bg-sage-50 rounded-lg text-sage-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-earth-900 text-sm">Teks Pengumuman Berjalan (Marquee)</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-earth-700 font-bold uppercase tracking-wider">
              Isi Teks Berjalan
            </label>
            <textarea
              value={settings.runningText || ''}
              onChange={(e) => onUpdateSettings({ runningText: e.target.value })}
              placeholder="Masukkan pengumuman teks berjalan yang akan ditampilkan di bagian paling atas aplikasi..."
              rows={3}
              className="w-full px-3 py-2 bg-earth-50 border border-earth-300 rounded-xl text-xs text-earth-900 font-medium focus:outline-none focus:ring-1 focus:ring-sage-600 focus:border-sage-600"
            />
            <span className="text-[10px] text-earth-700 leading-normal">
              💡 Teks ini akan langsung berjalan di strip merah (marquee) di bagian paling atas seluruh layar aplikasi Anda secara dinamis.
            </span>
          </div>
        </div>

        {/* Nada Pengiring Kustom Card */}
        <div className="bg-white rounded-2xl p-5 border border-earth-300 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-earth-200/50 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-terracotta-50 rounded-lg text-terracotta-500">
                <Music className="w-5 h-5" />
              </div>
              <span className="font-serif font-bold text-earth-900 text-sm">Nada Pengiring Kustom</span>
            </div>
            <label className="px-2.5 py-1.5 bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all flex items-center gap-1 select-none">
              <Upload className="w-3.5 h-3.5" />
              Unggah Baru
              <input
                type="file"
                accept="audio/*"
                multiple
                onChange={handleCustomAudioChange}
                className="hidden"
              />
            </label>
          </div>

          {customAudios.length === 0 ? (
            <div className="py-6 px-4 bg-earth-50 rounded-xl border border-dashed border-earth-200 flex flex-col items-center justify-center text-center">
              <Music className="w-8 h-8 text-earth-300 mb-2 animate-pulse" />
              <span className="text-xs font-bold text-earth-700">Belum ada nada pengiring kustom</span>
              <p className="text-[10px] text-earth-600 mt-0.5 max-w-[280px]">
                Unggah beberapa file MP3/WAV/OGG untuk diputar sebelum pengumuman suara dimulai.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {customAudios.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2.5 bg-earth-50 rounded-xl border border-earth-200 gap-3 group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handlePlayPreview(file.id, file.dataUrl)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                        playingPreviewId === file.id
                          ? 'bg-terracotta-100 text-terracotta-700'
                          : 'bg-white hover:bg-earth-100 text-earth-700 border border-earth-200'
                      }`}
                      title={playingPreviewId === file.id ? "Pause" : "Putar Preview"}
                    >
                      {playingPreviewId === file.id ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="text-xs font-bold text-earth-900 truncate max-w-[150px] sm:max-w-[200px]" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-[10px] text-earth-600">
                        {formatSize(file.size)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCustomAudio(file.id)}
                    className="p-1.5 hover:bg-terracotta-50 text-earth-400 hover:text-terracotta-600 rounded-lg transition-all active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                    title="Hapus Nada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <span className="text-[10px] text-earth-700 leading-normal block">
            ⚠️ Tips: Batasi durasi file audio 5-15 detik (maksimal 2.5MB per file) agar kinerja penyimpanan lokal peramban Anda tetap optimal.
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-earth-300 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-earth-200/50 pb-3">
            <div className="p-1.5 bg-sage-50 rounded-lg text-sage-600">
              <Sliders className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-earth-900 text-sm">Pengaturan Suara (TTS) & Volume</span>
          </div>

        {/* Volume controls */}
        <div className="flex flex-col gap-3.5">
          <div>
            <div className="flex justify-between items-center text-xs text-earth-750 font-semibold mb-1">
              <span>Volume Nada Bel (Chime)</span>
              <span className="font-mono">{Math.round(settings.chimeVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.chimeVolume}
              onChange={(e) => onUpdateSettings({ chimeVolume: Number(e.target.value) })}
              className="w-full accent-sage-600 h-1.5 bg-earth-200 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs text-earth-750 font-semibold mb-1">
              <span>Volume Suara Pengumuman (TTS)</span>
              <span className="font-mono">{Math.round(settings.ttsVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.ttsVolume}
              onChange={(e) => onUpdateSettings({ ttsVolume: Number(e.target.value) })}
              className="w-full accent-sage-600 h-1.5 bg-earth-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* TTS Speed & Pitch */}
          <div className="grid grid-cols-2 gap-3 border-t border-earth-200/55 pt-3">
            <div>
              <div className="flex justify-between items-center text-[11px] text-earth-700 font-bold mb-1 uppercase tracking-wider">
                <span>Kecepatan Bicara</span>
                <span className="font-mono text-xs text-earth-800">{settings.ttsRate}x</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.5"
                step="0.1"
                value={settings.ttsRate}
                onChange={(e) => onUpdateSettings({ ttsRate: Number(e.target.value) })}
                className="w-full accent-sage-600 h-1.5 bg-earth-200 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-[11px] text-earth-700 font-bold mb-1 uppercase tracking-wider">
                <span>Intonasi Nada</span>
                <span className="font-mono text-xs text-earth-800">{settings.ttsPitch}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={settings.ttsPitch}
                onChange={(e) => onUpdateSettings({ ttsPitch: Number(e.target.value) })}
                className="w-full accent-sage-600 h-1.5 bg-earth-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Voice Selector */}
          <div className="border-t border-earth-200/55 pt-3">
            <label className="text-[11px] text-earth-700 font-bold uppercase tracking-wider mb-1 block">
              Pilih Mesin Suara (Indonesian Voice Engine)
            </label>
            {voices.length > 0 ? (
              <select
                value={settings.selectedVoiceName}
                onChange={(e) => onUpdateSettings({ selectedVoiceName: e.target.value })}
                className="w-full mt-1.5 px-3 py-2 bg-earth-50 border border-earth-300 rounded-xl text-xs text-earth-900 font-medium focus:outline-none focus:ring-1 focus:ring-sage-600"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang}) {v.localService ? '[Lokal]' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-terracotta-700 bg-terracotta-50 p-2 rounded-lg border border-terracotta-100 mt-1">
                Suara Bahasa Indonesia khusus tidak terdeteksi. Sistem akan otomatis menggunakan suara default browser.
              </div>
            )}
          </div>

          {/* Voice Tester */}
          <div className="bg-earth-50 border border-earth-250 rounded-xl p-3 flex flex-col gap-2 mt-1">
            <span className="text-[10px] text-earth-700 font-bold uppercase tracking-wider">Uji Coba Pengumuman</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="flex-1 px-3 py-1 bg-white border border-earth-300 rounded-lg text-xs focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600 text-earth-900"
              />
              <button
                type="button"
                onClick={handleTestVoice}
                disabled={isTestPlaying}
                className="px-3 bg-sage-700 hover:bg-sage-800 disabled:bg-sage-400 text-white rounded-lg text-xs cursor-pointer flex items-center gap-1 active:scale-95 transition-all font-serif"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Uji
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* RIGHT COLUMN: Backup, Templates, and Maintenance */}
      <div className="flex flex-col gap-5">
        {/* Instant school templates */}
        <div className="bg-white rounded-2xl p-5 border border-earth-300 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-earth-200/55 pb-3">
            <div className="p-1.5 bg-terracotta-50 rounded-lg text-terracotta-500">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-earth-900 text-sm">Preset Templat Sekolah Indonesia</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                if (confirm('Muat templat standar Senin-Kamis? Jadwal saat ini akan ditimpa.')) {
                  onLoadPreset(PRESET_SENIN_KAMIS);
                }
              }}
              className="py-2.5 px-3 bg-earth-50 hover:bg-earth-100 border border-earth-300 rounded-xl text-left flex flex-col gap-0.5 cursor-pointer transition-all active:scale-95"
            >
              <span className="font-serif font-bold text-xs text-earth-900">Senin - Kamis</span>
              <span className="text-[10px] text-earth-700">12 bel harian, upacara, istirahat</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Muat templat Jumat? Jadwal saat ini akan ditimpa.')) {
                  onLoadPreset(PRESET_JUMAT);
                }
              }}
              className="py-2.5 px-3 bg-earth-50 hover:bg-earth-100 border border-earth-300 rounded-xl text-left flex flex-col gap-0.5 cursor-pointer transition-all active:scale-95"
            >
              <span className="font-serif font-bold text-xs text-earth-900">Hari Jumat</span>
              <span className="text-[10px] text-earth-700">7 bel harian, pulang lebih awal</span>
            </button>

            <button
              onClick={loadCombinedPreset}
              className="py-2.5 px-3 bg-sage-50 hover:bg-sage-100 border border-sage-200 rounded-xl text-left flex flex-col gap-0.5 cursor-pointer transition-all active:scale-95 col-span-2"
            >
              <span className="font-serif font-bold text-xs text-sage-900">Gabungan Senin - Jumat (Rekomendasi)</span>
              <span className="text-[10px] text-sage-800 opacity-90">Mengaktifkan bel otomatis sepanjang hari sekolah</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Muat templat pekan ujian sekolah? Jadwal saat ini akan ditimpa.')) {
                  onLoadPreset(PRESET_UJIAN);
                }
              }}
              className="py-2.5 px-3 bg-earth-50 hover:bg-earth-100 border border-earth-300 rounded-xl text-left flex flex-col gap-0.5 cursor-pointer transition-all active:scale-95 col-span-2"
            >
              <span className="font-serif font-bold text-xs text-earth-900">Pekan Ujian Sekolah (Senin - Sabtu)</span>
              <span className="text-[10px] text-earth-700">Pengawasan ketat waktu masuk, sesi 1, istirahat, sesi 2</span>
            </button>
          </div>
        </div>

        {/* Backup and Wiping controls */}
        <div className="bg-white rounded-2xl p-5 border border-earth-300 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-earth-200/55 pb-3">
            <div className="p-1.5 bg-sage-50 rounded-lg text-sage-600">
              <Settings2 className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-earth-900 text-sm">Pencadangan & Pemeliharaan</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportBackup}
              className="flex-1 py-2 bg-earth-50 hover:bg-earth-100 text-earth-800 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-earth-300"
            >
              <Download className="w-4 h-4" />
              Ekspor Jadwal (JSON)
            </button>

            <label className="flex-1 py-2 bg-earth-50 hover:bg-earth-100 text-earth-800 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-earth-300 text-center">
              <Upload className="w-4 h-4" />
              Impor Jadwal (JSON)
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={() => {
              if (confirm('APAKAH ANDA YAKIN? Tindakan ini akan menghapus semua jadwal bel saat ini secara permanen.')) {
                onClearAll();
              }
            }}
            className="w-full py-2 bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-700 border border-terracotta-200 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 mt-2"
          >
            <Trash2 className="w-4 h-4 text-terracotta-600" />
            Kosongkan Seluruh Jadwal
          </button>
        </div>

        {/* Security and Password Card */}
        <div className="bg-white rounded-2xl p-5 border border-earth-300 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-earth-200/55 pb-3">
            <div className="p-1.5 bg-terracotta-50 rounded-lg text-terracotta-500">
              <Lock className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-earth-900 text-sm">Keamanan & Kata Sandi Operator</span>
          </div>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] text-earth-700 font-bold uppercase tracking-wider mb-1 block">
                Kata Sandi Saat Ini
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Kata sandi saat ini (default: admin)"
                className="w-full px-3 py-1.5 bg-earth-50 border border-earth-300 rounded-xl text-xs text-earth-900 focus:outline-none focus:ring-1 focus:ring-sage-600 focus:border-sage-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-earth-700 font-bold uppercase tracking-wider mb-1 block">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 3 karakter"
                  className="w-full px-3 py-1.5 bg-earth-50 border border-earth-300 rounded-xl text-xs text-earth-900 focus:outline-none focus:ring-1 focus:ring-sage-600 focus:border-sage-600"
                />
              </div>

              <div>
                <label className="text-[10px] text-earth-700 font-bold uppercase tracking-wider mb-1 block">
                  Konfirmasi Sandi
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi sandi baru"
                  className="w-full px-3 py-1.5 bg-earth-50 border border-earth-300 rounded-xl text-xs text-earth-900 focus:outline-none focus:ring-1 focus:ring-sage-600 focus:border-sage-600"
                />
              </div>
            </div>

            {passwordError && (
              <span className="text-[11px] text-terracotta-600 font-medium bg-terracotta-50/50 p-2 rounded-lg border border-terracotta-100 text-center">
                ⚠️ {passwordError}
              </span>
            )}

            {passwordSuccess && (
              <span className="text-[11px] text-green-700 font-semibold bg-green-50 p-2 rounded-lg border border-green-100 text-center">
                ✓ {passwordSuccess}
              </span>
            )}

            <button
              type="submit"
              className="w-full mt-1.5 py-2 bg-sage-700 hover:bg-sage-800 text-white font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              Simpan Kata Sandi Baru
            </button>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
}
