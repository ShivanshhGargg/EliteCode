package com.shivansh.EliteCode.dto.leetcode;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class LeetCodeGraphQLResponse {
    private Data data;

    @lombok.Data
    public static class Data {
        @JsonProperty("problemsetQuestionList")
        private ProblemSetQuestionList problemsetQuestionList;
    }

    @lombok.Data
    public static class ProblemSetQuestionList {
        @JsonProperty("totalNum")
        private int total;          // total number of problems
        private List<Question> questions;
    }

    @lombok.Data
    public static class Question {
        private String title;
        @JsonProperty("topicTags")
        private List<TopicTag> topicTags;
    }

    @lombok.Data
    public static class TopicTag {
        private String name;
    }
}