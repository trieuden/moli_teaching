'use client';

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';

const initialQuestionsData = [
  { id: 1, question: 'Making no or very little noise.', answer: 'QUIET', letter: 'Q', key: 1 },
  { id: 2, question: 'To agree with and give encouragement to someone or something because you want them to succeed.', answer: 'SUPPORT', letter: 'U', key: 2 },
  { id: 3, question: 'A series of planned activities to achieve a particular social, commercial, or political goal.', answer: 'CAMPAIGN', letter: 'A', key: 2 },
  { id: 4, question: 'A person who does work without being paid for it.', answer: 'VOLUNTEER', letter: 'L', key: 3 },
  { id: 5, question: 'Your name written in your own characteristic way.', answer: 'SIGNATURE', letter: 'I', key: 2 },
  { id: 6, question: 'An event where people gather to show strong objection to something.', answer: 'PROTEST', letter: 'T', key: 4 },
  { id: 7, question: 'An acceptance that something exists or is true, especially one without proof.', answer: 'BELIEF', letter: 'I', key: 4 },
  { id: 8, question: 'A formal request, typically one signed by many people, appealing to authority about a particular cause.', answer: 'PETITION', letter: 'E', key: 2 },
  { id: 9, question: 'A formal plan or suggestion.', answer: 'PROPOSAL', letter: 'S', key: 6 },
];

