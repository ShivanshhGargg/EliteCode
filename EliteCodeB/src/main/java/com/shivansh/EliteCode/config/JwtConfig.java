package com.shivansh.EliteCode.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
public class JwtConfig {

    @Value("${elitecode.jwt.secret}")
    private String secret;

    @Value("${elitecode.jwt.expiration-ms:3600000}")
    private long expirationMs;

    @Value("${elitecode.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;
}

