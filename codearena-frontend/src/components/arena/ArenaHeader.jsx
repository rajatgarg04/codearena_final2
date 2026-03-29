import React, { useState } from 'react';

// 👇 Catch the voiceChatNode and activeTeammates props!
export default function ArenaHeader({ problem, roomId, language, setLanguage, isDisqualified, formatTime, timeLeft, activeView, setActiveView, teamName, myScore, mode, playerName, voiceChatNode, activeTeammates = [] }) {
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const displayName = mode === 'team' ? teamName : playerName;

    return (
        <div className="h-16 bg-[#181825] border-b border-gray-800 flex items-center justify-between px-4 md:px-6 shadow-md shrink-0 z-50 relative">
            
            <div className="flex items-center gap-4 md:gap-6 w-1/3">
                <div className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tighter shrink-0">
                    {`{ }`} CodeArena
                </div>
                
                <div className="hidden lg:flex flex-col items-center justify-center px-6 py-1 bg-[#1e1e2e] rounded-xl border border-gray-700 shadow-[0_0_15px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                    <div className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity ${myScore < 500 ? 'bg-red-500' : myScore < 800 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5 z-10">Live Score</span>
                    <span className={`font-black font-mono text-2xl leading-none z-10 drop-shadow-md ${myScore < 500 ? 'text-red-400 animate-pulse' : myScore < 800 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {myScore} <span className="text-xs text-gray-500">PTS</span>
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-2 bg-[#1e1e2e] rounded-lg p-1 border border-gray-700 shrink-0">
                    <button onClick={() => setActiveView('code')} className={`px-4 py-1.5 rounded text-sm font-bold transition ${activeView === 'code' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' : 'text-gray-500 hover:text-gray-300'}`}>💻 Code</button>
                    <button onClick={() => setActiveView('whiteboard')} className={`px-4 py-1.5 rounded text-sm font-bold transition flex items-center gap-2 ${activeView === 'whiteboard' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/50' : 'text-gray-500 hover:text-gray-300'}`}>🎨 Board</button>
                </div>
            </div>

            <div className={`absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border-[6px] bg-[#1e1e2e] shadow-[0_0_30px_rgba(0,0,0,0.5)] z-20 transition-all ${timeLeft <= 60 && !isDisqualified ? 'border-red-500 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'border-purple-600'}`}>
                <span className={`text-lg md:text-xl font-black font-mono tracking-widest ${timeLeft <= 60 ? 'text-red-400' : 'text-white'}`}>
                    {isDisqualified ? '00:00' : formatTime(timeLeft)}
                </span>
            </div>

            <div className="flex items-center justify-end gap-3 md:gap-4 w-1/3">
                
                {voiceChatNode && (
                    <div className="mr-2">
                        {voiceChatNode}
                    </div>
                )}

                <div className="hidden xl:flex items-center gap-2 bg-[#1e1e2e] rounded-lg px-3 py-1.5 border border-gray-700 text-sm">
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Room:</span>
                    <span className="text-gray-300 font-mono tracking-wider">{roomId}</span>
                </div>

                <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isDisqualified}
                    className="bg-[#1e1e2e] border border-gray-700 text-white text-xs md:text-sm font-bold rounded-lg px-3 py-1.5 md:px-4 md:py-2 outline-none focus:border-purple-500 transition cursor-pointer disabled:opacity-50"
                >
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                </select>

                <div className="relative">
                    <button 
                        onClick={() => mode === 'team' && setIsDropdownOpen(!isDropdownOpen)}
                        className={`flex items-center gap-3 pl-3 md:pl-4 border-l border-gray-700 shrink-0 transition-all ${mode === 'team' ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-lg">
                            {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-xs font-bold text-gray-200 truncate max-w-[100px]">{displayName || 'Player'}</p>
                            <p className="text-[9px] text-green-400 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Online
                            </p>
                        </div>
                        {mode === 'team' && (
                            <span className="text-gray-500 text-xs ml-1 transition-transform">{isDropdownOpen ? '▲' : '▼'}</span>
                        )}
                    </button>

                    {mode === 'team' && isDropdownOpen && (
                        <div className="absolute top-full right-0 mt-4 w-56 bg-[#1e1e2e] border border-gray-700 rounded-xl shadow-2xl py-2 z-[100] animate-fadeIn">
                            <div className="px-4 py-2 border-b border-gray-800 mb-2">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Squad Members</p>
                            </div>
                            
                            {/* 👇 FIX: We use activeTeammates to render the list dynamically! */}
                            <ul className="space-y-1 px-2">
                                {activeTeammates && activeTeammates.length > 0 ? (
                                    activeTeammates.map((teammateName, idx) => (
                                        <li key={idx} className="flex items-center justify-between px-3 py-2 bg-[#181825] rounded-lg border border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                                <span className={`text-xs font-bold ${teammateName === playerName ? 'text-purple-400' : 'text-gray-300'}`}>
                                                    {teammateName} {teammateName === playerName && '(You)'}
                                                </span>
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <li className="px-3 py-3 text-[10px] text-gray-500 italic text-center">Loading players...</li>
                                )}
                            </ul>

                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}