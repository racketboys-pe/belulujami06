/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Clock, BellRing, Calendar, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { BellSchedule } from '../types';
import { getHariName } from '../constants';

interface ClockPanelProps {
  schedules: BellSchedule[];
  isEngineActive: boolean;
  onActivateEngine: () => void;
}

export function findNextBell(
  schedules: BellSchedule[],
  now: Date
): { schedule: BellSchedule; targetTime: Date; dayDiff: number } | null {
  const activeSchedules = schedules.filter((s) => s.isActive);
  if (activeSchedules.length === 0) return null;

  const currentDay = now.getDay(); // 0 = Minggu, 1 = Senin, ...
  let bestCandidate: { schedule: BellSchedule; targetTime: Date; dayDiff: number } | null = null;
  let minDiffMs = Infinity;

  // Scan up to 7 days ahead (0 = today, 1 = tomorrow, etc.)
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const targetDayNum = (currentDay + dayOffset) % 7;
    const schedulesForDay = activeSchedules.filter(
      (s) => s.days.includes(targetDayNum) || s.days.length === 0
    );

    for (const sched of schedulesForDay) {
      const [shour, smin] = sched.time.split(':').map(Number);
      
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + dayOffset);
      targetDate.setHours(shour, smin, 0, 0);

      const diffMs = targetDate.getTime() - now.getTime();

      // If it is today and the bell time has already passed, skip
      if (diffMs <= 0) {
        continue;
      }

      if (diffMs < minDiffMs) {
        minDiffMs = diffMs;
        bestCandidate = {
          schedule: sched,
          targetTime: targetDate,
          dayDiff: dayOffset,
        };
      }
    }

    // Stop searching if we found candidates on the earliest available day
    if (bestCandidate && dayOffset > 0) {
      break;
    }
  }

  return bestCandidate;
}

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_ID = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

