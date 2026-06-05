package com.shivansh.EliteCode.config;

import com.shivansh.EliteCode.model.Account;
import com.shivansh.EliteCode.model.User;
import com.shivansh.EliteCode.repository.AccountRepository;
import com.shivansh.EliteCode.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.password:admin123}")
    private String adminPassword;

    @Override
    public void run(String @NonNull ... args) {
        String adminEmail = "admin@elitecode.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User adminUser = new User();
            adminUser.setFirstName("Admin");
            adminUser.setLastName("User");
            adminUser.setEmail(adminEmail);
            adminUser = userRepository.save(adminUser);

            Account adminAccount = new Account();
            adminAccount.setUser(adminUser);
            adminAccount.setProvider("local");
            adminAccount.setRole(Account.Role.ADMIN);
            adminAccount.setPasswordHash(passwordEncoder.encode(adminPassword));
            adminAccount.setEmailVerified(true);
            adminAccount.setEnabled(true);
            adminAccount.setAccountNonLocked(true);
            accountRepository.save(adminAccount);

            log.info("Created admin user with password from configuration");
        } else {
            log.info("Admin user already exists");
        }
    }
}