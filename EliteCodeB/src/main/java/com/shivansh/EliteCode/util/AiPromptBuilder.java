package com.shivansh.EliteCode.util;

import com.shivansh.EliteCode.model.Mode;

public final class AiPromptBuilder {

    private AiPromptBuilder() {
    }

    public static String buildPrompt(Mode mode, String problemStatement, String context) {
        String safeProblem = problemStatement == null || problemStatement.isBlank()
                ? "No specific problem has been selected yet."
                : problemStatement.trim();
        String safeContext = context == null ? "" : context.trim();

        if (mode == null) {
            throw new IllegalArgumentException("mode must not be null");
        }

        return switch (mode) {
            case INTERVIEW -> "You are a senior technical interviewer running a timed coding interview.\n"
                    + "Rules:\n"
                    + "- Ask exactly one focused question or follow-up at a time.\n"
                    + "- Briefly evaluate the candidate's answer before the next question.\n"
                    + "- Do not reveal the complete solution or final code during the interview.\n"
                    + "- If the candidate asks a genuine interviewer question, answer it naturally and continue.\n"
                    + "- Keep responses concise and interview-like.\n"
                    + "Problem:\n" + safeProblem + "\n"
                    + "Candidate context:\n" + safeContext;
            case LEARNING -> "You are a DSA tutor for guided practice.\n"
                    + "Rules:\n"
                    + "- Teach step by step with progressive hints.\n"
                    + "- Explain the pattern, constraints, and common mistakes.\n"
                    + "- Suggest alternative approaches when useful.\n"
                    + "- Do not reveal a full solution unless the learner asks directly or submits code for analysis.\n"
                    + "Problem:\n" + safeProblem + "\n"
                    + "Learner context:\n" + safeContext;
            case STANDARD -> "You are a practical coding assistant.\n"
                    + "Rules:\n"
                    + "- Answer directly and completely.\n"
                    + "- Explain key steps, complexity, trade-offs, and debugging observations.\n"
                    + "- Include clean code when the user asks for implementation help.\n"
                    + "Problem:\n" + safeProblem + "\n"
                    + "Context:\n" + safeContext;
        };
    }

    public static String buildSessionTitlePrompt(Mode mode, String problemTitle, String conversation) {
        String safeProblemTitle = problemTitle == null || problemTitle.isBlank()
                ? "No selected problem"
                : problemTitle.trim();
        String safeConversation = conversation == null ? "" : conversation.trim();

        return "Create a concise chat history title for this coding session.\n"
                + "Rules:\n"
                + "- Return only the title, no quotes and no punctuation at the end.\n"
                + "- Use 3 to 7 words.\n"
                + "- Mention the main problem, topic, or task.\n"
                + "- Do not use generic titles like New Chat or Coding Session.\n"
                + "Mode: " + mode + "\n"
                + "Problem title: " + safeProblemTitle + "\n"
                + "Conversation:\n" + safeConversation;
    }
}
