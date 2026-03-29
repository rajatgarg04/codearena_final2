package com.codearena.code.controller;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = {"https://codearena-final2-rajatgarg04s-projects.vercel.app", "http://localhost:5173"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class AIAssistantController {

    // 👇 SECURE: Spring Boot grabs this from application.properties now!
    @Value("${gemini.api.key}")
    private String geminiApiKey; 

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    @PostMapping("/ask")
    public ResponseEntity<?> askAssistant(@RequestBody Map<String, String> request) {
        String userQuestion = request.get("question");
        String userCode = request.getOrDefault("code", "No code provided.");
        String language = request.getOrDefault("language", "Unknown");
        String problemTitle = request.getOrDefault("problemTitle", "Unknown Problem");
        String problemDesc = request.getOrDefault("problemDesc", "No description provided.");

        String strictTutorPrompt = 
                "You are an expert AI Coding Tutor for a competitive programming platform called CodeArena. " +
                "Your job is to help the user learn, NOT to solve the problem for them. " +
                "STRICT RULES YOU MUST FOLLOW: " +
                "1. NEVER give the complete solution, full pseudocode, or step-by-step logic. " +
                "2. NEVER write code that solves the problem. " +
                "3. Give short, Socratic hints. Ask guiding questions to make the user think. " +
                "4. Point out logical errors or syntax errors in the user's code, but DO NOT write the corrected code for them. " +
                "5. Format your response cleanly and keep it concise. \n\n" +
                "--- CONTEXT ---\n" +
                "Problem Title: " + problemTitle + "\n" +
                "Problem Description: " + problemDesc + "\n" +
                "Language: " + language + "\n\n" +
                "--- USER'S CURRENT CODE ---\n" +
                userCode + "\n\n" +
                "--- USER'S QUESTION ---\n" +
                userQuestion;

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> partsMap = new HashMap<>();
        partsMap.put("text", strictTutorPrompt);
        Map<String, Object> contentMap = new HashMap<>();
        contentMap.put("parts", List.of(partsMap));
        requestBody.put("contents", List.of(contentMap));

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        // 👇 Uses the secure injected key!
        headers.set("x-goog-api-key", geminiApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            URI uri = new URI(GEMINI_URL); 
            ResponseEntity<Map> response = restTemplate.postForEntity(uri, entity, Map.class);
            
            Map<String, Object> responseBody = response.getBody();
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            String aiTextResponse = (String) parts.get(0).get("text");

            // 🛑 DELETED: The -25 penalty logic. React handles the dynamic penalty now!

            return ResponseEntity.ok(Map.of("success", true, "reply", aiTextResponse));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Map.of("success", false, "reply", "AI is currently resting its brain. Please try again in a moment."));
        }
    }
}