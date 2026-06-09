package com.shivansh.EliteCode.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shivansh.EliteCode.exception.CustomExceptions;
import com.shivansh.EliteCode.model.ChatMessage;
import com.shivansh.EliteCode.model.ChatSession;
import com.shivansh.EliteCode.model.Mode;
import com.shivansh.EliteCode.model.Problem;
import com.shivansh.EliteCode.model.User;
import com.shivansh.EliteCode.repository.ChatMessageRepository;
import com.shivansh.EliteCode.repository.ChatSessionRepository;
import com.shivansh.EliteCode.repository.ProblemRepository;
import com.shivansh.EliteCode.repository.UserRepository;
import com.shivansh.EliteCode.service.ChatService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatSessionRepository sessionRepo;
    private final ChatMessageRepository messageRepo;
    private final UserRepository userRepo;
    private final ProblemRepository problemRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public ChatSession createSession(UUID userId, Mode mode, UUID problemId, String title) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found"));
        Problem problem = problemId != null ? problemRepo.findById(problemId).orElse(null) : null;
        ChatSession session = new ChatSession();
        session.setUser(user);
        session.setMode(mode);
        session.setProblem(problem);
        session.setTitle(title != null ? title : mode + " Chat");
        return sessionRepo.save(session);
    }

    @Override
    public List<ChatSession> getUserSessions(UUID userId) {
        return sessionRepo.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    @Override
    public ChatSession getFullSession(UUID sessionId, UUID userId) {
        Optional<ChatSession> optional = sessionRepo.findByIdAndUserId(sessionId, userId);
        if (!optional.isPresent()) {
            throw new CustomExceptions.ResourceNotFoundException("Session not found");
        }
        ChatSession session = optional.get();
        session.getMessages().size(); // force load messages
        return session;
    }

    @Override
    public ChatMessage addMessage(UUID sessionId, UUID userId, String role, String content, List<Map<String, Object>> problemSuggestions) {
        Optional<ChatSession> optional = sessionRepo.findByIdAndUserId(sessionId, userId);
        if (!optional.isPresent()) {
            throw new CustomExceptions.ResourceNotFoundException("Session not found");
        }
        ChatSession session = optional.get();
        ChatMessage msg = new ChatMessage();
        msg.setSession(session);
        msg.setRole(role);
        msg.setContent(content);
        msg.setTimestamp(LocalDateTime.now());
        if (problemSuggestions != null) {
            msg.setProblemSuggestions(convertToJson(problemSuggestions));
        }
        ChatMessage saved = messageRepo.save(msg);
        session.setUpdatedAt(LocalDateTime.now());
        sessionRepo.save(session);
        return saved;
    }

    @Override
    public void updateTitle(UUID sessionId, UUID userId, String title) {
        Optional<ChatSession> optional = sessionRepo.findByIdAndUserId(sessionId, userId);
        if (!optional.isPresent()) {
            throw new CustomExceptions.ResourceNotFoundException("Session not found");
        }
        ChatSession session = optional.get();
        session.setTitle(title);
        sessionRepo.save(session);
    }

    @Override
    public void deleteSession(UUID sessionId, UUID userId) {
        Optional<ChatSession> optional = sessionRepo.findByIdAndUserId(sessionId, userId);
        if (!optional.isPresent()) {
            throw new CustomExceptions.ResourceNotFoundException("Session not found");
        }
        ChatSession session = optional.get();
        sessionRepo.delete(session);
    }

    private String convertToJson(List<Map<String, Object>> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            throw new CustomExceptions.BadRequestException("Failed to serialize problem suggestions");
        }
    }
}