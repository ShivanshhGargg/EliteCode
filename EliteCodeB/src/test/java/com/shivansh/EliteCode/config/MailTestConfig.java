package com.shivansh.EliteCode.config;

import com.shivansh.EliteCode.service.EmailService;
import com.shivansh.EliteCode.service.impl.EmailServiceImpl;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class MailTestConfig {

    @Bean
    @Primary
    public EmailService emailService() {
        // For tests, you can return a mock that doesn't call the real API
        return new EmailService() {
            @Override
            public void sendVerificationEmail(String to, String token) {
                // No-op for tests
            }

            @Override
            public void sendPasswordResetEmail(String to, String token) {
                // No-op for tests
            }
        };
    }
}