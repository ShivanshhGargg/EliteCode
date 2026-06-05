package com.shivansh.EliteCode.mapper;

import com.shivansh.EliteCode.dto.response.execution.HintResponse;
import com.shivansh.EliteCode.model.AIResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface HintMapper {

    @Mapping(target = "aiResponseId", source = "id")
    @Mapping(target = "problemId", expression = "java(response.getProblem() == null ? null : response.getProblem().getId())")
    @Mapping(target = "attemptId", expression = "java(response.getAttempt() == null ? null : response.getAttempt().getId())")
    @Mapping(target = "hint", source = "response")
    HintResponse toResponse(AIResponse response);
}
