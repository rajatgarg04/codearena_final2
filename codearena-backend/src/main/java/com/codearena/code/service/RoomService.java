package com.codearena.code.service;

import com.codearena.code.entity.Room;
import com.codearena.code.repository.RoomRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class RoomService {
    
    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public Room createRoom() {
        Room room = new Room();
        // Generates a random 6-character code (e.g., "A7F9B2")
        room.setRoomCode(UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        room.setStatus("WAITING");
        room.setStartTime(LocalDateTime.now());
        return roomRepository.save(room);
    }

    public Room getRoom(String roomCode) {
        return roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found!"));
    }
}