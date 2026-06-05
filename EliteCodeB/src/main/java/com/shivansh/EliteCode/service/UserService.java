package com.shivansh.EliteCode.service;

import com.shivansh.EliteCode.dto.request.user.UpdateProfileRequest;
import com.shivansh.EliteCode.dto.response.common.PageResponse;
import com.shivansh.EliteCode.dto.response.user.UserProfileResponse;
import com.shivansh.EliteCode.dto.response.user.UserProgressResponse;
import com.shivansh.EliteCode.model.User;

import java.util.UUID;

public interface UserService {

    UserProfileResponse getProfile(UUID userId);

    UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request);

    PageResponse<UserProgressResponse> getUserProgress(UUID userId, int page, int size);

    void removeAccount(UUID userId, UUID accountId);

    void deleteUser(UUID userId);

    User getUserById(UUID id);
}
