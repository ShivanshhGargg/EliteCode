package com.shivansh.EliteCode.imports;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shivansh.EliteCode.model.Problem;
import com.shivansh.EliteCode.repository.ProblemRepository;
import com.shivansh.EliteCode.util.HashUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class JsonProblemImporter {

    private final ProblemRepository problemRepository;

    // Create ObjectMapper locally to avoid bean dependency issues
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public void importFromJson(InputStream jsonStream) throws Exception {
        List<Map<String, Object>> problemsJson = objectMapper.readValue(jsonStream, new TypeReference<>() {});

        int imported = 0;
        int skipped = 0;

        for (Map<String, Object> json : problemsJson) {
            String title = (String) json.get("title");
            String content = (String) json.get("content");
            String difficultyStr = (String) json.get("difficulty");
            List<String> tags = (List<String>) json.get("tags");
            List<Map<String, String>> testCasesJson = (List<Map<String, String>>) json.get("testCases");

            // Build hash for duplicate detection
            String tagsString = tags == null ? "" : tags.stream().sorted().collect(Collectors.joining(","));
            String hashPayload = String.join("|",
                    title,
                    content,
                    difficultyStr,
                    tagsString
            );
            String hash = HashUtil.sha256(hashPayload);

            if (problemRepository.findByHash(hash).isPresent()) {
                skipped++;
                continue;
            }

            Problem problem = new Problem();
            problem.setTitle(title);
            problem.setOriginalText(content);
            problem.setNormalizedText(content); // can be improved later with AI normalization
            problem.setDifficulty(Problem.Difficulty.valueOf(difficultyStr.toUpperCase()));
            problem.setTags(tags == null ? new HashSet<>() : new HashSet<>(tags));
            problem.setHash(hash);

            List<Problem.TestCase> testCases = new ArrayList<>();
            if (testCasesJson != null) {
                for (Map<String, String> tc : testCasesJson) {
                    String input = tc.getOrDefault("input", "");
                    String expected = tc.getOrDefault("expectedOutput", "");
                    testCases.add(new Problem.TestCase(input, expected));
                }
            }
            problem.setTestCases(testCases);

            problemRepository.save(problem);
            imported++;
            log.info("Imported: {}", title);
        }

        log.info("JSON import finished. Imported: {}, Skipped (duplicate): {}", imported, skipped);
    }
}