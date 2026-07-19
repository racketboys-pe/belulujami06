/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Play, Check, X, CalendarDays, Music, Sparkles } from 'lucide-react';
import { BellSchedule, ChimeType, SoundType, CustomAudioFile } from '../types';
import { HARI_INDONESIA, getHariName, getDefaultTtsText } from '../constants';

interface ScheduleTableProps {
  schedules: BellSchedule[];
  onAddSchedule: (schedule: Omit<BellSchedule, 'id'>) => void;
  onUpdateSchedule: (id: string, updated: Partial<BellSchedule>) => void;
  onDeleteSchedule: (id: string) => void;
  onPreviewSchedule: (schedule: BellSchedule) => void;
  customAudios?: CustomAudioFile[];
}

export default function ScheduleTable({
  schedules,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onPreviewSchedule,
  customAudios = [],
}: ScheduleTableProps) {
  // Adding schedule form state
  const [isAdding, setIsAdding] = useState(false);
  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4]); // default Mon-Thu
  const [soundType, setSoundType] = useState<SoundType>('both');
  const [chimePreset, setChimePreset] = useState<ChimeType>('westminster');
  const [ttsText, setTtsText] = useState('');
  const [introAudioId, setIntroAudioId] = useState<string>('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editDays, setEditDays] = useState<number[]>([]);
  const [editSoundType, setEditSoundType] = useState<SoundType>('both');
  const [editChime, setEditChime] = useState<ChimeType>('westminster');
  const [editTtsText, setEditTtsText] = useState('');
  const [editIntroAudioId, setEditIntroAudioId] = useState<string>('');

  // Filtering state
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all');

  const handleDayToggle = (dayVal: number) => {
    if (selectedDays.includes(dayVal)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayVal));
    } else {
      setSelectedDays([...selectedDays, dayVal].sort());
    }
  };

  const handleEditDayToggle = (dayVal: number) => {
    if (editDays.includes(dayVal)) {
      setEditDays(editDays.filter((d) => d !== dayVal));
    } else {
      setEditDays([...editDays, dayVal].sort());
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    // Auto-generate TTS text if left blank
    const finalTtsText = ttsText.trim() || getDefaultTtsText(label);

    onAddSchedule({
      time,
      label: label.trim(),
      days: selectedDays,
      soundType,
      chimePreset,
      ttsText: finalTtsText,
      isActive: true,
      introAudioId: soundType !== 'tts' ? (introAudioId || undefined) : undefined,
    });

    // Reset Form
    setLabel('');
    setTtsText('');
    setIntroAudioId('');
    setIsAdding(false);
  };

  const startEdit = (sched: BellSchedule) => {
    setEditingId(sched.id);
    setEditTime(sched.time);
    setEditLabel(sched.label);
    setEditDays(sched.days);
    setEditSoundType(sched.soundType);
    setEditChime(sched.chimePreset);
    setEditTtsText(sched.ttsText);
    setEditIntroAudioId(sched.introAudioId || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    if (!editLabel.trim()) return;
    
    // Auto generate if empty
    const finalTts = editTtsText.trim() || getDefaultTtsText(editLabel);

    onUpdateSchedule(id, {
      time: editTime,
      label: editLabel.trim(),
      days: editDays,
      soundType: editSoundType,
      chimePreset: editChime,
      ttsText: finalTts,
      introAudioId: editSoundType !== 'tts' ? (editIntroAudioId || undefined) : undefined,
    });

    setEditingId(null);
  };

  // Sort schedules by time
  const sortedSchedules = [...schedules].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  // Filter schedules if filter is set
  const filteredSchedules = sortedSchedules.filter((sched) => {
    if (dayFilter === 'all') return true;
    return sched.days.includes(dayFilter) || sched.days.length === 0;
  });

  // Auto generate speech preview button
  const handleGenerateTtsPreset = () => {
    if (label.trim()) {
      setTtsText(getDefaultTtsText(label));
    }
  };

  const handleGenerateEditTtsPreset = () => {
    if (editLabel.trim()) {
      setEditTtsText(getDefaultTtsText(editLabel));
    }
  };

  return (
    <div id="schedule-table-root" className="flex flex-col gap-5">
      {/* Filters and Add Controls header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-earth-300 shadow-xs">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-sage-600" />
          <span className="font-serif font-bold text-earth-900 text-sm">Filter Hari:</span>
          <select
            value={dayFilter}
            onChange={(e) => {
              const val = e.target.value;
              setDayFilter(val === 'all' ? 'all' : Number(val));
            }}
            className="px-2.5 py-1 text-xs bg-earth-50 border border-earth-300 rounded-lg text-earth-800 font-medium focus:outline-none focus:border-sage-600 cursor-pointer"
          >
            <option value="all">Semua Hari</option>
            {HARI_INDONESIA.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-sage-700 hover:bg-sage-800 text-white font-medium text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer self-stretch sm:self-auto justify-center font-serif font-bold"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Tutup Formulir' : 'Tambah Jadwal Bel'}
        </button>
      </div>

      {/* Expandable Add Schedule Form */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-sage-50/80 border border-sage-200 rounded-2xl p-5 shadow-inner flex flex-col gap-4 animate-[slideDown_0.2s_ease-out]"
          id="add-schedule-form"
        >
          <div className="flex justify-between items-center border-b border-sage-200 pb-2">
            <h4 className="font-serif font-bold text-xs text-sage-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-terracotta-500 animate-pulse" />
              Rancang Jadwal Bel Baru
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Waktu & Label */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-earth-800 uppercase tracking-wider">
                  Waktu Bel (HH:MM)
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full mt-1.5 px-3 py-1.5 bg-white border border-earth-300 rounded-xl text-sm font-semibold font-mono text-earth-900 focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-earth-800 uppercase tracking-wider">
                  Nama Kegiatan / Label Bel
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Jam Pertama, Istirahat, Pulang"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full mt-1.5 px-3 py-1.5 bg-white border border-earth-300 rounded-xl text-sm font-medium text-earth-900 focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600"
                />
              </div>
            </div>

            {/* Hari Terjadwal */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-earth-800 uppercase tracking-wider mb-0.5">
                Pilih Hari Operasional
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {HARI_INDONESIA.map((day) => {
                  const active = selectedDays.includes(day.value);
                  return (
                    <button
                      type="button"
                      key={day.value}
                      onClick={() => handleDayToggle(day.value)}
                      className={`h-7 px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        active
                          ? 'bg-sage-700 text-white shadow-xs'
                          : 'bg-white hover:bg-earth-100 text-earth-700 border border-earth-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-earth-700 italic mt-2">
                * Kosongkan pilihan jika ingin bel berbunyi setiap hari.
              </p>
            </div>

            {/* Nada & Suara */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-bold text-earth-800 uppercase tracking-wider">
                  Jenis Bunyi
                </label>
                <select
                  value={soundType}
                  onChange={(e) => setSoundType(e.target.value as SoundType)}
                  className="w-full mt-1.5 px-2.5 py-1.5 bg-white border border-earth-300 rounded-xl text-xs text-earth-900 focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600"
                >
                  <option value="both">Nada Pengiring + Suara Pengumuman</option>
                  <option value="chime">Hanya Nada Bel</option>
                  <option value="tts">Hanya Suara Pengumuman (TTS)</option>
                </select>
              </div>

              {soundType !== 'tts' && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-earth-800 uppercase tracking-wider">
                      Pilih Nada Bel / Pengiring
                    </label>
                    <select
                      value={introAudioId || chimePreset}
                      onChange={(e) => {
                        const val = e.target.value;
                        const isCustom = customAudios.some((a) => a.id === val);
                        if (isCustom) {
                          setIntroAudioId(val);
                        } else {
                          setIntroAudioId('');
                          setChimePreset(val as ChimeType);
                        }
                      }}
                      className="w-full mt-1.5 px-2.5 py-1.5 bg-white border border-earth-300 rounded-xl text-xs text-earth-900 focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600 animate-[fadeIn_0.2s_ease]"
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
                </div>
              )}
            </div>
          </div>

          {/* Speech Text Input */}
          {soundType !== 'chime' && (
            <div className="border-t border-sage-200 pt-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-earth-800 uppercase tracking-wider">
                  Isi Pengumuman Suara (Teks-Ke-Suara Bahasa Indonesia)
                </label>
                {label.trim() && (
                  <button
                    type="button"
                    onClick={handleGenerateTtsPreset}
                    className="text-[10px] bg-sage-100 hover:bg-sage-200 text-sage-800 font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Buat Teks Otomatis
                  </button>
                )}
              </div>
              <textarea
                placeholder="Tulis kalimat pengumuman lengkap yang akan dibacakan setelah nada bel berbunyi..."
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                rows={2}
                className="w-full mt-1.5 px-3 py-2 bg-white border border-earth-300 rounded-xl text-xs text-earth-900 focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600 resize-none"
              />
              <p className="text-[10px] text-earth-700 mt-1 italic">
                * Kosongkan untuk menggunakan pengumuman bawaan sistem.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-sage-200 pt-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-semibold text-sage-900 bg-sage-100 hover:bg-sage-200 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-terracotta-500 hover:bg-terracotta-600 shadow-sm rounded-xl cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Simpan Jadwal
            </button>
          </div>
        </form>
      )}

      {/* Main Schedules List */}
      <div className="bg-white rounded-2xl border border-earth-300 shadow-xs overflow-hidden" id="schedules-container-card">
        {filteredSchedules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-earth-200/50 border-b border-earth-300 text-earth-700 text-[10px] font-bold tracking-wider uppercase">
                  <th className="py-2.5 px-2 sm:px-3.5 w-16 sm:w-20 text-center">Waktu</th>
                  <th className="py-2.5 px-2 sm:px-3.5">Keterangan & Hari</th>
                  <th className="py-2.5 px-2 sm:px-3.5 w-32 sm:w-44">Jenis Bunyi / Nada</th>
                  <th className="py-2.5 px-2 sm:px-3.5 w-12 sm:w-16 text-center">Aktif</th>
                  <th className="py-2.5 px-2 sm:px-3.5 w-24 sm:w-28 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-200">
                {filteredSchedules.map((sched) => {
                  return (
                    <tr
                       key={sched.id}
                       className={`transition-colors hover:bg-earth-100/35 ${
                         !sched.isActive ? 'opacity-65 bg-earth-100/10' : ''
                       }`}
                    >
                      {/* --- COL 1: TIME --- */}
                      <td className="py-3 px-2 sm:px-3.5 text-center">
                        <span className="font-mono font-bold text-base sm:text-lg text-earth-900 tracking-tight">
                          {sched.time}
                        </span>
                      </td>

                      {/* --- COL 2: DETAILS (LABEL & DAYS) --- */}
                      <td className="py-3 px-2 sm:px-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="font-serif font-bold text-earth-900 text-xs sm:text-sm">
                            {sched.label}
                          </span>
                          {/* Days indicators */}
                          <div className="flex items-center gap-1">
                            {sched.days.length === 0 ? (
                              <span className="text-[9px] sm:text-[10px] font-medium bg-sage-50 text-sage-800 px-1.5 py-0.2 rounded">
                                Setiap Hari
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-0.5 sm:gap-1">
                                {HARI_INDONESIA.map((day) => {
                                  const active = sched.days.includes(day.value);
                                  if (!active) return null;
                                  return (
                                    <span
                                      key={day.value}
                                      className="text-[9px] sm:text-[10px] font-bold bg-earth-100 text-earth-700 px-1 sm:px-1.5 py-0.2 rounded border border-earth-200"
                                    >
                                      {day.label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* --- COL 3: SOUND DETAILS --- */}
                      <td className="py-3 px-2 sm:px-3.5 text-xs">
                        <div className="flex flex-col gap-0.5 sm:gap-1">
                          <div className="flex items-center gap-1 font-semibold text-earth-800 text-[11px] sm:text-xs">
                            <Music className="w-3 h-3 text-earth-700" />
                            <span className="capitalize">
                              {sched.soundType === 'both' ? 'Nada & Suara' : sched.soundType === 'chime' ? 'Hanya Nada' : 'Hanya Suara (TTS)'}
                            </span>
                          </div>
                          
                          {sched.soundType !== 'tts' && (
                            <span className="text-[9px] sm:text-[10px] text-sage-800 font-mono font-bold bg-sage-50 px-1 py-0.2 rounded w-max truncate max-w-[120px] sm:max-w-[160px]" title={sched.introAudioId && customAudios.some(a => a.id === sched.introAudioId) ? customAudios.find(a => a.id === sched.introAudioId)?.name : sched.chimePreset}>
                              {sched.introAudioId && customAudios.some(a => a.id === sched.introAudioId)
                                ? `🎵 ${customAudios.find(a => a.id === sched.introAudioId)?.name}`
                                : `🔔 ${sched.chimePreset}`}
                            </span>
                          )}
                          
                          {sched.soundType !== 'chime' && (
                            <p className="text-[9px] sm:text-[10px] text-earth-750 italic line-clamp-1 max-w-[110px] sm:max-w-[180px]" title={sched.ttsText}>
                              "{sched.ttsText}"
                            </p>
                          )}
                        </div>
                      </td>

                      {/* --- COL 4: STATUS SWITCH --- */}
                      <td className="py-3 px-2 sm:px-3.5 text-center">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => onUpdateSchedule(sched.id, { isActive: !sched.isActive })}
                            className={`w-8 h-5 sm:w-10 sm:h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer focus:outline-none flex items-center ${
                              sched.isActive ? 'bg-sage-600 justify-end' : 'bg-earth-300 justify-start'
                            }`}
                          >
                            <span className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-md transform duration-200" />
                          </button>
                        </div>
                      </td>

                      {/* --- COL 5: ACTIONS --- */}
                      <td className="py-3 px-2 sm:px-3.5">
                        <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                          {/* Preview ring button */}
                          <button
                            onClick={() => onPreviewSchedule(sched)}
                            className="p-1 sm:p-1.5 text-sage-700 hover:bg-sage-50 border border-sage-200 rounded-lg cursor-pointer transition-all"
                            title="Uji Suara"
                          >
                            <Play className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current text-sage-600" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => startEdit(sched)}
                            className="p-1 sm:p-1.5 text-earth-700 hover:bg-earth-100 border border-earth-300 rounded-lg cursor-pointer transition-all"
                            title="Ubah"
                          >
                            <Edit2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-earth-800" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => {
                              if (confirm(`Hapus jadwal bel "${sched.label}"?`)) {
                                onDeleteSchedule(sched.id);
                              }
                            }}
                            className="p-1 sm:p-1.5 text-terracotta-600 hover:bg-terracotta-50 border border-terracotta-200 rounded-lg cursor-pointer transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-earth-700 text-sm flex flex-col items-center gap-2 bg-earth-50">
            <span>Tidak ada jadwal bel yang sesuai dengan filter.</span>
            <button
              onClick={() => {
                setDayFilter('all');
                setIsAdding(true);
              }}
              className="mt-2 text-sage-700 font-bold hover:underline cursor-pointer"
            >
              Reset Filter & Buat Jadwal Baru
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal Dialog */}
      {editingId !== null && (
        <div className="fixed inset-0 bg-earth-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-[fadeIn_0.2s_ease-out]" id="edit-schedule-modal">
          <div className="bg-white rounded-2xl border border-earth-300 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-sage-50 px-5 py-4 border-b border-earth-200 flex justify-between items-center">
              <h3 className="font-serif font-bold text-sm text-sage-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-terracotta-500" />
                Ubah Jadwal Bel
              </h3>
              <button 
                type="button" 
                onClick={cancelEdit}
                className="text-earth-500 hover:text-earth-700 p-1 rounded-lg hover:bg-earth-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={(e) => { e.preventDefault(); saveEdit(editingId); }} className="p-5 flex flex-col gap-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Waktu Bel */}
                <div>
                  <label className="text-[10px] font-bold text-earth-800 uppercase tracking-wider">
                    Waktu Bel (HH:MM)
                  </label>
                  <input
                    type="time"
                    required
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full mt-1.5 px-3 py-1.5 bg-earth-50 border border-earth-300 rounded-xl text-sm font-semibold font-mono text-earth-900 focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600"
                  />
                </div>

                {/* Label Bel */}
                <div>
                  <label className="text-[10px] font-bold text-earth-800 uppercase tracking-wider">
                    Nama Kegiatan / Label Bel
                  </label>
                  <input
                    type="text"
                    required
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="w-full mt-1.5 px-3 py-1.5 bg-earth-50 border border-earth-300 rounded-xl text-sm font-medium text-earth-900 focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600"
                  />
                </div>
              </div>

              {/* Hari Operasional */}
              <div>
                <span className="text-[10px] font-bold text-earth-800 uppercase tracking-wider block mb-1.5">
                  Hari Operasional Bel
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {HARI_INDONESIA.map((day) => {
                    const active = editDays.includes(day.value);
                    return (
                      <button
                        type="button"
                        key={day.value}
                        onClick={() => handleEditDayToggle(day.value)}
                        className={`h-7 px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                          active
                            ? 'bg-sage-700 text-white shadow-xs'
                            : 'bg-earth-50 hover:bg-earth-100 text-earth-700 border border-earth-300'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-earth-600 italic mt-1.5">
                  * Kosongkan pilihan jika ingin bel berbunyi setiap hari.
                </p>
              </div>

              {/* Jenis Suara */}
              <div className="flex flex-col gap-3 pt-1 border-t border-earth-100">
                <div>
                  <label className="text-[10px] font-bold text-earth-800 uppercase tracking-wider">
                    Jenis Bunyi
                  </label>
                  <select
                    value={editSoundType}
                    onChange={(e) => setEditSoundType(e.target.value as SoundType)}
                    className="w-full mt-1.5 px-2.5 py-1.5 bg-earth-50 border border-earth-300 rounded-xl text-xs text-earth-900 focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600"
                  >
                    <option value="both">Nada + Suara</option>
                    <option value="chime">Hanya Nada</option>
                    <option value="tts">Hanya Suara (TTS)</option>
                  </select>
                </div>

                {/* Pilih Nada Bel */}
                {editSoundType !== 'tts' && (
                  <div>
                    <label className="text-[10px] font-bold text-earth-800 uppercase tracking-wider">
                      Pilih Nada Bel / Pengiring
                    </label>
                    <select
                      value={editIntroAudioId || editChime}
                      onChange={(e) => {
                        const val = e.target.value;
                        const isCustom = customAudios.some((a) => a.id === val);
                        if (isCustom) {
                          setEditIntroAudioId(val);
                        } else {
                          setEditIntroAudioId('');
                          setEditChime(val as ChimeType);
                        }
                      }}
                      className="w-full mt-1.5 px-2.5 py-1.5 bg-earth-50 border border-earth-300 rounded-xl text-xs text-earth-900 focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600"
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

                {/* Teks TTS */}
                {editSoundType !== 'chime' && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-earth-800 uppercase tracking-wider">
                        Teks Pengeras Suara (TTS)
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateEditTtsPreset}
                        className="text-[10px] font-bold bg-sage-50 hover:bg-sage-100 text-sage-800 px-2 py-0.5 rounded border border-sage-200 cursor-pointer"
                      >
                        Gunakan Kalimat Otomatis
                      </button>
                    </div>
                    <textarea
                      placeholder="Masukkan pesan teks suara untuk diumumkan"
                      value={editTtsText}
                      onChange={(e) => setEditTtsText(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 bg-earth-50 border border-earth-300 rounded-xl text-xs text-earth-900 focus:outline-none focus:border-sage-600 focus:ring-1 focus:ring-sage-600 resize-none font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 border-t border-earth-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-xs font-semibold text-earth-800 bg-earth-100 hover:bg-earth-200 border border-earth-300 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sage-700 hover:bg-sage-800 shadow-sm rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
