package com.shivansh.EliteCode.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.*;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "problems",
        indexes = {
                @Index(columnList = "difficulty"),
                @Index(columnList = "hash"),
                @Index(columnList = "createdAt"),
                @Index(columnList = "deleted"),
                @Index(columnList = "deleted, createdAt")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(columnDefinition = "TEXT", nullable = false)
    private String originalText;

    @Column(columnDefinition = "TEXT")
    private String normalizedText;  // nullable if not generated yet

    @NotBlank
    @Column(length = 128, unique = true, nullable = false)
    private String hash;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Difficulty difficulty;   // EASY, MEDIUM, HARD

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "problem_tags", joinColumns = @JoinColumn(name = "problem_id"))
    @Column(name = "tag", nullable = false)
    private Set<String> tags = new HashSet<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private boolean deleted = false;

    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AIResponse> aiResponses = new ArrayList<>();

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Attempt> attempts = new ArrayList<>();

    public enum Difficulty {
        EASY, MEDIUM, HARD
    }

    @ElementCollection
    @CollectionTable(name = "problem_test_cases", joinColumns = @JoinColumn(name = "problem_id"))
    @OrderColumn(name = "test_order")
    private List<TestCase> testCases = new ArrayList<>();

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestCase {
        @Lob
        @Column(columnDefinition = "TEXT")
        private String input;

        @Lob
        @Column(columnDefinition = "TEXT")
        private String expectedOutput;
    }
}
