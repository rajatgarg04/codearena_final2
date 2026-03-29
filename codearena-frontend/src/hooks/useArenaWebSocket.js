import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';

export function useArenaWebSocket({ 
    roomId, mode, teamCode, mySessionId, 
    onCodeReceived, onLeaderboardUpdate, onWhiteboardUpdate, 
    onNotificationReceived // 👈 NEW: Accepts notifications from other players!
}) {
    const stompClientRef = useRef(null);
    const isReceivingRef = useRef(false);
    const modeRef = useRef(mode);

    useEffect(() => { modeRef.current = mode; }, [mode]);

    useEffect(() => {
        const client = new Client({
            brokerURL: 'wss://codearena-backend-5tet.onrender.com/ws-arena/ws-arena',
            reconnectDelay: 1000, 
            onConnect: () => {
                
                // 1. Code Listener
                client.subscribe(`/topic/room/${roomId}/code`, (message) => {
                    if (modeRef.current !== 'team') return; 
                    const data = JSON.parse(message.body);
                    
                    if (data.sender !== mySessionId) {
                        try {
                            const parsed = JSON.parse(data.content);
                            if (parsed.teamId === teamCode) {
                                isReceivingRef.current = true; 
                                onCodeReceived({ content: parsed.code, language: data.language });
                                setTimeout(() => isReceivingRef.current = false, 100);
                            }
                        } catch (e) { console.error("Code sync error", e); }
                    }
                });
                
                // 2. Leaderboard Listener
                client.subscribe(`/topic/room/${roomId}/leaderboard`, (message) => {
                    onLeaderboardUpdate(JSON.parse(message.body));
                });
                
                // 3. General Room Events (Whiteboard & Killfeed)
                client.subscribe(`/topic/room/${roomId}`, (message) => {
                    const data = JSON.parse(message.body);
                    
                    // Handle Whiteboard
                    if (data.type === 'WHITEBOARD_SYNC' && data.sender !== mySessionId) {
                        if (modeRef.current === 'team') {
                            try {
                                const parsed = JSON.parse(data.content);
                                if (parsed.teamId === teamCode) {
                                    onWhiteboardUpdate(parsed.drawData);
                                }
                            } catch (e) { console.error("Whiteboard sync error", e); }
                        }
                    }

                    // 👇 NEW: Handle Killfeed Events from other players!
                    if (data.type === 'KILLFEED_EVENT' && data.sender !== mySessionId) {
                        try {
                            const parsed = JSON.parse(data.content);
                            if (onNotificationReceived) {
                                // Pop it up on our screen!
                                onNotificationReceived(parsed.text, parsed.notifType);
                            }
                        } catch (e) { console.error("Killfeed sync error", e); }
                    }
                });
            }
        });

        const connectionTimer = setTimeout(() => {
            client.activate();
            stompClientRef.current = client;
        }, 300);

        return () => {
            clearTimeout(connectionTimer);
            if (stompClientRef.current) stompClientRef.current.deactivate();
        };
    }, [roomId, teamCode, mySessionId, onCodeReceived, onLeaderboardUpdate, onWhiteboardUpdate, onNotificationReceived]);

    const broadcastCode = (newCode, language) => {
        if (isReceivingRef.current) return;
        if (modeRef.current === 'team' && stompClientRef.current?.connected) {
            const safePayload = JSON.stringify({ teamId: teamCode, code: newCode });
            stompClientRef.current.publish({
                destination: `/app/room/${roomId}/code`,
                body: JSON.stringify({ type: 'CODE_SYNC', sender: mySessionId, content: safePayload, language: language })
            });
        }
    };

    const broadcastWhiteboard = (drawData) => {
        if (modeRef.current === 'team' && stompClientRef.current?.connected) {
            const safePayload = JSON.stringify({ teamId: teamCode, drawData: drawData });
            stompClientRef.current.publish({
                destination: `/app/room/${roomId}/send`, 
                body: JSON.stringify({ type: 'WHITEBOARD_SYNC', sender: mySessionId, content: safePayload })
            });
        }
    };

    // 👇 NEW: A function to scream your events to the whole room
    const broadcastKillfeedEvent = useCallback((text, notifType = 'info') => {
        if (stompClientRef.current?.connected) {
            const safePayload = JSON.stringify({ text, notifType });
            stompClientRef.current.publish({
                destination: `/app/room/${roomId}/send`, 
                body: JSON.stringify({ type: 'KILLFEED_EVENT', sender: mySessionId, content: safePayload })
            });
        }
    }, [roomId, mySessionId]);

    return { broadcastCode, broadcastWhiteboard, broadcastKillfeedEvent, isReceivingRef };
}