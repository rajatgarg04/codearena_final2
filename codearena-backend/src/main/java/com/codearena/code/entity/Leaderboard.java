package com.codearena.code.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "leaderboard")
@Data
public class Leaderboard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String roomId;
    private String playerName;
    private Integer attempts = 0;
    private String status = "SOLVING"; // SOLVING or FINISHED
    
 // Add these fields
    private int score = 1000;
    private boolean completed = false;
    private long completionTime = 0;

    // Add these getters and setters
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    
    public long getCompletionTime() { return completionTime; }
    public void setCompletionTime(long completionTime) { this.completionTime = completionTime; }
}