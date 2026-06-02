import Link from "next/link";

export default function Home() {
  return (
    <div 
      className="flex flex-col flex-1 items-center justify-center min-h-screen font-sans bg-cover bg-center"
      style={{ backgroundImage: "url('/images/bg_crossword.jpg')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-white/10" />

      <main className="z-10 flex flex-col items-center justify-center gap-8 p-8 bg-white/80 backdrop-blur-md rounded-[32px] shadow-2xl border-4 border-white/50">
        <h1 className="text-4xl font-black text-emerald-700 tracking-wider">
          Moli Teaching Games 🌈
        </h1>
        <div className="flex gap-6">
          <Link 
            href="/game/crossword" 
            className="px-10 py-5 text-xl font-black text-white bg-sky-500 rounded-2xl shadow-[0_6px_0_rgb(14,165,233)] hover:bg-sky-400 transition-all active:shadow-none active:translate-y-1"
          >
            Crossword
          </Link>
          <Link 
            href="/audioloop" 
            className="px-10 py-5 text-xl font-black text-white bg-purple-500 rounded-2xl shadow-[0_6px_0_rgb(168,85,247)] hover:bg-purple-400 transition-all active:shadow-none active:translate-y-1"
          >
            Audioloop
          </Link>
          <Link 
            href="/game/flashcard" 
            className="px-10 py-5 text-xl font-black text-white bg-emerald-500 rounded-2xl shadow-[0_6px_0_rgb(16,185,129)] hover:bg-emerald-400 transition-all active:shadow-none active:translate-y-1"
          >
            Flashcards
          </Link>
          <Link 
            href="/game/definition" 
            className="px-10 py-5 text-xl font-black text-white bg-amber-500 rounded-2xl shadow-[0_6px_0_rgb(245,158,11)] hover:bg-amber-400 transition-all active:shadow-none active:translate-y-1"
          >
            Definition
          </Link>
          <Link 
            href="/game/random-word" 
            className="px-10 py-5 text-xl font-black text-white bg-pink-500 rounded-2xl shadow-[0_6px_0_rgb(236,72,153)] hover:bg-pink-400 transition-all active:shadow-none active:translate-y-1"
          >
            Random Word
          </Link>
        </div>
      </main>
    </div>
  );
}
