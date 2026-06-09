package com.shivansh.EliteCode.service;

import com.shivansh.EliteCode.dto.leetcode.LeetCodeGraphQLResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class LeetCodeTagService {

    private final RestClient restClient = RestClient.create();

    private static final int PAGE_SIZE = 100;

    public List<LeetCodeGraphQLResponse.Question> fetchAllProblemsWithTags() {
        List<LeetCodeGraphQLResponse.Question> allQuestions = new ArrayList<>();
        int skip = 0;
        int total = Integer.MAX_VALUE;

        while (skip < total) {
            String query = """
            {
              problemsetQuestionList: questionList(
                categorySlug: ""
                limit: %d
                skip: %d
                filters: {}
              ) {
                totalNum
                questions: data {
                  title
                  topicTags { name }
                }
              }
            }
            """.formatted(PAGE_SIZE, skip);

            log.info("Fetching page: skip={}, limit={}", skip, PAGE_SIZE);
            LeetCodeGraphQLResponse response = restClient.post()
                    .uri("https://leetcode.com/graphql")
                    .body(Map.of("query", query))
                    .retrieve()
                    .body(LeetCodeGraphQLResponse.class);

            if (response == null || response.getData() == null) {
                log.error("No response for skip={}", skip);
                break;
            }

            var pageData = response.getData().getProblemsetQuestionList();
            if (pageData.getQuestions() == null || pageData.getQuestions().isEmpty()) {
                break;
            }

            allQuestions.addAll(pageData.getQuestions());
            total = pageData.getTotal();
            skip += PAGE_SIZE;
            log.info("Fetched {} problems, total available: {}", allQuestions.size(), total);
        }

        log.info("Finished fetching. Total problems from LeetCode: {}", allQuestions.size());
        return allQuestions;
    }
}