/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { History, Trash2, Calendar, Radio, CheckCircle, Volume2 } from 'lucide-react';
import { BellLog } from '../types';

interface LogPanelProps {
  logs: BellLog[];
  onClearLogs: () => void;
}

export default function LogPanel({ logs, onClearLogs }: LogPanelProps) {
  return (
    <div id="log-panel-root" className="bg-white rounded-2xl p-5 border border-earth-300 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-earth-200/50 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sage-50 rounded-lg text-sage-600">
            <History className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif font-bold text-earth-900 text-sm block">Riwayat Kejadian (Bell Logs)</span>
            <span className="text-[10px] text-earth-700">Daftar bel otomatis dan manual yang telah berbunyi</span>
          </div>
        </div>

        {logs.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Bersihkan seluruh catatan riwayat bel?')) {
                onClearLogs();
              }
            }}
            className="px-3 py-1.5 bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-700 font-bold text-xs rounded-lg cursor-pointer transition-all active:scale-95 border border-terracotta-200/60 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Bersihkan
          </button>
        )}
      </div>

      {logs.length > 0 ? (
        <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-1" id="logs-timeline">
          {logs.map((log) => {
            const isManual = log.type === 'manual';
            return (
              <div
                key={log.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all ${
                  isManual 
                    ? 'bg-terracotta-50/45 border-terracotta-100' 
                    : 'bg-sage-50/45 border-sage-200'
                }`}
              >
                <div className="flex gap-3">
                  {/* Indicator Icon */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isManual ? 'bg-terracotta-100 text-terracotta-700' : 'bg-sage-100 text-sage-700'
                  }`}>
                    {isManual ? <Volume2 className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </div>

                  <div>
                    <h5 className="font-serif font-bold text-earth-900 text-xs sm:text-sm">
                      {log.label}
                    </h5>
                    
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-earth-700 font-medium">
                      <span className={`px-2 py-0.2 rounded font-bold uppercase text-[9px] ${
                        isManual ? 'bg-terracotta-100 text-terracotta-800' : 'bg-sage-100 text-sage-800'
                      }`}>
                        {isManual ? 'Manual' : 'Otomatis'}
                      </span>
                      
                      <span className="bg-earth-100 text-earth-800 px-1.5 py-0.2 rounded font-mono border border-earth-300/40">
                        {log.details}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamp section */}
                <div className="flex flex-col items-end shrink-0 bg-white/60 p-2 rounded-lg border border-earth-200 sm:border-0 sm:bg-transparent sm:p-0">
                  <span className="font-mono font-bold text-earth-800 text-xs sm:text-sm">
                    {log.timeStr}
                  </span>
                  <span className="text-[9px] text-earth-700 font-medium mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-earth-800" />
                    {log.dateStr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-earth-700 text-xs flex flex-col items-center gap-1">
          <span>Belum ada riwayat aktivitas bel terekam.</span>
          <span className="text-earth-700 opacity-80">Sistem bel otomatis akan mencatat setiap pemicu di sini.</span>
        </div>
      )}
    </div>
  );
}
