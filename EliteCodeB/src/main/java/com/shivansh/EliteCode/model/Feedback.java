package com.shivansh.EliteCode.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "feedback",
        uniqueConstraints = @UniqueConstraint(columnNames = "attempt_id"),
        indexes = {
                @Index(columnList = "attempt_id"),
                @Index(columnList = "createdAt")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "attempt")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)   // or @ManyToOne if multiple feedbacks per attempt
    @JoinColumn(name = "attempt_id", nullable = false)
    @NotNull
    private Attempt attempt;

    @NotBlank
    @Column(columnDefinition = "TEXT", nullable = false)
    private String aiFeedback;

    @Min(0)
    @Max(100)
    @Column(nullable = false)
    private int score;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

