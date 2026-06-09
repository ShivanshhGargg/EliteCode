package com.shivansh.EliteCode.controller;

import com.shivansh.EliteCode.dto.request.chat.AddMessageRequest;
import com.shivansh.EliteCode.dto.request.chat.CreateSessionRequest;
import com.shivansh.EliteCode.dto.request.chat.TitleRequest;
import com.shivansh.EliteCode.model.ChatMessage;
import com.shivansh.EliteCode.model.ChatSession;
import com.shivansh.EliteCode.security.UserPrincipal;
import com.shivansh.EliteCode.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/sessions")
    public ResponseEntity<ChatSession> createSession(@AuthenticationPrincipal UserPrincipal user,
                                                     @RequestBody CreateSessionRequest req) {
        return ResponseEntity.ok(chatService.createSession(user.getId(), req.mode(), req.problemId(), req.title()));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSession>> getSessions(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(chatService.getUserSessions(user.getId()));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ChatSession> getSession(@AuthenticationPrincipal UserPrincipal user,
                                                  @PathVariable UUID sessionId) {
        return ResponseEntity.ok(chatService.getFullSession(sessionId, user.getId()));
    }

    @PostMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<ChatMessage> addMessage(@AuthenticationPrincipal UserPrincipal user,
                                                  @PathVariable UUID sessionId,
                                                  @RequestBody AddMessageRequest req) {
        return ResponseEntity.ok(chatService.addMessage(sessionId, user.getId(), req.role(), req.content(), req.problemSuggestions()));
    }

    @PutMapping("/sessions/{sessionId}/title")
    public ResponseEntity<Void> updateTitle(@AuthenticationPrincipal UserPrincipal user,
                                            @PathVariable UUID sessionId,
                                            @RequestBody TitleRequest req) {
        chatService.updateTitle(sessionId, user.getId(), req.title());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> deleteSession(@AuthenticationPrincipal UserPrincipal user,
                                              @PathVariable UUID sessionId) {
        chatService.deleteSession(sessionId, user.getId());
        return ResponseEntity.noContent().build();
    }
}