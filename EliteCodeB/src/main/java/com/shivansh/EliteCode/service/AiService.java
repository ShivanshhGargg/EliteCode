package com.shivansh.EliteCode.service;

import com.shivansh.EliteCode.model.Mode;
import java.util.UUID;

public interface AiService {

    String ask(UUID problemId, Mode mode, String context);

    String generateSessionTitle(Mode mode, String problemTitle, String conversation);
}
