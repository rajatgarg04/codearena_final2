package com.codearena.code.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 👇 Replaced the "*" with your explicit Vercel and Localhost URLs
    	registry.addEndpoint("/ws-arena")
        .setAllowedOrigins(
            "https://codearena-final2.vercel.app", 
            "https://codearena-final2-rajatgarg04s-projects.vercel.app",
            "http://localhost:5173",
            "http://localhost:3000"
        )
        .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }
}