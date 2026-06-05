package com.shivansh.EliteCode.service.impl;

import com.shivansh.EliteCode.dto.request.user.UpdateProfileRequest;
import com.shivansh.EliteCode.dto.response.common.PageResponse;
import com.shivansh.EliteCode.dto.response.user.UserProfileResponse;
import com.shivansh.EliteCode.dto.response.user.UserProgressResponse;
import com.shivansh.EliteCode.exception.CustomExceptions;
import com.shivansh.EliteCode.mapper.UserProfileMapper;
import com.shivansh.EliteCode.mapper.UserProgressMapper;
import com.shivansh.EliteCode.model.User;
import com.shivansh.EliteCode.repository.UserRepository;
import com.shivansh.EliteCode.repository.UserProgressRepository;
import com.shivansh.EliteCode.service.UserService;
import com.shivansh.EliteCode.util.PageResponseMapper;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserProgressRepository userProgressRepository;
    private final com.shivansh.EliteCode.repository.AccountRepository accountRepository;
    private final UserProfileMapper userProfileMapper;
    private final UserProgressMapper userProgressMapper;
    private final PageResponseMapper pageResponseMapper;

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found"));
        return userProfileMapper.toResponse(user);
    }

    @Override
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found"));

        userRepository.findByEmail(request.email())
                .filter(existing -> !existing.getId().equals(userId))
                .ifPresent(existing -> { throw new CustomExceptions.ConflictException("Email already in use"); });

        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        return userProfileMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserProgressResponse> getUserProgress(UUID userId, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        return pageResponseMapper.toPageResponse(
                userProgressRepository.findByUserId(userId, pageable),
                userProgressMapper::toResponse
        );
    }

    @Override
    public void removeAccount(UUID userId, UUID accountId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found"));

        var account = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Account not found"));

        if (!account.getUser().getId().equals(userId)) {
            throw new CustomExceptions.BadRequestException("Account does not belong to the current user");
        }

        if (user.getAccounts() != null && user.getAccounts().size() <= 1) {
            throw new CustomExceptions.BadRequestException("Cannot remove the last remaining account");
        }

        user.removeAccount(account);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found"));
        // Optionally soft‑delete – set a deleted flag, or hard delete
        userRepository.delete(user);
    }

    @Override
    public User getUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found"));
    }
}
