package com.shivansh.EliteCode.service.impl;

import com.shivansh.EliteCode.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${elitecode.app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Override
    @Async("emailExecutor")
    public void sendVerificationEmail(String to, String token) {
        String verificationUrl = baseUrl + "/api/auth/verify-email?token=" + token;
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
    }

    @Override
    @Async("emailExecutor")
    public void sendPasswordResetEmail(String to, String token) {
        String resetUrl = baseUrl + "/reset-password?token=" + token;
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
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("✅ Email sent to {} with subject '{}'", to, subject);
        } catch (Exception e) {
            log.error("❌ Failed to send email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
