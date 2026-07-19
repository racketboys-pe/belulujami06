/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BellSchedule } from './types';

export const HARI_INDONESIA = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 0, label: 'Minggu' },
];

export const getHariName = (dayNum: number): string => {
  const day = HARI_INDONESIA.find((h) => h.value === dayNum);
  return day ? day.label : 'Setiap Hari';
};

// Generates beautiful default speech text based on label
export const getDefaultTtsText = (label: string): string => {
  const cleanLabel = label.toLowerCase();
  
  if (cleanLabel.includes('upacara')) {
    return 'Diberitahukan kepada seluruh siswa siswi, upacara bendera akan segera dimulai. Silakan baris tertib di lapangan sekolah.';
  }
  if (cleanLabel.includes('masuk kelas') || cleanLabel.includes('literasi') || cleanLabel.includes('persiapan')) {
    return 'Bel masuk kelas telah berbunyi. Kepada seluruh siswa siswi silakan memasuki ruang kelas masing-masing, dan kepada bapak ibu guru silakan memasuki ruang kelas untuk memulai pembelajaran.';
  }
  if (cleanLabel.includes('jam ke-1') || cleanLabel.includes('jam kesatu') || cleanLabel.includes('jam pertama')) {
    return 'Saatnya jam pertama dimulai. It\'s time to begin the first lesson.';
  }
  if (cleanLabel.includes('jam ke-2') || cleanLabel.includes('jam kedua')) {
    return 'Saatnya jam kedua dimulai. It\'s time to begin the second lesson.';
  }
  if (cleanLabel.includes('jam ke-3') || cleanLabel.includes('jam ketiga')) {
    return 'Saatnya jam ketiga dimulai. It\'s time to begin the third lesson.';
  }
  if (cleanLabel.includes('jam ke-4') || cleanLabel.includes('jam keempat')) {
    return 'Saatnya jam keempat dimulai. It\'s time to begin the fourth lesson.';
  }
  if (cleanLabel.includes('jam ke-5') || cleanLabel.includes('jam kelima')) {
    return 'Saatnya jam kelima dimulai. It\'s time to begin the fifth lesson.';
  }
  if (cleanLabel.includes('jam ke-6') || cleanLabel.includes('jam keenam')) {
    return 'Saatnya jam keenam dimulai. It\'s time to begin the sixth lesson.';
  }
  if (cleanLabel.includes('jam ke-7') || cleanLabel.includes('jam ketujuh')) {
    return 'Saatnya jam ketujuh dimulai. It\'s time to begin the seventh lesson.';
  }
  if (cleanLabel.includes('jam ke-8') || cleanLabel.includes('jam kedelapan')) {
    return 'Saatnya jam kedelapan dimulai. It\'s time to begin the eighth lesson.';
  }
  if (cleanLabel.includes('istirahatt') || cleanLabel.includes('istirahat pertama') || cleanLabel === 'istirahat') {
    return 'Bel istirahat telah berbunyi. Selamat beristirahat, silakan menjaga kebersihan lingkungan sekolah selama beristirahat.';
  }
  if (cleanLabel.includes('istirahatt kedua') || cleanLabel.includes('dhuhur') || cleanLabel.includes('sholat')) {
    return 'Saatnya istirahat kedua dan ibadah sholat dhuhur berjamaah dimulai. Mari laksanakan sholat di mushola sekolah.';
  }
  if (cleanLabel.includes('pulang')) {
    return 'Bel pulang sekolah telah berbunyi. Terima kasih atas pembelajaran hari ini. Selamat jalan, semoga selamat sampai di rumah masing-masing.';
  }
  
  // Generic fallback Indonesian announcement
  return `Bel pemberitahuan untuk ${label} telah berbunyi. Mohon perhatian bagi seluruh warga sekolah.`;
};

