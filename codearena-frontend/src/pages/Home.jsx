import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Home() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [joinCode, setJoinCode] = useState('');

    // Load saved username if they visited before
    useEffect(() => {
        const savedName = localStorage.getItem('playerName');
        if (savedName) setUsername(savedName);
    }, []);

    const handleNameChange = (e) => {
        const name = e.target.value;
        setUsername(name);
        localStorage.setItem('playerName', name);
    };

    const createRoom = () => {
        if (!username.trim()) return alert("Please enter a username first!");
        
        // Generate a random 6-character room code
        const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Navigate to the new Setup phase instead of directly to the lobby
        navigate(`/setup/${newRoomCode}`);
    };

    const joinRoom = async () => {
        if (!username.trim()) return alert("Please enter a username first!");
        if (!joinCode.trim()) return alert("Please enter a room code!");
        
        const code = joinCode.trim().toUpperCase();

        try {
            // 👇 FIX: Changed wss:// to https:// so Axios can read it properly!
            const res = await axios.get(`https://codearena-backend-5tet.onrender.com/api/rooms/${code}`);
            
            if (!res.data.exists) {
                return alert("❌ Room does not exist! Please check the code.");
            }
            if (res.data.isStarted) {
                return alert("🔒 Match has already started! You cannot join late.");
            }

            // If it exists and isn't started, let them through to Setup!
            navigate(`/setup/${code}`);
        } catch (error) {
            console.error(error);
            alert("⚠️ Failed to connect to the server.");
        }
    };

    return (
        <div className="flex min-h-screen bg-[#181825] items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-[#1e1e2e] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden relative">
                
                {/* Header Decoration */}
                <div className="h-2 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500"></div>
                
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                            CodeArena
                        </h1>
                        <p className="text-gray-400 font-medium">Multiplayer Coding Battles</p>
                    </div>

                    {/* Step 1: Username (Mandatory) */}
                    <div className="mb-8">
                        <label className="block text-gray-300 text-sm font-bold mb-2 uppercase tracking-wide">
                            1. Who are you?
                        </label>
                        <input 
                            type="text" 
                            placeholder="Enter your username..." 
                            value={username}
                            onChange={handleNameChange}
                            className="w-full bg-[#313244] border border-gray-700 text-white px-4 py-3 rounded-xl outline-none focus:border-purple-500 transition shadow-inner font-semibold"
                        />
                    </div>

                    <div className="h-px w-full bg-gray-800 mb-8"></div>

                    {/* Step 2: Room Actions */}
                    <div className="space-y-6">
                        <label className="block text-gray-300 text-sm font-bold mb-2 uppercase tracking-wide">
                            2. Enter the Arena
                        </label>
                        
                        <button 
                            onClick={createRoom}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-xl transition shadow-[0_0_15px_rgba(147,51,234,0.3)] transform hover:-translate-y-0.5"
                        >
                            🚀 Create New Room
                        </button>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-gray-700"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm font-bold">OR</span>
                            <div className="flex-grow border-t border-gray-700"></div>
                        </div>

                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Room Code (e.g. A1B2C)" 
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                className="flex-1 bg-[#313244] border border-gray-700 text-white px-4 py-3 rounded-xl outline-none focus:border-pink-500 transition shadow-inner font-mono font-bold uppercase"
                            />
                            <button 
                                onClick={joinRoom}
                                className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 px-6 rounded-xl transition shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                            >
                                Join
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}