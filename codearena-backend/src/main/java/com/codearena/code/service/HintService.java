package com.codearena.code.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class HintService {
    
    // Tracks how many hints a specific player has used in a specific room
    // Key format: "roomId_playerName"
    private final Map<String, Integer> hintTracker = new ConcurrentHashMap<>();

    public String getHint(Long problemId, String roomId, String playerName) {
        String key = roomId + "_" + playerName;
        int usedHints = hintTracker.getOrDefault(key, 0);

        if (usedHints >= 2) {
            return "Limit Reached! You have used all available hints for this problem.";
        }

        hintTracker.put(key, usedHints + 1);

        // Rule-based logic for Problem ID 1 (Add Two Numbers)
        if (usedHints == 0) {
            return "💡 AI Approach Hint: To solve this, you need to read inputs from the standard input stream (e.g., Scanner in Java, input() in Python) and simply print their mathematical sum.";
        } else {
            return "💡 AI Edge Case Hint: Be careful! What if the hidden test cases contain negative numbers or zero? Make sure your data types support standard integer ranges.";
        }
    }

    public int getRemainingHints(String roomId, String playerName) {
        String key = roomId + "_" + playerName;
        return 2 - hintTracker.getOrDefault(key, 0);
    }
}