// Preset schedules
export const PRESET_SENIN_KAMIS: BellSchedule[] = [
  {
    id: 'sk-1',
    time: '07:00',
    label: 'Upacara Bendera / Literasi',
    days: [1, 2, 3, 4], // Senin-Kamis
    soundType: 'both',
    chimePreset: 'westminster',
    ttsText: 'Diberitahukan kepada seluruh siswa siswi, upacara bendera dan kegiatan literasi pagi akan segera dimulai.',
    isActive: true,
  },
  {
    id: 'sk-2',
    time: '07:15',
    label: 'Jam Pertama (Masuk Kelas)',
    days: [1, 2, 3, 4],
    soundType: 'both',
    chimePreset: 'dingdong',
    ttsText: 'Saatnya jam pertama dimulai. It\'s time to begin the first lesson.',
    isActive: true,
  },
  {
    id: 'sk-3',
    time: '08:00',
    label: 'Jam Kedua',
    days: [1, 2, 3, 4],
    soundType: 'both',
    chimePreset: 'beep',
    ttsText: 'Saatnya jam kedua dimulai. It\'s time to begin the second lesson.',
    isActive: true,
  },
  {
    id: 'sk-4',
    time: '08:45',
    label: 'Jam Ketiga',
    days: [1, 2, 3, 4],
    soundType: 'both',
    chimePreset: 'beep',
    ttsText: 'Saatnya jam ketiga dimulai. It\'s time to begin the third lesson.',
    isActive: true,
  },
  {
    id: 'sk-5',
    time: '09:30',
    label: 'Istirahat Pertama',
    days: [1, 2, 3, 4],
    soundType: 'both',
    chimePreset: 'westminster',
    ttsText: 'Bel istirahat pertama telah berbunyi. Selamat beristirahat.',
    isActive: true,
  },
  {
    id: 'sk-6',
    time: '09:50',
    label: 'Jam Keempat (Masuk Kelas)',
    days: [1, 2, 3, 4],
    soundType: 'both',
    chimePreset: 'dingdong',
    ttsText: 'Jam istirahat telah selesai. Saatnya jam keempat dimulai. It\'s time to begin the fourth lesson.',
    isActive: true,
  },
  {
    id: 'sk-7',
    time: '10:35',
    label: 'Jam Kelima',
    days: [1, 2, 3, 4],
    soundType: 'both',
    chimePreset: 'beep',
    ttsText: 'Saatnya jam kelima dimulai. It\'s time to begin the fifth lesson.',
    isActive: true,
  },
  {
    id: 'sk-8',
    time: '11:20',
    label: 'Jam Keenam',
    days: [1, 2, 3, 4],
    soundType: 'both',
    chimePreset: 'beep',
    ttsText: 'Saatnya jam keenam dimulai. It\'s time to begin the sixth lesson.',
    isActive: true,
  },
  {
    id: 'sk-9',
    time: '12:05',
    label: 'Istirahat Kedua (Dhuhur)',
    days: [1, 2, 3, 4],
    soundType: 'both',
    chimePreset: 'westminster',
    ttsText: 'Bel istirahat kedua telah berbunyi. Selamat beristirahat dan saatnya menunaikan ibadah sholat dhuhur berjamaah.',
    isActive: true,
  },
  {
    id: 'sk-10',
    time: '12:35',
    label: 'Jam Ketujuh (Masuk Kelas)',
    days: [1, 2, 3, 4],
    soundType: 'both',
    chimePreset: 'dingdong',
    ttsText: 'Jam istirahat kedua telah selesai. Saatnya jam ketujuh dimulai. It\'s time to begin the seventh lesson.',
    isActive: true,
  },
  {
    id: 'sk-11',
    time: '13:20',
    label: 'Jam Kedelapan',
    days: [1, 2, 3, 4],
    soundType: 'both',
    chimePreset: 'beep',
    ttsText: 'Saatnya jam kedelapan dimulai. It\'s time to begin the eighth lesson.',
    isActive: true,
  },
  {
    id: 'sk-12',
    time: '14:05',
    label: 'Pulang Sekolah',
    days: [1, 2, 3, 4],
    soundType: 'both',
    chimePreset: 'classic',
    ttsText: 'Bel pulang sekolah telah berbunyi. Terima kasih atas pembelajaran hari ini. Selamat jalan, semoga selamat sampai di rumah masing-masing.',
    isActive: true,
  },
];

