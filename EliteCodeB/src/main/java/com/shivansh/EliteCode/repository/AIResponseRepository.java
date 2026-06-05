package com.shivansh.EliteCode.repository;

import com.shivansh.EliteCode.model.AIResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AIResponseRepository extends JpaRepository<AIResponse, UUID> {
}
