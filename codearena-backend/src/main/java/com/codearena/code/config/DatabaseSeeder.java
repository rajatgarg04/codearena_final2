package com.codearena.code.config;

import com.codearena.code.entity.Problem;
import com.codearena.code.entity.TestCase;
import com.codearena.code.repository.ProblemRepository;
import com.codearena.code.repository.TestCaseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.Arrays;

@Configuration
public class DatabaseSeeder {

    @Bean
    CommandLineRunner initDatabase(ProblemRepository problemRepository, TestCaseRepository testCaseRepository) {
        return args -> {
            
            // 👇 THE NUCLEAR OPTION: Wipes the old database to force the new constraints in!
            // (Pro-tip: You can comment these two lines out after you restart the server once)
            testCaseRepository.deleteAll();
            problemRepository.deleteAll();
            
            if (problemRepository.count() == 0) {
                System.out.println("🌱 Database is empty. Seeding 20 High-Quality Problems with Constraints...");
                
                // ==========================================
                // 🟢 EASY LEVEL (10 Min Solo)
                // ==========================================
                saveProblem(problemRepository, "EASY", "Add Two Numbers", "Math", 
                    "Read two integers from standard input on separate lines and print their sum.",
                    "5\n7", "12", false, "-10\n10", "0", true, "1 <= A, B <= 10^5\nTime Limit: 1.0s");
                
                saveProblem(problemRepository, "EASY", "Even or Odd", "Logic", 
                    "Given an integer N, print 'Even' if it is divisible by 2, otherwise print 'Odd'.",
                    "4", "Even", false, "-7", "Odd", true, "-10^9 <= N <= 10^9\nTime Limit: 1.0s");

                saveProblem(problemRepository, "EASY", "String Reversal", "Strings", 
                    "Given a single word as input, output the reversed version of that word.",
                    "hello", "olleh", false, "Racecar", "racecaR", true, "1 <= length(S) <= 10^4\nContains only English letters\nTime Limit: 1.0s");

                saveProblem(problemRepository, "EASY", "Find the Maximum", "Arrays", 
                    "Given a number N, followed by N space-separated integers, print the largest integer.",
                    "3\n1 5 3", "5", false, "4\n-1 -5 -2 -9", "-1", true, "1 <= N <= 10^5\n-10^9 <= A[i] <= 10^9\nTime Limit: 1.0s");

                saveProblem(problemRepository, "EASY", "Count Vowels", "Strings", 
                    "Given a string of lowercase letters, count the number of vowels (a, e, i, o, u).",
                    "codearena", "5", false, "rhythm", "0", true, "1 <= length(S) <= 10^5\nTime Limit: 1.0s");

                // ==========================================
                // 🟡 MEDIUM LEVEL (30 Min Solo / 10 Min Team)
                // ==========================================
                saveProblem(problemRepository, "MEDIUM", "Valid Palindrome", "Strings", 
                    "Given a string, print 'true' if it is a palindrome, and 'false' otherwise. Ignore spaces and case.",
                    "Racecar", "true", false, "A man a plan a canal Panama", "true", true, "1 <= length(S) <= 2 * 10^5\nTime Limit: 1.5s");

                saveProblem(problemRepository, "MEDIUM", "Two Sum", "Arrays,HashMap", 
                    "Given an integer N, followed by N space-separated integers, and a target T. Output the indices of the two numbers that add up to T.",
                    "4\n2 7 11 15\n9", "0 1", false, "3\n3 2 4\n6", "1 2", true, "2 <= N <= 10^4\n-10^9 <= A[i] <= 10^9\nTime Limit: 1.0s");

                saveProblem(problemRepository, "MEDIUM", "Fibonacci Sequence", "Math,DP", 
                    "Given an integer N, print the Nth number in the Fibonacci sequence (where F(0)=0, F(1)=1).",
                    "5", "5", false, "10", "55", true, "0 <= N <= 30\nTime Limit: 1.0s");

                saveProblem(problemRepository, "MEDIUM", "Valid Parentheses", "Stack", 
                    "Given a string containing only '(', ')', '{', '}', '[' and ']', print 'true' if the brackets are closed in the correct order.",
                    "()[]{}", "true", false, "([)]", "false", true, "1 <= length(S) <= 10^4\nTime Limit: 1.0s");

                saveProblem(problemRepository, "MEDIUM", "Maximum Subarray", "Arrays,DP", 
                    "Given N integers, find the contiguous subarray which has the largest sum and print that sum.",
                    "9\n-2 1 -3 4 -1 2 1 -5 4", "6", false, "1\n-5", "-5", true, "1 <= N <= 10^5\n-10^4 <= A[i] <= 10^4\nTime Limit: 1.0s");

                // ==========================================
                // 🔴 HARD LEVEL (45 Min Solo / 30 Min Team)
                // ==========================================
                saveProblem(problemRepository, "HARD", "Merge Intervals", "Arrays,Sorting", 
                    "Given N intervals (start end), merge all overlapping intervals and output the result.",
                    "4\n1 3\n2 6\n8 10\n15 18", "1 6\n8 10\n15 18", false, "2\n1 4\n4 5", "1 5", true, "1 <= N <= 10^4\n0 <= start <= end <= 10^4\nTime Limit: 1.0s");

                saveProblem(problemRepository, "HARD", "Longest Substring Without Repeats", "Strings,SlidingWindow", 
                    "Given a string, find the length of the longest substring without repeating characters.",
                    "abcabcbb", "3", false, "pwwkew", "3", true, "0 <= length(S) <= 5 * 10^4\nTime Limit: 1.0s");

                saveProblem(problemRepository, "HARD", "Container With Most Water", "TwoPointers", 
                    "Given N non-negative integers representing vertical lines, find two lines that form a container holding the most water.",
                    "9\n1 8 6 2 5 4 8 3 7", "49", false, "2\n1 1", "1", true, "2 <= N <= 10^5\n0 <= height <= 10^4\nTime Limit: 1.5s");

                saveProblem(problemRepository, "HARD", "Search in Rotated Sorted Array", "BinarySearch", 
                    "Given a rotated sorted array and a target value, return the index of the target. If not found, return -1.",
                    "7\n4 5 6 7 0 1 2\n0", "4", false, "7\n4 5 6 7 0 1 2\n3", "-1", true, "1 <= N <= 5000\n-10^4 <= target <= 10^4\nMust run in O(log n) time\nTime Limit: 1.0s");

                saveProblem(problemRepository, "HARD", "Word Search", "Backtracking,DFS", 
                    "Given an M x N grid of characters and a word, return 'true' if the word exists in the grid (horizontal/vertical moves only).",
                    "3 4\nA B C E\nS F C S\nA D E E\nABCCED", "true", false, "3 4\nA B C E\nS F C S\nA D E E\nABCB", "false", true, "1 <= M, N <= 6\n1 <= length(Word) <= 15\nTime Limit: 2.0s");

                // ==========================================
                // 🔥 EXTREME LEVEL (45 Min Team)
                // ==========================================
                saveProblem(problemRepository, "EXTREME", "Merge K Sorted Lists", "LinkedList,Heaps", 
                    "Given K sorted arrays, merge them all into a single sorted array and output the space-separated result.",
                    "3\n3\n1 4 5\n3\n1 3 4\n2\n2 6", "1 1 2 3 4 4 5 6", false, "0", "", true, "0 <= K <= 10^4\n0 <= length(List) <= 500\nTime Limit: 2.0s");

                saveProblem(problemRepository, "EXTREME", "Trapping Rain Water", "TwoPointers,DP", 
                    "Given N non-negative integers representing an elevation map where width is 1, compute how much water it can trap.",
                    "12\n0 1 0 2 1 0 1 3 2 1 2 1", "6", false, "6\n4 2 0 3 2 5", "9", true, "1 <= N <= 2 * 10^4\n0 <= height <= 10^5\nTime Limit: 1.5s");

                saveProblem(problemRepository, "EXTREME", "Regular Expression Matching", "DP", 
                    "Implement regex matching with support for '.' (any character) and '*' (zero or more of preceding element). Output 'true' or 'false'.",
                    "aa\na*", "true", false, "mississippi\nmis*is*p*.", "false", true, "1 <= length(S), length(P) <= 20\nTime Limit: 2.0s");

                saveProblem(problemRepository, "EXTREME", "N-Queens", "Backtracking", 
                    "Given N, output the number of distinct solutions to place N queens on an NxN chessboard such that none attack each other.",
                    "4", "2", false, "8", "92", true, "1 <= N <= 9\nTime Limit: 2.0s");

                saveProblem(problemRepository, "EXTREME", "Median of Two Sorted Arrays", "BinarySearch,Math", 
                    "Given two sorted arrays of size M and N, find the median of the two sorted arrays. Output as a double.",
                    "2\n1 3\n1\n2", "2.0", false, "2\n1 2\n2\n3 4", "2.5", true, "0 <= M, N <= 1000\n1 <= M + N <= 2000\nMust run in O(log(m+n)) time\nTime Limit: 1.0s");

                System.out.println("✅ Database Seeded Successfully!");
            } else {
                System.out.println("✅ Database already contains problems. Skipping seed process.");
            }
        };
    }

    private void saveProblem(ProblemRepository repo, String diff, String title, String tags, String desc, 
                             String pubIn, String pubOut, boolean pubHid, String privIn, String privOut, boolean privHid, String constraints) {
        Problem p = new Problem();
        p.setTitle(title);
        p.setDescription(desc);
        p.setDifficulty(diff);
        p.setTags(tags);
        
        p.setExampleInput(pubIn);
        p.setExampleOutput(pubOut);
        
        p.setConstraints(constraints);
        
        TestCase t1 = new TestCase(); t1.setInputData(pubIn); t1.setExpectedOutput(pubOut); t1.setHidden(pubHid); t1.setProblem(p);
        TestCase t2 = new TestCase(); t2.setInputData(privIn); t2.setExpectedOutput(privOut); t2.setHidden(privHid); t2.setProblem(p);
        
        p.setTestCases(Arrays.asList(t1, t2));
        repo.save(p);
    }
}