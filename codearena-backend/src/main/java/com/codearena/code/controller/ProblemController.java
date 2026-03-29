package com.codearena.code.controller;

import com.codearena.code.entity.Problem;
import com.codearena.code.entity.TestCase;
import com.codearena.code.repository.ProblemRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = {"https://codearena-final2-rajatgarg04s-projects.vercel.app", "http://localhost:5173"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class ProblemController {

    private final ProblemRepository problemRepository;

    public ProblemController(ProblemRepository problemRepository) {
        this.problemRepository = problemRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProblemForArena(@PathVariable Long id) {
        Optional<Problem> problemOpt = problemRepository.findById(id);
        
        if (problemOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Problem p = problemOpt.get();

        // Safe, traditional Java loop to filter hidden cases
        List<Map<String, Object>> publicTestCases = new ArrayList<>();
        
        for (TestCase tc : p.getTestCases()) {
            if (!tc.isHidden()) {
                Map<String, Object> tcMap = new HashMap<>();
                tcMap.put("input", tc.getInputData());
                tcMap.put("output", tc.getExpectedOutput());
                publicTestCases.add(tcMap);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", p.getId());
        response.put("title", p.getTitle());
        response.put("description", p.getDescription());
        response.put("difficulty", p.getDifficulty());
        response.put("tags", p.getTags());
        response.put("publicCases", publicTestCases);
        response.put("exampleInput", p.getExampleInput());
        response.put("exampleOutput", p.getExampleOutput());
        
        // 👇 THE FIX: Actually send the constraints to the frontend!
        response.put("constraints", p.getConstraints());

        return ResponseEntity.ok(response);
    }
}