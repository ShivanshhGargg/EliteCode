package com.shivansh.EliteCode.service.impl;
import com.shivansh.EliteCode.exception.CustomExceptions;
import com.shivansh.EliteCode.model.Account;
import com.shivansh.EliteCode.model.User;
import com.shivansh.EliteCode.repository.AccountRepository;
import com.shivansh.EliteCode.repository.UserRepository;
import com.shivansh.EliteCode.service.OAuthAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;


@Service
@RequiredArgsConstructor
@Slf4j
public class OAuthAccountServiceImpl implements OAuthAccountService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    @Override
    @Transactional  // still needed for the find+create atomicity
    public Account upsertOAuthAccount(String provider, String providerId, String email,
                                      String firstName, String lastName) {
        // 1. Check existing
        Optional<Account> existing = accountRepository.findByUserEmailAndProvider(email, provider);
        if (existing.isPresent()) {
            Account account = existing.get();
            if (providerId != null && !providerId.isBlank() &&
                    (account.getProviderId() == null || account.getProviderId().isBlank())) {
                account.setProviderId(providerId);
                account.setEmailVerified(true);
                account = accountRepository.save(account);
            }
            return account;
        }

        // 2. Create user if needed
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .firstName(firstName == null || firstName.isBlank() ? "User" : firstName)
                    .lastName(lastName)
                    .email(email)
                    .build();
            return userRepository.saveAndFlush(newUser);
        });

        // 3. Create and flush account directly
        Account newAccount = Account.builder()
                .provider(provider)
                .providerId(providerId)
                .role(Account.Role.USER)
                .emailVerified(true)
                .enabled(true)
                .accountNonLocked(true)
                .loginAttempts(0)
                .build();
        newAccount.setUser(user);   // set the user
        try {
            return accountRepository.saveAndFlush(newAccount);  // 🔥 immediate insert
        } catch (DataIntegrityViolationException e) {
            // Another thread inserted the account – fetch and return it
            log.warn("Duplicate account on insert for {} / {}", email, provider);
            return accountRepository.findByUserEmailAndProvider(email, provider)
                    .orElseThrow(() -> new CustomExceptions.BadRequestException("Failed to create account, please retry"));
        }
    }
}