import { useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

export function useAntiCheat(roomId, playerName, entityName, isDisqualified, fireGlobalNotification, refreshLeaderboard) {
    // 👇 NEW: Track the exact moment the component mounts
    const mountTime = useRef(Date.now());

    const triggerWarning = useCallback(async (reason) => {
        if (isDisqualified) return; 

        // 👇 FIX: Ignore any "paste" warnings for the first 3 seconds after a page load!
        if (Date.now() - mountTime.current < 3000) {
            console.log(`🛡️ Ignored warning: "${reason}" because page just loaded.`);
            return;
        }

        if (fireGlobalNotification) {
            fireGlobalNotification(`🚨 ${playerName} triggered a warning: ${reason}! (-25 pts)`, 'penalty');
        }

        if (roomId && entityName) {
            try {
                await axios.post('https://codearena-backend-5tet.onrender.com/ws-arena/api/submit/apply-penalty', {
                    roomId: roomId,
                    playerName: entityName, 
                    penaltyAmount: 25 
                });
                if (refreshLeaderboard) refreshLeaderboard();
            } catch (err) {
                console.error("Failed to report cheat event", err);
            }
        }
    }, [roomId, playerName, entityName, isDisqualified, fireGlobalNotification, refreshLeaderboard]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && !isDisqualified) triggerWarning("Tab Switch");
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isDisqualified, triggerWarning]);

    const handlePasteCheat = () => { triggerWarning("Massive Code Paste"); };

    return { handlePasteCheat };
}