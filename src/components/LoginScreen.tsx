/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, User, LogIn, Bell, AlertCircle } from 'lucide-react';
import SchoolLogo from './SchoolLogo';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  logoUrl: string | null;
}

export default function LoginScreen({ onLoginSuccess, logoUrl }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const savedPassword = localStorage.getItem('bel_sekolah_admin_password') || 'admin';

    // Username is hardcoded to 'admin' as requested: "id dan password defaulnya admin"
    if (username.trim().toLowerCase() !== 'admin') {
      setError('ID Operator (Username) tidak dikenal.');
      return;
    }

    if (password !== savedPassword) {
      setError('Kata sandi salah. Silakan coba lagi.');
      return;
    }

    // Login success
    sessionStorage.setItem('bel_sekolah_is_logged_in', 'true');
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-earth-100 flex flex-col justify-between p-4 selection:bg-terracotta-200 selection:text-terracotta-900" id="login-screen-root">
      {/* Spacer to center card vertically */}
      <div className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-md bg-white border border-earth-300 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8 flex flex-col gap-6" id="login-card">
          {/* Header Section */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-20 h-20 rounded-2xl border border-earth-300 overflow-hidden bg-earth-50 flex items-center justify-center p-2 shadow-xs shrink-0 animate-bounce">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo Sekolah" className="w-full h-full object-contain" />
              ) : (
                <SchoolLogo className="w-16 h-16 text-sage-700" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-black text-2xl text-earth-900 tracking-tight leading-tight">
                SISTEM BEL SEKOLAH
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-terracotta-600 mt-1 font-mono">
                Operator Portal
              </span>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-earth-700 font-bold uppercase tracking-wider">
                ID Operator (Username)
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-earth-450" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan ID (contoh: admin)"
                  className="w-full pl-10 pr-4 py-2.5 bg-earth-50 border border-earth-300 rounded-xl text-xs text-earth-900 font-medium focus:outline-none focus:ring-2 focus:ring-sage-600 focus:border-sage-600 transition-all placeholder:text-earth-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-earth-700 font-bold uppercase tracking-wider">
                Kata Sandi
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-earth-450" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-10 pr-4 py-2.5 bg-earth-50 border border-earth-300 rounded-xl text-xs text-earth-900 font-medium focus:outline-none focus:ring-2 focus:ring-sage-600 focus:border-sage-600 transition-all placeholder:text-earth-400"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-terracotta-50/70 border border-terracotta-100 text-terracotta-700 rounded-xl text-[11px] font-medium leading-normal animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-terracotta-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-terracotta-600 hover:bg-terracotta-700 text-white font-serif font-bold text-sm rounded-xl cursor-pointer active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Masuk Sistem
            </button>
          </form>
        </div>
      </div>

      {/* Login Page Tidy Footer */}
      <footer className="text-center py-4 text-[11px] text-earth-600 font-semibold flex flex-col gap-1">
        <span>© 2026 - Bel Sekolah Pintar SDN Ulujami 06 Pagi</span>
        <span className="text-[10px] text-earth-500 font-normal">
          100% Beroperasi Offline &amp; Tersimpan Secara Lokal
        </span>
      </footer>
    </div>
  );
}
