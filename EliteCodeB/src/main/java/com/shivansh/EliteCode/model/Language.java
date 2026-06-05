package com.shivansh.EliteCode.model;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Language {
    JAVA("amazoncorretto:17-alpine", ".java", "Main", "javac Main.java && java Main"),
    CPP("gcc:latest", ".cpp", "solution", "g++ solution.cpp -o solution && ./solution"),
    JAVASCRIPT("node:18-alpine", ".js", "solution", "node solution.js"),
    PYTHON("python:3.11-alpine", ".py", "solution", "python solution.py");

    private final String dockerImage;
    private final String fileExtension;
    private final String fileName;
    private final String runCommand;
}