export const PRESET_JUMAT: BellSchedule[] = [
  {
    id: 'j-1',
    time: '07:00',
    label: 'Kegiatan Keagamaan / Senam Pagi',
    days: [5], // Jumat
    soundType: 'both',
    chimePreset: 'westminster',
    ttsText: 'Diberitahukan bagi seluruh siswa siswi, kegiatan kerohanian pagi dan senam sehat akan segera dimulai.',
    isActive: true,
  },
  {
    id: 'j-2',
    time: '07:30',
    label: 'Jam Pertama (Masuk Kelas)',
    days: [5],
    soundType: 'both',
    chimePreset: 'dingdong',
    ttsText: 'Saatnya jam pertama dimulai. It\'s time to begin the first lesson.',
    isActive: true,
  },
  {
    id: 'j-3',
    time: '08:15',
    label: 'Jam Kedua',
    days: [5],
    soundType: 'both',
    chimePreset: 'beep',
    ttsText: 'Saatnya jam kedua dimulai. It\'s time to begin the second lesson.',
    isActive: true,
  },
  {
    id: 'j-4',
    time: '09:00',
    label: 'Istirahat Jumat',
    days: [5],
    soundType: 'both',
    chimePreset: 'westminster',
    ttsText: 'Bel istirahat telah berbunyi. Selamat beristirahat.',
    isActive: true,
  },
  {
    id: 'j-5',
    time: '09:20',
    label: 'Jam Ketiga (Masuk Kelas)',
    days: [5],
    soundType: 'both',
    chimePreset: 'dingdong',
    ttsText: 'Jam istirahat telah selesai. Saatnya jam ketiga dimulai. It\'s time to begin the third lesson.',
    isActive: true,
  },
  {
    id: 'j-6',
    time: '10:05',
    label: 'Jam Keempat',
    days: [5],
    soundType: 'both',
    chimePreset: 'beep',
    ttsText: 'Saatnya jam keempat dimulai. It\'s time to begin the fourth lesson.',
    isActive: true,
  },
  {
    id: 'j-7',
    time: '10:50',
    label: 'Pulang Sekolah & Sholat Jumat',
    days: [5],
    soundType: 'both',
    chimePreset: 'classic',
    ttsText: 'Bel pulang sekolah telah berbunyi. Bagi siswa muslim, silakan segera bersiap menunaikan ibadah Sholat Jumat berjamaah di masjid sekolah.',
    isActive: true,
  },
];

export const PRESET_UJIAN: BellSchedule[] = [
  {
    id: 'u-1',
    time: '07:15',
    label: 'Persiapan Masuk Ruang Ujian',
    days: [1, 2, 3, 4, 5, 6], // Senin-Sabtu
    soundType: 'both',
    chimePreset: 'westminster',
    ttsText: 'Bel tanda masuk ruang ujian telah berbunyi. Kepada seluruh peserta ujian silakan memasuki ruangan masing-masing dengan tertib.',
    isActive: true,
  },
  {
    id: 'u-2',
    time: '07:30',
    label: 'Mulai Ujian Sesi 1',
    days: [1, 2, 3, 4, 5, 6],
    soundType: 'both',
    chimePreset: 'dingdong',
    ttsText: 'Waktu pengerjaan ujian Sesi Pertama dimulai. Selamat bekerja, harap menjaga ketertiban dan kejujuran selama ujian berlangsung.',
    isActive: true,
  },
  {
    id: 'u-3',
    time: '09:00',
    label: 'Selesai Ujian Sesi 1 & Istirahat',
    days: [1, 2, 3, 4, 5, 6],
    soundType: 'both',
    chimePreset: 'classic',
    ttsText: 'Waktu pengerjaan ujian Sesi Pertama telah selesai. Silakan letakkan alat tulis Anda dan keluar ruangan dengan tertib untuk beristirahat.',
    isActive: true,
  },
  {
    id: 'u-4',
    time: '09:30',
    label: 'Masuk Ruang Sesi 2',
    days: [1, 2, 3, 4, 5, 6],
    soundType: 'both',
    chimePreset: 'westminster',
    ttsText: 'Bel tanda masuk ruang ujian Sesi Kedua telah berbunyi. Harap seluruh peserta segera kembali memasuki ruangan masing-masing.',
    isActive: true,
  },
  {
    id: 'u-5',
    time: '09:45',
    label: 'Mulai Ujian Sesi 2',
    days: [1, 2, 3, 4, 5, 6],
    soundType: 'both',
    chimePreset: 'dingdong',
    ttsText: 'Waktu pengerjaan ujian Sesi Kedua dimulai. Selamat bekerja.',
    isActive: true,
  },
  {
    id: 'u-6',
    time: '11:15',
    label: 'Selesai Ujian Sesi 2 & Pulang',
    days: [1, 2, 3, 4, 5, 6],
    soundType: 'both',
    chimePreset: 'classic',
    ttsText: 'Waktu pengerjaan ujian Sesi Kedua telah selesai. Pembelajaran hari ini berakhir, silakan meninggalkan sekolah dengan tertib.',
    isActive: true,
  },
];
