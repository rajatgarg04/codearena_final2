package com.codearena.code.controller;

import com.codearena.code.entity.Leaderboard;
import com.codearena.code.repository.LeaderboardRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cheat")
@CrossOrigin(origins = {"https://codearena-final2-rajatgarg04s-projects.vercel.app", "http://localhost:5173"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class AntiCheatController {

    private final LeaderboardRepository leaderboardRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public AntiCheatController(LeaderboardRepository leaderboardRepository, SimpMessagingTemplate messagingTemplate) {
        this.leaderboardRepository = leaderboardRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping("/tab-switch")
    public ResponseEntity<?> handleTabSwitch(@RequestBody Map<String, String> request) {
        String roomId = request.get("roomId");
        String playerName = request.get("playerName");

        Leaderboard stats = leaderboardRepository.findFirstByRoomIdAndPlayerName(roomId, playerName);
        if (stats != null && !stats.isCompleted()) {
            // Deduct 100 points for cheating!
            stats.setScore(Math.max(0, stats.getScore() - 100));
            leaderboardRepository.save(stats);

            // Broadcast the penalty to the whole room instantly
            List<Leaderboard> updatedBoard = leaderboardRepository.findByRoomIdOrderByScoreDescCompletionTimeAsc(roomId);
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/leaderboard", updatedBoard);
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Penalty applied"));
    }
}