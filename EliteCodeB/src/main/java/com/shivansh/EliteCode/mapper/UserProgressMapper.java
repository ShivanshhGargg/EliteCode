package com.shivansh.EliteCode.mapper;

import com.shivansh.EliteCode.dto.response.user.UserProgressResponse;
import com.shivansh.EliteCode.model.UserProgress;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserProgressMapper {

    @Mapping(target = "userId", source = "user.id")
    UserProgressResponse toResponse(UserProgress progress);
}
