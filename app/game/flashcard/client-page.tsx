"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";

interface Flashcard {
  id: number;
  description: string;
  english_meaning: string;
  vietnamese_meaning: string;
  image_url?: string;
}

export default function FlashcardClientPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportTemplate = () => {
    const template = [
      { id: 1, description: 'A yellow curved fruit', english_meaning: 'Banana', vietnamese_meaning: 'Quả chuối', image_url: '/images/banana.jpg' }
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

          const formattedData: Flashcard[] = jsonData.map((row) => ({
            id: row.id,
            description: row.description,
            english_meaning: row.english_meaning,
            vietnamese_meaning: row.vietnamese_meaning,
            image_url: row.image_url,
          }));
          
          if (formattedData.length > 0 && formattedData[0].description) {
            setFlashcards(formattedData);
            setCurrentIndex(0);
            setIsFlipped(false);
          } else {
            alert('Invalid file format. Please use the exported template.');
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

  const currentCard = flashcards[currentIndex];

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
            <p className="mt-2 text-slate-500 mb-8 max-w-sm mx-auto font-medium">Please import a flashcard file to start, or export a template to create your own dataset.</p>
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
          <div className="w-full justify-center flex flex-col items-center mx-auto max-w-4xl relative">
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
                Import new deck
              </button>
            </div>

            <div className="mb-6">
              <span className="bg-sky-100 text-sky-700 px-6 py-2 rounded-full font-black tracking-widest text-lg uppercase border-2 border-sky-200 shadow-sm">
                Card {currentIndex + 1} / {flashcards.length}
              </span>
            </div>

            <div
              className="w-full max-w-2xl h-80 min-h-[320px] perspective-1000 cursor-pointer animate-pop-in"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* FRONT */}
                <div className="absolute w-full h-full backface-hidden flex items-center justify-center bg-white/95 backdrop-blur-lg rounded-[40px] shadow-2xl border-t-8 border-yellow-400 p-8 text-center">
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    {currentCard.image_url ? (
                      <div className="flex-1 flex items-center justify-center min-h-0 mb-4 w-full">
                        <img 
                          src={currentCard.image_url} 
                          alt="Flashcard visual" 
                          className="max-h-full max-w-full object-contain rounded-2xl shadow-inner border-2 border-slate-100"
                        />
                      </div>
                    ) : null}
                    <div>
                      <h2 className={`${currentCard.image_url ? 'text-2xl' : 'text-3xl'} font-bold text-slate-800 leading-snug drop-shadow-sm`}>
                        {currentCard.description}
                      </h2>
                      <p className="mt-4 text-sky-500 font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                        <span>👆</span> Click to flip
                      </p>
                    </div>
                  </div>
                </div>

                {/* BACK */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center bg-emerald-50 backdrop-blur-lg rounded-[40px] shadow-2xl border-t-8 border-emerald-500 p-8 text-center text-emerald-900 border-b-8 border-b-emerald-200">
                  <div className="mb-6">
                    <span className="text-emerald-600/70 font-black uppercase tracking-widest text-xs block mb-2">English</span>
                    <h2 className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                      {currentCard.english_meaning}
                    </h2>
                  </div>
                  <div className="w-2/3 h-1 bg-emerald-200/50 rounded-full mb-6" />
                  <div>
                    <span className="text-emerald-600/70 font-black uppercase tracking-widest text-xs block mb-2">Vietnamese</span>
                    <h3 className="text-2xl font-bold text-emerald-800">
                      {currentCard.vietnamese_meaning}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex space-x-6">
              <button
                onClick={handlePrev}
                className="w-32 bg-amber-100 hover:bg-amber-200 text-amber-600 font-black py-4 rounded-2xl transition-all border-b-4 border-amber-300 active:border-0 active:translate-y-1 text-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <span>←</span> PREV
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
