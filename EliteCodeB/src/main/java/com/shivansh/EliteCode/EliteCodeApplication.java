package com.shivansh.EliteCode;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.retry.annotation.EnableRetry;

@SpringBootApplication
@EnableRetry
public class EliteCodeApplication {

    public static void main(String[] args) {
        SpringApplication.run(EliteCodeApplication.class, args);
    }
}