export default function CrosswordClientPage() {
  const [questions, setQuestions] = useState(initialQuestionsData);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(questions.length > 0 ? questions[0].id : null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [inputValue, setInputValue] = useState('');
  const [lastCorrectId, setLastCorrectId] = useState<number | null>(null);
  const [shakeInput, setShakeInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);
  const currentIndex = questions.findIndex(q => q.id === selectedQuestionId);

  useEffect(() => {
    if (selectedQuestion) {
      setInputValue(answers[selectedQuestion.id] || '');
    }
  }, [selectedQuestionId, answers, questions]); // Add questions to dependency array

  const handleSelectQuestion = (id: number) => {
    setSelectedQuestionId(id);
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % questions.length;
    handleSelectQuestion(questions[nextIndex].id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestion && inputValue.toUpperCase().trim() === selectedQuestion.answer) {
      setAnswers((prev) => ({ ...prev, [selectedQuestion.id]: inputValue.toUpperCase().trim() }));
      setLastCorrectId(selectedQuestion.id);
    } else {
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 300);
    }
  };

  const handleShowAnswer = () => {
    if (selectedQuestion) {
      setAnswers((prev) => ({ ...prev, [selectedQuestion.id]: selectedQuestion.answer }));
    }
  };

  const handleExportTemplate = () => {
    const template = [
      { id: 1, question: 'Your question here', answer: 'ANSWER', letter: 'A', key: 1 }
    ];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
    XLSX.writeFile(workbook, 'questions_template.xlsx');
  };

  const handleImportQuestions = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as typeof initialQuestionsData;
          
          // Basic validation
          if (json.length > 0 && 'id' in json[0] && 'question' in json[0] && 'answer' in json[0] && 'key' in json[0]) {
            setQuestions(json);
            setAnswers({});
            setSelectedQuestionId(json[0].id);
            setLastCorrectId(null);
          } else {
            alert('Invalid file format. Please use the exported template.');
          }
        } catch (error) {
          console.error("Error reading Excel file:", error);
          alert('There was an error processing the file.');
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className="flex h-screen bg-cover bg-center bg-no-repeat text-slate-800 font-sans p-4 gap-6 overflow-hidden transition-all duration-500"
      style={{ backgroundImage: "url('/images/bg_crossword.jpg')" }} // Đã thêm ảnh nền
    >
      {/* Overlay nhẹ để tăng tương phản chữ */}
      <div className="absolute inset-0 bg-white/10 pointer-events-none" />

      {/* Left Menu: Question Cards */}
      <div className="w-1/4 bg-white/80 backdrop-blur-md p-6 rounded-[32px] shadow-2xl border-4 border-white/50 overflow-y-auto z-10">
        <h2 className="text-2xl font-black mb-6 text-emerald-700 flex items-center gap-2">
          <span>🌈</span> QUEST LIST
        </h2>
        
        {/* --- START: Import/Export Buttons --- */}
        <div className="mb-6 grid grid-cols-2 gap-3">
            <button onClick={handleExportTemplate} className="bg-sky-100 text-sky-700 p-3 rounded-xl font-bold text-sm hover:bg-sky-200 transition-all border-b-4 border-sky-200 active:border-0 active:translate-y-1">
              Export Template
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportQuestions}
              className="hidden"
              accept=".xlsx, .xls"
            />
            <button onClick={triggerFileInput} className="bg-purple-100 text-purple-700 p-3 rounded-xl font-bold text-sm hover:bg-purple-200 transition-all border-b-4 border-purple-200 active:border-0 active:translate-y-1">
              Import Questions
            </button>
        </div>
        {/* --- END: Import/Export Buttons --- */}

        <div className="grid grid-cols-1 gap-4">
          {questions.map((q) => (
            <button
              key={q.id}
              onClick={() => handleSelectQuestion(q.id)}
              className={`
                p-4 rounded-2xl border-b-4 transition-all active:mt-1 active:border-b-0
                ${selectedQuestionId === q.id 
                  ? 'bg-emerald-500 border-emerald-700 text-white shadow-lg' 
                  : 'bg-white/60 border-emerald-100 hover:bg-emerald-50 text-emerald-900'}
                ${answers[q.id] ? 'ring-2 ring-yellow-400 border-yellow-500' : ''}
                relative overflow-hidden
              `}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${selectedQuestionId === q.id ? 'bg-white text-emerald-500' : 'bg-emerald-100 text-emerald-600'}`}>
                  {q.id}
                </span>
                <span className="font-bold uppercase tracking-tight">Mission</span>
                {answers[q.id] && <span className="absolute right-2 top-2 animate-bounce">🌻</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Middle Content: Main Interaction */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {selectedQuestion ? (
          <div className="w-full max-w-xl animate-pop-in">
            <div className={`bg-white/90 backdrop-blur-lg p-10 rounded-[40px] shadow-2xl border-t-8 border-yellow-400 transition-transform ${shakeInput ? 'animate-shake' : ''}`}>
              <div className="mb-8 text-center">
                <span className="bg-sky-100 text-sky-700 px-4 py-1 rounded-full font-bold text-sm tracking-wider uppercase border border-sky-200">
                  Step {selectedQuestion.id} / {questions.length}
                </span>
                <h2 className="text-3xl font-bold mt-6 text-slate-800 leading-snug drop-shadow-sm">
                   {selectedQuestion.question}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full bg-sky-50/50 border-4 border-sky-100 p-6 rounded-3xl text-2xl text-center font-black text-emerald-600 focus:border-yellow-400 focus:bg-white focus:outline-none transition-all placeholder:text-slate-300 uppercase tracking-[0.2em]"
                  placeholder="ANSWER HERE..."
                  autoFocus
                  disabled={!!answers[selectedQuestion.id]}
                />
                
                <div className="flex flex-col gap-4">
                  {!answers[selectedQuestion.id] ? (
                    <div className="flex gap-4">
                      <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-black py-5 rounded-2xl transition-all shadow-[0_6px_0_rgb(5,150,105)] active:shadow-none active:translate-y-1 text-xl">
                        GO! 🚀
                      </button>
                      <button type="button" onClick={handleShowAnswer} className="px-8 bg-amber-100 hover:bg-amber-200 text-amber-600 font-bold py-5 rounded-2xl transition-all border-b-4 border-amber-300 active:border-0 active:translate-y-1">
                        Hint 💡
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleNext} 
                      className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-5 rounded-2xl transition-all shadow-[0_6px_0_rgb(14,165,233)] active:shadow-none active:translate-y-1 text-xl flex items-center justify-center gap-3 animate-pop-in"
                    >
                      EXCELLENT! NEXT ONE ✨ <span>→</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="text-center bg-white/80 p-10 rounded-3xl shadow-lg">
            <h3 className="text-2xl font-bold text-slate-700">Welcome!</h3>
            <p className="mt-2 text-slate-500">Please import a questions file to start the game.</p>
          </div>
        )}
      </div>

      {/* Right Vertical: The Word Builder */}
      <div className="w-1/3 bg-white/80 backdrop-blur-md p-8 rounded-[32px] shadow-2xl border-4 border-white/50 flex flex-col items-center overflow-y-auto z-10">
        <h2 className="text-xl font-black mb-8 text-emerald-700 uppercase tracking-widest border-b-4 border-yellow-200 pb-2 flex items-center gap-2">
          <span>☀️</span> NATURE KEY
        </h2>
        <div className="flex flex-col gap-2 w-full">
          {questions.map((q) => {
            const isCorrect = !!answers[q.id];
            const char = q.answer[q.key - 1];
            const shouldAnimate = lastCorrectId === q.id;

            return (
              <div key={`grid-${q.id}`} className="grid grid-cols-[1fr_60px_1fr] items-center gap-2 w-full">
                <span className={`text-right font-bold text-lg transition-all duration-700 ${isCorrect ? 'text-emerald-600' : 'text-transparent'}`}>
                  {q.answer.slice(0, q.key - 1)}
                </span>

                <div
                  className={`
                    w-14 h-14 flex items-center justify-center 
                    border-4 rounded-2xl transition-all transform shadow-md
                    ${isCorrect 
                      ? 'border-yellow-400 bg-yellow-50 text-amber-600 scale-105 rotate-0 shadow-yellow-200' 
                      : 'border-white bg-white/40 text-emerald-200 -rotate-3'}
                    text-3xl font-black
                  `}
                >
                  <span className={shouldAnimate ? 'animate-char-appear' : ''}>
                    {isCorrect ? char : '?'}
                  </span>
                </div>

                <span className={`text-left font-bold text-lg transition-all duration-700 ${isCorrect ? 'text-emerald-600' : 'text-transparent'}`}>
                  {q.answer.slice(q.key)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}