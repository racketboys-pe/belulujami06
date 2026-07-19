/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, HelpCircle, FileSpreadsheet, Settings, History, Info, Play, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { BellSchedule, BellLog, BellSettings, ChimeType, SoundType, CustomAudioFile } from './types';
import { PRESET_SENIN_KAMIS, PRESET_JUMAT } from './constants';
import { initAudioContext, playBellNotification } from './audioEngine';

import ClockPanel from './components/ClockPanel';
import ManualControls from './components/ManualControls';
import ScheduleTable from './components/ScheduleTable';
import SettingsPanel from './components/SettingsPanel';
import LogPanel from './components/LogPanel';
import SchoolLogo from './components/SchoolLogo';
import LoginScreen from './components/LoginScreen';
import { getCustomAudiosFromDB, saveCustomAudioToDB, deleteCustomAudioFromDB } from './dbLocal';

const DEFAULT_SETTINGS: BellSettings = {
  ttsVolume: 0.8,
  ttsRate: 1.0,
  ttsPitch: 1.0,
  chimeVolume: 0.7,
  selectedVoiceName: '',
  runningText: '📢 INFORMASI BEL OTOMATIS: Selamat Datang di Sistem Bel Pintar SDN Ulujami 06 Pagi CERIA! • Pastikan volume amplifier sound system menyala • Jalankan uji suara bel untuk memastikan keselarasan perangkat pengeras suara • Cerdas, Berkarakter, dan Penuh Keceriaan!',
};

