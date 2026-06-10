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
    @Transactional
    public Account upsertOAuthAccount(String provider, String providerId, String email, String firstName, String lastName) {
        // 1. First, try to find an existing Account linked to this OAuth provider
        Optional<Account> existingAccount = accountRepository.findByUserEmailAndProvider(email, provider);

        if (existingAccount.isPresent()) {
            // Account already linked, just return it
            return existingAccount.get();
        }

        // 2. If not found, check if a User already exists with this email via a local account
        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            // User exists via local auth: Link the OAuth provider to this existing user
            User user = existingUser.get();
            Account newLinkedAccount = Account.builder()
                    .user(user)
                    .provider(provider)
                    .providerId(providerId)
                    .role(Account.Role.USER)
                    .emailVerified(true) // Google emails are already verified
                    .enabled(true)
                    .accountNonLocked(true)
                    .loginAttempts(0)
                    .build();
            user.addAccount(newLinkedAccount);
            return accountRepository.save(newLinkedAccount);
        }

        // 3. No existing user or account found: Create a brand-new user and link the OAuth account
        User newUser = User.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .build();

        Account newAccount = Account.builder()
                .user(newUser)
                .provider(provider)
                .providerId(providerId)
                .role(Account.Role.USER)
                .emailVerified(true)
                .enabled(true)
                .accountNonLocked(true)
                .build();

        newUser.addAccount(newAccount);
        return accountRepository.save(newAccount);
    }
}