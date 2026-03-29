import { useState, useEffect } from 'react';

export function useArenaTimer(endTimeParam, onTimeUp) {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!endTimeParam) return;
        const endTime = parseInt(endTimeParam, 10);

        const timerInterval = setInterval(() => {
            const now = Date.now();
            const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
            
            setTimeLeft(remainingSeconds);
            if (remainingSeconds <= 0) {
                clearInterval(timerInterval);
                onTimeUp();
            }
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [endTimeParam, onTimeUp]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return { timeLeft, formatTime };
}