export default function App() {
  // --- STATE DECLARATIONS ---
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('bel_sekolah_is_logged_in') === 'true';
  });

  const [schedules, setSchedules] = useState<BellSchedule[]>([]);
  const [logs, setLogs] = useState<BellLog[]>([]);
  const [settings, setSettings] = useState<BellSettings>(DEFAULT_SETTINGS);
  const [isEngineActive, setIsEngineActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'jadwal' | 'riwayat' | 'pengaturan'>('jadwal');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [customAudios, setCustomAudios] = useState<CustomAudioFile[]>([]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem operator?')) {
      sessionStorage.removeItem('bel_sekolah_is_logged_in');
      setIsLoggedIn(false);
    }
  };

  // Load logo and custom audios on init
  useEffect(() => {
    const storedLogo = localStorage.getItem('bel_sekolah_logo');
    if (storedLogo) {
      setLogoUrl(storedLogo);
    }
    
    // Load custom audios from IndexedDB (with a migration fallback from localStorage)
    async function loadAudios() {
      try {
        const dbAudios = await getCustomAudiosFromDB();
        if (dbAudios && dbAudios.length > 0) {
          setCustomAudios(dbAudios);
        } else {
          // Fallback check in localStorage
          const storedCustomAudios = localStorage.getItem('bel_sekolah_custom_audios');
          if (storedCustomAudios) {
            const parsed = JSON.parse(storedCustomAudios);
            setCustomAudios(parsed);
            // Migrate them to IndexedDB
            for (const item of parsed) {
              await saveCustomAudioToDB(item);
            }
            // Clear localStorage key to save space
            localStorage.removeItem('bel_sekolah_custom_audios');
          }
        }
      } catch (e) {
        console.error('Gagal memuat file audio kustom dari IndexedDB:', e);
      }
    }
    
    loadAudios();
  }, []);

  const handleUpdateCustomAudios = async (newCustomAudios: CustomAudioFile[]) => {
    setCustomAudios(newCustomAudios);
    try {
      const currentInDB = await getCustomAudiosFromDB();
      const newIds = new Set(newCustomAudios.map(a => a.id));
      
      // Delete removed ones from IndexedDB
      for (const item of currentInDB) {
        if (!newIds.has(item.id)) {
          await deleteCustomAudioFromDB(item.id);
        }
      }
      
      // Save/Update current ones in IndexedDB
      for (const item of newCustomAudios) {
        await saveCustomAudioToDB(item);
      }
    } catch (e) {
      console.error('Gagal memperbarui database audio di IndexedDB:', e);
    }
  };

  const handleLogoUpdate = (logo: string | null) => {
    setLogoUrl(logo);
    if (logo) {
      localStorage.setItem('bel_sekolah_logo', logo);
    } else {
      localStorage.removeItem('bel_sekolah_logo');
    }
  };

  // Update favicon dynamically based on uploaded logo
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    if (logoUrl) {
      link.href = logoUrl;
    } else {
      link.href = '/favicon.ico';
    }
  }, [logoUrl]);

  // To prevent multiple triggers within the same minute
  const lastRungKeyRef = useRef<string>('');

  // --- INITIALIZATION ---
  useEffect(() => {
    // 1. Load schedules from LocalStorage, fallback to default combined Mon-Fri schedule
    const storedSchedules = localStorage.getItem('bel_sekolah_schedules');
    if (storedSchedules) {
      try {
        setSchedules(JSON.parse(storedSchedules));
      } catch (e) {
        console.error('Gagal memuat jadwal dari storage:', e);
        const combinedDefault = [...PRESET_SENIN_KAMIS, ...PRESET_JUMAT];
        setSchedules(combinedDefault);
      }
    } else {
      // Fallback: Default to combination of standard schedules
      const combinedDefault = [...PRESET_SENIN_KAMIS, ...PRESET_JUMAT];
      setSchedules(combinedDefault);
      localStorage.setItem('bel_sekolah_schedules', JSON.stringify(combinedDefault));
    }

    // 2. Load settings
    const storedSettings = localStorage.getItem('bel_sekolah_settings');
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch (e) {
        console.error('Gagal memuat pengaturan:', e);
      }
    }

    // 3. Load logs
    const storedLogs = localStorage.getItem('bel_sekolah_logs');
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch (e) {
        console.error('Gagal memuat log:', e);
      }
    }
  }, []);

  // --- PERSISTENCE SYNCS ---
  const saveSchedules = (newSchedules: BellSchedule[]) => {
    setSchedules(newSchedules);
    localStorage.setItem('bel_sekolah_schedules', JSON.stringify(newSchedules));
  };

  const handleUpdateSettings = (updated: Partial<BellSettings>) => {
    const newSettings = { ...settings, ...updated };
    setSettings(newSettings);
    localStorage.setItem('bel_sekolah_settings', JSON.stringify(newSettings));
  };

  // --- AUTOMATIC CHRON TIMER ENGINE ---
  useEffect(() => {
    if (!isEngineActive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Minggu, 1 = Senin, dll
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentSeconds = now.getSeconds().toString().padStart(2, '0');
      const currentHHMM = `${currentHour}:${currentMinute}`;
      const todayDateStr = now.toLocaleDateString('id-ID');

      // Check strictly on the '00' second mark to guarantee single triggers
      if (currentSeconds !== '00') {
        return;
      }

      // Find if there is an active matching schedule
      const activeSchedules = schedules.filter((s) => s.isActive);
      const matchingSchedule = activeSchedules.find((sched) => {
        const matchesDay = sched.days.length === 0 || sched.days.includes(currentDay);
        const matchesTime = sched.time === currentHHMM;
        return matchesDay && matchesTime;
      });

      if (matchingSchedule) {
        // Prevent double hit in the same minute due to clock micro-jitters
        const triggerKey = `${matchingSchedule.id}_${todayDateStr}_${currentHHMM}`;
        if (lastRungKeyRef.current === triggerKey) {
          return;
        }
        lastRungKeyRef.current = triggerKey;

        // Retrieve custom audio if matchingSchedule.introAudioId is set
        let customIntroUrl: string | undefined = undefined;
        if (matchingSchedule.introAudioId) {
          const matchedAudio = customAudios.find((a) => a.id === matchingSchedule.introAudioId);
          if (matchedAudio) {
            customIntroUrl = matchedAudio.dataUrl;
          }
        }

        // Play sound & TTS announcer
        playBellNotification(
          matchingSchedule.soundType,
          matchingSchedule.chimePreset,
          matchingSchedule.ttsText,
          settings,
          customIntroUrl
        );

        // Record Log
        const formattedDate = now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const formattedTime = `${currentHHMM}:00`;

        const newLog: BellLog = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          timeStr: formattedTime,
          dateStr: formattedDate,
          label: matchingSchedule.label,
          type: 'automatic',
          soundType: matchingSchedule.soundType,
          details: `${
            matchingSchedule.soundType === 'both'
              ? `Chime (${matchingSchedule.chimePreset}) + Suara`
              : matchingSchedule.soundType === 'chime'
              ? `Chime (${matchingSchedule.chimePreset})`
              : 'Suara (TTS)'
          }`,
        };

        setLogs((prev) => {
          const updated = [newLog, ...prev];
          localStorage.setItem('bel_sekolah_logs', JSON.stringify(updated));
          return updated;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [schedules, isEngineActive, settings, customAudios]);

  // --- ACTIONS HANDLERS ---
  const handleActivateEngine = () => {
    try {
      initAudioContext();
      setIsEngineActive(true);
    } catch (e) {
      console.error('Gagal mengaktifkan Audio Context:', e);
    }
  };

  const handleManualTrigger = (
    soundType: SoundType,
    chimePreset: ChimeType,
    ttsText: string,
    label: string,
    introAudioId?: string
  ) => {
    // Play sound immediately
    let customIntroUrl: string | undefined = undefined;
    if (introAudioId) {
      const matchedAudio = customAudios.find((a) => a.id === introAudioId);
      if (matchedAudio) {
        customIntroUrl = matchedAudio.dataUrl;
      }
    }
    playBellNotification(soundType, chimePreset, ttsText, settings, customIntroUrl);

    // Save Log
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newLog: BellLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      timeStr: formattedTime,
      dateStr: formattedDate,
      label,
      type: 'manual',
      soundType,
      details: `${
        soundType === 'both'
          ? `${introAudioId && customAudios.some(a => a.id === introAudioId) ? `Kustom (${customAudios.find(a => a.id === introAudioId)?.name})` : `Chime (${chimePreset})`} + Suara`
          : soundType === 'chime'
          ? introAudioId && customAudios.some(a => a.id === introAudioId) ? `Kustom (${customAudios.find(a => a.id === introAudioId)?.name})` : `Chime (${chimePreset})`
          : 'Suara (TTS)'
      }`,
    };

    setLogs((prev) => {
      const updated = [newLog, ...prev];
      localStorage.setItem('bel_sekolah_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddSchedule = (schedule: Omit<BellSchedule, 'id'>) => {
    const newSchedule: BellSchedule = {
      ...schedule,
      id: Math.random().toString(36).substring(2, 9),
    };
    const updated = [...schedules, newSchedule];
    saveSchedules(updated);
  };

  const handleUpdateSchedule = (id: string, updated: Partial<BellSchedule>) => {
    const updatedSchedules = schedules.map((s) => {
      if (s.id === id) {
        return { ...s, ...updated };
      }
      return s;
    });
    saveSchedules(updatedSchedules);
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = schedules.filter((s) => s.id !== id);
    saveSchedules(updated);
  };

  const handlePreviewSchedule = (sched: BellSchedule) => {
    if (!isEngineActive) {
      handleActivateEngine();
    }
    let customIntroUrl: string | undefined = undefined;
    if (sched.introAudioId) {
      const matchedAudio = customAudios.find((a) => a.id === sched.introAudioId);
      if (matchedAudio) {
        customIntroUrl = matchedAudio.dataUrl;
      }
    }
    playBellNotification(sched.soundType, sched.chimePreset, sched.ttsText, settings, customIntroUrl);
  };

  const handleLoadPreset = (preset: BellSchedule[]) => {
    saveSchedules(preset);
  };

  const handleClearAllSchedules = () => {
    saveSchedules([]);
  };

  const handleClearLogs = () => {
    setLogs([]);
    localStorage.removeItem('bel_sekolah_logs');
  };

  // --- COMPUTE COUNTERS ---
  const activeBellsCount = schedules.filter((s) => s.isActive).length;

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} logoUrl={logoUrl} />;
  }

  return (
    <div className="min-h-screen bg-earth-100 text-earth-900 flex flex-col font-sans" id="app-root">
      {/* Running Announcement Marquee at the very top of the application */}
      <div className="bg-terracotta-600 text-white py-2 px-4 text-xs font-semibold overflow-hidden whitespace-nowrap border-b border-terracotta-700 shadow-xs select-none" id="running-text-marquee">
        <div className="animate-marquee whitespace-nowrap inline-block">
          {settings.runningText || '📢 INFORMASI BEL OTOMATIS: Selamat Datang di Sistem Bel Pintar SDN Ulujami 06 Pagi CERIA! • Pastikan volume amplifier sound system menyala • Jalankan uji suara bel untuk memastikan keselarasan perangkat pengeras suara • Cerdas, Berkarakter, dan Penuh Keceriaan!'}
        </div>
      </div>

      {/* Upper Brand / Institutional Header */}
      <header className="bg-sage-700 text-white shadow-sm border-b border-sage-800" id="header-root">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center p-1 shadow-lg transform hover:scale-105 transition-all">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
              ) : (
                <SchoolLogo className="w-12 h-12" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold tracking-tight sm:text-2xl flex items-center gap-2">
                SDN Ulujami 06 Pagi
                <span className="text-[10px] bg-terracotta-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  CERIA
                </span>
              </h1>
              <p className="text-xs text-sage-100 mt-0.5 font-medium">
                Sistem Bel Sekolah Otomatis & Pengeras Suara Teks-Ke-Suara (TTS) Humanis
              </p>
            </div>
          </div>

          {/* Quick status pill counters */}
          <div className="flex items-center gap-2.5">
            <div className="bg-sage-800/40 border border-sage-600/30 rounded-xl px-3.5 py-1.5 text-center">
              <span className="block text-[10px] text-sage-200 font-bold uppercase tracking-wider">Total Jadwal</span>
              <span className="font-mono font-bold text-sm text-earth-50">{schedules.length} Bel</span>
            </div>
            <div className="bg-sage-800/40 border border-sage-600/30 rounded-xl px-3.5 py-1.5 text-center">
              <span className="block text-[10px] text-sage-200 font-bold uppercase tracking-wider">Aktif</span>
              <span className="font-mono font-bold text-sm text-terracotta-100">{activeBellsCount} Bel</span>
            </div>
            <div className="bg-sage-800/40 border border-sage-600/30 rounded-xl px-3.5 py-1.5 text-center">
              <span className="block text-[10px] text-sage-200 font-bold uppercase tracking-wider">Sistem</span>
              <span className={`font-mono font-bold text-xs ${isEngineActive ? 'text-green-200' : 'text-terracotta-100 animate-pulse'}`}>
                {isEngineActive ? '● BERJALAN' : '● NONAKTIF'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="bg-terracotta-600 hover:bg-terracotta-700 border border-terracotta-500 rounded-xl px-3.5 py-2 text-center flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-white text-xs font-bold uppercase tracking-wider h-full"
              title="Keluar dari Sistem Operator"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:py-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="main-content-grid">
        
        {/* --- LEFT HAND BENTO GRID (4/12 WIDTH) --- */}
        <aside className="lg:col-span-4 flex flex-col gap-6" id="left-sidebar">
          {/* Clock, state status, next bell countdown */}
          <ClockPanel
            schedules={schedules}
            isEngineActive={isEngineActive}
            onActivateEngine={handleActivateEngine}
          />

          {/* Quick trigger manual bells and broadcasting panel */}
          <ManualControls
            onManualTrigger={handleManualTrigger}
            isEngineActive={isEngineActive}
            onActivateEngine={handleActivateEngine}
            customAudios={customAudios}
          />

          {/* Informational Guidelines Card */}
          <div className="bg-sage-50 border border-sage-200/80 rounded-2xl p-4 text-xs text-earth-800 flex gap-3 shadow-xs">
            <Info className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-bold text-sage-900 font-serif">Tips Operasional:</span>
              <p className="leading-relaxed opacity-90">
                Hubungkan komputer operator dengan sistem pengeras suara (sound system) sekolah. Pastikan tab browser ini tetap terbuka agar bel dapat berbunyi otomatis sesuai jadwal.
              </p>
            </div>
          </div>
        </aside>

        {/* --- RIGHT HAND TABS & WORKSPACE (8/12 WIDTH) --- */}
        <section className="lg:col-span-8 flex flex-col gap-6" id="workspace-section">
          {/* Workspace Tab bar */}
          <div className="flex bg-earth-200/70 p-1.5 rounded-xl border border-earth-300/70" id="tabs-bar">
            <button
              onClick={() => setActiveTab('jadwal')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'jadwal'
                  ? 'bg-white text-earth-900 shadow-sm border border-earth-300/40'
                  : 'text-earth-700 hover:text-earth-950 hover:bg-earth-100/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Kelola Jadwal Bel
            </button>
            <button
              onClick={() => setActiveTab('riwayat')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'riwayat'
                  ? 'bg-white text-earth-900 shadow-sm border border-earth-300/40'
                  : 'text-earth-700 hover:text-earth-950 hover:bg-earth-100/60'
              }`}
            >
              <History className="w-4 h-4" />
              Riwayat Aktivitas ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('pengaturan')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'pengaturan'
                  ? 'bg-white text-earth-900 shadow-sm border border-earth-300/40'
                  : 'text-earth-700 hover:text-earth-950 hover:bg-earth-100/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              Pengaturan Sistem
            </button>
          </div>

          {/* Active Workspace Panel rendering */}
          <div className="flex-1" id="tab-content-area">
            {activeTab === 'jadwal' && (
              <ScheduleTable
                schedules={schedules}
                onAddSchedule={handleAddSchedule}
                onUpdateSchedule={handleUpdateSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onPreviewSchedule={handlePreviewSchedule}
                customAudios={customAudios}
              />
            )}

            {activeTab === 'riwayat' && (
              <LogPanel logs={logs} onClearLogs={handleClearLogs} />
            )}

            {activeTab === 'pengaturan' && (
              <SettingsPanel
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onLoadPreset={handleLoadPreset}
                onClearAll={handleClearAllSchedules}
                schedules={schedules}
                logoUrl={logoUrl}
                onLogoUpdate={handleLogoUpdate}
                customAudios={customAudios}
                onUpdateCustomAudios={handleUpdateCustomAudios}
              />
            )}
          </div>
        </section>
      </main>

      {/* Tidy Footer */}
      <footer className="bg-earth-900 text-earth-300 border-t border-earth-800 text-center py-5 text-xs font-medium" id="footer-root">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>© 2026 - <strong>gurumasakini</strong> — Bel Sekolah Otomatis SDN Ulujami 06 Pagi</span>
          <span className="text-[11px] text-earth-400">
            Sistem Bel Sekolah Otomatis Ceria • 100% Aman &amp; Offline
          </span>
        </div>
      </footer>
    </div>
  );
}
