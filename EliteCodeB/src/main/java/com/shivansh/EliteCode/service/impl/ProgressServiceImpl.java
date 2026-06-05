package com.shivansh.EliteCode.service.impl;

import com.shivansh.EliteCode.dto.response.user.UserProgressResponse;
import com.shivansh.EliteCode.exception.CustomExceptions;
import com.shivansh.EliteCode.mapper.UserProgressMapper;
import com.shivansh.EliteCode.model.Attempt;
import com.shivansh.EliteCode.model.Problem;
import com.shivansh.EliteCode.model.User;
import com.shivansh.EliteCode.model.UserProgress;
import com.shivansh.EliteCode.repository.AttemptRepository;
import com.shivansh.EliteCode.repository.UserProgressRepository;
import com.shivansh.EliteCode.repository.UserRepository;
import com.shivansh.EliteCode.service.ProgressService;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ProgressServiceImpl implements ProgressService {

    private final UserProgressRepository userProgressRepository;
    private final UserRepository userRepository;
    private final AttemptRepository attemptRepository;
    private final UserProgressMapper userProgressMapper;

    @Override
    public void updateAfterAttempt(UUID userId, UUID attemptId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found"));
        Attempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Attempt not found"));

        if (!attempt.getUser().getId().equals(userId)) {
            throw new CustomExceptions.BadRequestException("Attempt does not belong to the current user");
        }

        boolean success = attempt.getResult() == Attempt.AttemptResult.ACCEPTED;
        Set<String> topics = resolveTopics(attempt.getProblem());
        UserProgressResponse first = null;

        for (String topic : topics) {
            UserProgress progress = userProgressRepository.findByUserIdAndTopic(userId, topic)
                    .orElseGet(() -> {
                        UserProgress created = new UserProgress();
                        created.setUser(user);
                        created.setTopic(topic);
                        return created;
                    });
            progress.addAttempt(success);
            UserProgress saved = userProgressRepository.save(progress);
            if (first == null) {
                first = userProgressMapper.toResponse(saved);
            }
        }

    }

    private Set<String> resolveTopics(Problem problem) {
        if (problem.getTags() == null || problem.getTags().isEmpty()) {
            return Set.of(problem.getTitle());
        }
        return new LinkedHashSet<>(problem.getTags());
    }
}
