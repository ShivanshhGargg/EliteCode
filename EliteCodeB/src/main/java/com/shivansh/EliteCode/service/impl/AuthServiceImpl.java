package com.shivansh.EliteCode.service.impl;

import com.shivansh.EliteCode.config.JwtConfig;
import com.shivansh.EliteCode.dto.request.auth.LoginRequest;
import com.shivansh.EliteCode.dto.request.auth.RegisterRequest;
import com.shivansh.EliteCode.dto.response.auth.TokenPair;
import com.shivansh.EliteCode.dto.response.auth.TwoFactorSetupResponse;
import com.shivansh.EliteCode.exception.CustomExceptions;
import com.shivansh.EliteCode.model.Account;
import com.shivansh.EliteCode.model.User;
import com.shivansh.EliteCode.repository.AccountRepository;
import com.shivansh.EliteCode.repository.UserRepository;
import com.shivansh.EliteCode.service.AuthService;
import com.shivansh.EliteCode.service.EmailService;
import com.shivansh.EliteCode.security.JwtTokenProvider;
import com.shivansh.EliteCode.service.OAuthAccountService;
import com.shivansh.EliteCode.util.Constants;
import com.shivansh.EliteCode.util.HashUtil;
import com.shivansh.EliteCode.util.TotpUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final JwtConfig jwtConfig;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final OAuthAccountService oAuthAccountService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${oauth.google.client-ids:}")
    private String googleClientIds;

    @Value("${oauth.google.tokeninfo-url:https://oauth2.googleapis.com/tokeninfo}")
    private String googleTokenInfoUrl;

    @Value("${oauth.github.api-base:https://api.github.com}")
    private String githubApiBase;

    @Value("${elitecode.app.name:EliteCode}")
    private String appName;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Override
    public TokenPair login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found"));

        Account account = accountRepository.findByUserEmailAndProvider(request.email(), Constants.LOCAL_PROVIDER)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Local account not found"));

        // Block login if email not verified
        if (!account.isEmailVerified()) {
            throw new CustomExceptions.BadRequestException("Please verify your email before logging in.");
        }

        if (account.isLocked()) {
            if (account.getLockedUntil() != null && account.getLockedUntil().isBefore(LocalDateTime.now())) {
                account.resetLoginAttempts();
                account.setAccountNonLocked(true);
            } else {
                log.warn("Login blocked: account locked for email {}", request.email());
                throw new CustomExceptions.BadRequestException("Account is locked");
            }
        }

        if (!passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            account.incrementLoginAttempts();
            if (account.getLoginAttempts() >= 5) {
                account.lockAccount(Duration.ofMinutes(15));
            }
            accountRepository.save(account);
            log.warn("Login failed: invalid credentials for email {}", request.email());
            throw new CustomExceptions.BadRequestException("Invalid credentials");
        }

        verifyTotpIfEnabled(account, request.totpCode());

        account.resetLoginAttempts();
        account.setAccountNonLocked(true);
        account.setLastLoginAt(LocalDateTime.now());
        accountRepository.save(account);

        return issueTokenPair(user, account);
    }

    @Override
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new CustomExceptions.BadRequestException("Email already registered");
        }

        User user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .build();

        String verificationToken = UUID.randomUUID().toString();
        LocalDateTime verificationSentAt = LocalDateTime.now();

        Account account = Account.builder()
                .provider(Constants.LOCAL_PROVIDER)
                .role(Account.Role.USER)
                .passwordHash(passwordEncoder.encode(request.password()))
                .emailVerified(false)
                .enabled(true)
                .accountNonLocked(true)
                .loginAttempts(0)
                .emailVerificationToken(verificationToken)
                .emailVerificationSentAt(verificationSentAt)
                .emailVerificationTokenExpiresAt(verificationSentAt.plusHours(24))
                .build();

        user.addAccount(account);
        userRepository.save(user);
        accountRepository.save(account);

        // Send verification email (no token issuance)
        try {
            emailService.sendVerificationEmail(user.getEmail(), verificationToken);
            log.info("Verification email sent to {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send verification email", e);
            // Don't throw – user can request resend
        }
    }

    @Override
    public void verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new CustomExceptions.BadRequestException("Verification token missing");
        }

        Account account = accountRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Invalid verification token"));

        LocalDateTime expiresAt = account.getEmailVerificationTokenExpiresAt();
        if (expiresAt == null || expiresAt.isBefore(LocalDateTime.now())) {
            throw new CustomExceptions.BadRequestException("Verification token expired");
        }

        account.setEmailVerified(true);
        account.setEmailVerificationToken(null);
        account.setEmailVerificationSentAt(null);
        account.setEmailVerificationTokenExpiresAt(null);
        accountRepository.save(account);
    }

    @Override
    public void resendVerificationEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new CustomExceptions.BadRequestException("Email missing");
        }

        Account account = accountRepository.findByUserEmailAndProvider(email, Constants.LOCAL_PROVIDER)
                .orElse(null);
        if (account == null || account.isEmailVerified()) {
            return;
        }

        String verificationToken = UUID.randomUUID().toString();
        LocalDateTime sentAt = LocalDateTime.now();
        account.setEmailVerificationToken(verificationToken);
        account.setEmailVerificationSentAt(sentAt);
        account.setEmailVerificationTokenExpiresAt(sentAt.plusHours(24));
        accountRepository.save(account);

        try {
            emailService.sendVerificationEmail(account.getUser().getEmail(), verificationToken);
            log.info("Verification email re-sent to {}", account.getUser().getEmail());
        } catch (Exception e) {
            log.error("Failed to resend verification email – ignoring for development", e);
        }
    }

    @Override
    public void requestPasswordReset(String email) {
        if (email == null || email.isBlank()) {
            throw new CustomExceptions.BadRequestException("Email missing");
        }

        Account account = accountRepository.findByUserEmailAndProvider(email, Constants.LOCAL_PROVIDER)
                .orElse(null);
        if (account == null) {
            return;
        }

        String resetToken = UUID.randomUUID().toString();
        LocalDateTime requestedAt = LocalDateTime.now();
        account.setPasswordResetToken(resetToken);
        account.setPasswordResetRequestedAt(requestedAt);
        account.setPasswordResetTokenExpiresAt(requestedAt.plusHours(1));
        accountRepository.save(account);

        try {
            emailService.sendPasswordResetEmail(account.getUser().getEmail(), resetToken);
            log.info("Password reset email sent to {}", account.getUser().getEmail());
        } catch (Exception e) {
            log.error("Failed to send password reset email – ignoring for development", e);
        }
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new CustomExceptions.BadRequestException("Reset token missing");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new CustomExceptions.BadRequestException("New password missing");
        }

        Account account = accountRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Invalid reset token"));

        LocalDateTime expiresAt = account.getPasswordResetTokenExpiresAt();
        if (expiresAt == null || expiresAt.isBefore(LocalDateTime.now())) {
            throw new CustomExceptions.BadRequestException("Reset token expired");
        }

        account.setPasswordHash(passwordEncoder.encode(newPassword));
        account.setPasswordChangedAt(LocalDateTime.now());
        account.setPasswordResetToken(null);
        account.setPasswordResetRequestedAt(null);
        account.setPasswordResetTokenExpiresAt(null);
        account.setRefreshTokenHash(null);
        account.setRefreshTokenExpiresAt(null);
        account.resetLoginAttempts();
        account.setAccountNonLocked(true);
        accountRepository.save(account);
    }

    @Override
    public TokenPair loginWithGoogle(String idToken, String totpCode) {
        GoogleTokenInfo tokenInfo = verifyGoogleToken(idToken);
        Account account;
        try {
            account = oAuthAccountService.upsertOAuthAccount(
                    "google", tokenInfo.providerId(), tokenInfo.email(),
                    tokenInfo.firstName(), tokenInfo.lastName());
        } catch (DataIntegrityViolationException e) {
            // Duplicate key on account creation – fetch the existing account
            log.warn("Duplicate account creation for {} / google, fetching existing", tokenInfo.email());
            account = accountRepository.findByUserEmailAndProvider(tokenInfo.email(), "google")
                    .orElseThrow(() -> new CustomExceptions.BadRequestException("Failed to create account, please retry"));
        }
        ensureAccountActive(account);
        verifyTotpIfEnabled(account, totpCode);
        return issueTokenPair(account.getUser(), account);
    }

    @Override
    public TokenPair loginWithGithub(String accessToken, String totpCode) {
        GithubProfile profile = fetchGithubProfile(accessToken);
        Account account = oAuthAccountService.upsertOAuthAccount(
                "github", profile.providerId(), profile.email(),
                profile.firstName(), profile.lastName());
        ensureAccountActive(account);
        verifyTotpIfEnabled(account, totpCode);
        return issueTokenPair(account.getUser(), account);
    }

    @Override
    public TwoFactorSetupResponse setupTwoFactor(UUID userId) {
        Account account = findPrimaryAccount(userId);
        String secret = TotpUtil.generateSecret();
        account.setTotpSecret(secret);
        account.setTwoFactorEnabled(false);
        accountRepository.save(account);
        String otpauthUrl = TotpUtil.buildOtpAuthUrl(appName, account.getUser().getEmail(), secret);
        return new TwoFactorSetupResponse(secret, otpauthUrl);
    }

    @Override
    public void enableTwoFactor(UUID userId, String totpCode) {
        Account account = findPrimaryAccount(userId);
        if (account.getTotpSecret() == null || account.getTotpSecret().isBlank()) {
            throw new CustomExceptions.BadRequestException("2FA is not set up");
        }
        if (TotpUtil.isValidCode(account.getTotpSecret(), totpCode)) {
            throw new CustomExceptions.BadRequestException("Invalid 2FA code");
        }
        account.setTwoFactorEnabled(true);
        accountRepository.save(account);
    }

    @Override
    public void disableTwoFactor(UUID userId, String totpCode) {
        Account account = findPrimaryAccount(userId);
        if (!account.isTwoFactorEnabled()) {
            return;
        }
        if (TotpUtil.isValidCode(account.getTotpSecret(), totpCode)) {
            throw new CustomExceptions.BadRequestException("Invalid 2FA code");
        }
        account.setTwoFactorEnabled(false);
        account.setTotpSecret(null);
        accountRepository.save(account);
    }

    @Override
    public TokenPair refreshToken(String refreshToken) {
        // Validate token and extract claims
        if (jwtTokenProvider.validateToken(refreshToken)) {
            throw new CustomExceptions.BadRequestException("Invalid refresh token");
        }
        Map<String, Object> claims = jwtTokenProvider.extractClaims(refreshToken);
        String tokenType = String.valueOf(claims.get("tokenType"));
        if (!Constants.REFRESH_TOKEN_TYPE.equalsIgnoreCase(tokenType)) {
            throw new CustomExceptions.BadRequestException("Invalid refresh token type");
        }

        String email = String.valueOf(claims.get("email"));
        String userId = String.valueOf(claims.get("userId"));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found"));
        if (!user.getId().toString().equals(userId)) {
            throw new CustomExceptions.BadRequestException("Refresh token does not match user");
        }

        Account account = accountRepository.findByUserEmailAndProvider(email, Constants.LOCAL_PROVIDER)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Local account not found"));

        if (!account.isEnabled() || account.isLocked()) {
            throw new CustomExceptions.BadRequestException("Account is disabled or locked");
        }
        if (!account.isEmailVerified()) {
            throw new CustomExceptions.BadRequestException("Email not verified");
        }

        String oldHash = hashToken(refreshToken);
        if (account.getRefreshTokenHash() == null || !account.getRefreshTokenHash().equals(oldHash)) {
            throw new CustomExceptions.BadRequestException("Refresh token has been rotated or revoked");
        }
        if (account.getRefreshTokenExpiresAt() == null || account.getRefreshTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new CustomExceptions.BadRequestException("Refresh token expired");
        }

        // Issue new token pair (this automatically replaces the refresh token hash)
        return issueTokenPair(user, account);
    }

    @Override
    public void revokeRefreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new CustomExceptions.BadRequestException("Refresh token missing");
        }

        String hash = hashToken(refreshToken);
        Account account = accountRepository.findByRefreshTokenHash(hash)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Token not found"));
        account.setRefreshTokenHash(null);
        account.setRefreshTokenExpiresAt(null);
        accountRepository.save(account);
    }

    private TokenPair issueTokenPair(User user, Account account) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId().toString());
        claims.put("email", user.getEmail());
        claims.put("provider", account.getProvider());
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());
        claims.put("role", account.getRole() == null ? Account.Role.USER.name() : account.getRole().name());
        claims.put("tokenType", Constants.ACCESS_TOKEN_TYPE);

        String accessToken = jwtTokenProvider.createToken(
                user.getEmail(),
                claims,
                Duration.ofMillis(jwtConfig.getExpirationMs())
        );

        long refreshTtl = jwtConfig.getRefreshExpirationMs() > 0
                ? jwtConfig.getRefreshExpirationMs()
                : Duration.ofDays(7).toMillis();
        Map<String, Object> refreshClaims = new HashMap<>();
        refreshClaims.put("userId", user.getId().toString());
        refreshClaims.put("email", user.getEmail());
        refreshClaims.put("tokenType", Constants.REFRESH_TOKEN_TYPE);
        String refreshToken = jwtTokenProvider.createToken(
                user.getEmail(),
                refreshClaims,
                Duration.ofMillis(refreshTtl)
        );

        // Store the new refresh token hash (overwrites the old one)
        account.setRefreshTokenHash(hashToken(refreshToken));
        account.setRefreshTokenExpiresAt(LocalDateTime.now().plusSeconds(refreshTtl / 1000));
        accountRepository.save(account);

        return new TokenPair(
                accessToken,
                "Bearer",
                jwtConfig.getExpirationMs() / 1000,
                refreshToken,
                user.getId(),
                user.getEmail()
        );
    }

    private String hashToken(String value) {
        return HashUtil.sha256(value);
    }

    private void verifyTotpIfEnabled(Account account, String totpCode) {
        if (account.isTwoFactorEnabled()) {
            if (!TotpUtil.isValidCode(account.getTotpSecret(), totpCode)) {
                throw new CustomExceptions.BadRequestException("Invalid 2FA code");
            }
        }
    }

    private void ensureAccountActive(Account account) {
        if (!account.isEnabled() || account.isLocked()) {
            throw new CustomExceptions.BadRequestException("Account is disabled or locked");
        }
    }

    private Account findPrimaryAccount(UUID userId) {
        return accountRepository.findByUserIdAndProvider(userId, Constants.LOCAL_PROVIDER)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("User not found"));
                    return user.getAccounts().stream()
                            .findFirst()
                            .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Account not found"));
                });
    }

    private GoogleTokenInfo verifyGoogleToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new CustomExceptions.BadRequestException("idToken missing");
        }
        try {
            String url = googleTokenInfoUrl + "?id_token=" + idToken;
            JsonNode node = getJson(url, null);
            String email = node.path("email").asText(null);
            boolean emailVerified = node.path("email_verified").asBoolean(false);
            String aud = node.path("aud").asText(null);
            String sub = node.path("sub").asText(null);
            String givenName = node.path("given_name").asText(null);
            String familyName = node.path("family_name").asText(null);

            if (!emailVerified) {
                throw new CustomExceptions.BadRequestException("Google email not verified");
            }
            if (!isAllowedGoogleClient(aud)) {
                throw new CustomExceptions.BadRequestException("Invalid Google client");
            }
            return new GoogleTokenInfo(sub, email, givenName, familyName);
        } catch (CustomExceptions.BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new CustomExceptions.BadRequestException("Failed to verify Google token");
        }
    }

    private GithubProfile fetchGithubProfile(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new CustomExceptions.BadRequestException("accessToken missing");
        }
        try {
            String userUrl = githubApiBase + "/user";
            JsonNode userNode = getJson(userUrl, Map.of(
                    "Authorization", "Bearer " + accessToken,
                    "Accept", "application/vnd.github+json"
            ));
            String id = userNode.path("id").asText(null);
            String name = userNode.path("name").asText(null);
            String login = userNode.path("login").asText(null);
            String email = userNode.path("email").asText(null);

            if (email == null || email.isBlank()) {
                String emailsUrl = githubApiBase + "/user/emails";
                JsonNode emailsNode = getJson(emailsUrl, Map.of(
                        "Authorization", "Bearer " + accessToken,
                        "Accept", "application/vnd.github+json"
                ));
                for (JsonNode entry : emailsNode) {
                    if (entry.path("primary").asBoolean(false) && entry.path("verified").asBoolean(false)) {
                        email = entry.path("email").asText(null);
                        break;
                    }
                }
            }

            if (email == null || email.isBlank()) {
                throw new CustomExceptions.BadRequestException("GitHub email not available");
            }

            String firstName = null;
            String lastName = null;
            if (name != null && !name.isBlank()) {
                String[] parts = name.trim().split("\\s+", 2);
                firstName = parts[0];
                if (parts.length > 1) {
                    lastName = parts[1];
                }
            } else if (login != null && !login.isBlank()) {
                firstName = login;
            }
            return new GithubProfile(id, email, firstName, lastName);
        } catch (CustomExceptions.BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new CustomExceptions.BadRequestException("Failed to verify GitHub token");
        }
    }

    private JsonNode getJson(String url, Map<String, String> headers) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET();
        if (headers != null) {
            headers.forEach(builder::header);
        }
        HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Request failed: " + response.statusCode());
        }
        return objectMapper.readTree(response.body());
    }

    private boolean isAllowedGoogleClient(String aud) {
        if (aud == null || aud.isBlank()) {
            return false;
        }
        if (googleClientIds == null || googleClientIds.isBlank()) {
            return false;
        }
        String[] allowed = googleClientIds.split(",");
        for (String clientId : allowed) {
            if (aud.equals(clientId.trim())) {
                return true;
            }
        }
        return false;
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        Account account = accountRepository.findByUserIdAndProvider(userId, Constants.LOCAL_PROVIDER)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException("Local account not found"));
        if (!passwordEncoder.matches(currentPassword, account.getPasswordHash())) {
            throw new CustomExceptions.BadRequestException("Current password is incorrect");
        }
        account.setPasswordHash(passwordEncoder.encode(newPassword));
        account.setPasswordChangedAt(LocalDateTime.now());
        // Invalidate all refresh tokens for this account
        account.setRefreshTokenHash(null);
        account.setRefreshTokenExpiresAt(null);
        accountRepository.save(account);
    }

    private record GoogleTokenInfo(String providerId, String email, String firstName, String lastName) {
    }

    private record GithubProfile(String providerId, String email, String firstName, String lastName) {
    }
}
