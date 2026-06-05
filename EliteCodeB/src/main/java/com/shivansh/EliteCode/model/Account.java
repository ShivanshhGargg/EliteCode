package com.shivansh.EliteCode.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "accounts",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "provider"}),
        indexes = {
                @Index(columnList = "providerId"),
                @Index(columnList = "emailVerificationToken"),
                @Index(columnList = "passwordResetToken")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "user")   // prevents bidirectional recursion
public class Account {

    public enum Role {
        USER,
        ADMIN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(length = 50, nullable = false)
    private String provider;       // "local", "google", "GitHub"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;

    @Column
    private String providerId;     // for OAuth (null for local)

    @Column
    private String passwordHash;   // null for OAuth-only

    // Email verification (only relevant for "local" provider)
    @Column(nullable = false)
    private boolean emailVerified = false;

    @Column      // increased for longer tokens
    private String emailVerificationToken;

    private LocalDateTime emailVerificationSentAt;

    private LocalDateTime emailVerificationTokenExpiresAt;  // explicit expiry

    @Column
    private String passwordResetToken;

    private LocalDateTime passwordResetRequestedAt;

    private LocalDateTime passwordResetTokenExpiresAt;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(nullable = false)
    private boolean accountNonLocked = true;

    @Column(nullable = false)
    private Integer loginAttempts = 0;

    private LocalDateTime lastLoginAt;

    private LocalDateTime lockedUntil;

    private LocalDateTime passwordChangedAt;

    private boolean twoFactorEnabled = false;

    @Column
    private String totpSecret;     // null if 2FA not enabled

    @Column
    private String refreshTokenHash;

    private LocalDateTime refreshTokenExpiresAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void resetLoginAttempts() {
        this.loginAttempts = 0;
        this.lockedUntil = null;
    }

    public boolean isLocked() {
        return !accountNonLocked || (lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now()));
    }

    public void incrementLoginAttempts() {
        this.loginAttempts = (this.loginAttempts == null ? 0 : this.loginAttempts) + 1;
    }

    public void lockAccount(Duration duration) {
        this.accountNonLocked = false;
        this.lockedUntil = LocalDateTime.now().plus(duration);
    }
}