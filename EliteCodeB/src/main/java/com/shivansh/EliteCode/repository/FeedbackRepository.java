package com.shivansh.EliteCode.repository;

import com.shivansh.EliteCode.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    // One-to-one with Attempt -> unique attempt_id, so Optional
    Optional<Feedback> findByAttemptId(UUID attemptId);
}