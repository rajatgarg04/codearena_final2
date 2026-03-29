import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { Client } from '@stomp/stompjs';

export default function VoiceChat({ roomId, teamCode, mySessionId }) {
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);
    
    const myStreamRef = useRef(null);
    const audioRef = useRef(null);
    const peerRef = useRef(null);
    const stompClientRef = useRef(null);

    useEffect(() => {
        const client = new Client({
            brokerURL: 'wss://codearena-backend-5tet.onrender.com/ws-arena',
            reconnectDelay: 5000, // 👇 NEW: Automatically reconnects if the cloud drops the connection
            onConnect: () => {
                console.log("Voice Chat connected to Secure WebSocket!");
                
                client.subscribe(`/topic/room/${roomId}`, (message) => {
                    const data = JSON.parse(message.body);
                    
                    if (data.sender === mySessionId) return;

                    try {
                        const parsed = JSON.parse(data.content);
                        if (parsed.teamId !== teamCode) return; 

                        if (data.type === 'VOICE_JOINED') {
                            startPeerConnection(true, null);
                        }
                        
                        if (data.type === 'VOICE_SIGNAL') {
                            if (peerRef.current) {
                                peerRef.current.signal(parsed.signal);
                            } else if (parsed.signal.type === 'offer') {
                                startPeerConnection(false, parsed.signal);
                            }
                        }
                    } catch (e) {}
                });
            },
            // 👇 NEW: Logs errors if the connection fails instead of failing silently
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            }
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) stompClientRef.current.deactivate();
            if (peerRef.current) peerRef.current.destroy();
            if (myStreamRef.current) {
                myStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [roomId, teamCode, mySessionId]);

    const startPeerConnection = (isInitiator, initialSignal) => {
        const peer = new Peer({
            initiator: isInitiator,
            trickle: true, 
            stream: myStreamRef.current,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            }
        });

        peer.on('signal', (signalData) => {
            const safePayload = JSON.stringify({ teamId: teamCode, signal: signalData });
            
            stompClientRef.current.publish({
                destination: `/app/room/${roomId}/send`, 
                body: JSON.stringify({
                    type: 'VOICE_SIGNAL',
                    sender: mySessionId,
                    content: safePayload
                })
            });
        });

        peer.on('connect', () => {
            setIsConnected(true);
        });

        peer.on('stream', (remoteStream) => {
            if (audioRef.current) {
                audioRef.current.srcObject = remoteStream;
                audioRef.current.play().catch(err => console.log("Audio play prevented:", err));
            }
            setIsConnected(true);
        });

        peer.on('close', () => {
            setIsConnected(false);
            peerRef.current = null;
        });

        peer.on('error', (err) => {
            console.error("WebRTC Error:", err);
            setIsConnected(false);
        });

        if (initialSignal) {
            peer.signal(initialSignal);
        }

        peerRef.current = peer;
    };

    const joinVoice = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            myStreamRef.current = stream;
            setHasJoined(true);

            const safePayload = JSON.stringify({ teamId: teamCode });

            stompClientRef.current.publish({
                destination: `/app/room/${roomId}/send`,
                body: JSON.stringify({ 
                    type: 'VOICE_JOINED', 
                    sender: mySessionId,
                    content: safePayload
                })
            });
        } catch (error) {
            alert("Microphone access denied! Check your browser permissions.");
            console.error(error);
        }
    };

    const toggleMute = () => {
        if (myStreamRef.current) {
            const audioTrack = myStreamRef.current.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    };

    return (
        <div className="bg-[#1e1e2e] border border-gray-700 rounded-lg p-1.5 flex items-center gap-3 transition-all">
            <audio ref={audioRef} autoPlay /> 

            {!hasJoined ? (
                <button 
                    onClick={joinVoice}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-md font-bold flex items-center gap-2 text-[10px] uppercase tracking-wider shadow-[0_0_15px_rgba(147,51,234,0.3)] transition"
                >
                    🎤 Join Voice
                </button>
            ) : (
                <div className="flex items-center gap-2 px-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`} />
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 pr-1">
                        {isConnected ? 'Connected' : 'Connecting'}
                    </span>
                    <button 
                        onClick={toggleMute}
                        className={`p-1.5 rounded text-white transition text-xs ${isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        {isMuted ? '🔇' : '🔊'}
                    </button>
                </div>
            )}
        </div>
    );
}