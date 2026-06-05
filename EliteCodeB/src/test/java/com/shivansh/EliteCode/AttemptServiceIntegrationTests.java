package com.shivansh.EliteCode;

import com.shivansh.EliteCode.dto.request.execution.CodeExecutionRequest;
import com.shivansh.EliteCode.dto.response.execution.AttemptResponse;
import com.shivansh.EliteCode.model.Mode;
import com.shivansh.EliteCode.model.Problem;
import com.shivansh.EliteCode.model.User;
import com.shivansh.EliteCode.repository.AttemptRepository;
import com.shivansh.EliteCode.repository.ProblemRepository;
import com.shivansh.EliteCode.repository.UserRepository;
import com.shivansh.EliteCode.service.AttemptService;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.shivansh.EliteCode.config.MailTestConfig;

@SpringBootTest
@Import(MailTestConfig.class)
class AttemptServiceIntegrationTests {

    @Autowired
    private AttemptService attemptService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private AttemptRepository attemptRepository;

    @Test
    void submitCodeCreatesAttemptAndTriggersEvaluation() {
        User user = new User();
        user.setFirstName("Attempt");
        user.setLastName("Tester");
        user.setEmail("attempt" + System.nanoTime() + "@example.com");
        user = userRepository.save(user);

        Problem problem = new Problem();
        problem.setTitle("FizzBuzz");
        problem.setOriginalText("Print numbers from 1 to n with FizzBuzz rules.");
        problem.setDifficulty(Problem.Difficulty.EASY);
        problem.setHash("hash-" + UUID.randomUUID());
        problem = problemRepository.save(problem);

        CodeExecutionRequest request = new CodeExecutionRequest(
                problem.getId(),
                Mode.STANDARD,
                com.shivansh.EliteCode.model.Language.JAVA,
                "class Main { public static void main(String[] args) {} }",
                null
        );

        AttemptResponse response = attemptService.submitCode(user.getId(), request);

        Assertions.assertNotNull(response.id());
        Assertions.assertEquals(problem.getId(), response.problemId());

        Assertions.assertTrue(attemptRepository.findById(response.id()).isPresent());
        Assertions.assertNotNull(response.status());
    }
}
