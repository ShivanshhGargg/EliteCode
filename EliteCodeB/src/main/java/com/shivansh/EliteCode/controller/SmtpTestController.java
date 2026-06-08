package com.shivansh.EliteCode.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.InetSocketAddress;
import java.net.Socket;

@RestController
public class SmtpTestController {

    @GetMapping("/smtp-test")
    public String testSmtp() {

        StringBuilder result = new StringBuilder();

        testPort(result, 465);
        testPort(result, 587);

        return result.toString();
    }

    private void testPort(StringBuilder result, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(
                    new InetSocketAddress("smtp.gmail.com", port),
                    10000
            );

            result.append("Port ")
                    .append(port)
                    .append(": Connected\n");
        } catch (Exception e) {
            result.append("Port ")
                    .append(port)
                    .append(": ")
                    .append(e.getClass().getSimpleName())
                    .append(" - ")
                    .append(e.getMessage())
                    .append("\n");
        }
    }
}