export default function ClockPanel({
  schedules,
  isEngineActive,
  onActivateEngine,
}: ClockPanelProps) {
  const [now, setNow] = useState(new Date());
  const [nextBell, setNextBell] = useState<ReturnType<typeof findNextBell>>(null);
  const [countdownStr, setCountdownStr] = useState('');

  // Keep clock updating every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Recalculate next bell whenever schedules or current time changes
  useEffect(() => {
    const next = findNextBell(schedules, now);
    setNextBell(next);

    if (next) {
      const diffMs = next.targetTime.getTime() - now.getTime();
      if (diffMs > 0) {
        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const hPad = hours.toString().padStart(2, '0');
        const mPad = minutes.toString().padStart(2, '0');
        const sPad = seconds.toString().padStart(2, '0');

        let prefix = '';
        if (next.dayDiff > 0) {
          prefix = `${getHariName(next.targetTime.getDay())}, `;
        }

        setCountdownStr(`${prefix}${hPad}:${mPad}:${sPad}`);
      } else {
        setCountdownStr('Sedang Berbunyi...');
      }
    } else {
      setCountdownStr('--:--:--');
    }
  }, [schedules, now]);

  // Format time (HH:MM:SS)
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  // Format Indonesian date
  const dayName = DAYS_ID[now.getDay()];
  const dateNum = now.getDate();
  const monthName = MONTHS_ID[now.getMonth()];
  const yearNum = now.getFullYear();

  return (
    <div className="flex flex-col gap-6" id="clock-panel-root">
      {/* System Authorization and Activation Banner */}
      <div 
        id="engine-status-card"
        className={`p-4 rounded-2xl border transition-all duration-300 shadow-xs flex items-center justify-between gap-4 ${
          isEngineActive 
            ? 'bg-sage-50 border-sage-200 text-sage-800' 
            : 'bg-terracotta-50 border-terracotta-200 text-terracotta-800 animate-pulse'
        }`}
      >
        <div className="flex items-center gap-3">
          {isEngineActive ? (
            <CheckCircle2 className="w-6 h-6 text-sage-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-terracotta-500 shrink-0" />
          )}
          <div>
            <h4 className="font-serif font-bold text-sm leading-tight">
              {isEngineActive ? 'Sistem Bel Otomatis Aktif' : 'Sistem Bel Tertangguh'}
            </h4>
            <p className="text-xs opacity-90 mt-0.5">
              {isEngineActive 
                ? 'Aplikasi sedang berjalan dan memantau jadwal bel.' 
                : 'Klik tombol di samping untuk mengaktifkan audio & suara.'}
            </p>
          </div>
        </div>
        {!isEngineActive && (
          <button
            id="btn-activate-engine"
            onClick={onActivateEngine}
            className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white font-medium text-xs rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
          >
            Aktifkan
          </button>
        )}
      </div>

      {/* Main Digital Clock Card */}
      <div 
        id="digital-clock-card"
        className="relative overflow-hidden bg-earth-900 text-white rounded-3xl p-6 shadow-md border border-earth-800 flex flex-col items-center justify-center text-center"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-sage-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-terracotta-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

        <span className="text-xs font-mono tracking-widest text-earth-300 uppercase bg-earth-800/60 px-3 py-1 rounded-full mb-3 flex items-center gap-1.5 border border-earth-700/50">
          <Clock className="w-3.5 h-3.5 text-sage-200" />
          Waktu Lokal Sistem
        </span>

        {/* Hour, Minute, Second */}
        <div className="flex items-center justify-center font-mono font-bold tracking-tight text-4xl sm:text-5xl md:text-6xl text-earth-50">
          <span>{hours}</span>
          <span className="text-terracotta-500 animate-[pulse_1s_infinite] mx-1">:</span>
          <span>{minutes}</span>
          <span className="text-terracotta-500 animate-[pulse_1s_infinite] mx-1">:</span>
          <span className="text-earth-300 text-2xl sm:text-3xl self-end mb-1 sm:mb-2 ml-1">{seconds}</span>
        </div>

        {/* Date */}
        <div className="mt-4 flex items-center gap-2 text-sm text-earth-200 bg-earth-800/40 px-4 py-1.5 rounded-full border border-earth-800/60">
          <Calendar className="w-4 h-4 text-terracotta-500" />
          <span className="font-medium">{dayName}, {dateNum} {monthName} {yearNum}</span>
        </div>
      </div>

      {/* Countdown To Next Bell Card */}
      <div 
        id="countdown-bell-card"
        className="bg-white rounded-2xl p-5 border border-earth-300 shadow-xs flex flex-col gap-4"
      >
        <div className="flex items-center justify-between border-b border-earth-200/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sage-50 rounded-lg text-sage-600">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <span className="font-serif font-bold text-earth-900 text-sm">Bel Berikutnya</span>
          </div>
          {nextBell && (
            <span className="text-xs bg-sage-100 text-sage-800 font-semibold px-2.5 py-0.5 rounded-full">
              {nextBell.dayDiff === 0 ? 'Hari Ini' : getHariName(nextBell.targetTime.getDay())}
            </span>
          )}
        </div>

        {nextBell ? (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-earth-900 truncate max-w-[180px] font-serif">
                {nextBell.schedule.label}
              </span>
              <span className="text-2xl font-black font-mono text-terracotta-500">
                {nextBell.schedule.time}
              </span>
            </div>

            {/* Countdown string */}
            <div className="mt-2 bg-earth-100 border border-earth-200 rounded-xl p-3 flex justify-between items-center">
              <span className="text-xs font-medium text-earth-700">Mundur:</span>
              <span className="text-xl font-bold font-mono tracking-wider text-earth-800">
                {countdownStr}
              </span>
            </div>

            {/* Info pills */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="text-[10px] bg-earth-200 text-earth-800 px-2 py-0.5 rounded font-mono">
                Sound: {nextBell.schedule.soundType === 'both' ? 'Chime + TTS' : nextBell.schedule.soundType.toUpperCase()}
              </span>
              {nextBell.schedule.soundType !== 'tts' && (
                <span className="text-[10px] bg-sage-50 text-sage-700 px-2 py-0.5 rounded font-mono">
                  Preset: {nextBell.schedule.chimePreset}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-earth-700 text-sm flex flex-col items-center gap-1">
            <span>Tidak ada jadwal aktif terdekat.</span>
            <span className="text-xs text-earth-800 opacity-85">Pastikan setidaknya satu jadwal diaktifkan di tabel.</span>
          </div>
        )}
      </div>
    </div>
  );
}
