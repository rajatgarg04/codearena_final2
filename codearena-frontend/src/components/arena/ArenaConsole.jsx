import React, { useState } from 'react';

// 👇 FIX: Receive customInput and setCustomInput as props!
export default function ArenaConsole({ output, runCode, submitSolution, isDisqualified, customInput, setCustomInput }) {
    const [activeTab, setActiveTab] = useState('output'); 

    return (
        // 👇 FIX: Changed h-48 to h-full so it perfectly fills the draggable resize box!
        <div className="h-full bg-[#181825] flex flex-col">
            
            {/* TERMINAL HEADER & TABS */}
            <div className="flex justify-between items-end px-4 pt-3 border-b border-gray-800 bg-[#1e1e2e] shrink-0">
                <div className="flex gap-4">
                    <button 
                        onClick={() => setActiveTab('output')}
                        className={`pb-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'output' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Terminal Output
                    </button>
                    <button 
                        onClick={() => setActiveTab('input')}
                        className={`pb-2 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'input' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Custom Input
                    </button>
                </div>

                <div className="flex gap-3 pb-2">
                    <button 
                        onClick={runCode}
                        disabled={isDisqualified}
                        className="bg-[#2a2a3c] hover:bg-[#3a3a4c] border border-gray-600 disabled:opacity-50 text-gray-200 px-5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2"
                    >
                        ▶ Run Code
                    </button>
                    <button 
                        onClick={submitSolution}
                        disabled={isDisqualified}
                        className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 disabled:opacity-50 text-white px-5 py-1.5 rounded-lg text-xs font-bold transition shadow-[0_0_15px_rgba(20,184,166,0.2)] flex items-center gap-2"
                    >
                        ☁ Submit Solution
                    </button>
                </div>
            </div>

            {/* TERMINAL CONTENT AREA */}
            <div className="flex-1 p-4 overflow-hidden bg-[#11111b]">
                {activeTab === 'output' ? (
                    <div className="h-full bg-black/50 border border-gray-800 rounded-lg p-3 font-mono text-sm overflow-y-auto custom-scrollbar text-gray-300 shadow-inner">
                        {!output || output === 'Console: Ready' ? (
                            <span className="text-gray-600 italic">Waiting for execution...</span>
                        ) : (
                            <pre className="whitespace-pre-wrap leading-relaxed">
                                {/* 👇 NEW: Auto-colorizer! Turns ✅ green and ❌ red dynamically! */}
                                {output.split('\n').map((line, i) => (
                                    <div key={i} className={`${line.includes('✅') ? 'text-green-400 font-bold' : line.includes('❌') ? 'text-red-400 font-bold' : line.includes('Expected') || line.includes('Got') ? 'text-yellow-300' : 'text-gray-300'}`}>
                                        {line}
                                    </div>
                                ))}
                            </pre>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col gap-2 animate-fadeIn">
                        <label className="text-xs text-gray-500 uppercase font-bold tracking-widest flex items-center gap-2">
                            Provide Custom Standard Input (stdin)
                            <span className="bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded text-[9px]">Beta</span>
                        </label>
                        <textarea 
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            placeholder="e.g., if the problem asks for N followed by N integers:\n3\n1 5 9"
                            disabled={isDisqualified}
                            className="flex-1 bg-black/50 border border-gray-800 rounded-lg p-3 font-mono text-sm text-gray-300 resize-none outline-none focus:border-purple-500 transition custom-scrollbar"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}