package com.codearena.code.controller;

import com.codearena.code.service.DockerExecutionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/execute")
@CrossOrigin(origins = {"https://codearena-final2-rajatgarg04s-projects.vercel.app", "http://localhost:5173"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class ExecutionController {

    private final DockerExecutionService dockerService;

    public ExecutionController(DockerExecutionService dockerService) {
        this.dockerService = dockerService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> executeCode(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        String language = request.get("language");
        
        // 👇 Make sure this line exists to catch the input we just sent!
        String input = request.getOrDefault("input", ""); 
        
        String output = dockerService.executeCode(code, language, input);
        return ResponseEntity.ok(Map.of("output", output));
    }
}