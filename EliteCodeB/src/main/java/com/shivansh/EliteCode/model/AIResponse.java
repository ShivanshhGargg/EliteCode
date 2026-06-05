package com.shivansh.EliteCode.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "ai_responses",
        indexes = {
                @Index(columnList = "problem_id"),
                @Index(columnList = "createdAt")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "problem")
public class AIResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = true)  
    private Problem problem;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Mode mode;

    @NotBlank(message = "Response cannot be empty")
    @Column(columnDefinition = "TEXT", nullable = false)
    private String response;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id")
    private Attempt attempt;
    
}
