import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Client } from '@stomp/stompjs';

export default function Lobby() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const setupData = location.state || {};
    const mode = setupData.mode || 'solo';
    const timeLimit = setupData.timeLimit || '10'; 
    const myTeamCode = setupData.teamCode || 'SOLO_000';
    const myTeamName = setupData.teamName || 'Solo Player'; 
    const isLeader = setupData.isLeader || false;

    const [playerName] = useState(() => localStorage.getItem('playerName') || 'Unknown Ninja');
    const [players, setPlayers] = useState([]);
    const [amIReady, setAmIReady] = useState(false); 
    const [mySessionId] = useState(() => Math.random().toString(36).substring(7));
    
    const stompClientRef = useRef(null);
    const hasStartedRef = useRef(false);
    const actualTeamNameRef = useRef(myTeamName);

    useEffect(() => {
        if (!location.state) {
            navigate('/');
            return;
        }

        setPlayers([{ 
            id: mySessionId, 
            name: playerName, 
            teamCode: myTeamCode, 
            teamName: myTeamName, 
            isLeader: isLeader,
            isReady: false
        }]);

        const client = new Client({
            // 👇 Ensures secure websocket protocol is used for Render
            brokerURL: 'wss://codearena-backend-5tet.onrender.com/ws-arena',
            reconnectDelay: 5000, // Reconnect if it drops
            onConnect: () => {
                console.log("Lobby connected to Secure WebSocket!");
                
                client.subscribe(`/topic/room/${roomId}`, (message) => {
                    const receivedMsg = JSON.parse(message.body);
                    
                    let payload = {};
                    if (receivedMsg.content && receivedMsg.content !== 'left') {
                        try { payload = JSON.parse(receivedMsg.content); } catch (e) {}
                    }

                    if (payload.teamCode === myTeamCode && payload.teamName && payload.teamName !== 'Joining...') {
                        actualTeamNameRef.current = payload.teamName;
                    }

                    if (receivedMsg.type === 'JOIN' && receivedMsg.sender !== playerName) {
                        setPlayers((prev) => {
                            if (!prev.find(p => p.name === receivedMsg.sender)) {
                                return [...prev, { name: receivedMsg.sender, ...payload }];
                            }
                            return prev;
                        });

                        client.publish({
                            destination: `/app/room/${roomId}/send`,
                            body: JSON.stringify({ 
                                type: 'PRESENT', 
                                sender: playerName, 
                                content: JSON.stringify({ teamCode: myTeamCode, teamName: actualTeamNameRef.current, isLeader, isReady: amIReady }) 
                            })
                        });
                    }

                    if (receivedMsg.type === 'PRESENT' && receivedMsg.sender !== playerName) {
                        setPlayers((prev) => {
                            if (!prev.find(p => p.name === receivedMsg.sender)) {
                                const updated = [...prev, { name: receivedMsg.sender, ...payload }];
                                checkAllReadyAndStart(updated);
                                return updated;
                            }
                            return prev;
                        });
                    }

                    if (receivedMsg.type === 'LEAVE') {
                        setPlayers((prev) => {
                            const updated = prev.filter(p => p.name !== receivedMsg.sender);
                            checkAllReadyAndStart(updated);
                            return updated;
                        });
                    }

                    if (receivedMsg.type === 'READY') {
                        setPlayers((prev) => {
                            const updated = prev.map(p => 
                                p.name === receivedMsg.sender ? { ...p, isReady: true } : p
                            );
                            checkAllReadyAndStart(updated);
                            return updated;
                        });
                    }

                    if (receivedMsg.type === 'START') {
                        const startData = JSON.parse(receivedMsg.content);
                        navigate(`/arena/${roomId}?mode=${startData.mode}&endTime=${startData.endTime}&teamCode=${myTeamCode}&teamName=${encodeURIComponent(actualTeamNameRef.current)}`);
                    }
                });

                client.publish({
                    destination: `/app/room/${roomId}/send`,
                    body: JSON.stringify({ 
                        type: 'JOIN', 
                        sender: playerName, 
                        content: JSON.stringify({ teamCode: myTeamCode, teamName: myTeamName, isLeader, isReady: false }) 
                    })
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            }
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.publish({
                    destination: `/app/room/${roomId}/send`,
                    body: JSON.stringify({ type: 'LEAVE', sender: playerName, content: 'left' })
                });
                stompClientRef.current.deactivate();
            }
        };
    }, [roomId, navigate, location.state, playerName, myTeamCode, myTeamName, isLeader]);

    const checkAllReadyAndStart = (currentPlayers) => {
        if (hasStartedRef.current) return;

        const teamMap = {};
        currentPlayers.forEach(p => {
            if (!teamMap[p.teamCode]) teamMap[p.teamCode] = { isReady: false };
            if (p.isLeader && p.isReady) teamMap[p.teamCode].isReady = true;
        });

        const teamKeys = Object.keys(teamMap);
        
        if (teamKeys.length > 0) {
            const allTeamsReady = teamKeys.every(code => teamMap[code].isReady);
            if (allTeamsReady && isLeader) {
                hasStartedRef.current = true;
                startBattle();
            }
        }
    };

    const handleReadyUp = () => {
        setAmIReady(true);
        if (stompClientRef.current?.connected) {
            stompClientRef.current.publish({
                destination: `/app/room/${roomId}/send`,
                body: JSON.stringify({ type: 'READY', sender: playerName })
            });
        }
        setPlayers((prev) => {
            const updated = prev.map(p => p.name === playerName ? { ...p, isReady: true } : p);
            checkAllReadyAndStart(updated);
            return updated;
        });
    };

    const startBattle = () => {
        const minutes = parseInt(timeLimit, 10);
        const battleDurationMs = minutes * 60 * 1000; 
        const exactEndTime = Date.now() + battleDurationMs;

        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish({
                destination: `/app/room/${roomId}/send`,
                body: JSON.stringify({ 
                    type: 'START', 
                    sender: playerName, 
                    content: JSON.stringify({ mode: mode, endTime: exactEndTime }) 
                })
            });
        }
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId);
        alert("Room Code Copied!");
    };

    const teams = players.reduce((acc, player) => {
        if (!acc[player.teamCode]) {
            const displayTeamName = player.teamName === 'Joining...' ? actualTeamNameRef.current : player.teamName;
            acc[player.teamCode] = { teamName: displayTeamName, members: [], isReady: false };
        }
        acc[player.teamCode].members.push(player);
        if (player.isLeader && player.isReady) acc[player.teamCode].isReady = true;
        return acc;
    }, {});

    return (
        <div className="flex min-h-screen bg-[#181825] items-center justify-center p-6 font-sans">
            <div className="w-full max-w-4xl bg-[#1e1e2e] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col h-[80vh]">
                
                <div className="bg-[#313244] p-6 border-b border-gray-700 flex justify-between items-end shrink-0">
                    <div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-400">
                            Waiting Lobby
                        </h1>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                            {mode === 'team' ? `Squad Members (${teams[myTeamCode]?.members?.length || 1}/5)` : 'Solo Competitor'}
                        </p>
                    </div>
                    
                    <div className="flex gap-4 items-center">
                        {mode === 'team' && isLeader && (
                            <div className="bg-yellow-900/40 text-yellow-500 border border-yellow-700/50 px-4 py-2.5 rounded-lg font-bold text-sm flex items-center shadow-inner uppercase tracking-wider h-[44px]">
                                👑 Squad Leader
                            </div>
                        )}
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Global Room Code</p>
                            <button onClick={copyRoomCode} className="bg-[#181825] text-yellow-400 font-mono text-xl px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-800 transition shadow-inner flex items-center gap-3 h-[44px]">
                                {roomId} 📋
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 flex-1 overflow-y-auto bg-[#181825]/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(teams).map(([code, team]) => (
                            <div key={code} className={`rounded-xl border overflow-hidden shadow-lg h-fit transition-colors ${team.isReady ? 'border-green-500/50 bg-[#1e1e2e]' : 'border-gray-700 bg-[#1e1e2e]'}`}>
                                <div className={`px-4 py-3 border-b flex justify-between items-center ${team.isReady ? 'bg-green-900/20 border-green-900/50' : 'bg-[#313244] border-gray-700'}`}>
                                    <h3 className="font-bold text-lg text-gray-200 flex items-center gap-2">
                                        {team.teamName} {team.isReady && '✅'}
                                    </h3>
                                    {mode === 'team' && (
                                        <span className="text-xs font-mono bg-gray-800 text-pink-400 px-2 py-1 rounded border border-gray-600">
                                            Code: {code}
                                        </span>
                                    )}
                                </div>
                                <div className="p-4">
                                    {mode === 'team' && (
                                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                                            Members ({team.members.length}/5)
                                        </p>
                                    )}
                                    <ul className="space-y-2">
                                        {team.members.map((member, idx) => (
                                            <li key={idx} className="flex justify-between items-center bg-[#181825] px-3 py-2 rounded-lg border border-gray-800">
                                                <span className={`font-semibold ${member.name === playerName ? 'text-purple-400' : 'text-gray-300'}`}>
                                                    {member.name} {member.name === playerName && '(You)'}
                                                </span>
                                                {/* GUARANTEED to hide Leader tag in Solo mode */}
                                                {mode === 'team' && member.isLeader && (
                                                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border font-bold ${member.isReady ? 'bg-green-900/40 text-green-400 border-green-700/50' : 'bg-yellow-900/40 text-yellow-500 border-yellow-700/50'}`}>
                                                        {member.isReady ? 'Ready' : 'Leader'}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-[#313244] border-t border-gray-700 text-center shrink-0 min-h-[100px] flex items-center justify-center">
                    {!isLeader ? (
                        <div className="text-gray-400 font-bold uppercase tracking-widest animate-pulse flex items-center gap-3">
                            <span className="text-2xl">⏳</span> Waiting for your Squad Leader to ready up...
                        </div>
                    ) : (
                        <button 
                            onClick={handleReadyUp}
                            disabled={amIReady}
                            className={`text-xl font-black py-4 px-16 rounded-full shadow-lg transition uppercase tracking-wide w-full max-w-md ${
                                amIReady 
                                ? 'bg-gray-700 text-gray-400 border border-gray-600 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-500 hover:to-teal-400 text-white transform hover:scale-105 shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                            }`}
                        >
                            {amIReady ? '✅ READY (WAITING FOR OTHERS...)' : '🚀 READY UP'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}