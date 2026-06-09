package com.shivansh.EliteCode.config;

import com.shivansh.EliteCode.imports.JsonProblemImporter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
@Profile("json-import")
@RequiredArgsConstructor
@Slf4j
public class JsonImportRunner implements CommandLineRunner {

    private final JsonProblemImporter importer;

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting JSON problem import...");
        var resource = new ClassPathResource("leetcode_problems.json");
        try (var is = resource.getInputStream()) {
            importer.importFromJson(is);
        }
        log.info("JSON import completed.");
    }
}