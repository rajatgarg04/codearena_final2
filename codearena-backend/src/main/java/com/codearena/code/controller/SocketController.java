package com.codearena.code.controller;

import com.codearena.code.dto.RoomMessage;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class SocketController {

    // Handles Players Joining/Leaving and Chat Messages in the Lobby
    @MessageMapping("/room/{roomId}/send")
    @SendTo("/topic/room/{roomId}")
    public RoomMessage sendMessage(@DestinationVariable String roomId, @Payload RoomMessage message) {
        // We simply take the message from one user and broadcast it to the whole room topic
        return message; 
    }
    
    // Handles Live Code Synchronization in the Arena
    @MessageMapping("/room/{roomId}/code")
    @SendTo("/topic/room/{roomId}/code")
    public RoomMessage syncCode(@DestinationVariable String roomId, @Payload RoomMessage message) {
        return message; 
    }
}