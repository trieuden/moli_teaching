'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import {
  FiVolume2,
  FiShuffle,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiUpload,
  FiCheckCircle,
  FiHelpCircle,
  FiRotateCcw
} from 'react-icons/fi';

export interface PrepositionItem {
  id: number;
  word: string;
  preposition: string;
  meaning: string;
  example: string;
}

const DEFAULT_POOL = ['to', 'for', 'about', 'at', 'in', 'on', 'with', 'of', 'from'];

const INITIAL_ITEMS: PrepositionItem[] = [
  // 1. Đi với giới từ "TO"
  {
    id: 1,
    word: 'belong',
    preposition: 'to',
    meaning: 'belong to sb: thuộc về ai',
    example: 'This jacket belongs to me.',
  },
  {
    id: 2,
    word: 'listen',
    preposition: 'to',
    meaning: 'listen to sb/sth: lắng nghe ai/cái gì',
    example: 'Listen to the teacher carefully.',
  },
  {
    id: 3,
    word: 'explain',
    preposition: 'to',
    meaning: 'explain sth to sb: giải thích cái gì cho ai',
    example: 'Can you explain this rule to me?',
  },
  {
    id: 4,
    word: 'adapt',
    preposition: 'to',
    meaning: 'adapt to sth: thích nghi với cái gì',
    example: 'He adapted quickly to the new school.',
  },
  {
    id: 5,
    word: 'look forward',
    preposition: 'to',
    meaning: 'look forward to sth / V-ing: ngóng chờ điều gì',
    example: 'I look forward to seeing you.',
  },
  {
    id: 6,
    word: 'invite',
    preposition: 'to',
    meaning: 'invite sb to sth: mời ai đến đâu',
    example: 'Invite Debbie to the party.',
  },
  {
    id: 7,
    word: 'talk / speak',
    preposition: 'to',
    meaning: 'talk / speak to sb: nói chuyện với ai',
    example: 'I need to speak to Martin.',
  },
  {
    id: 8,
    word: 'apologize',
    preposition: 'to',
    meaning: 'apologize to sb for sth: xin lỗi ai về điều gì',
    example: 'He apologized to the teacher.',
  },

  // 2. Đi với giới từ "FOR"
  {
    id: 9,
    word: 'wait',
    preposition: 'for',
    meaning: 'wait for sb/sth: chờ đợi ai/cái gì',
    example: 'I hate waiting for people who are late.',
  },
  {
    id: 10,
    word: 'ask',
    preposition: 'for',
    meaning: 'ask for sth: yêu cầu, xin cái gì',
    example: 'I asked for a chicken sandwich.',
  },
  {
    id: 11,
    word: 'pay',
    preposition: 'for',
    meaning: 'pay for sth: trả tiền cho món đồ/bữa ăn',
    example: 'Who is going to pay for the meal?',
  },
  {
    id: 12,
    word: 'look',
    preposition: 'for',
    meaning: 'look for sb/sth: tìm kiếm ai/cái gì',
    example: 'What are you looking for under the desk?',
  },
  {
    id: 13,
    word: 'thank',
    preposition: 'for',
    meaning: 'thank sb for sth: cảm ơn ai vì điều gì',
    example: 'Thank them for their help.',
  },
  {
    id: 14,
    word: 'apologize',
    preposition: 'for',
    meaning: 'apologize for sth / V-ing: xin lỗi vì điều gì',
    example: 'Apologize for being late.',
  },
  {
    id: 15,
    word: 'apply',
    preposition: 'for',
    meaning: 'apply for sth: nộp đơn ứng tuyển/xin học bổng',
    example: 'She applied for that scholarship.',
  },

  // 3. Đi với giới từ "ABOUT"
  {
    id: 16,
    word: 'worry',
    preposition: 'about',
    meaning: 'worry about sb/sth: lo lắng về ai/cái gì',
    example: "Don't worry about the exam.",
  },
  {
    id: 17,
    word: 'think',
    preposition: 'about',
    meaning: 'think about sth / V-ing: nghĩ, suy xét về việc gì',
    example: "I'm thinking about studying abroad.",
  },
  {
    id: 18,
    word: 'speak / talk',
    preposition: 'about',
    meaning: 'speak / talk about sth: nói về chủ đề gì',
    example: 'Talk about their favorite music.',
  },
  {
    id: 19,
    word: 'argue',
    preposition: 'about',
    meaning: 'argue about sth: tranh cãi về vấn đề gì',
    example: 'They argue about money.',
  },

  // 4. Đi với giới từ "AT"
  {
    id: 20,
    word: 'arrive',
    preposition: 'at',
    meaning: 'arrive at + địa điểm nhỏ (khách sạn, sân bay, nhà ga): đến nơi',
    example: 'Arrive at the hotel / the station.',
  },
  {
    id: 21,
    word: 'smile',
    preposition: 'at',
    meaning: 'smile at sb: mỉm cười với ai',
    example: 'She smiled at me.',
  },
  {
    id: 22,
    word: 'laugh',
    preposition: 'at',
    meaning: 'laugh at sb/sth: cười chế giễu ai/cái gì',
    example: 'Stop laughing at your brother.',
  },

  // 5. Đi với giới từ "IN"
  {
    id: 23,
    word: 'arrive',
    preposition: 'in',
    meaning: 'arrive in + thành phố / quốc gia: đến một thành phố/nước',
    example: 'Arrive in Paris / Tokyo.',
  },
  {
    id: 24,
    word: 'believe',
    preposition: 'in',
    meaning: 'believe in sb/sth: tin vào điều gì/sự tồn tại của cái gì',
    example: "I don't believe in ghosts.",
  },
  {
    id: 25,
    word: 'succeed',
    preposition: 'in',
    meaning: 'succeed in sth / V-ing: thành công trong việc gì',
    example: 'He succeeded in passing the exam.',
  },

  // 6. Đi với các giới từ khác (ON, WITH, OF, FROM)
  {
    id: 26,
    word: 'depend',
    preposition: 'on',
    meaning: 'depend on sb/sth: phụ thuộc, tùy thuộc vào ai/cái gì',
    example: 'It depends on the weather.',
  },
  {
    id: 27,
    word: 'spend',
    preposition: 'on',
    meaning: 'spend money/time on sth: chi tiêu tiền/thời gian vào việc gì',
    example: 'Spend 50 dollars on books.',
  },
  {
    id: 28,
    word: 'agree',
    preposition: 'with',
    meaning: 'agree with sb: đồng ý với ai',
    example: "I don't agree with you.",
  },
  {
    id: 29,
    word: 'help',
    preposition: 'with',
    meaning: 'help sb with sth: giúp ai việc gì',
    example: 'Help her with the report.',
  },
  {
    id: 30,
    word: 'argue',
    preposition: 'with',
    meaning: 'argue with sb about sth: tranh cãi với ai về điều gì',
    example: 'Argue with parents.',
  },
  {
    id: 31,
    word: 'remind',
    preposition: 'of',
    meaning: 'remind sb of sb/sth: gợi nhớ cho ai về ai/cái gì',
    example: 'Remind me of my childhood.',
  },
  {
    id: 32,
    word: 'think',
    preposition: 'of',
    meaning: 'think of sb/sth: nghĩ về, nhớ tới ai/cái gì',
    example: 'Think of studying abroad.',
  },
  {
    id: 33,
    word: 'protect',
    preposition: 'from',
    meaning: 'protect sb/sth from sth: bảo vệ ai khỏi cái gì',
    example: 'Protect passengers from injury.',
  },
];

