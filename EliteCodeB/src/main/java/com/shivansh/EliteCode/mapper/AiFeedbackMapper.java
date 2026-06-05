package com.shivansh.EliteCode.mapper;

import com.shivansh.EliteCode.dto.response.execution.AiFeedbackResponse;
import com.shivansh.EliteCode.model.Feedback;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AiFeedbackMapper {

    @Mapping(target = "attemptId", source = "attempt.id")
    AiFeedbackResponse toResponse(Feedback feedback);
}
