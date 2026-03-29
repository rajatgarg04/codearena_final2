package com.codearena.code.controller;

import com.codearena.code.service.HintService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/hints")
@CrossOrigin(origins = {"https://codearena-final2-rajatgarg04s-projects.vercel.app", "http://localhost:5173"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class HintController {

    private final HintService hintService;

    public HintController(HintService hintService) {
        this.hintService = hintService;
    }

    @PostMapping("/{problemId}")
    public ResponseEntity<Map<String, Object>> requestHint(
            @PathVariable Long problemId,
            @RequestBody Map<String, String> request) {
        
        String roomId = request.get("roomId");
        String playerName = request.get("playerName");

        String hintMessage = hintService.getHint(problemId, roomId, playerName);
        int remaining = hintService.getRemainingHints(roomId, playerName);

        return ResponseEntity.ok(Map.of(
            "hint", hintMessage,
            "remaining", remaining
        ));
    }
}