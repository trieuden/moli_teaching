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

const TEMPLATE_HEADERS = ['Từ', 'Định nghĩa (4 - 6 từ)', 'Loại từ', 'Nghĩa tiếng việt'];

export default function RandomWordClientPage() {
  const { t } = useTranslation('game');
  
  const [wordList, setWordList] = useState<WordData[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 means not started
  const [inputValue, setInputValue] = useState('');
  const [shakeInput, setShakeInput] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      // Try to autoplay
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay may be blocked until user interacts
        });
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
        [TEMPLATE_HEADERS[3]]: 'quả táo'
      },
      {
        [TEMPLATE_HEADERS[0]]: 'run',
        [TEMPLATE_HEADERS[1]]: 'move at a speed faster than a walk',
        [TEMPLATE_HEADERS[2]]: 'verb',
        [TEMPLATE_HEADERS[3]]: 'chạy'
      }
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
            const parsedWords: WordData[] = json.map((row: any) => ({
              word: String(row[TEMPLATE_HEADERS[0]] || '').trim(),
              definition: String(row[TEMPLATE_HEADERS[1]] || '').trim(),
              type: String(row[TEMPLATE_HEADERS[2]] || '').trim(),
              vn_meaning: String(row[TEMPLATE_HEADERS[3]] || '').trim(),
            })).filter(w => w.word !== '');

            if (parsedWords.length > 0) {
              setWordList(parsedWords);
              setCurrentIndex(-1); // Reset state
            } else {
              alert(t('random_word.invalid_format'));
            }
          } else {
            alert(t('random_word.invalid_format'));
          }
        } catch (error) {
          console.error("Error reading Excel file:", error);
          alert(t('random_word.file_error'));
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
    
    // Try to get unique false options
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
        QuestionType.INPUT_DEF_TO_WORD
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
        // Input types
        answer = wd.word;
      }

      return {
        wordData: wd,
        type,
        options,
        answer
      };
    });

    setQuestions(newQuestions);
    setCurrentIndex(0);
    resetQuestionState();
  };

  const resetQuestionState = () => {
    setInputValue('');
    setIsAnswered(false);
    setIsCorrect(null);
  };

  const handleShowAnswer = () => {
    if (currentIndex >= questions.length || isAnswered) return;
    const currentQ = questions[currentIndex];
    setInputValue(currentQ.answer);
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
    new Audio('/voice/correct.mp3').play().catch(() => {}); // Play sound if exists
  };

  const handleWrong = () => {
    setShakeInput(true);
    setTimeout(() => setShakeInput(false), 300);
    new Audio('/voice/freesound_community-wrong-47985.mp3').play().catch(() => {});
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetQuestionState();
    } else {
      // Reached the end, change to finished state
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

    const isInputType = q.type === QuestionType.INPUT_VN_TO_WORD || q.type === QuestionType.INPUT_DEF_TO_WORD;

    return (
      <div className={`bg-white/90 backdrop-blur-lg p-10 rounded-[40px] shadow-2xl border-t-8 border-yellow-400 transition-transform ${shakeInput ? 'animate-shake' : ''}`}>
        <div className="mb-8 text-center">
          <span className="bg-sky-100 text-sky-700 px-4 py-1 rounded-full font-bold text-sm tracking-wider uppercase border border-sky-200">
            {t('random_word.step')} {currentIndex + 1} / {questions.length}
          </span>
          <h3 className="text-xl font-bold mt-6 text-slate-500">
            {questionTitle}
          </h3>
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
                  <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-black py-5 rounded-2xl transition-all shadow-[0_6px_0_rgb(5,150,105)] active:shadow-none active:translate-y-1 text-xl">
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
                <button 
                  type="button" 
                  onClick={handleNext} 
                  className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-5 rounded-2xl transition-all shadow-[0_6px_0_rgb(14,165,233)] active:shadow-none active:translate-y-1 text-xl flex items-center justify-center gap-3 animate-pop-in"
                >
                  {t('random_word.next')} <span>→</span>
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.options?.map((opt, idx) => {
                let btnClass = "bg-white border-4 border-sky-100 text-slate-700 hover:bg-sky-50";
                if (isAnswered) {
                  if (opt === q.answer) {
                    btnClass = "bg-emerald-500 border-emerald-600 text-white shadow-lg scale-105 z-10";
                  } else {
                    btnClass = "bg-gray-100 border-gray-200 text-gray-400 opacity-50";
                  }
                }
                
                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => checkSelectAnswer(opt)}
                    className={`p-6 rounded-2xl font-bold text-lg transition-all ${btnClass} ${!isAnswered ? 'active:scale-95' : ''}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            {isAnswered && (
               <button 
                type="button" 
                onClick={handleNext} 
                className="w-full mt-6 bg-sky-500 hover:bg-sky-400 text-white font-black py-5 rounded-2xl transition-all shadow-[0_6px_0_rgb(14,165,233)] active:shadow-none active:translate-y-1 text-xl flex items-center justify-center gap-3 animate-pop-in"
               >
                 {t('random_word.next')} <span>→</span>
               </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="flex h-screen bg-cover bg-center bg-no-repeat text-slate-800 font-sans p-4 gap-6 overflow-hidden transition-all duration-500 justify-center items-center"
      style={{ backgroundImage: "url('/images/bg_crossword.jpg')" }}
    >
      <div className="absolute inset-0 bg-white/20 pointer-events-none" />

      {/* Background Audio */}
      <audio
        ref={audioRef}
        src="/audio/leberch-calm-lo-fi-524696.mp3"
        loop
        muted={isMuted}
      />

      {/* Header Volume Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleMute}
          className="w-14 h-14 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border-2 border-white/50 flex items-center justify-center text-3xl hover:scale-105 active:scale-95 transition-all"
          title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {currentIndex === -1 ? (
          <div className="text-center bg-white/90 backdrop-blur-md p-12 rounded-[40px] shadow-2xl">
            <h1 className="text-4xl font-black text-emerald-600 mb-4">{t('random_word.welcome_title')}</h1>
            <p className="text-lg text-slate-600 mb-8">{t('random_word.welcome_desc')}</p>
            
            <div className="flex justify-center gap-6 mb-8">
              <button onClick={handleExportTemplate} className="bg-sky-100 text-sky-700 px-8 py-4 rounded-2xl font-bold text-xl hover:bg-sky-200 transition-all border-b-4 border-sky-300 active:border-0 active:translate-y-1">
                {t('random_word.export_template')}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                className="hidden"
                accept=".xlsx, .xls"
              />
              <button onClick={triggerFileInput} className="bg-purple-100 text-purple-700 px-8 py-4 rounded-2xl font-bold text-xl hover:bg-purple-200 transition-all border-b-4 border-purple-300 active:border-0 active:translate-y-1">
                {t('random_word.import_questions')}
              </button>
            </div>

            {wordList.length > 0 && (
              <div className="mt-8 animate-pop-in">
                <p className="text-emerald-600 font-bold mb-4">Đã tải {wordList.length} từ vựng.</p>
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
          <div className="text-center bg-white/90 backdrop-blur-md p-12 rounded-[40px] shadow-2xl animate-pop-in">
            <h1 className="text-5xl font-black text-amber-500 mb-6 drop-shadow-md">🎉 {t('random_word.finish')} 🎉</h1>
            
            <button 
              onClick={() => {
                setCurrentIndex(-1);
                setWordList([]);
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
  );
}
