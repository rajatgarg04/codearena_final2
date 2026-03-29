import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';

// Custom Hooks
import { useArenaTimer } from '../hooks/useArenaTimer';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { useArenaWebSocket } from '../hooks/useArenaWebSocket';

// Components
import ArenaHeader from '../components/arena/ArenaHeader';
import ArenaSidebar from '../components/arena/ArenaSidebar';
import ArenaConsole from '../components/arena/ArenaConsole';
import ArenaModals from '../components/arena/ArenaModals';
import ArenaWhiteboard from '../components/arena/ArenaWhiteboard';
import VoiceChat from '../components/VoiceChat';

const BOILERPLATES = {
    java: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n        // Read your inputs here\n        // int a = sc.nextInt();\n        \n        // Print your final output\n        // System.out.println(result);\n    }\n}',
    python: 'import sys\n\ndef solve():\n    # Read input from standard input\n    # input_data = sys.stdin.read().split()\n    \n    # Write your logic here\n    pass\n\nif __name__ == "__main__":\n    solve()',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Read your inputs here\n    // int a;\n    // cin >> a;\n    \n    // Print your final output\n    // cout << result << endl;\n    return 0;\n}'
};

export default function Arena() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    // --- 1. URL PARAMETERS & SETUP ---
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode') || 'solo';
    const endTime = parseInt(searchParams.get('endTime'), 10);
    const teamCode = searchParams.get('teamCode');
    const teamName = searchParams.get('teamName'); 
    const playerName = localStorage.getItem('playerName') || "Anonymous";

    const entityName = mode === 'team' ? teamName : playerName;

    // --- 2. STATE MANAGEMENT ---
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState(BOILERPLATES['python']);
    const [output, setOutput] = useState('Console: Ready');
    const [leaderboard, setLeaderboard] = useState([]);
    const [customInput, setCustomInput] = useState('5 7\n'); 
    const [notifications, setNotifications] = useState([]); 
    const [problem, setProblem] = useState(null); 
    const [isDisqualified, setIsDisqualified] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);
    const [activeView, setActiveView] = useState('code'); 
    const [incomingDrawData, setIncomingDrawData] = useState(null);
    const [mySessionId] = useState(() => Math.random().toString(36).substring(7));

    const [showExitModal, setShowExitModal] = useState(false);
    
    // 👇 NEW: State to hold the active teammates in the room
    const [activeTeammates, setActiveTeammates] = useState([]);

    const myStats = leaderboard.find(entry => entry.playerName === entityName);
    const backendScore = myStats ? myStats.score : 100;
    const isCompleted = myStats ? myStats.completed : false;

    const [liveScore, setLiveScore] = useState(backendScore);

    const langRef = useRef(language);
    useEffect(() => { langRef.current = language; }, [language]);

    const hasRegistered = useRef(false);
    const internalClipboard = useRef(""); 

    // --- 3. DATABASE FETCHING & LEADERBOARD INIT ---
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 👇 FIX: Changed wss:// to https://
                const roomRes = await axios.get(`https://codearena-backend-5tet.onrender.com/api/rooms/${roomId}`);
                if (roomRes.data.problemId) {
                    // 👇 FIX: Changed wss:// to https://
                    const probRes = await axios.get(`https://codearena-backend-5tet.onrender.com/api/problems/${roomRes.data.problemId}`);
                    const probData = probRes.data;
                    setProblem(probData);
                    
                    const defaultInput = probData.exampleInput || probData.example_input;
                    if (defaultInput) {
                        setCustomInput(defaultInput);
                    } else {
                        setCustomInput(''); 
                    }
                }
                
                // 👇 FIX: Changed wss:// to https://
                const boardRes = await axios.get(`https://codearena-backend-5tet.onrender.com/api/submit/leaderboard/${roomId}`);
                setLeaderboard(boardRes.data);

                // Fetch active teammates for the Presence Tracker!
                if (mode === 'team') {
                    try {
                        // 👇 FIX: Changed wss:// to https://
                        const playersRes = await axios.get(`https://codearena-backend-5tet.onrender.com/api/rooms/${roomId}/players`);
                        if (playersRes.data.success) {
                            setActiveTeammates(playersRes.data.players);
                        }
                    } catch (e) {
                        console.error("Failed to fetch teammates", e);
                    }
                }

                if (entityName && !hasRegistered.current) {
                    hasRegistered.current = true;
                    // 👇 FIX: Changed wss:// to https://
                    axios.post('https://codearena-backend-5tet.onrender.com/api/submit/apply-penalty', {
                        roomId: roomId,
                        playerName: entityName, 
                        penaltyAmount: 0
                    }).catch(e => console.error("Registration failed", e));
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        fetchInitialData();
    }, [roomId, entityName, mode]);

    // The Back Button & Refresh Trap
    useEffect(() => {
        window.history.pushState(null, null, window.location.href);

        const handlePopState = () => {
            setShowExitModal(true);
            window.history.pushState(null, null, window.location.href);
        };

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = ''; 
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // --- 4. HOOKS & WEBSOCKETS ---
    const addNotification = useCallback((text, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, text, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    }, []);

    const handleTimeUp = useCallback(() => {
        setIsDisqualified(true);
        setIsGameOver(true);
    }, []);
    const { timeLeft, formatTime } = useArenaTimer(endTime, handleTimeUp);

    const initialTimeRef = useRef(null);
    if (initialTimeRef.current === null && timeLeft > 0) {
        initialTimeRef.current = Math.ceil(timeLeft / 60) * 60; 
    }
    const totalTime = initialTimeRef.current || 600; 

    useEffect(() => {
        if (isCompleted) {
            setLiveScore(backendScore); 
            return;
        }
        if (timeLeft <= 0) {
            setLiveScore(0);
            return;
        }
        
        const timeElapsed = Math.max(0, totalTime - timeLeft);
        const timePenalty = Math.floor((100 / totalTime) * timeElapsed);
        const decayedScore = Math.max(0, backendScore - timePenalty);
        
        setLiveScore(decayedScore);
    }, [timeLeft, backendScore, isCompleted, totalTime]);

    const onCodeReceived = useCallback((data) => {
        setCode(data.content);
        if (langRef.current !== data.language) setLanguage(data.language);
    }, []);
    const onLeaderboardUpdate = useCallback((data) => setLeaderboard(data), []);
    const onWhiteboardUpdate = useCallback((data) => setIncomingDrawData(data), []);

    const { broadcastCode, broadcastWhiteboard, broadcastKillfeedEvent } = useArenaWebSocket({ 
        roomId, mode, teamCode, mySessionId, onCodeReceived, onLeaderboardUpdate, onWhiteboardUpdate,
        onNotificationReceived: addNotification 
    });

    const fireGlobalNotification = useCallback((text, type) => {
        addNotification(text, type);               
        if (broadcastKillfeedEvent) {
            broadcastKillfeedEvent(text, type);        
        }
    }, [addNotification, broadcastKillfeedEvent]);
    
    const refreshLeaderboard = useCallback(async () => {
        try {
            // 👇 FIX: Changed wss:// to https://
            const boardRes = await axios.get(`https://codearena-backend-5tet.onrender.com/api/submit/leaderboard/${roomId}`);
            setLeaderboard(boardRes.data);
        } catch (err) { console.error("Failed to refresh leaderboard"); }
    }, [roomId]);

    const { handlePasteCheat } = useAntiCheat(
        roomId, playerName, entityName, isDisqualified, fireGlobalNotification, refreshLeaderboard
    );

    // --- 5. EVENT HANDLERS ---
    const handleEditorDidMount = (editor, monaco) => {
        const container = editor.getDomNode();

        const saveInternalText = () => {
            const selection = editor.getSelection();
            const text = editor.getModel().getValueInRange(selection);
            if (text) {
                internalClipboard.current = text;
            }
        };

        container.addEventListener('copy', saveInternalText);
        container.addEventListener('cut', saveInternalText);

        container.addEventListener('paste', (e) => {
            const pastedText = (e.clipboardData || window.clipboardData).getData('text') || "";
            
            if (pastedText.length > 50) {
                const normalize = (str) => str.replace(/\s+/g, '');
                
                const internalClean = normalize(internalClipboard.current);
                const pastedClean = normalize(pastedText);

                if (internalClean !== pastedClean && !internalClean.includes(pastedClean)) {
                    handlePasteCheat(); 
                } else {
                    console.log("Allowed internal paste!");
                }
            }
        });
    };

    const handleEditorChange = (newCode) => {
        setCode(newCode);
        broadcastCode(newCode, langRef.current);
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        const newBoilerplate = BOILERPLATES[newLang];
        setCode(newBoilerplate);
        broadcastCode(newBoilerplate, newLang); 
    };

    const runCode = async () => {
        setOutput("Running code in Sandbox...");
        try {
            // 👇 FIX: Changed wss:// to https://
            const response = await axios.post('https://codearena-backend-5tet.onrender.com/api/execute', { 
                code, 
                language,
                input: customInput 
            });
            setOutput(response.data.output || "Program finished with no output.");
        } catch (error) {
            setOutput("Failed to connect to the execution engine.");
        }
    };

    const submitSolution = async () => {
        setOutput("Running tests against Hidden Cases...");
        try {
            // 👇 FIX: Changed wss:// to https://
            const response = await axios.post(`https://codearena-backend-5tet.onrender.com/api/submit/submit-code/${problem?.id || 1}`, {
                code, language, roomId, 
                playerName: entityName, 
                timeLeft: String(timeLeft) 
            });
            
            const data = response.data;
            
            if (!data.success) {
                fireGlobalNotification(`❌ ${playerName} submitted wrong code! (-10 pts)`, 'penalty');
            } else {
                fireGlobalNotification(`✅ ${playerName} passed all cases for ${entityName}!`, 'success');
            }

            refreshLeaderboard();

            let resultText = `STATUS: ${data.success ? '✅ ACCEPTED' : '❌ FAILED'}\n`;
            resultText += `Cases Passed: ${data.passedCount} / ${data.totalCases}\n\n`;
            data.results.forEach(res => {
                resultText += `Test Case ${res.testCase} (${res.isHidden ? 'Hidden' : 'Public'}): ${res.passed ? '✅ Pass' : '❌ Fail'}\n`;
                if (!res.passed && !res.isHidden) {
                    resultText += `   Expected: ${res.expected}\n   Got: ${res.actual}\n`; 
                }
            });
            setOutput(resultText);
        } catch (error) { setOutput("Failed to connect to the test case engine."); }
    };

    // --- 6. RENDER ---
    return (
        <div className="flex flex-col h-screen w-screen bg-[#1e1e2e] text-gray-200 overflow-hidden font-sans relative">
            
            {showExitModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#181825] border border-red-500/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.2)] text-center transform animate-fadeIn">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-black text-red-400 mb-2 uppercase tracking-wide">Are you sure?</h2>
                        <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                            Leaving now will disconnect you from the arena. Your progress may be lost and your squad will be left behind!
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button 
                                onClick={() => setShowExitModal(false)}
                                className="flex-1 py-3 bg-[#313244] hover:bg-gray-600 text-white rounded-xl font-bold transition"
                            >
                                Stay in Battle
                            </button>
                            <button 
                                onClick={() => navigate('/')}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition shadow-lg shadow-red-500/30"
                            >
                                Flee Contest
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ArenaHeader 
                problem={problem} 
                roomId={roomId} language={language} setLanguage={handleLanguageChange} 
                isDisqualified={isDisqualified} formatTime={formatTime} timeLeft={timeLeft} 
                activeView={activeView} setActiveView={setActiveView} 
                teamName={playerName}
                myScore={liveScore}
                mode={mode}
                playerName={playerName}
                activeTeammates={activeTeammates} 
                voiceChatNode={
                    mode === 'team' ? (
                        <VoiceChat roomId={roomId} teamCode={teamCode} mySessionId={mySessionId} />
                    ) : null
                }
            />

            <div className="flex flex-1 overflow-hidden pt-4 px-4 pb-4 gap-4">
                <div className="resize-x overflow-auto min-w-[300px] max-w-[50vw] flex flex-col pr-2 custom-scrollbar">
                    <ArenaSidebar 
                        problem={problem} code={code} language={language}
                        leaderboard={leaderboard} isDisqualified={isDisqualified}
                        roomId={roomId} playerName={playerName}
                        entityName={entityName} 
                        fireGlobalNotification={fireGlobalNotification}
                        refreshLeaderboard={refreshLeaderboard}
                        liveScore={liveScore}
                        timeLeft={timeLeft}
                        totalTime={totalTime}
                    />
                </div>

                <div className="flex-1 flex flex-col border border-purple-500/30 rounded-xl overflow-hidden bg-[#181825] shadow-2xl relative">
                    <div className="flex-1 relative min-h-[300px]">
                        
                        <div style={{ display: activeView === 'code' ? 'block' : 'none', height: '100%' }}>
                            <Editor 
                                height="100%" 
                                theme="vs-dark" 
                                language={language} 
                                value={code} 
                                onChange={handleEditorChange} 
                                onMount={handleEditorDidMount} 
                                options={{ minimap: { enabled: false }, fontSize: 16, readOnly: isDisqualified, padding: { top: 16 } }} 
                            />
                        </div>
                        
                        {activeView === 'whiteboard' && <ArenaWhiteboard broadcastWhiteboard={broadcastWhiteboard} incomingDrawData={incomingDrawData} />}
                    </div>
                    
                    <div className="resize-y overflow-auto min-h-[150px] max-h-[60vh] border-t border-gray-700 bg-[#1e1e2e]">
                        <ArenaConsole 
                            output={output} runCode={runCode} submitSolution={submitSolution} isDisqualified={isDisqualified} 
                            customInput={customInput} setCustomInput={setCustomInput}
                        />
                    </div>
                </div>
            </div>

            <ArenaModals 
                isGameOver={isGameOver} 
                leaderboard={leaderboard} navigate={navigate} 
                notifications={notifications}
            />
        </div>
    );
}