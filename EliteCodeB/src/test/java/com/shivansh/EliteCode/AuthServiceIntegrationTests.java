package com.shivansh.EliteCode;

import com.shivansh.EliteCode.dto.request.auth.LoginRequest;
import com.shivansh.EliteCode.dto.request.auth.RegisterRequest;
import com.shivansh.EliteCode.dto.response.auth.TokenPair;
import com.shivansh.EliteCode.exception.CustomExceptions;
import com.shivansh.EliteCode.config.MailTestConfig;
import com.shivansh.EliteCode.repository.AccountRepository;
import com.shivansh.EliteCode.service.AuthService;
import com.shivansh.EliteCode.util.Constants;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(MailTestConfig.class)
class AuthServiceIntegrationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private AccountRepository accountRepository;

    @Test
    void registerLoginAndRefreshTokenFlow() {
        String email = "user" + System.nanoTime() + "@example.com";

        // 1. Register (no tokens returned – email is unverified)
        authService.register(new RegisterRequest("Test", "User", email, "Password123!"));

        // 2. Manually verify the email (simulate clicking the verification link)
        accountRepository.findByUserEmailAndProvider(email, Constants.LOCAL_PROVIDER)
                .ifPresent(account -> {
                    account.setEmailVerified(true);
                    account.setEmailVerificationToken(null);
                    account.setEmailVerificationTokenExpiresAt(null);
                    accountRepository.save(account);
                });

        // 3. Login now returns tokens (email is verified)
        TokenPair loggedIn = authService.login(new LoginRequest(email, "Password123!", null));
        Assertions.assertNotNull(loggedIn.accessToken());
        Assertions.assertNotNull(loggedIn.refreshToken());

        // 4. Refresh token flow
        TokenPair refreshed = authService.refreshToken(loggedIn.refreshToken());
        Assertions.assertNotNull(refreshed.accessToken());
        Assertions.assertNotNull(refreshed.refreshToken());

        // 5. Access token cannot be used as refresh token
        Assertions.assertThrows(CustomExceptions.BadRequestException.class,
                () -> authService.refreshToken(loggedIn.accessToken()));
    }
}
