package com.codearena.code.controller;

import com.codearena.code.entity.Problem;
import com.codearena.code.repository.ProblemRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = {"https://codearena-final2-rajatgarg04s-projects.vercel.app", "http://localhost:5173"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class RoomController {

    private final ProblemRepository problemRepository;

    // Stores: RoomCode -> Room Data (mode, timeLimit, problemId, isStarted, playerNames, teamNames)
    private static final Map<String, Map<String, Object>> activeRooms = new ConcurrentHashMap<>();

    public RoomController(ProblemRepository problemRepository) {
        this.problemRepository = problemRepository;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createRoom(@RequestBody Map<String, String> request) {
        String roomCode = request.get("roomCode");
        String mode = request.get("mode");
        String timeLimit = request.get("timeLimit"); 

        String difficulty = "EASY";

        if ("solo".equals(mode)) {
            if ("10".equals(timeLimit)) difficulty = "EASY";
            else if ("30".equals(timeLimit)) difficulty = "MEDIUM";
            else if ("45".equals(timeLimit)) difficulty = "HARD";
        } else if ("team".equals(mode)) {
            if ("10".equals(timeLimit)) difficulty = "MEDIUM";  
            else if ("30".equals(timeLimit)) difficulty = "HARD";    
            else if ("45".equals(timeLimit)) difficulty = "EXTREME"; 
        }

        List<Problem> problems = problemRepository.findByDifficulty(difficulty);
        Long assignedProblemId = 1L; 
        
        if (!problems.isEmpty()) {
            Random rand = new Random();
            assignedProblemId = problems.get(rand.nextInt(problems.size())).getId();
        }

        // 👇 THE FIX: Add tracking for started status, players, and teams!
        Map<String, Object> roomData = new ConcurrentHashMap<>();
        roomData.put("mode", mode);
        roomData.put("timeLimit", timeLimit != null ? timeLimit : "10");
        roomData.put("problemId", assignedProblemId);
        roomData.put("isStarted", false); // 👈 Starts unlocked
        roomData.put("playerNames", ConcurrentHashMap.newKeySet()); // 👈 Thread-safe set for names
        roomData.put("teamNames", ConcurrentHashMap.newKeySet());

        activeRooms.put(roomCode, roomData);
        
        return ResponseEntity.ok(Map.of("success", true, "problemId", assignedProblemId));
    }

    // 👇 NEW: The "Bouncer" Endpoint. Validates names and locks late joiners out!
    @PostMapping("/{roomCode}/join")
    public ResponseEntity<?> joinRoom(@PathVariable String roomCode, @RequestBody Map<String, String> request) {
        if (!activeRooms.containsKey(roomCode)) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Room does not exist."));
        }

        Map<String, Object> data = activeRooms.get(roomCode);
        boolean isStarted = (boolean) data.get("isStarted");

        // 1. Check if the door is locked
        if (isStarted) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Match has already started! You cannot join."));
        }

        String playerName = request.get("playerName");
        String teamName = request.get("teamName");

        @SuppressWarnings("unchecked")
        Set<String> players = (Set<String>) data.get("playerNames");
        @SuppressWarnings("unchecked")
        Set<String> teams = (Set<String>) data.get("teamNames");

        // 2. Check for duplicate Player Name
        if (players.contains(playerName)) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Player name '" + playerName + "' is already taken in this room!"));
        }

        // 3. Check for duplicate Team Name (only if they are creating a new team)
        String isLeader = request.get("isLeader");
        if ("true".equals(isLeader) && teams.contains(teamName)) {
            return ResponseEntity.ok(Map.of("success", false, "message", "Team name '" + teamName + "' is already taken!"));
        }

        // 4. If they pass all checks, add them to the official room ledger!
        players.add(playerName);
        if (teamName != null && !teamName.equals("Joining...")) {
            teams.add(teamName);
        }

        return ResponseEntity.ok(Map.of("success", true, "mode", data.get("mode"), "timeLimit", data.get("timeLimit")));
    }

    // 👇 NEW: Locks the room when the Leader clicks "Ready Up" and starts the match!
    @PostMapping("/{roomCode}/start")
    public ResponseEntity<?> startRoom(@PathVariable String roomCode) {
        if (activeRooms.containsKey(roomCode)) {
            activeRooms.get(roomCode).put("isStarted", true);
            return ResponseEntity.ok(Map.of("success", true));
        }
        return ResponseEntity.ok(Map.of("success", false));
    }
    
 // 👇 NEW: Fetches the Active Players in the Room!
    @GetMapping("/{roomCode}/players")
    public ResponseEntity<?> getRoomPlayers(@PathVariable String roomCode) {
        if (activeRooms.containsKey(roomCode)) {
            Map<String, Object> data = activeRooms.get(roomCode);
            @SuppressWarnings("unchecked")
            Set<String> players = (Set<String>) data.get("playerNames");
            
            return ResponseEntity.ok(Map.of("success", true, "players", players));
        }
        return ResponseEntity.ok(Map.of("success", false, "message", "Room not found"));
    }

    @GetMapping("/{roomCode}")
    public ResponseEntity<?> checkRoom(@PathVariable String roomCode) {
        if (activeRooms.containsKey(roomCode)) {
            Map<String, Object> data = activeRooms.get(roomCode);
            return ResponseEntity.ok(Map.of(
                "exists", true, 
                "mode", data.get("mode"),
                "timeLimit", data.get("timeLimit"),
                "problemId", data.get("problemId"),
                "isStarted", data.get("isStarted") // 👈 Sends lock status to frontend
            ));
        }
        return ResponseEntity.ok(Map.of("exists", false));
    }
}