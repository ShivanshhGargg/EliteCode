package com.shivansh.EliteCode.repository;

import com.shivansh.EliteCode.model.UserProgress;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserProgressRepository extends JpaRepository<UserProgress, UUID> {

    Page<UserProgress> findByUserId(UUID userId, Pageable pageable);

    Optional<UserProgress> findByUserIdAndTopic(UUID userId, String topic);
}