interface QuestionState {
  isAnswered: boolean;
  selectedPreposition: string | null;
  wrongAttempts: number;
  isFirstTryCorrect: boolean;
  options: string[];
}

// Simple audio synth for cheerful success sound
function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
    });
  } catch {
    // Ignore audio context errors if browser blocks autoplay
  }
}

function playWrongSound() {
  try {
    const audio = new Audio('/voice/freesound_community-wrong-47985.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

function speakText(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

// Generate 4 randomized options (1 correct + 3 random distinct from pool)
function generateOptions(correctPrep: string, pool: string[] = DEFAULT_POOL): string[] {
  const normCorrect = correctPrep.trim().toLowerCase();
  const others = pool
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p !== normCorrect);
  
  // Shuffle other prepositions
  const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
  const pickedOthers = shuffledOthers.slice(0, 3);
  
  // Combine 1 correct + 3 incorrect
  const final4 = [normCorrect, ...pickedOthers];
  // Shuffle final 4
  return final4.sort(() => Math.random() - 0.5);
}

export default function PrepositionClientPage() {
  const { t } = useTranslation('game');
  const [mounted, setMounted] = useState(false);

  const [items, setItems] = useState<PrepositionItem[]>(INITIAL_ITEMS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [shakingOption, setShakingOption] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Per-item question state tracking
  const [itemStates, setItemStates] = useState<Record<number, QuestionState>>(() => {
    const initial: Record<number, QuestionState> = {};
    INITIAL_ITEMS.forEach((it) => {
      initial[it.id] = {
        isAnswered: false,
        selectedPreposition: null,
        wrongAttempts: 0,
        isFirstTryCorrect: false,
        options: generateOptions(it.preposition),
      };
    });
    return initial;
  });

  // Automatically load from the prepositions.xlsx file via API on mount
  useEffect(() => {
    setMounted(true);
    fetch('/api/game/preposition')
      .then((res) => res.json())
      .then((data) => {
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items);
          const newStates: Record<number, QuestionState> = {};
          data.items.forEach((it: PrepositionItem) => {
            newStates[it.id] = {
              isAnswered: false,
              selectedPreposition: null,
              wrongAttempts: 0,
              isFirstTryCorrect: false,
              options: generateOptions(it.preposition),
            };
          });
          setItemStates(newStates);
        }
      })
      .catch((err) => {
        console.warn('Fallback to built-in items:', err);
      });
  }, []);

  const currentItem = items[currentIndex] || items[0];
  const currentState: QuestionState = itemStates[currentItem?.id] || {
    isAnswered: false,
    selectedPreposition: null,
    wrongAttempts: 0,
    isFirstTryCorrect: false,
    options: generateOptions(currentItem?.preposition || 'to'),
  };

  // Toast notification helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2400);
  }, []);

  // Handle Export Template
  const handleExportTemplate = () => {
    const exportData = items.map((it) => ({
      'Từ': it.word,
      'Giới từ': it.preposition,
      'Nghĩa': it.meaning,
      'Ví dụ': it.example,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prepositions');
    XLSX.writeFile(wb, 'prepositions.xlsx');
  };

  // Flexible column key getter for Excel
  const getColValue = (row: Record<string, unknown>, keys: string[]): string => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null) {
        return String(row[k]).trim();
      }
    }
    // Also try case-insensitive
    const rowKeys = Object.keys(row);
    for (const k of keys) {
      const match = rowKeys.find((rk) => rk.toLowerCase() === k.toLowerCase());
      if (match && row[match] !== undefined && row[match] !== null) {
        return String(row[match]).trim();
      }
    }
    return '';
  };

  // Handle Import Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        if (!json || json.length === 0) {
          alert(t('preposition.invalid_format'));
          return;
        }

        const parsedItems: PrepositionItem[] = [];
        let idCounter = 1;

        for (const row of json) {
          const word = getColValue(row, ['Từ', 'Word', 'Tu', 'vocab']);
          const prep = getColValue(row, ['Giới từ', 'Preposition', 'Gioi tu', 'prep']);
          const meaning = getColValue(row, ['Nghĩa', 'Meaning', 'Nghia', 'dinh nghia']);
          const example = getColValue(row, ['Ví dụ', 'Example', 'Vi du', 'sentence']);

          if (word && prep) {
            parsedItems.push({
              id: idCounter++,
              word,
              preposition: prep.toLowerCase(),
              meaning: meaning || '',
              example: example || '',
            });
          }
        }

        if (parsedItems.length === 0) {
          alert(t('preposition.invalid_format'));
          return;
        }

        // Initialize state for imported items
        const newStates: Record<number, QuestionState> = {};
        parsedItems.forEach((it) => {
          newStates[it.id] = {
            isAnswered: false,
            selectedPreposition: null,
            wrongAttempts: 0,
            isFirstTryCorrect: false,
            options: generateOptions(it.preposition),
          };
        });

        setItems(parsedItems);
        setItemStates(newStates);
        setCurrentIndex(0);
        showToast(`Đã nhập thành công ${parsedItems.length} từ! 🎉`);
      } catch (err) {
        console.error('Import error:', err);
        alert(t('preposition.file_error'));
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  // Action: Sắp xếp lại (Shuffle questions order)
  const handleShuffle = () => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setItems(shuffled);
    setCurrentIndex(0);
    showToast('Đã xáo trộn thứ tự các từ! 🔀');
  };

  // Navigation: Next & Prev
  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
      showToast('Đã hoàn thành! Bắt đầu lại lượt mới 🚀');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Handle Option Click
  const handleSelectOption = (option: string) => {
    if (currentState.isAnswered) return;

    const normOption = option.trim().toLowerCase();
    const correctPrep = currentItem.preposition.trim().toLowerCase();

    if (normOption === correctPrep) {
      // Correct!
      playSuccessChime();
      setItemStates((prev) => ({
        ...prev,
        [currentItem.id]: {
          ...currentState,
          isAnswered: true,
          selectedPreposition: normOption,
          isFirstTryCorrect: currentState.wrongAttempts === 0,
        },
      }));
    } else {
      // Incorrect!
      playWrongSound();
      setShakingOption(normOption);
      setTimeout(() => setShakingOption(null), 500);

      setItemStates((prev) => ({
        ...prev,
        [currentItem.id]: {
          ...currentState,
          wrongAttempts: currentState.wrongAttempts + 1,
        },
      }));
    }
  };

  // Highlight word + preposition inside example sentence
  const renderHighlightedExample = (example: string, word: string, prep: string) => {
    if (!example) return null;

    // Pattern to highlight word and preposition if they appear close to each other
    const regex = new RegExp(`(${word}[a-z]*\\s+${prep})`, 'gi');
    const parts = example.split(regex);

    if (parts.length > 1) {
      return (
        <span>
          {parts.map((part, i) =>
            regex.test(part) ? (
              <span key={i} className="font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md underline decoration-indigo-400 decoration-2">
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </span>
      );
    }

    return <span>{example}</span>;
  };

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
      className="flex flex-col flex-1 items-center justify-between min-h-screen font-sans bg-cover bg-center p-3 sm:p-6 pb-24 sm:pb-28"
      style={{ backgroundImage: "url('/images/bg_crossword.jpg')" }}
    >
      {/* Background soft overlay */}
      <div className="fixed inset-0 bg-white/15 pointer-events-none" />

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportExcel}
        accept=".xlsx, .xls"
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 z-50 animate-bounce bg-emerald-600 text-white text-xs sm:text-sm font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white max-w-[90%] text-center">
          <FiCheckCircle className="text-lg flex-shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="z-10 w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 bg-white/90 backdrop-blur-md px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-2xl shadow-lg border border-white/60">
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🎯</span>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-indigo-900 tracking-wide leading-tight">
                Prepositions
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-gray-500">
                {t('preposition.question_progress', 'Từ')} {currentIndex + 1} / {items.length}
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Buttons Toolbar: 3 columns on mobile, row on desktop */}
        <div className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleExportTemplate}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 px-1.5 py-1.5 sm:px-3 sm:py-1.5 text-[11px] sm:text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition border border-indigo-200 shadow-sm"
            title={t('preposition.export_template')}
          >
            <FiDownload className="text-sm sm:text-base flex-shrink-0" />
            <span className="truncate">{t('preposition.export_template', 'Mẫu')}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 px-1.5 py-1.5 sm:px-3 sm:py-1.5 text-[11px] sm:text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition border border-emerald-200 shadow-sm"
            title={t('preposition.import_questions')}
          >
            <FiUpload className="text-sm sm:text-base flex-shrink-0" />
            <span className="truncate">{t('preposition.import_questions', 'Nhập')}</span>
          </button>

          <button
            onClick={handleShuffle}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 px-1.5 py-1.5 sm:px-3 sm:py-1.5 text-[11px] sm:text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition border border-amber-200 shadow-sm"
            title={t('preposition.shuffle')}
          >
            <FiShuffle className="text-sm sm:text-base flex-shrink-0" />
            <span className="truncate">{t('preposition.shuffle', 'Đảo từ')}</span>
          </button>
        </div>
      </header>

      {/* Main Game Card */}
      <main className="z-10 w-full max-w-2xl my-auto flex flex-col items-center gap-4 sm:gap-6 py-2">
        {/* Progress Bar */}
        <div className="w-full bg-white/60 rounded-full h-2.5 sm:h-3 backdrop-blur-sm overflow-hidden border border-white/50 shadow-inner">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          />
        </div>

        {/* Word Card */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[32px] p-4 sm:p-8 shadow-xl sm:shadow-2xl border-2 sm:border-4 border-white/80 flex flex-col items-center gap-4 sm:gap-6 text-center relative overflow-hidden">
          {/* Header indicator */}
          <div className="flex items-center justify-between w-full text-xs sm:text-sm font-bold text-gray-400">
            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-indigo-100">
              # {currentIndex + 1}
            </span>
            {currentState.isAnswered ? (
              <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-emerald-200 animate-pulse text-xs sm:text-sm">
                <FiCheckCircle /> {t('preposition.correct', 'Chính xác!')}
              </span>
            ) : (
              <span className="text-gray-500 flex items-center gap-1 text-xs sm:text-sm">
                <FiHelpCircle /> {t('preposition.choose_preposition', 'Chọn giới từ đúng:')}
              </span>
            )}
          </div>

          {/* Central Target Word */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 my-1">
            <h2 className="text-3xl sm:text-5xl font-black text-indigo-900 tracking-wide drop-shadow-sm break-words">
              {currentItem.word}
            </h2>
            <button
              onClick={() => speakText(currentItem.word)}
              className="p-2 sm:p-2.5 rounded-full text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition active:scale-95"
              title="Phát âm từ"
            >
              <FiVolume2 className="text-xl sm:text-2xl" />
            </button>
          </div>

          {/* 4 Preposition Option Buttons */}
          <div className="w-full grid grid-cols-2 gap-2.5 sm:gap-4 mt-1 sm:mt-2">
            {currentState.options.map((opt) => {
              const normOpt = opt.trim().toLowerCase();
              const isCorrectTarget = normOpt === currentItem.preposition.trim().toLowerCase();
              const isShaking = shakingOption === normOpt;

              let btnStyle =
                'bg-white text-indigo-900 border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 shadow-[0_4px_0_rgb(224,231,255)] sm:shadow-[0_5px_0_rgb(224,231,255)]';

              if (currentState.isAnswered) {
                if (isCorrectTarget) {
                  btnStyle =
                    'bg-emerald-500 text-white border-2 border-emerald-600 shadow-[0_4px_0_rgb(5,150,105)] sm:shadow-[0_5px_0_rgb(5,150,105)] scale-102 sm:scale-105 font-black ring-2 sm:ring-4 ring-emerald-200';
                } else {
                  btnStyle = 'bg-gray-100 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed';
                }
              }

              return (
                <button
                  key={opt}
                  disabled={currentState.isAnswered}
                  onClick={() => handleSelectOption(opt)}
                  className={`py-3 sm:py-4 px-2 sm:px-6 text-lg sm:text-2xl font-black rounded-xl sm:rounded-2xl transition-all duration-150 transform active:translate-y-1 active:shadow-none min-h-[52px] sm:min-h-[64px] flex items-center justify-center ${btnStyle} ${
                    isShaking ? 'animate-bounce !bg-rose-500 !text-white !border-rose-600 shadow-[0_4px_0_rgb(225,29,72)]' : ''
                  }`}
                >
                  {opt.toLowerCase()}
                </button>
              );
            })}
          </div>

          {/* Feedback & Revealed Meaning + Example Card */}
          {currentState.isAnswered && (
            <div className="w-full mt-1 sm:mt-2 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 text-left flex flex-col gap-2 sm:gap-3 shadow-md animate-fadeIn">
              {/* Meaning */}
              {currentItem.meaning && (
                <div className="flex items-start gap-2">
                  <span className="text-xs sm:text-sm font-black text-indigo-600 uppercase tracking-wider min-w-[60px] sm:min-w-[70px]">
                    {t('preposition.meaning', 'Nghĩa:')}
                  </span>
                  <p className="text-sm sm:text-lg font-bold text-gray-800">
                    {currentItem.meaning}
                  </p>
                </div>
              )}

              {/* Example sentence */}
              {currentItem.example && (
                <div className="flex items-start gap-2 pt-2 border-t border-indigo-100">
                  <span className="text-xs sm:text-sm font-black text-purple-600 uppercase tracking-wider min-w-[60px] sm:min-w-[70px]">
                    {t('preposition.example', 'Ví dụ:')}
                  </span>
                  <div className="flex-1 flex items-center justify-between gap-1.5 sm:gap-2">
                    <p className="text-xs sm:text-lg font-medium text-gray-700 italic leading-relaxed">
                      "{renderHighlightedExample(currentItem.example, currentItem.word, currentItem.preposition)}"
                    </p>
                    <button
                      onClick={() => speakText(currentItem.example)}
                      className="p-1.5 rounded-full text-purple-600 hover:text-purple-800 hover:bg-purple-100 transition active:scale-95 flex-shrink-0"
                      title="Phát âm câu ví dụ"
                    >
                      <FiVolume2 className="text-lg sm:text-xl" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls inside Card */}
          <div className="w-full flex items-center justify-between gap-2 sm:gap-4 pt-1 sm:pt-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition text-xs sm:text-base ${
                currentIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-indigo-700 hover:bg-indigo-50 border-2 border-indigo-200 shadow-sm active:translate-y-0.5'
              }`}
            >
              <FiChevronLeft className="text-base sm:text-lg" />
              <span>{t('preposition.prev', 'Từ trước')}</span>
            </button>

            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-sm sm:text-lg rounded-xl sm:rounded-2xl shadow-[0_4px_0_rgb(79,70,229)] sm:shadow-[0_5px_0_rgb(79,70,229)] active:shadow-none active:translate-y-1 transition"
            >
              <span>
                {currentIndex === items.length - 1
                  ? 'Bắt đầu lại 🔄'
                  : t('preposition.next', 'Từ tiếp theo ➡️')}
              </span>
              <FiChevronRight className="text-lg sm:text-xl" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

