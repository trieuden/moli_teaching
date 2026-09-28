'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';

export default function TrieuDenPage() {
  const { t } = useTranslation('game');
  const params = useParams();
  const locale = (params?.locale as string) || 'vi';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="flex flex-col flex-1 items-center justify-center min-h-screen font-sans bg-cover bg-center"
        style={{ backgroundImage: "url('/images/bg_crossword.jpg')" }}
      >
        <div className="absolute inset-0 bg-white/10" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col flex-1 items-center justify-center min-h-screen font-sans bg-cover bg-center p-4 sm:p-6"
      style={{ backgroundImage: "url('/images/bg_crossword.jpg')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/15 backdrop-blur-[2px]" />

      <main className="z-10 w-full max-w-lg flex flex-col items-center gap-6 p-6 sm:p-10 bg-white/85 backdrop-blur-md rounded-[32px] shadow-2xl border-4 border-white/60 text-center">
        {/* Back Link */}
        <div className="w-full flex items-center justify-start">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-800 bg-white/60 hover:bg-white px-3 py-1.5 rounded-full border border-gray-200 transition active:scale-95"
          >
            <FiArrowLeft className="text-base" />
            <span>{t('trieuden.back_home', 'Về trang chủ')}</span>
          </Link>
        </div>

        {/* Title & Badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-slate-900 to-indigo-800 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-200/50 border-2 border-white transform rotate-3 hover:rotate-0 transition duration-200">
            <span className="text-3xl sm:text-4xl">⚡</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-wider mt-2">
            trieuden
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-gray-500 max-w-xs">
            {t('trieuden.subtitle', 'Khu vực trò chơi & học tập')}
          </p>
        </div>

        {/* Game Buttons List */}
        <div className="w-full flex flex-col gap-4 mt-2">
          {/* Prepositions button (bằng tiếng Anh theo yêu cầu) */}
          <Link
            href={`/${locale}/game/preposition`}
            className="group flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-2xl shadow-[0_6px_0_rgb(79,70,229)] active:shadow-none active:translate-y-1 transition text-white"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 text-left">
              <span className="text-3xl sm:text-4xl bg-white/20 p-2.5 rounded-xl flex items-center justify-center">
                🎯
              </span>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-wide block">
                  Prepositions
                </span>
                <span className="text-xs sm:text-sm text-indigo-100 font-medium">
                  {t('trieuden.preposition_desc', 'Học và luyện tập giới từ tiếng Anh')}
                </span>
              </div>
            </div>
            <span className="text-2xl sm:text-3xl opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition transform">
              ➔
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
