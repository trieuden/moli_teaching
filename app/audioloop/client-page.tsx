'use client';

import { useState, useEffect, useRef } from 'react';
import { FaPlus, FaPlay, FaPause, FaCopy, FaTrash } from 'react-icons/fa';

interface Loop {
    id: number,
    name: string,
    startTime: number,
    endTime: number,
    repeat: number,
}
// Helper to format milliseconds to an object { m, s, ms }
const formatMsToTimeParts = (totalMs: number) => {
  if (isNaN(totalMs) || totalMs < 0) return { m: 0, s: 0, ms: 0 };
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;
  return { m: minutes, s: seconds, ms: milliseconds };
};

export default function AudioLoopClientPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loops, setLoops] = useState<Loop[]>([]);
  const [currentLoop, setCurrentLoop] = useState<Loop | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopCounter, setLoopCounter] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1); // State for playback rate
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load loops from local storage when audio file changes
  useEffect(() => {
    if (audioFile) {
      const storedLoops = localStorage.getItem(`loops_${audioFile.name}`);
      if (storedLoops) {
        setLoops(JSON.parse(storedLoops));
      } else {
        setLoops([]);
      }
    }
  }, [audioFile]);

  // Save loops to local storage whenever they change
  useEffect(() => {
    if (audioFile && loops.length > 0) {
      localStorage.setItem(`loops_${audioFile.name}`, JSON.stringify(loops));
    } else if (audioFile) {
        localStorage.removeItem(`loops_${audioFile.name}`);
    }
  }, [loops, audioFile]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentLoop) return;

    const handleTimeUpdate = () => {
      // Convert ms to seconds for comparison with audio.currentTime
      if (audio.currentTime * 1000 >= currentLoop.endTime) {
        if (loopCounter < currentLoop.repeat - 1) {
          setLoopCounter(prev => prev + 1);
          audio.currentTime = currentLoop.startTime / 1000;
          audio.play();
        } else {
          audio.pause();
          setIsPlaying(false);
          setCurrentLoop(null);
          setLoopCounter(0);
        }
      }
    };

    if (isPlaying) {
      audio.addEventListener('timeupdate', handleTimeUpdate);
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isPlaying, currentLoop, loopCounter]);

  // Effect to update audio playback rate
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate, audioSrc]); // Re-apply when audio source changes

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
    }
  };

  const addLoop = () => {
    const newLoop: Loop = {
      id: Date.now(),
      name: `Loop #${loops.length + 1}`,
      startTime: 0,
      endTime: 5000, // 5 seconds in ms
      repeat: 3,
    };
    setLoops([...loops, newLoop]);
  };

  const updateLoop = (id: number, updatedLoop: Partial<Loop>) => {
    setLoops(loops.map(loop => (loop.id === id ? { ...loop, ...updatedLoop } : loop)));
  };

  const handleTimeChange = (id: number, field: 'startTime' | 'endTime', part: 'm' | 's' | 'ms', value: number) => {
    const loop = loops.find(l => l.id === id);
    if (!loop) return;

    const currentTimeParts = formatMsToTimeParts(loop[field]);
    currentTimeParts[part] = value;

    const newTotalMs = (currentTimeParts.m * 60000) + (currentTimeParts.s * 1000) + currentTimeParts.ms;
    updateLoop(id, { [field]: newTotalMs });
  };

  const duplicateLoop = (id: number) => {
    const loopToDuplicate = loops.find(loop => loop.id === id);
    if (loopToDuplicate) {
      const newLoop = { ...loopToDuplicate, id: Date.now(), name: `${loopToDuplicate.name} (Copy)` };
      setLoops([...loops, newLoop]);
    }
  };

  const removeLoop = (id: number) => {
    setLoops(loops.filter(loop => loop.id !== id));
    if (audioFile && loops.length === 1) {
        localStorage.removeItem(`loops_${audioFile.name}`);
    }
  };

  const playLoop = (loop: Loop) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentLoop?.id === loop.id && isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setCurrentLoop(null);
    } else {
      setCurrentLoop(loop);
      setLoopCounter(0);
      audio.currentTime = loop.startTime / 1000; // Convert ms to seconds
      audio.play();
      setIsPlaying(true);
    }
  };

  return (
    <div 
      className="flex flex-col items-center min-h-screen p-8 font-sans bg-cover bg-center text-slate-800"
      style={{ backgroundImage: "url('/images/bg_crossword.jpg')" }}
    >
      <div className="absolute inset-0 bg-white/20" />
      
      <div className="w-full max-w-7xl z-10">
        <div className="p-8 bg-white/80 backdrop-blur-md rounded-[32px] shadow-2xl border-4 border-white/50">
          <h1 className="text-4xl font-black text-emerald-700 tracking-wider text-center mb-6">
            Audio Looper 🎧
          </h1>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column (30%) */}
            <div className="w-full md:w-3/10 flex flex-col gap-6">
              <div className="p-6 bg-white/50 rounded-2xl">
                <div className="text-center">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-4 text-lg font-bold text-white bg-purple-500 rounded-2xl shadow-[0_6px_0_rgb(168,85,247)] hover:bg-purple-400 transition-all active:shadow-none active:translate-y-1"
                  >
                    {audioSrc ? 'Change Audio' : 'Import Audio'}
                  </button>
                  {audioFile && <p className="text-slate-600 font-bold mt-4">Now playing: {audioFile.name}</p>}
                </div>
              </div>

              {audioSrc && (
                <>
                  <div className="p-4 bg-white/50 rounded-2xl">
                    <audio ref={audioRef} src={audioSrc} controls className="w-full" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
                  </div>

                  {/* Playback Rate Slider */}
                  <div className="p-4 bg-white/50 rounded-2xl flex items-center gap-4">
                    <label htmlFor="playbackRate" className="font-bold text-slate-600">Speed:</label>
                    <input
                      id="playbackRate"
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={playbackRate}
                      onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-sky-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="font-black text-emerald-600 w-16 text-center bg-white/70 p-2 rounded-lg">{playbackRate.toFixed(1)}x</span>
                  </div>
                </>
              )}
            </div>

            {/* Right Column (70%) */}
            <div className="w-full md:w-7/10">
              <div className="flex justify-center mb-6">
                <button 
                  onClick={addLoop}
                  disabled={!audioSrc}
                  className="flex items-center gap-3 px-6 py-3 font-bold text-white bg-sky-500 rounded-xl shadow-[0_5px_0_rgb(14,165,233)] hover:bg-sky-400 transition-all active:shadow-none active:translate-y-1 disabled:bg-slate-400 disabled:shadow-none"
                >
                  <FaPlus /> Add New Loop
                </button>
              </div>

              <div className="space-y-4">
                {loops.map((loop) => {
                  const startTimeParts = formatMsToTimeParts(loop.startTime);
                  const endTimeParts = formatMsToTimeParts(loop.endTime);

                  return (
                  <div key={loop.id} className="bg-white/60 p-4 rounded-2xl shadow-md flex flex-col gap-4 animate-pop-in">
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                      {/* Loop Name */}
                      <div className="w-full">
                        <label className="block text-sm font-bold text-slate-600">Loop Name</label>
                        <input
                          type="text"
                          value={loop.name}
                          onChange={(e) => updateLoop(loop.id, { name: e.target.value })}
                          className="w-full p-2 mt-1 font-bold border-2 border-slate-200 rounded-lg focus:border-yellow-400 focus:outline-none"
                        />
                      </div>

                      {/* Start Time Inputs */}
                      <div>
                        <label className="block text-sm font-bold text-slate-600">Start Time</label>
                        <div className="flex items-center gap-1 mt-1">
                          <input type="number" placeholder="m" value={startTimeParts.m} onChange={e => handleTimeChange(loop.id, 'startTime', 'm', parseInt(e.target.value) || 0)} className="w-1/3 p-2 font-bold border-2 border-slate-200 rounded-lg focus:border-yellow-400 focus:outline-none text-center" />
                          <span className="font-bold">:</span>
                          <input type="number" placeholder="s" value={startTimeParts.s} onChange={e => handleTimeChange(loop.id, 'startTime', 's', parseInt(e.target.value) || 0)} className="w-1/3 p-2 font-bold border-2 border-slate-200 rounded-lg focus:border-yellow-400 focus:outline-none text-center" />
                          <span className="font-bold">:</span>
                          <input type="number" placeholder="ms" value={startTimeParts.ms} onChange={e => handleTimeChange(loop.id, 'startTime', 'ms', parseInt(e.target.value) || 0)} className="w-1/3 p-2 font-bold border-2 border-slate-200 rounded-lg focus:border-yellow-400 focus:outline-none text-center" />
                        </div>
                      </div>

                      {/* End Time Inputs */}
                      <div>
                        <label className="block text-sm font-bold text-slate-600">End Time</label>
                        <div className="flex items-center gap-1 mt-1">
                          <input type="number" placeholder="m" value={endTimeParts.m} onChange={e => handleTimeChange(loop.id, 'endTime', 'm', parseInt(e.target.value) || 0)} className="w-1/3 p-2 font-bold border-2 border-slate-200 rounded-lg focus:border-yellow-400 focus:outline-none text-center" />
                          <span className="font-bold">:</span>
                          <input type="number" placeholder="s" value={endTimeParts.s} onChange={e => handleTimeChange(loop.id, 'endTime', 's', parseInt(e.target.value) || 0)} className="w-1/3 p-2 font-bold border-2 border-slate-200 rounded-lg focus:border-yellow-400 focus:outline-none text-center" />
                          <span className="font-bold">:</span>
                          <input type="number" placeholder="ms" value={endTimeParts.ms} onChange={e => handleTimeChange(loop.id, 'endTime', 'ms', parseInt(e.target.value) || 0)} className="w-1/3 p-2 font-bold border-2 border-slate-200 rounded-lg focus:border-yellow-400 focus:outline-none text-center" />
                        </div>
                      </div>
                      
                      {/* Repeat Input */}
                      <div className="w-full">
                        <label className="block text-sm font-bold text-slate-600">Repeat</label>
                        <input
                          type="number"
                          value={loop.repeat}
                          min="1"
                          onChange={(e) => updateLoop(loop.id, { repeat: parseInt(e.target.value, 10) || 1 })}
                          className="w-full p-2 mt-1 font-bold border-2 border-slate-200 rounded-lg focus:border-yellow-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex self-center items-center gap-2">
                      <button onClick={() => playLoop(loop)} className={`p-4 rounded-full transition-all text-white ${isPlaying && currentLoop?.id === loop.id ? 'bg-red-500' : 'bg-emerald-500'}`}>
                        {isPlaying && currentLoop?.id === loop.id ? <FaPause /> : <FaPlay />}
                      </button>
                      <button onClick={() => duplicateLoop(loop.id)} className="p-4 bg-sky-100 text-sky-600 rounded-full hover:bg-sky-200 transition-all">
                        <FaCopy />
                      </button>
                      <button onClick={() => removeLoop(loop.id)} className="p-4 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-all">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
