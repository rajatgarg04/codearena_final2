package com.codearena.code.repository;
import com.codearena.code.entity.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    // 👇 ADD THIS LINE FIX THE ERROR!
    List<TestCase> findByProblemId(Long problemId); 
}