"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";

interface Flashcard {
  id: number;
  description?: string;
  english_meaning: string;
  vietnamese_meaning?: string;
  image_url?: string;
  /** IPA phonetic; optional — fetched from dictionary if empty */
  phonetic?: string;
}

function normalizeCell(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "object") return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

function speakEnglish(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}

export default function FlashcardClientPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [fetchedPhonetic, setFetchedPhonetic] = useState<string | null>(null);
  const [phoneticLoading, setPhoneticLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportTemplate = () => {
    const template = [
      {
        id: 1,
        description: "",
        english_meaning: "Banana",
        vietnamese_meaning: "Quả chuối",
        phonetic: "/bəˈnænə/",
        image_url: "",
      },
      {
        id: 2,
        english_meaning: "Hello",
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Flashcards');
    XLSX.writeFile(workbook, 'flashcard_template.xlsx');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

          const formattedData: Flashcard[] = jsonData
            .map((row) => ({
              id: row.id,
              description: normalizeCell(row.description),
              english_meaning: normalizeCell(row.english_meaning) ?? "",
              vietnamese_meaning: normalizeCell(row.vietnamese_meaning),
              image_url: normalizeCell(row.image_url),
              phonetic: normalizeCell(row.phonetic),
            }))
            .filter((c) => c.english_meaning);

          if (formattedData.length > 0) {
            setFlashcards(formattedData);
            setCurrentIndex(0);
            setIsFlipped(false);
          } else {
            alert(
              "Invalid file: each row needs english_meaning. vietnamese_meaning, description, image_url, and phonetic are optional."
            );
          }
        } catch (error) {
          console.error("Error reading Excel file:", error);
          alert('There was an error processing the file.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
    setIsFlipped(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? flashcards.length - 1 : prevIndex - 1
    );
    setIsFlipped(false);
  };

  const shuffleDeck = useCallback(() => {
    setFlashcards((prev) => {
      if (prev.length < 2) return prev;
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  const currentCard = flashcards[currentIndex];

  useEffect(() => {
    setFetchedPhonetic(null);
    const card = flashcards[currentIndex];
    if (!card) return;

    if (card.phonetic) {
      setPhoneticLoading(false);
      return;
    }

    const word = card.english_meaning.trim();
    if (!word) {
      setPhoneticLoading(false);
      return;
    }

    setPhoneticLoading(true);
    const ctrl = new AbortController();
    fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: ctrl.signal }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.[0]?.phonetics) return;
        const ph = data[0].phonetics as { text?: string }[];
        const text = ph.find((p) => p.text)?.text;
        if (text) setFetchedPhonetic(text);
      })
      .catch(() => {})
      .finally(() => setPhoneticLoading(false));

    return () => ctrl.abort();
  }, [flashcards, currentIndex]);

  const displayPhonetic =
    currentCard?.phonetic?.trim() || fetchedPhonetic || null;

  const handleSpeak = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (currentCard?.english_meaning) speakEnglish(currentCard.english_meaning);
    },
    [currentCard?.english_meaning]
  );

  return (
    <div 
      className="flex h-screen bg-cover bg-center bg-no-repeat text-slate-800 font-sans p-4 gap-6 overflow-hidden transition-all duration-500"
      style={{ backgroundImage: "url('/images/bg_crossword.jpg')" }} // Using same background as crossword
    >
      <div className="absolute inset-0 bg-white/10 pointer-events-none" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full h-full">
        {flashcards.length === 0 ? (
          <div className="text-center bg-white/80 backdrop-blur-md p-10 rounded-[40px] shadow-2xl border-t-8 border-yellow-400">
            <h3 className="text-3xl font-black text-emerald-700 mb-6">Welcome to the Flashcard Game!</h3>
            <div className="mt-6 flex justify-center gap-4">
              <button 
                onClick={handleExportTemplate} 
                className="bg-sky-100 text-sky-700 px-6 py-4 rounded-2xl font-bold text-lg hover:bg-sky-200 transition-all border-b-4 border-sky-200 active:border-0 active:translate-y-1"
              >
                Export Template
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".xlsx, .xls"
              />
              <button 
                onClick={triggerFileInput} 
                className="bg-emerald-100 text-emerald-700 px-6 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-200 transition-all border-b-4 border-emerald-200 active:border-0 active:translate-y-1 flex items-center gap-2"
              >
                <span>➕</span> Import Flashcards
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full justify-center flex flex-col items-center mx-auto max-w-6xl relative">
            <div className="absolute -top-3 right-0 p-4">
               <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".xlsx, .xls"
              />
               <button 
                onClick={triggerFileInput} 
                className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl border-b-4 border-purple-200 active:border-0 active:translate-y-1 font-bold shadow hover:bg-purple-200"
              >
                Import new flashcards
              </button>
            </div>

            <div className="mb-6">
              <span className="bg-sky-100 text-sky-700 px-6 py-2 rounded-full font-black tracking-widest text-lg uppercase border-2 border-sky-200 shadow-sm">
                Card {currentIndex + 1} / {flashcards.length}
              </span>
            </div>

            <div
              className="w-full max-w-4xl min-h-[22rem] h-[min(32rem,calc(100svh-12rem))] sm:min-h-[26rem] perspective-1000 cursor-pointer animate-pop-in"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* FRONT */}
                <div className="absolute w-full h-full backface-hidden flex items-center justify-center bg-white/95 backdrop-blur-lg rounded-[40px] shadow-2xl border-t-8 border-yellow-400 p-10 sm:p-12 text-center">
                  <div className="flex h-full w-full min-h-0 flex-col items-stretch">
                    {currentCard.image_url ? (
                      <>
                        <div className="flex min-h-0 flex-1 items-center justify-center">
                          <img
                            src={currentCard.image_url}
                            alt="Flashcard visual"
                            className="h-full w-full max-h-full max-w-full object-contain rounded-3xl shadow-inner border-2 border-slate-100"
                          />
                        </div>
                        <div className="shrink-0 pt-3 sm:pt-4">
                          {currentCard.description ? (
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-snug drop-shadow-sm">
                              {currentCard.description}
                            </h2>
                          ) : (
                            <p className="text-xl sm:text-2xl font-bold text-slate-400">
                              (No description)
                            </p>
                          )}
                          <p className="mt-2 text-sky-500 font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2">
                            <span>👆</span> Tap to flip
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-1 flex-col items-center justify-center">
                        {currentCard.description ? (
                          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 leading-snug drop-shadow-sm">
                            {currentCard.description}
                          </h2>
                        ) : (
                          <p className="text-3xl sm:text-4xl font-bold text-slate-400">
                            (No description)
                          </p>
                        )}
                        <p className="mt-4 text-sky-500 font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                          <span>👆</span> Tap to flip
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* BACK */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center bg-emerald-50 backdrop-blur-lg rounded-[40px] shadow-2xl border-t-8 border-emerald-500 p-10 sm:p-12 text-center text-emerald-900 border-b-8 border-b-emerald-200">
                  <button
                    type="button"
                    onClick={handleSpeak}
                    className="absolute top-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition hover:bg-emerald-400 active:scale-95"
                    title="Listen to pronunciation"
                    aria-label="Listen to pronunciation"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5L6 9H2v6h4l5 4V5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.54 8.46a5 5 0 010 7.07M18 6a8 8 0 010 12"
                      />
                    </svg>
                  </button>
                  <div className="mb-4 w-full max-w-2xl">
                    <span className="text-emerald-600/70 font-black uppercase tracking-widest text-xs block mb-2">
                      English
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                      {currentCard.english_meaning}
                    </h2>
                    <div className="mt-3 min-h-[1.5rem] text-lg sm:text-xl font-mono text-emerald-700/90">
                      {phoneticLoading && !displayPhonetic ? (
                        <span className="text-sm font-sans text-emerald-600/60">
                          Looking up phonetic…
                        </span>
                      ) : displayPhonetic ? (
                        <span>{displayPhonetic}</span>
                      ) : (
                        <span className="text-sm font-sans text-emerald-600/50">
                          No phonetic (phrase or unknown word)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-2/3 h-1 bg-emerald-200/50 rounded-full mb-6" />
                  <div>
                    <span className="text-emerald-600/70 font-black uppercase tracking-widest text-xs block mb-2">
                      Vietnamese
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-bold text-emerald-800">
                      {currentCard.vietnamese_meaning ? (
                        currentCard.vietnamese_meaning
                      ) : (
                        <span className="text-emerald-600/45 font-medium">
                          No translation
                        </span>
                      )}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <button
                onClick={handlePrev}
                className="w-32 bg-amber-100 hover:bg-amber-200 text-amber-600 font-black py-4 rounded-2xl transition-all border-b-4 border-amber-300 active:border-0 active:translate-y-1 text-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <span>←</span> PREV
              </button>
              <button
                type="button"
                onClick={shuffleDeck}
                disabled={flashcards.length < 2}
                className="w-32 bg-violet-100 hover:bg-violet-200 text-violet-700 font-black py-4 rounded-2xl transition-all border-b-4 border-violet-200 active:border-0 active:translate-y-1 text-lg flex items-center justify-center gap-2 shadow-sm disabled:pointer-events-none disabled:opacity-40"
                title="Shuffle deck"
                aria-label="Shuffle deck"
              >
                <span aria-hidden></span> RANDOM
              </button>
              <button
                onClick={handleNext}
                className="w-32 bg-sky-500 hover:bg-sky-400 text-white font-black py-4 rounded-2xl transition-all shadow-[0_6px_0_rgb(14,165,233)] active:shadow-none active:translate-y-1 text-xl flex items-center justify-center gap-2"
              >
                NEXT <span>→</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Add some CSS to globals.css for the 3D effect if it's not already there
/*
.perspective-1000 {
  perspective: 1000px;
}
.transform-style-preserve-3d {
  transform-style: preserve-3d;
}
.rotate-y-180 {
  transform: rotateY(180deg);
}
.backface-hidden {
  backface-visibility: hidden;
}
*/
