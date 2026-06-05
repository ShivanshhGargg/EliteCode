package com.shivansh.EliteCode.mapper;

import com.shivansh.EliteCode.dto.response.execution.AttemptResponse;
import com.shivansh.EliteCode.model.Attempt;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AttemptMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "problemId", source = "problem.id")
    AttemptResponse toResponse(Attempt attempt);
}
