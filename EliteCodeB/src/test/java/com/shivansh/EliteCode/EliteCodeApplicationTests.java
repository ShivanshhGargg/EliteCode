package com.shivansh.EliteCode;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.shivansh.EliteCode.config.MailTestConfig;

@SpringBootTest
@Import(MailTestConfig.class)
class EliteCodeApplicationTests {

	@Test
	void contextLoads() {
	}

}
