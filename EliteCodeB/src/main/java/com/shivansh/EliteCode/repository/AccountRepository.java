package com.shivansh.EliteCode.repository;

import com.shivansh.EliteCode.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    // Login with email + provider "local"
    Optional<Account> findByUserEmailAndProvider(String email, String provider);

    // Check if user already has an account with a given OAuth provider
    Optional<Account> findByUserIdAndProvider(UUID userId, String provider);

    Optional<Account> findByEmailVerificationToken(String token);

    Optional<Account> findByPasswordResetToken(String token);

    Optional<Account> findByRefreshTokenHash(String refreshTokenHash);

    List<Account> findByUserId(UUID userId);
}
