package com.shivansh.EliteCode.mapper;

import com.shivansh.EliteCode.dto.response.problem.ProblemResponse;
import com.shivansh.EliteCode.dto.response.problem.ProblemTestCaseResponse;
import com.shivansh.EliteCode.model.Problem;
import java.util.List;
import java.util.Set;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProblemMapper {

    @Mapping(target = "tags", expression = "java(mapTags(problem.getTags()))")
    ProblemResponse toResponse(Problem problem);

    List<ProblemTestCaseResponse> toTestCaseResponses(List<Problem.TestCase> testCases);

    default Set<String> mapTags(Set<String> tags) {
        return tags == null ? Set.of() : Set.copyOf(tags);
    }
}
