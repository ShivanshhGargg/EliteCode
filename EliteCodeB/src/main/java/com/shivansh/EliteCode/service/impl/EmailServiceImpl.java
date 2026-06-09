package com.shivansh.EliteCode.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shivansh.EliteCode.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.from.email}")
    private String fromEmail;

    @Value("${brevo.from.name}")
    private String fromName;

    @Value("${elitecode.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${elitecode.app.base-url:http://localhost:8080}")
    private String backendBaseUrl;

    public EmailServiceImpl() {
        this.restClient = RestClient.builder()
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    @Async("emailExecutor")
    public void sendVerificationEmail(String to, String token) {
        String verificationUrl = backendBaseUrl + "/api/auth/verify-email-link?token=" + token;
        String subject = "Verify your email – EliteCode";
        String htmlContent = String.format("""
                <html>
                <body>
                    <h2>Welcome to EliteCode!</h2>
                    <p>Thank you for registering. Please click the link below to verify your email address:</p>
                    <a href="%s">Verify Email</a>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you did not create an account, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>The EliteCode Team</p>
                </body>
                </html>
                """, verificationUrl);
        sendEmail(to, subject, htmlContent);
    }

    @Override
    @Async("emailExecutor")
    public void sendPasswordResetEmail(String to, String token) {
        String resetUrl = frontendBaseUrl + "/reset-password?token=" + token;
        String subject = "Reset your password – EliteCode";
        String htmlContent = String.format("""
                <html>
                <body>
                    <h2>Reset Your Password</h2>
                    <p>We received a request to reset your password. Click the link below to choose a new one:</p>
                    <a href="%s">Reset Password</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>The EliteCode Team</p>
                </body>
                </html>
                """, resetUrl);
        sendEmail(to, subject, htmlContent);
    }

    private void sendEmail(String to, String subject, String htmlContent) {
        try {
            // Build the request payload as a Map (ObjectMapper is optional here)
            Map<String, Object> payload = Map.of(
                    "sender", Map.of("name", fromName, "email", fromEmail),
                    "to", List.of(Map.of("email", to)),
                    "subject", subject,
                    "htmlContent", htmlContent
            );

            // Send the request
            restClient.post()
                    .uri("https://api.brevo.com/v3/smtp/email")
                    .header("api-key", apiKey)
                    .body(objectMapper.writeValueAsString(payload))
                    .retrieve()
                    .toBodilessEntity();

            log.info("✅ Email sent successfully via Brevo API to: {}", to);
        } catch (Exception e) {
            log.error("❌ Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }
}