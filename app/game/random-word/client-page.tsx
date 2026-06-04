'use client';

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';

interface WordData {
  word: string;
  definition: string;
  type: string;
  vn_meaning: string;
}

enum QuestionType {
  SELECT_DEF,
  SELECT_TYPE,
  SELECT_VN,
  INPUT_VN_TO_WORD,
  INPUT_DEF_TO_WORD,
}

interface Question {
  wordData: WordData;
  type: QuestionType;
  options?: string[];
  answer: string;
}

interface LessonMeta {
  id: string;
  name: string;
  fileName: string;
}

const TEMPLATE_HEADERS = ['Từ', 'Định nghĩa (4 - 6 từ)', 'Loại từ', 'Nghĩa tiếng việt'];

export default function RandomWordClientPage() {
  const { t } = useTranslation('game');

  const [wordList, setWordList] = useState<WordData[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');
  const [shakeInput, setShakeInput] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [hasGuessedWrong, setHasGuessedWrong] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Lesson panel state
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile drawer

  // Fetch available lessons on mount
  useEffect(() => {
    fetch('/api/game/random-word?action=list')
      .then(r => r.json())
      .then(data => setLessons(data.lessons ?? []))
      .catch(() => setLessons([]));
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, []);

  const ensureAudioPlaying = () => {
    if (audioRef.current && !isMuted && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (audioRef.current) {
      audioRef.current.muted = newMutedState;
      if (!newMutedState) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportTemplate = () => {
    const template = [
      {
        [TEMPLATE_HEADERS[0]]: 'apple',
        [TEMPLATE_HEADERS[1]]: 'a round fruit with red or green skin',
        [TEMPLATE_HEADERS[2]]: 'noun',
        [TEMPLATE_HEADERS[3]]: 'quả táo',
      },
      {
        [TEMPLATE_HEADERS[0]]: 'run',
        [TEMPLATE_HEADERS[1]]: 'move at a speed faster than a walk',
        [TEMPLATE_HEADERS[2]]: 'verb',
        [TEMPLATE_HEADERS[3]]: 'chạy',
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'random_word_template.xlsx');
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);

          if (json.length > 0) {
            const parsedWords: WordData[] = (json as Record<string, unknown>[])
              .map((row) => ({
                word: String(row[TEMPLATE_HEADERS[0]] ?? '').trim(),
                definition: String(row[TEMPLATE_HEADERS[1]] ?? '').trim(),
                type: String(row[TEMPLATE_HEADERS[2]] ?? '').trim(),
                vn_meaning: String(row[TEMPLATE_HEADERS[3]] ?? '').trim(),
              }))
              .filter(w => w.word !== '');

            if (parsedWords.length > 0) {
              setWordList(parsedWords);
              setActiveLesson(null);
              setCurrentIndex(-1);
            } else {
              alert(t('random_word.invalid_format'));
            }
          } else {
            alert(t('random_word.invalid_format'));
          }
        } catch (error) {
          console.error('Error reading Excel file:', error);
          alert(t('random_word.file_error'));
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Load a lesson from the server
  const handleSelectLesson = async (lesson: LessonMeta) => {
    if (loadingLesson || activeLesson === lesson.id) return;
    setLoadingLesson(true);
    setDrawerOpen(false);
    try {
      const res = await fetch(`/api/game/random-word?action=load&id=${lesson.id}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setWordList(data.words ?? []);
      setActiveLesson(lesson.id);
      setCurrentIndex(-1);
    } catch {
      alert('Không thể tải bài học.');
    } finally {
      setLoadingLesson(false);
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const generateOptions = (correctAnswer: string, allWords: WordData[], field: keyof WordData) => {
    const options = new Set<string>();
    options.add(correctAnswer);
    const pool = shuffleArray(allWords.filter(w => w[field] !== correctAnswer).map(w => w[field]));
    for (const opt of pool) {
      if (options.size >= 4) break;
      if (opt && opt.trim() !== '') {
        options.add(opt);
      }
    }
    return shuffleArray(Array.from(options));
  };

  const handleStart = () => {
    if (wordList.length === 0) return;
    ensureAudioPlaying();
    const shuffledWords = shuffleArray(wordList);
    const newQuestions: Question[] = shuffledWords.map(wd => {
      const types = [
        QuestionType.SELECT_DEF,
        QuestionType.SELECT_TYPE,
        QuestionType.SELECT_VN,
        QuestionType.INPUT_VN_TO_WORD,
        QuestionType.INPUT_DEF_TO_WORD,
      ];
      const type = types[Math.floor(Math.random() * types.length)];
      let answer = '';
      let options: string[] | undefined = undefined;

      if (type === QuestionType.SELECT_DEF) {
        answer = wd.definition;
        options = generateOptions(answer, wordList, 'definition');
      } else if (type === QuestionType.SELECT_TYPE) {
        answer = wd.type;
        options = generateOptions(answer, wordList, 'type');
      } else if (type === QuestionType.SELECT_VN) {
        answer = wd.vn_meaning;
        options = generateOptions(answer, wordList, 'vn_meaning');
      } else {
        answer = wd.word;
      }

      return { wordData: wd, type, options, answer };
    });

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setCorrectCount(0);
    setAnsweredCount(0);
    resetQuestionState();
  };

  const resetQuestionState = () => {
    setInputValue('');
    setIsAnswered(false);
    setIsCorrect(null);
    setHasGuessedWrong(false);
  };

  const handleShowAnswer = () => {
    if (currentIndex >= questions.length || isAnswered) return;
    const currentQ = questions[currentIndex];
    setInputValue(currentQ.answer);
    setIsAnswered(true);
    setAnsweredCount(prev => prev + 1);
  };

  const checkInputAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentIndex >= questions.length || isAnswered) return;
    const currentQ = questions[currentIndex];
    const isCorrectAnswer = inputValue.trim().toLowerCase() === currentQ.answer.toLowerCase();
    if (isCorrectAnswer) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  const checkSelectAnswer = (selectedOpt: string) => {
    if (isAnswered) return;
    const currentQ = questions[currentIndex];
    if (selectedOpt === currentQ.answer) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  const handleCorrect = () => {
    setIsAnswered(true);
    setIsCorrect(true);
    setAnsweredCount(prev => prev + 1);
    setCorrectCount(prev => prev + (hasGuessedWrong ? 0 : 1));
    new Audio('/voice/correct.mp3').play().catch(() => {});
  };

  const handleWrong = () => {
    setHasGuessedWrong(true);
    setShakeInput(true);
    setTimeout(() => setShakeInput(false), 300);
    new Audio('/voice/freesound_community-wrong-47985.mp3').play().catch(() => {});
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetQuestionState();
    } else {
      setCurrentIndex(questions.length);
    }
  };

  const renderQuestion = () => {
    const q = questions[currentIndex];
    if (!q) return null;

    let questionTitle = '';
    let questionContent = '';

    switch (q.type) {
      case QuestionType.SELECT_DEF:
        questionTitle = t('random_word.select_definition');
        questionContent = q.wordData.word;
        break;
      case QuestionType.SELECT_TYPE:
        questionTitle = t('random_word.select_type');
        questionContent = q.wordData.word;
        break;
      case QuestionType.SELECT_VN:
        questionTitle = t('random_word.select_vn_meaning');
        questionContent = q.wordData.word;
        break;
      case QuestionType.INPUT_VN_TO_WORD:
        questionTitle = t('random_word.input_word_from_vn');
        questionContent = q.wordData.vn_meaning;
        break;
      case QuestionType.INPUT_DEF_TO_WORD:
        questionTitle = t('random_word.input_word_from_def');
        questionContent = q.wordData.definition;
        break;
    }

    const isInputType =
      q.type === QuestionType.INPUT_VN_TO_WORD || q.type === QuestionType.INPUT_DEF_TO_WORD;

    const detailedInfo = (
      <div className="text-center text-lg font-medium text-slate-700 py-2">
        <span className="font-bold text-emerald-600">{q.wordData.word}</span>
        <span className="mx-2 text-slate-400">-</span>
        <span>{q.wordData.definition}</span>
        <span className="mx-2 text-slate-400">-</span>
        <span className="italic text-sky-600">{q.wordData.type}</span>
        <span className="mx-2 text-slate-400">-</span>
        <span className="font-bold text-amber-600">{q.wordData.vn_meaning}</span>
      </div>
    );

    return (
      <div
        className={`bg-white/90 backdrop-blur-lg p-10 rounded-[40px] shadow-2xl border-t-8 border-yellow-400 transition-transform ${
          shakeInput ? 'animate-shake' : ''
        }`}
      >
        <div className="mb-8 text-center">
          <div className="flex justify-center items-center gap-4">
            <span className="bg-sky-100 text-sky-700 px-4 py-1 rounded-full font-bold text-sm tracking-wider uppercase border border-sky-200">
              {t('random_word.step')} {currentIndex + 1} / {questions.length}
            </span>
            <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full font-bold text-sm tracking-wider uppercase border border-emerald-200" title="Số câu đúng / Số câu đã làm">
              ⭐ {correctCount} / {answeredCount}
            </span>
          </div>
          <h3 className="text-xl font-bold mt-6 text-slate-500">{questionTitle}</h3>
          <h2 className="text-4xl font-black mt-2 text-emerald-600 leading-snug drop-shadow-sm uppercase">
            {questionContent}
          </h2>
        </div>

        {isInputType ? (
          <form onSubmit={checkInputAnswer} className="space-y-8">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-sky-50/50 border-4 border-sky-100 p-6 rounded-3xl text-2xl text-center font-black text-emerald-600 focus:border-yellow-400 focus:bg-white focus:outline-none transition-all placeholder:text-slate-300 uppercase tracking-[0.2em]"
              placeholder={t('random_word.answer_placeholder')}
              autoFocus
              disabled={isAnswered}
            />
            <div className="flex flex-col gap-4">
              {!isAnswered ? (
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-black py-5 rounded-2xl transition-all shadow-[0_6px_0_rgb(5,150,105)] active:shadow-none active:translate-y-1 text-xl"
                  >
                    {t('random_word.submit')}
                  </button>
                  <button
                    type="button"
                    onClick={handleShowAnswer}
                    title="Hiện đáp án"
                    className="w-16 h-[68px] bg-amber-100 hover:bg-amber-200 text-amber-600 font-bold rounded-2xl transition-all border-b-4 border-amber-300 active:border-0 active:translate-y-1 flex items-center justify-center text-3xl"
                  >
                    💡
                  </button>
                </div>
              ) : (
                <div className="animate-pop-in space-y-6 mt-4">
                  {detailedInfo}
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-5 rounded-2xl transition-all shadow-[0_6px_0_rgb(14,165,233)] active:shadow-none active:translate-y-1 text-xl flex items-center justify-center gap-3"
                  >
                    {t('random_word.next')} <span>→</span>
                  </button>
                </div>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.options?.map((opt, idx) => {
                let btnClass = 'bg-white border-4 border-sky-100 text-slate-700 hover:bg-sky-50';
                if (isAnswered) {
                  if (opt === q.answer) {
                    btnClass = 'bg-emerald-500 border-emerald-600 text-white shadow-lg scale-105 z-10';
                  } else {
                    btnClass = 'bg-gray-100 border-gray-200 text-gray-400 opacity-50';
                  }
                }
                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => checkSelectAnswer(opt)}
                    className={`p-6 rounded-2xl font-bold text-lg transition-all ${btnClass} ${
                      !isAnswered ? 'active:scale-95' : ''
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {isAnswered && (
              <div className="animate-pop-in space-y-6 mt-6">
                {detailedInfo}
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-5 rounded-2xl transition-all shadow-[0_6px_0_rgb(14,165,233)] active:shadow-none active:translate-y-1 text-xl flex items-center justify-center gap-3"
                >
                  {t('random_word.next')} <span>→</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Lesson Panel (shared between sidebar & mobile drawer) ──────────────────
  const LessonPanel = () => (
    <div className="h-full flex flex-col">
      <div className="px-4 py-5 border-b border-white/20">
        <h2 className="text-base font-black text-white uppercase tracking-widest flex items-center gap-2">
          <span className="text-lg">📚</span> Bài học
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {lessons.length === 0 && (
          <p className="text-white/50 text-sm text-center py-6 px-3">Chưa có bài nào</p>
        )}
        {lessons.map((lesson) => {
          const isActive = activeLesson === lesson.id;
          return (
            <button
              key={lesson.id}
              onClick={() => handleSelectLesson(lesson)}
              disabled={loadingLesson}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all font-semibold text-sm flex items-center gap-3 group
                ${isActive
                  ? 'bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-400/30'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                }
                ${loadingLesson ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className={`text-xl shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {isActive ? '📖' : '📄'}
              </span>
              <span className="leading-tight">{lesson.name}</span>
              {isActive && loadingLesson && (
                <span className="ml-auto text-xs animate-spin">⏳</span>
              )}
              {isActive && !loadingLesson && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 mx-4" />

      {/* Manual import */}
      <div className="px-3 py-4 space-y-2">
        <p className="text-white/40 text-xs uppercase tracking-widest px-1 font-bold">Hoặc tải lên</p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportExcel}
          className="hidden"
          accept=".xlsx, .xls"
        />
        <button
          onClick={triggerFileInput}
          className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm font-bold transition-all flex items-center gap-2"
        >
          <span>📂</span> Nhập file Excel
        </button>
        <button
          onClick={handleExportTemplate}
          className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm font-bold transition-all flex items-center gap-2"
        >
          <span>⬇️</span> Tải mẫu
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="flex h-screen bg-cover bg-center bg-no-repeat text-slate-800 font-sans overflow-hidden"
      style={{ backgroundImage: "url('/images/bg_crossword.jpg')" }}
    >
      <div className="absolute inset-0 bg-white/20 pointer-events-none" />

      {/* Background Audio */}
      <audio ref={audioRef} src="/audio/leberch-calm-lo-fi-524696.mp3" loop muted={isMuted} />

      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <aside className="hidden md:flex relative z-10 w-64 shrink-0 flex-col bg-slate-900/70 backdrop-blur-xl border-r border-white/10 shadow-2xl">
        <LessonPanel />
      </aside>

      {/* ── Mobile Drawer Overlay ──────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 md:hidden
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all text-lg"
          aria-label="Đóng"
        >
          ✕
        </button>
        <LessonPanel />
      </aside>

      {/* ── Mobile FAB (lesson picker trigger) ──────────────────────── */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 left-6 z-20 md:hidden w-14 h-14 rounded-2xl bg-slate-900/90 backdrop-blur-md shadow-xl border border-white/20 flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all"
        aria-label="Chọn bài học"
        title="Chọn bài học"
      >
        📚
      </button>

      {/* ── Top-right Controls ───────────────────────────────────────── */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleMute}
          className="w-14 h-14 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border-2 border-white/50 flex items-center justify-center text-3xl hover:scale-105 active:scale-95 transition-all"
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {currentIndex === -1 ? (
            <div className="text-center bg-white/90 backdrop-blur-md p-10 md:p-12 rounded-[40px] shadow-2xl">
              <h1 className="text-4xl font-black text-emerald-600 mb-4">
                {t('random_word.welcome_title')}
              </h1>
              <p className="text-lg text-slate-600 mb-8">{t('random_word.welcome_desc')}</p>

              {wordList.length === 0 ? (
                <div className="py-6 text-slate-400 flex flex-col items-center gap-3">
                  <span className="text-5xl">👈</span>
                  <p className="font-semibold">
                    Chọn một bài học từ danh sách{' '}
                    <span className="md:inline hidden">bên trái</span>
                    <span className="md:hidden inline">bên dưới góc trái</span>
                  </p>
                </div>
              ) : (
                <div className="mt-4 animate-pop-in space-y-4">
                  <p className="text-emerald-600 font-bold">
                    Đã tải <span className="text-2xl font-black">{wordList.length}</span> từ vựng.
                  </p>
                  <button
                    onClick={handleStart}
                    className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-black px-12 py-5 rounded-[30px] text-2xl transition-all shadow-[0_8px_0_rgb(202,138,4)] active:shadow-none active:translate-y-2 uppercase tracking-widest"
                  >
                    {t('random_word.start')}
                  </button>
                </div>
              )}
            </div>
          ) : currentIndex >= questions.length ? (
            <div className="text-center bg-white/90 backdrop-blur-md p-10 md:p-12 rounded-[40px] shadow-2xl animate-pop-in">
              <h1 className="text-5xl font-black text-amber-500 mb-6 drop-shadow-md">
                🎉 {t('random_word.finish')} 🎉
              </h1>
              <p className="text-2xl font-bold text-emerald-600 mb-8">
                Điểm số: {correctCount} / {questions.length}
              </p>
              <button
                onClick={() => {
                  setCurrentIndex(-1);
                }}
                className="mt-8 bg-emerald-500 hover:bg-emerald-400 text-white font-black px-12 py-5 rounded-[30px] text-2xl transition-all shadow-[0_8px_0_rgb(5,150,105)] active:shadow-none active:translate-y-2 uppercase tracking-widest"
              >
                {t('random_word.restart')}
              </button>
            </div>
          ) : (
            renderQuestion()
          )}
        </div>
      </div>
    </div>
  );
}
