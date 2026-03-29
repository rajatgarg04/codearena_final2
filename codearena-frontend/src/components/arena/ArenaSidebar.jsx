import React, { useState, useEffect } from 'react'; 
import axios from 'axios';

export default function ArenaSidebar({ 
    problem, code, language, leaderboard, isDisqualified, roomId, playerName,
    entityName, fireGlobalNotification, refreshLeaderboard, liveScore, timeLeft,
    totalTime 
}) {
    const [activeTab, setActiveTab] = useState('problem'); 
    const [aiInput, setAiInput] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    
    const storageKey = `ai_tutor_${roomId}_${playerName}`;
    const savedData = JSON.parse(localStorage.getItem(storageKey)) || {};
    
    const [aiCost, setAiCost] = useState(savedData.aiCost || 5);
    const [chatHistory, setChatHistory] = useState(savedData.chatHistory || [
        { sender: 'ai', text: `Hi! I'm your AI Tutor. Ask me for a hint! (Cost: ${savedData.aiCost || 5} pts)` }
    ]);

    useEffect(() => {
        if (roomId && playerName) {
            localStorage.setItem(storageKey, JSON.stringify({ aiCost, chatHistory }));
        }
    }, [aiCost, chatHistory, roomId, playerName]);

    const dynamicLeaderboard = [...leaderboard].map(entry => {
        const timeElapsed = Math.max(0, totalTime - (timeLeft || 0));
        const timePenalty = Math.floor((100 / totalTime) * timeElapsed);
        
        const currentScore = entry.completed 
            ? entry.score 
            : Math.max(0, entry.score - timePenalty);
            
        return { ...entry, currentScore };
    }).sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? -1 : 1; 
        }
        return b.currentScore - a.currentScore;
    });

    const rankedLeaderboard = dynamicLeaderboard.map((entry, index, arr) => {
        if (index === 0) return { ...entry, rank: 1 };
        const prev = arr[index - 1];
        
        const isTie = entry.completed === prev.completed && entry.currentScore === prev.currentScore;
        const rank = isTie ? prev.rank : index + 1;
        return { ...entry, rank };
    });

    const askAI = async () => {
        if (!aiInput.trim() || isDisqualified || isAiLoading || liveScore < aiCost) return;
        
        const userText = aiInput;
        setAiInput(''); 
        setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
        setIsAiLoading(true);

        try {
            await axios.post('https://codearena-backend-5tet.onrender.com/api/submit/apply-penalty', {
                roomId: roomId, playerName: entityName, penaltyAmount: aiCost
            });

            if (fireGlobalNotification) {
                fireGlobalNotification(`🤖 ${playerName} used the AI Tutor! (-${aiCost} pts)`, 'warning');
            }
            if (refreshLeaderboard) refreshLeaderboard();

            const nextCost = aiCost === 5 ? 10 : aiCost === 10 ? 20 : aiCost === 20 ? 50 : 50;
            setAiCost(nextCost);

            const response = await axios.post('https://codearena-backend-5tet.onrender.com/api/ai/ask', {
                question: userText, code: code, language: language,
                problemTitle: problem?.title || "Unknown",
                problemDesc: problem?.description || "No description",
                roomId: roomId, playerName: playerName
            });
            
            setChatHistory(prev => [
                ...prev, 
                { sender: 'ai', text: response.data.reply },
                { sender: 'ai', text: `Next hint will cost ${nextCost} pts. Use wisely!` }
            ]);
        } catch (error) {
            setChatHistory(prev => [...prev, { sender: 'ai', text: "⚠️ Connection to AI failed." }]);
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="w-[350px] flex flex-col gap-4 h-full hidden md:flex shrink-0">
            <div className="bg-[#181825] border border-gray-700 rounded-xl shadow-lg flex-1 flex flex-col min-h-[300px] overflow-hidden">
                
                <div className="flex bg-[#1e1e2e] border-b border-gray-700 shrink-0">
                    <button onClick={() => setActiveTab('problem')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'problem' ? 'text-blue-400 border-b-2 border-blue-500 bg-[#181825]' : 'text-gray-500 hover:text-gray-300'}`}>📋 Problem</button>
                    <button onClick={() => setActiveTab('ai')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'ai' ? 'text-purple-400 border-b-2 border-purple-500 bg-[#181825]' : 'text-gray-500 hover:text-gray-300'}`}>🤖 AI Tutor</button>
                    <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'leaderboard' ? 'text-yellow-400 border-b-2 border-yellow-500 bg-[#181825]' : 'text-gray-500 hover:text-gray-300'}`}>🏆 Board</button>
                </div>

                {activeTab === 'problem' && (
                    <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                        {!problem ? (
                            <div className="animate-pulse space-y-3">
                                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-700 rounded w-full"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-xl font-bold text-gray-100">{problem.title}</h2>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-300`}>{problem.difficulty}</span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{problem.description}</p>
                                
                                <div className="mt-6 space-y-3">
                                    <h3 className="text-xs text-gray-400 font-bold uppercase tracking-widest">Example Cases</h3>
                                    <div className="bg-black/50 p-3 rounded-lg border border-gray-800">
                                        <p className="text-xs text-gray-500 mb-1">Input:</p>
                                        <pre className="text-sm text-gray-300 font-mono mb-2 overflow-x-auto">
                                            {problem.exampleInput || problem.example_input || "No example input provided in DB."}
                                        </pre>
                                        <p className="text-xs text-gray-500 mb-1">Expected Output:</p>
                                        <pre className="text-sm text-green-400 font-mono overflow-x-auto">
                                            {problem.exampleOutput || problem.example_output || "No example output provided in DB."}
                                        </pre>
                                    </div>
                                </div>

                                {/* 👇 FIX: Constraints section will now ALWAYS be visible! */}
                                <div className="mt-6 space-y-2">
                                    <h3 className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <span>⚠️</span> Constraints
                                    </h3>
                                    <div className="bg-[#181825] p-3 rounded-lg border border-gray-700 shadow-inner">
                                        <ul className="list-disc list-inside text-sm text-yellow-500/90 font-mono space-y-1">
                                            {problem.constraints || problem.constraint ? (
                                                (problem.constraints || problem.constraint).split('\n').map((line, i) => (
                                                    line.trim() && <li key={i}>{line}</li>
                                                ))
                                            ) : (
                                                <li className="text-gray-500 italic list-none">No constraints provided in Database.</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="flex-1 flex flex-col p-4 overflow-hidden">
                        <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-2 custom-scrollbar">
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`p-2.5 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 ml-auto w-10/12' : 'bg-[#1e1e2e] text-gray-300 border border-gray-700 mr-auto w-11/12'}`}>
                                    <span className="font-bold opacity-40 block text-[10px] mb-1 uppercase tracking-wider">{msg.sender === 'user' ? 'You' : 'AI Assistant'}</span>
                                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{msg.text}</pre>
                                </div>
                            ))}
                            {isAiLoading && <div className="text-gray-500 text-xs italic animate-pulse p-2">AI is analyzing...</div>}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                            {liveScore < aiCost && <p className="text-red-400 text-[10px] font-bold text-center uppercase tracking-widest animate-pulse">Insufficient Points for AI</p>}
                            <div className="flex gap-2">
                                <input 
                                    type="text" value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()}
                                    placeholder="Ask for a hint..." disabled={isDisqualified || isAiLoading || liveScore < aiCost}
                                    className="flex-1 bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500 transition disabled:opacity-50"
                                />
                                <button 
                                    onClick={askAI} disabled={isDisqualified || isAiLoading || !aiInput.trim() || liveScore < aiCost}
                                    className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shrink-0 disabled:opacity-50"
                                >
                                    Send ({aiCost})
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        {rankedLeaderboard.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500"><p className="text-xs italic">Awaiting submissions...</p></div>
                        ) : (
                            <ul className="space-y-2">
                                {rankedLeaderboard.map((entry, index) => (
                                    <li key={index} className="flex justify-between items-center text-sm p-3 rounded-lg bg-[#1e1e2e] border border-gray-800 transition-all">
                                        <span className="flex items-center gap-3">
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full font-bold text-xs ${entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-800 text-gray-500'}`}>
                                                {entry.rank}
                                            </span>
                                            <span className="text-gray-200 font-semibold truncate max-w-[120px]">
                                                {entry.playerName} {entry.completed && '✅'}
                                            </span>
                                        </span>
                                        <span className={`font-mono font-bold ${entry.completed ? 'text-green-400' : 'text-gray-400'}`}>
                                            {entry.currentScore} pts
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}