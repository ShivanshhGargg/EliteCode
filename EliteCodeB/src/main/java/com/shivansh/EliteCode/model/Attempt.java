package com.shivansh.EliteCode.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "attempts", indexes = {
        @Index(columnList = "user_id"),
        @Index(columnList = "problem_id"),
        @Index(columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user", "problem"})
public class Attempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    @NotNull
    private Problem problem;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @NotNull
    private Mode mode;

    @NotBlank
    @Column(columnDefinition = "TEXT", nullable = false)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private AttemptResult result;

    @PositiveOrZero
    @Column(nullable = false)
    private double executionTime;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private AttemptStatus status;  // PENDING, SUCCESS, FAILED

    @OneToOne(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private Feedback feedback;

    public enum AttemptStatus {
        PENDING,    // Submitted, waiting for evaluation
        RUNNING,    // Currently being evaluated (e.g., running tests)
        COMPLETED,  // Evaluation finished, result is available
        FAILED      // Evaluation failed (e.g., compile error, internal error)
    }

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Language language;

    public enum AttemptResult {
        ACCEPTED, WRONG_ANSWER, TIME_LIMIT_EXCEEDED, MEMORY_LIMIT_EXCEEDED, RUNTIME_ERROR, COMPILATION_ERROR
    }

    @PrePersist
    @PreUpdate
    private void validate() {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Code cannot be blank");
        }
        if (user == null) throw new IllegalArgumentException("User required");
        if (problem == null) throw new IllegalArgumentException("Problem required");
        if (mode == null) throw new IllegalArgumentException("Mode required");
        if (status == null) throw new IllegalArgumentException("Status required");
    }
}