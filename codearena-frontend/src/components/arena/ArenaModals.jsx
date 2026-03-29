import React from 'react';

export default function ArenaModals({ 
    isGameOver, leaderboard, navigate, notifications = [] 
}) {

    const finalLeaderboard = [...leaderboard].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? -1 : 1;
        return b.score - a.score;
    });

    return (
        <>
            {/* 1. THE LIVE KILLFEED (Esports Ticker) */}
            <div className="fixed top-20 right-6 z-[90] flex flex-col gap-2 w-72 pointer-events-none">
                {notifications.map(notif => (
                    <div 
                        key={notif.id} 
                        className={`p-3 rounded-lg shadow-2xl border text-sm font-bold flex items-center gap-3 transform transition-all duration-500 animate-slide-in ${
                            notif.type === 'penalty' ? 'bg-red-950/90 border-red-500 text-red-200' :
                            notif.type === 'success' ? 'bg-green-950/90 border-green-500 text-green-200' :
                            notif.type === 'warning' ? 'bg-yellow-950/90 border-yellow-500 text-yellow-200' :
                            'bg-[#1e1e2e]/90 border-gray-600 text-gray-200'
                        }`}
                    >
                        <span className="text-xl">
                            {notif.type === 'penalty' ? '🚨' : notif.type === 'success' ? '🏆' : '⚠️'}
                        </span>
                        <p className="leading-tight">{notif.text}</p>
                    </div>
                ))}
            </div>

            {/* 2. FINAL GAME OVER / PODIUM MODAL */}
            {isGameOver && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md pointer-events-auto">
                    <div className="bg-[#181825] border-2 border-purple-500 rounded-3xl p-8 w-full max-w-2xl text-center shadow-[0_0_80px_rgba(147,51,234,0.3)]">
                        <div className="text-7xl mb-4">🏆</div>
                        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2 tracking-tighter">
                            MATCH OVER
                        </h2>
                        <p className="text-gray-400 text-sm mb-8 font-bold uppercase tracking-widest">Final Standings</p>

                        <div className="bg-[#1e1e2e] rounded-2xl p-4 mb-8 border border-gray-800 shadow-inner max-h-[40vh] overflow-y-auto custom-scrollbar">
                            {leaderboard.length === 0 ? (
                                <div className="py-8 text-gray-500 italic text-sm">No one submitted a passing solution!</div>
                            ) : (
                                <ul className="space-y-3">
                                    {finalLeaderboard.map((player, idx) => (
                                        <li key={idx} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${idx === 0 ? 'bg-gradient-to-r from-purple-900/40 to-[#1e1e2e] border-purple-500/50 transform scale-[1.02]' : 'bg-[#181825] border-gray-800'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="text-left">
                                                    <span className={`block font-bold text-lg ${idx === 0 ? 'text-white' : 'text-gray-300'}`}>
                                                        {player.playerName}
                                                    </span>
                                                    {idx === 0 && <span className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">Arena Champion</span>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`block text-3xl font-black ${idx === 0 ? 'text-green-400' : 'text-gray-300'}`}>{player.score}</span>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Points</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button onClick={() => navigate('/')} className="bg-white hover:bg-gray-200 text-black px-12 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition shadow-xl w-full">
                            Return to Headquarters
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}