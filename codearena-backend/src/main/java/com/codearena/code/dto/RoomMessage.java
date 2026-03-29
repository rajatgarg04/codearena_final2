package com.codearena.code.dto;

import lombok.Data;

@Data
public class RoomMessage {
    private String type;     // e.g., "JOIN", "LEAVE", "CHAT", "CODE_SYNC"
    private String sender;   // The username of the person sending the message
    private String content;  // The actual chat message OR the raw code block
    private String language; // e.g., "java", "python" (used during code sync)
}