package com.shivansh.EliteCode.controller;

import com.shivansh.EliteCode.dto.request.problem.CreateProblemRequest;
import com.shivansh.EliteCode.dto.request.problem.UpdateProblemRequest;
import com.shivansh.EliteCode.dto.response.common.PageResponse;
import com.shivansh.EliteCode.dto.response.problem.ProblemResponse;
import com.shivansh.EliteCode.dto.response.problem.ProblemTestCaseResponse;
import com.shivansh.EliteCode.model.Problem;
import com.shivansh.EliteCode.service.ProblemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    @GetMapping
    @Operation(summary = "List problems")
    @ApiResponse(responseCode = "200", description = "Problems retrieved")
    public ResponseEntity<PageResponse<ProblemResponse>> listProblems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Problem.Difficulty difficulty,
            @RequestParam(required = false) String tags) {   // e.g. "array,dp,string"
        List<String> tagList = (tags == null || tags.isBlank())
                ? List.of()
                : Arrays.asList(tags.split(","));
        return ResponseEntity.ok(problemService.listProblems(page, size, difficulty, tagList));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get problem by id")
    @ApiResponse(responseCode = "200", description = "Problem retrieved")
    public ResponseEntity<ProblemResponse> getById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(problemService.getById(id));
    }

    @GetMapping("/{id}/test-cases")
    @Operation(summary = "Get problem test cases")
    @ApiResponse(responseCode = "200", description = "Problem test cases retrieved")
    public ResponseEntity<List<ProblemTestCaseResponse>> getTestCases(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(problemService.getTestCases(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    @Operation(summary = "Create problem")
    @ApiResponse(responseCode = "200", description = "Problem created")
    public ResponseEntity<ProblemResponse> createProblem(@Valid @RequestBody CreateProblemRequest request) {
        return ResponseEntity.ok(problemService.createProblem(request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    @Operation(summary = "Update problem")
    @ApiResponse(responseCode = "200", description = "Problem updated")
    public ResponseEntity<ProblemResponse> updateProblem(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateProblemRequest request) {
        return ResponseEntity.ok(problemService.updateProblem(id, request));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete problem")
    @ApiResponse(responseCode = "204", description = "Problem deleted")
    public ResponseEntity<Void> deleteProblem(@PathVariable("id") UUID id) {
        problemService.deleteProblem(id);
        return ResponseEntity.noContent().build();
    }
}
