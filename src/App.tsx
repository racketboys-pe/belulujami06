/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, HelpCircle, FileSpreadsheet, Settings, History, Info, Play, CheckCircle2, AlertCircle, LogOut, RefreshCw } from 'lucide-react';
import { BellSchedule, BellLog, BellSettings, ChimeType, SoundType, CustomAudioFile } from './types';
import { PRESET_SENIN_KAMIS, PRESET_JUMAT } from './constants';
import { initAudioContext, playBellNotification, startSilenceKeepAlive, stopSilenceKeepAlive } from './audioEngine';
import { initAuth, googleSignIn, googleSignOut, uploadSyncFile, findSyncFile, downloadSyncFile, SyncData } from './gdriveSync';

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

  // --- GOOGLE DRIVE SYNC STATES ---
  const [syncUser, setSyncUser] = useState<any>(null);
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(() => {
    const stored = localStorage.getItem('bel_sekolah_last_sync');
    return stored ? parseInt(stored) : null;
  });
  const [showSyncConflictModal, setShowSyncConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<SyncData | null>(null);


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

    // 4. Register Google Auth listener for Drive Sync
    const unsubscribeAuth = initAuth(
      (user, token) => {
        setSyncUser(user);
        setSyncToken(token);
      },
      () => {
        setSyncUser(null);
        setSyncToken(null);
      }
    );

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // --- PERSISTENCE SYNCS ---
  const saveSchedules = (newSchedules: BellSchedule[]) => {
    setSchedules(newSchedules);
    localStorage.setItem('bel_sekolah_schedules', JSON.stringify(newSchedules));
    
    // Auto-sync to Google Drive in real-time if authenticated
    if (syncToken) {
      uploadSyncFile(syncToken, newSchedules, settings).then((success) => {
        if (success) {
          const nowMs = Date.now();
          setLastSyncTime(nowMs);
          localStorage.setItem('bel_sekolah_last_sync', nowMs.toString());
        }
      });
    }
  };

  const handleUpdateSettings = (updated: Partial<BellSettings>) => {
    const newSettings = { ...settings, ...updated };
    setSettings(newSettings);
    localStorage.setItem('bel_sekolah_settings', JSON.stringify(newSettings));
    
    // Auto-sync to Google Drive in real-time if authenticated
    if (syncToken) {
      uploadSyncFile(syncToken, schedules, newSettings).then((success) => {
        if (success) {
          const nowMs = Date.now();
          setLastSyncTime(nowMs);
          localStorage.setItem('bel_sekolah_last_sync', nowMs.toString());
        }
      });
    }
  };

  // State reference to let the non-throttled Web Worker tick thread always access current states
  const cronStateRef = useRef({ schedules, settings, customAudios });
  useEffect(() => {
    cronStateRef.current = { schedules, settings, customAudios };
  }, [schedules, settings, customAudios]);

  const handleCronTick = () => {
    const { schedules: activeSchedulesList, settings: currentSettings, customAudios: activeAudios } = cronStateRef.current;
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
    const activeSchedules = activeSchedulesList.filter((s) => s.isActive);
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
        const matchedAudio = activeAudios.find((a) => a.id === matchingSchedule.introAudioId);
        if (matchedAudio) {
          customIntroUrl = matchedAudio.dataUrl;
        }
      }

      // Play sound & TTS announcer
      playBellNotification(
        matchingSchedule.soundType,
        matchingSchedule.chimePreset,
        matchingSchedule.ttsText,
        currentSettings,
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
  };

  // --- AUTOMATIC CHRON TIMER ENGINE (WEB WORKER + BACKGROUND KEEP-AWAKE) ---
  useEffect(() => {
    if (!isEngineActive) {
      stopSilenceKeepAlive();
      return;
    }

    // Start background silence loop to prevent modern browser tab suspension
    startSilenceKeepAlive();

    // Self-contained inline Web Worker to bypass main thread setInterval sleep/throttling
    const workerCode = `
      let intervalId = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (intervalId) clearInterval(intervalId);
          intervalId = setInterval(() => {
            self.postMessage('tick');
          }, 1000);
        } else if (e.data === 'stop') {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      };
    `;

    let worker: Worker | null = null;
    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      worker = new Worker(URL.createObjectURL(blob));
      
      worker.onmessage = () => {
        handleCronTick();
      };
      
      worker.postMessage('start');
      console.log('📡 Web Worker Timer Latar Belakang Aktif');
    } catch (e) {
      console.warn('Gagal memuat Web Worker Timer, menggunakan fallback timer lokal:', e);
      // Fallback local timer if workers are blocked
      const fallbackInterval = setInterval(() => {
        handleCronTick();
      }, 1000);
      
      return () => {
        clearInterval(fallbackInterval);
        stopSilenceKeepAlive();
      };
    }

    return () => {
      if (worker) {
        worker.postMessage('stop');
        worker.terminate();
      }
      stopSilenceKeepAlive();
    };
  }, [isEngineActive]);

  // --- GOOGLE DRIVE SYNC ACTIONS ---
  const handleSyncLogin = async () => {
    setIsSyncing(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setSyncUser(result.user);
        setSyncToken(result.accessToken);
        
        // Check for sync file
        const fileId = await findSyncFile(result.accessToken);
        if (fileId) {
          const driveData = await downloadSyncFile(result.accessToken, fileId);
          if (driveData) {
            setConflictData(driveData);
            setShowSyncConflictModal(true);
          }
        } else {
          // No sync file on Google Drive, upload current local state
          const success = await uploadSyncFile(result.accessToken, schedules, settings);
          if (success) {
            const nowMs = Date.now();
            setLastSyncTime(nowMs);
            localStorage.setItem('bel_sekolah_last_sync', nowMs.toString());
          }
        }
      }
    } catch (e) {
      console.error('Login & sync Google Drive gagal:', e);
      alert('Gagal menyinkronkan dengan Google Drive. Silakan coba lagi.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncLogout = async () => {
    if (confirm('Apakah Anda yakin ingin mematikan sinkronisasi Google Drive?')) {
      await googleSignOut();
      setSyncUser(null);
      setSyncToken(null);
      setLastSyncTime(null);
      localStorage.removeItem('bel_sekolah_last_sync');
    }
  };

  const handleApplySyncData = (choice: 'local' | 'drive') => {
    if (!conflictData || !syncToken) return;
    
    if (choice === 'drive') {
      // Overwrite local state with Cloud data
      setSchedules(conflictData.schedules);
      setSettings(conflictData.settings);
      localStorage.setItem('bel_sekolah_schedules', JSON.stringify(conflictData.schedules));
      localStorage.setItem('bel_sekolah_settings', JSON.stringify(conflictData.settings));
      
      const syncTime = conflictData.lastSynced || Date.now();
      setLastSyncTime(syncTime);
      localStorage.setItem('bel_sekolah_last_sync', syncTime.toString());
      alert('Berhasil mengunduh dan menyelaraskan jadwal dari Google Drive Anda!');
    } else {
      // Overwrite Cloud state with local data
      setIsSyncing(true);
      uploadSyncFile(syncToken, schedules, settings).then((success) => {
        if (success) {
          const nowMs = Date.now();
          setLastSyncTime(nowMs);
          localStorage.setItem('bel_sekolah_last_sync', nowMs.toString());
          alert('Berhasil mengunggah dan menyelaraskan jadwal lokal ke Google Drive Anda!');
        } else {
          alert('Gagal mengunggah data ke Google Drive.');
        }
        setIsSyncing(false);
      });
    }
    
    setShowSyncConflictModal(false);
    setConflictData(null);
  };

  const handleSyncManual = async () => {
    if (!syncToken) return;
    setIsSyncing(true);
    try {
      const success = await uploadSyncFile(syncToken, schedules, settings);
      if (success) {
        const nowMs = Date.now();
        setLastSyncTime(nowMs);
        localStorage.setItem('bel_sekolah_last_sync', nowMs.toString());
        alert('Data berhasil disinkronkan ke Google Drive!');
      } else {
        alert('Gagal menyinkronkan data.');
      }
    } catch (err) {
      console.error('Error during manual sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

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
                syncUser={syncUser}
                syncToken={syncToken}
                isSyncing={isSyncing}
                lastSyncTime={lastSyncTime}
                onSyncLogin={handleSyncLogin}
                onSyncLogout={handleSyncLogout}
                onSyncManual={handleSyncManual}
              />
            )}
          </div>
        </section>
      </main>

      {/* --- GOOGLE DRIVE SYNC CONFLICT RESOLUTION MODAL --- */}
      {showSyncConflictModal && conflictData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-earth-300 max-w-lg w-full shadow-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-earth-200/50 pb-3">
              <div className="p-2 bg-sage-100 rounded-xl text-sage-700 animate-bounce">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-earth-900 text-lg">Penyelarasan Google Drive</span>
                <span className="text-[11px] text-earth-600 font-medium">Ditemukan data sinkronisasi di Cloud</span>
              </div>
            </div>

            <div className="text-xs text-earth-800 leading-relaxed flex flex-col gap-3">
              <p>
                Halo! Kami menemukan file cadangan bel sekolah Anda yang tersimpan di Google Drive. Pilih tindakan yang ingin Anda lakukan untuk menyinkronkan data:
              </p>

              <div className="grid grid-cols-2 gap-3.5 mt-1.5">
                {/* Local State Summary Box */}
                <div className="p-3 bg-earth-50 border border-earth-200 rounded-2xl flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-earth-700 uppercase tracking-wider block">Data Lokal Saat Ini</span>
                  <div className="text-xs font-bold text-earth-900 leading-none">{schedules.length} Jadwal Bel</div>
                  <span className="text-[10px] text-earth-600">Disimpan di perangkat ini</span>
                </div>

                {/* Cloud State Summary Box */}
                <div className="p-3 bg-sage-50 border border-sage-200 rounded-2xl flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-sage-800 uppercase tracking-wider block">Data di Google Drive</span>
                  <div className="text-xs font-bold text-sage-950 leading-none">{(conflictData.schedules || []).length} Jadwal Bel</div>
                  {conflictData.lastSynced && (
                    <span className="text-[9px] text-sage-700 leading-tight">
                      Sinkron: {new Date(conflictData.lastSynced).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleApplySyncData('drive')}
                className="flex-1 py-2.5 bg-sage-700 hover:bg-sage-800 text-white font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
              >
                <span>Unduh dari Google Drive</span>
                <span className="text-[9px] font-normal opacity-80">(Gunakan data Cloud)</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplySyncData('local')}
                className="flex-1 py-2.5 bg-earth-100 hover:bg-earth-200 text-earth-850 border border-earth-300 font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
              >
                <span>Unggah ke Google Drive</span>
                <span className="text-[9px] font-normal text-earth-600">(Gunakan data perangkat ini)</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
