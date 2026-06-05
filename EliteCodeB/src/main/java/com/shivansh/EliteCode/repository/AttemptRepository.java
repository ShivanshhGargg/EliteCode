package com.shivansh.EliteCode.repository;

import com.shivansh.EliteCode.model.Attempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttemptRepository extends JpaRepository<Attempt, UUID> {

    Page<Attempt> findByUserId(UUID userId, Pageable pageable);

    Optional<Attempt> findByIdAndUserId(UUID id, UUID userId);
}
