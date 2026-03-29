package com.codearena.code.repository;

import com.codearena.code.entity.Leaderboard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeaderboardRepository extends JpaRepository<Leaderboard, Long> {
    List<Leaderboard> findByRoomIdOrderByScoreDescCompletionTimeAsc(String roomId);
    
    // 👇 FIX: Change this to findFirstBy to prevent duplicate crashes!
    Leaderboard findFirstByRoomIdAndPlayerName(String roomId, String playerName);
}