package com.shivansh.EliteCode;

import com.shivansh.EliteCode.config.MailTestConfig;
import com.shivansh.EliteCode.model.Attempt;
import com.shivansh.EliteCode.model.Language;
import com.shivansh.EliteCode.model.Mode;
import com.shivansh.EliteCode.model.Problem;
import com.shivansh.EliteCode.model.User;
import com.shivansh.EliteCode.repository.AttemptRepository;
import com.shivansh.EliteCode.repository.ProblemRepository;
import com.shivansh.EliteCode.repository.UserRepository;
import com.shivansh.EliteCode.service.EvaluationService;
import com.shivansh.EliteCode.service.ProgressService;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(MailTestConfig.class)
class EvaluationServiceImplTests {

    @TestConfiguration
    static class StubConfig {
        @Bean
        @Primary
        ProgressService progressService() {
            return new ProgressService() {
                @Override
                public void updateAfterAttempt(UUID userId, UUID attemptId) {
                    throw new RuntimeException("progress failed");
                }
            };
        }
    }

    @Autowired
    private EvaluationService evaluationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Test
    void evaluationFailureMarksAttemptFailed() {
        User user = new User();
        user.setFirstName("Eval");
        user.setLastName("Tester");
        user.setEmail("eval" + System.nanoTime() + "@example.com");
        user = userRepository.save(user);

        Problem problem = new Problem();
        problem.setTitle("Two Sum");
        problem.setOriginalText("Return indices of two numbers that add up to target.");
        problem.setDifficulty(Problem.Difficulty.EASY);
        problem.setHash("hash-" + UUID.randomUUID());
        problem = problemRepository.save(problem);

        Attempt attempt = new Attempt();
        attempt.setUser(user);
        attempt.setProblem(problem);
        attempt.setMode(Mode.STANDARD);
        attempt.setLanguage(Language.JAVA);
        attempt.setCode("class Main { public static void main(String[] args) {} }");
        attempt.setStatus(Attempt.AttemptStatus.PENDING);
        attempt.setExecutionTime(0.0);
        attempt = attemptRepository.save(attempt);

        evaluationService.evaluateAttemptAsync(attempt.getId()).join();

        Attempt updated = attemptRepository.findById(attempt.getId())
                .orElseThrow(() -> new IllegalStateException("Attempt missing"));

        Assertions.assertEquals(Attempt.AttemptStatus.FAILED, updated.getStatus());
    }
}
