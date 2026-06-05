package com.shivansh.EliteCode.mapper;

import com.shivansh.EliteCode.dto.response.user.UserProfileResponse;
import com.shivansh.EliteCode.model.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserProfileMapper {

    UserProfileResponse toResponse(User user);
}
