package com.shivansh.EliteCode.config;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.io.InputStream;
import java.util.Properties;

import org.jspecify.annotations.NonNull;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@TestConfiguration
public class MailTestConfig {

    @Bean
    public JavaMailSender javaMailSender() {
        return new JavaMailSender() {
            @Override
            public @NonNull MimeMessage createMimeMessage() {
                return new MimeMessage(Session.getDefaultInstance(new Properties()));
            }

            @Override
            public @NonNull MimeMessage createMimeMessage(@NonNull InputStream contentStream) {
                try {
                    return new MimeMessage(Session.getDefaultInstance(new Properties()), contentStream);
                } catch (Exception ex) {
                    throw new MailException("Failed to create test MimeMessage", ex) {
                    };
                }
            }

            @Override
            public void send(@NonNull MimeMessage mimeMessage) {
                // No-op for tests.
            }

            @Override
            public void send(MimeMessage @NonNull ... mimeMessages) {
                // No-op for tests.
            }

            @Override
            public void send(@NonNull SimpleMailMessage simpleMessage) {
                // No-op for tests.
            }

            @Override
            public void send(SimpleMailMessage @NonNull ... simpleMessages) {
                // No-op for tests.
            }
        };
    }
}

