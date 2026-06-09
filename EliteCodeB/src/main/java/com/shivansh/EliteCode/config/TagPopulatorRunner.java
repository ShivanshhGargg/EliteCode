package com.shivansh.EliteCode.config;

import com.shivansh.EliteCode.dto.leetcode.LeetCodeGraphQLResponse;
import com.shivansh.EliteCode.model.Problem;
import com.shivansh.EliteCode.repository.ProblemRepository;
import com.shivansh.EliteCode.service.LeetCodeTagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Component
@Profile("fetch-tags")
@RequiredArgsConstructor
@Slf4j
public class TagPopulatorRunner implements CommandLineRunner {

    private final LeetCodeTagService tagService;
    private final ProblemRepository problemRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("=== Starting tag population from LeetCode ===");

        // 1. Fetch all problems with tags from LeetCode (paginated)
        List<LeetCodeGraphQLResponse.Question> questions = tagService.fetchAllProblemsWithTags();
        if (questions.isEmpty()) {
            log.error("No questions fetched from LeetCode. Aborting.");
            return;
        }

        Map<String, List<String>> titleToTags = new HashMap<>();
        for (var q : questions) {
            List<String> tags = q.getTopicTags().stream()
                    .map(LeetCodeGraphQLResponse.TopicTag::getName)
                    .collect(Collectors.toList());
            titleToTags.put(q.getTitle(), tags);
        }
        log.info("Fetched {} problem titles with tags from LeetCode.", titleToTags.size());

        // 2. Load all problems from your database
        List<Problem> dbProblems = problemRepository.findAll();
        log.info("Found {} problems in database.", dbProblems.size());

        // 3. Clear existing tags (optional – comment out if you want to keep old ones)
        jdbcTemplate.execute("TRUNCATE TABLE problem_tags");
        log.info("Cleared existing problem_tags.");

        // 4. Insert new tags using batch JDBC
        int matched = 0;
        int totalTags = 0;
        List<Object[]> batchArgs = new ArrayList<>();

        for (Problem problem : dbProblems) {
            String title = problem.getTitle();
            List<String> tags = titleToTags.get(title);
            if (tags != null && !tags.isEmpty()) {
                matched++;
                for (String tag : tags) {
                    batchArgs.add(new Object[]{problem.getId(), tag});
                    totalTags++;
                }
            } else {
                log.debug("No tags found for problem: {}", title);
            }
        }

        // Batch insert
        if (!batchArgs.isEmpty()) {
            jdbcTemplate.batchUpdate(
                    "INSERT INTO problem_tags (problem_id, tag) VALUES (?, ?)",
                    batchArgs
            );
        }

        log.info("Tag population completed. Matched {} problems, inserted {} tag rows.", matched, totalTags);
    }
}