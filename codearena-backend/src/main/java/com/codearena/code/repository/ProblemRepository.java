package com.codearena.code.repository;
import com.codearena.code.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProblemRepository extends JpaRepository<Problem, Long> {
    List<Problem> findByDifficulty(String difficulty);
    // We will use this to find problems that match specific tags later!
    List<Problem> findByDifficultyAndTagsContainingIgnoreCase(String difficulty, String tag);
}