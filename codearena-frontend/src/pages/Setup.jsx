import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Setup() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    const [username, setUsername] = useState('');
    const [mode, setMode] = useState('solo'); 
    const [timeLimit, setTimeLimit] = useState('10'); 
    const [teamAction, setTeamAction] = useState('create'); 
    const [teamName, setTeamName] = useState('');
    const [joinTeamCode, setJoinTeamCode] = useState('');
    const [isRoomLocked, setIsRoomLocked] = useState(false);
    
    const [generatedTeamCode] = useState(() => Math.random().toString(36).substring(2, 6).toUpperCase());

    useEffect(() => {
        const savedName = localStorage.getItem('playerName');
        if (!savedName) {
            navigate('/');
        } else {
            setUsername(savedName);
        }
    }, [navigate]);

    // Check if room exists and lock settings if we are joining!
    useEffect(() => {
        const checkRoomStatus = async () => {
            try {
                // 👇 FIX 1: Changed wss:// to https://
                const res = await axios.get(`https://codearena-backend-5tet.onrender.com/api/rooms/${roomId}`);
                if (res.data.exists) {
                    setMode(res.data.mode);
                    setTimeLimit(res.data.timeLimit); 
                    setIsRoomLocked(true);  
                    if (res.data.mode === 'team') {
                        setTeamAction('join'); 
                    }
                }
            } catch (err) {
                console.error("Could not verify room status:", err);
            }
        };
        checkRoomStatus();
    }, [roomId]);

    const enterLobby = async () => {
        let finalTeamCode = '';
        let finalTeamName = '';
        let isLeader = false;

        if (mode === 'solo') {
            finalTeamCode = `SOLO_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            finalTeamName = username; 
            isLeader = true;
        } else {
            if (teamAction === 'create') {
                if (!teamName.trim()) return alert("Please enter a Squad Name!");
                finalTeamCode = generatedTeamCode;
                finalTeamName = teamName;
                isLeader = true;
            } else {
                if (!joinTeamCode.trim()) return alert("Please enter a Squad Code!");
                finalTeamCode = joinTeamCode.toUpperCase();
                finalTeamName = "Joining..."; 
                isLeader = false;
            }
        }

        // 1. IF we are the Host, CREATE the room first
        if (!isRoomLocked) {
            try {
                // 👇 FIX 2: Changed wss:// to https://
                await axios.post('https://codearena-backend-5tet.onrender.com/api/rooms/create', { 
                    roomCode: roomId, 
                    mode: mode,
                    timeLimit: timeLimit 
                });
            } catch (error) {
                console.error("Failed to register room on backend.");
                return alert("⚠️ Failed to create the room.");
            }
        }

        // 2. Everyone (Host and Joiners) must pass the Bouncer to enter!
        try {
            // 👇 FIX 3: Changed wss:// to https://
            const joinRes = await axios.post(`https://codearena-backend-5tet.onrender.com/api/rooms/${roomId}/join`, {
                playerName: username,
                teamName: finalTeamName,
                isLeader: String(isLeader)
            });

            // If the backend rejects the name, STOP them!
            if (!joinRes.data.success) {
                return alert(`❌ ${joinRes.data.message}`);
            }
        } catch (error) {
            console.error("Failed to join room.", error);
            return alert("⚠️ Failed to connect to the server.");
        }

        // 3. If the bouncer lets them through, enter the lobby!
        navigate(`/lobby/${roomId}`, { 
            state: { mode, timeLimit, teamCode: finalTeamCode, teamName: finalTeamName, isLeader } 
        });
    };

    return (
        <div className="flex min-h-screen bg-[#181825] items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-[#1e1e2e] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
                <div className="bg-[#313244] p-6 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-200">Battle Setup</h2>
                        <p className="text-gray-400 text-sm">Welcome, <span className="text-purple-400 font-bold">{username}</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Room Code</p>
                        <span className="bg-gray-800 text-yellow-400 font-mono text-lg px-3 py-1 rounded border border-gray-600">
                            {roomId}
                        </span>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Mode Selection */}
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-3 uppercase tracking-wide">
                            Game Mode {isRoomLocked && <span className="text-xs text-red-400 normal-case ml-2">(Locked)</span>}
                        </label>
                        <div className="flex bg-[#181825] rounded-xl p-1 border border-gray-700">
                            <button 
                                onClick={() => setMode('solo')} disabled={isRoomLocked}
                                className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${mode === 'solo' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'} ${isRoomLocked && mode !== 'solo' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                👤 Solo
                            </button>
                            <button 
                                onClick={() => setMode('team')} disabled={isRoomLocked}
                                className={`flex-1 py-2.5 rounded-lg font-bold transition-all ${mode === 'team' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'} ${isRoomLocked && mode !== 'team' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                👥 Squad
                            </button>
                        </div>
                    </div>

                    {/* Time Limit Selection */}
                    <div>
                        <label className="block text-gray-300 text-sm font-bold mb-3 uppercase tracking-wide">
                            Time Limit {isRoomLocked && <span className="text-xs text-red-400 normal-case ml-2">(Locked)</span>}
                        </label>
                        <div className="flex bg-[#181825] rounded-xl p-1 border border-gray-700">
                            <button 
                                onClick={() => setTimeLimit('10')} disabled={isRoomLocked}
                                className={`flex-1 py-2 rounded-lg font-bold transition-all text-sm ${timeLimit === '10' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'} ${isRoomLocked && timeLimit !== '10' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                ⏱️ 10 Min
                            </button>
                            <button 
                                onClick={() => setTimeLimit('30')} disabled={isRoomLocked}
                                className={`flex-1 py-2 rounded-lg font-bold transition-all text-sm ${timeLimit === '30' ? 'bg-yellow-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'} ${isRoomLocked && timeLimit !== '30' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                ⏱️ 30 Min
                            </button>
                            <button 
                                onClick={() => setTimeLimit('45')} disabled={isRoomLocked}
                                className={`flex-1 py-2 rounded-lg font-bold transition-all text-sm ${timeLimit === '45' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'} ${isRoomLocked && timeLimit !== '45' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                🔥 45 Min
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            {timeLimit === '10' && "Fast-paced. Easy difficulty."}
                            {timeLimit === '30' && "Standard contest. Medium difficulty."}
                            {timeLimit === '45' && "The Ultimate Challenge. Hard difficulty."}
                        </p>
                    </div>

                    {/* Team Setup */}
                    {mode === 'team' && (
                        <div className="bg-[#181825] border border-gray-700 rounded-xl p-4 space-y-4 animate-fadeIn">
                            <div className="flex bg-[#313244] rounded-lg p-1 border border-gray-700">
                                <button onClick={() => setTeamAction('create')} className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${teamAction === 'create' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Create Squad</button>
                                <button onClick={() => setTeamAction('join')} className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${teamAction === 'join' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Join Squad</button>
                            </div>

                            {teamAction === 'create' ? (
                                <div className="space-y-3">
                                    <input type="text" placeholder="Squad Name (e.g. Code Ninjas)" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full bg-[#1e1e2e] border border-gray-700 text-white px-4 py-2.5 rounded-lg outline-none focus:border-pink-500 transition text-sm font-semibold"/>
                                    <div className="flex justify-between items-center bg-[#1e1e2e] px-4 py-3 rounded-lg border border-gray-700">
                                        <span className="text-gray-400 text-sm">Squad Code:</span>
                                        <span className="text-pink-400 font-mono font-bold text-xl tracking-widest">{generatedTeamCode}</span>
                                    </div>
                                </div>
                            ) : (
                                <input type="text" placeholder="Enter 4-Letter Squad Code" value={joinTeamCode} onChange={(e) => setJoinTeamCode(e.target.value.toUpperCase())} maxLength={4} className="w-full bg-[#1e1e2e] border border-gray-700 text-pink-400 px-4 py-3 rounded-lg outline-none focus:border-pink-500 transition text-center font-mono font-bold tracking-widest uppercase"/>
                            )}
                        </div>
                    )}

                    <button onClick={enterLobby} className="w-full bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-400 hover:to-green-400 text-white font-black py-4 rounded-xl transition shadow-[0_0_20px_rgba(20,184,166,0.2)] text-lg">
                        Enter Waiting Lobby
                    </button>
                </div>
            </div>
        </div>
    );
}