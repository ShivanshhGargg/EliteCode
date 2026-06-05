package com.shivansh.EliteCode.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "topic"}),
        indexes = {
                @Index(columnList = "user_id"),
                @Index(columnList = "topic"),
                @Index(columnList = "user_id, topic")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "user")
public class UserProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull
    private User user;

    @NotBlank
    @Column(length = 100, nullable = false)
    private String topic;

    @Min(0)
    @Column(nullable = false)
    private int attempts = 0;

    @Min(0) @Max(1)
    @Column(nullable = false)
    private double successRate = 0.0;   // 0.75 = 75%   // percentage (0-100)

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime lastPracticed;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void addAttempt(boolean success) {
        this.attempts++;
        // successRate is stored as percentage (0-100)
        this.successRate = ((this.successRate * (this.attempts - 1)) + (success ? 100 : 0)) / (float) this.attempts;
        this.lastPracticed = LocalDateTime.now();
    }
}