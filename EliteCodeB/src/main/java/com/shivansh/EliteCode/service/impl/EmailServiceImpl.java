package com.shivansh.EliteCode.service.impl;

import com.shivansh.EliteCode.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from-email:}")
    private String resendFromEmail;

    @Value("${elitecode.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${elitecode.app.base-url:http://localhost:8080}")
    private String backendBaseUrl;

    @Override
    @Async("emailExecutor")
    public void sendVerificationEmail(String to, String token) {
        try {
            String verificationUrl = backendBaseUrl + "/api/auth/verify-email-link?token=" + token;
            String subject = "Verify your email – EliteCode";
            String body = String.format("""
                    Hello,

                    Thank you for registering with EliteCode.
                    Please click the link below to verify your email address:

                    %s

                    This link will expire in 24 hours.

                    If you did not create an account, please ignore this email.

                    Best regards,
                    The EliteCode Team
                    """, verificationUrl);

            sendEmail(to, subject, body);
        } catch (Exception e) {
            log.error("Failed to prepare verification email for {}: {}", to, e.getMessage(), e);
        }
    }

    @Override
    @Async("emailExecutor")
    public void sendPasswordResetEmail(String to, String token) {
        try {
            String resetUrl = frontendBaseUrl + "/reset-password?token=" + token;
            String subject = "Reset your password – EliteCode";
            String body = String.format("""
                    Hello,

                    We received a request to reset your password.
                    Use the link below to set a new password:

                    %s

                    This link will expire in 1 hour.

                    If you did not request a password reset, please ignore this email.

                    Best regards,
                    The EliteCode Team
                    """, resetUrl);

            sendEmail(to, subject, body);
        } catch (Exception e) {
            log.error("Failed to prepare password reset email for {}: {}", to, e.getMessage(), e);
        }
    }

    private void sendEmail(String to, String subject, String body) {
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            sendEmailWithResend(to, subject, body);
            return;
        }

        sendEmailWithSmtp(to, subject, body);
    }

    private void sendEmailWithSmtp(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromEmail != null && !fromEmail.isBlank()) {
                message.setFrom(fromEmail);
            }
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("✅ SMTP email sent to {} with subject '{}'", to, subject);
        } catch (Exception e) {
            log.error("❌ Failed to send SMTP email to {}: {}", to, e.getMessage(), e);
        }
    }

    private void sendEmailWithResend(String to, String subject, String body) {
        try {
            String from = (resendFromEmail != null && !resendFromEmail.isBlank())
                    ? resendFromEmail
                    : fromEmail;
            if (from == null || from.isBlank()) {
                log.error("❌ Resend email not sent to {}: sender email is missing", to);
                return;
            }

            String payload = objectMapper.writeValueAsString(Map.of(
                    "from", from,
                    "to", List.of(to),
                    "subject", subject,
                    "text", body
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("✅ Resend email sent to {} with subject '{}'", to, subject);
                return;
            }

            log.error("❌ Resend email failed for {} with status {}: {}", to, response.statusCode(), response.body());
        } catch (Exception e) {
            log.error("❌ Failed to send Resend email to {}: {}", to, e.getMessage(), e);
        }
    }
}
