package com.shivansh.EliteCode.service;

import com.shivansh.EliteCode.model.ChatMessage;
import com.shivansh.EliteCode.model.ChatSession;
import com.shivansh.EliteCode.model.Mode;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ChatService {
    ChatSession createSession(UUID userId, Mode mode, UUID problemId, String title);
    List<ChatSession> getUserSessions(UUID userId);
    ChatSession getFullSession(UUID sessionId, UUID userId);
    ChatMessage addMessage(UUID sessionId, UUID userId, String role, String content, List<Map<String, Object>> problemSuggestions);
    void updateTitle(UUID sessionId, UUID userId, String title);
    void deleteSession(UUID sessionId, UUID userId);
}