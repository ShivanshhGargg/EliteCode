package com.shivansh.EliteCode.repository;

import com.shivansh.EliteCode.model.Problem;
import com.shivansh.EliteCode.model.Problem.Difficulty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, UUID> {

    Page<Problem> findByDifficultyAndDeletedFalse(Difficulty difficulty, Pageable pageable);

    Optional<Problem> findByIdAndDeletedFalse(UUID id);

    Page<Problem> findAllByDeletedFalse(Pageable pageable);

    // Filter by difficulty AND a list of tags (problem must have at least one of the tags)
    @Query("SELECT DISTINCT p FROM Problem p JOIN p.tags t WHERE " +
            "p.deleted = false AND (:difficulty IS NULL OR p.difficulty = :difficulty) AND " +
            "t IN :tags")
    Page<Problem> findByDifficultyAndTagsIn(@Param("difficulty") Difficulty difficulty,
                                            @Param("tags") List<String> tags,
                                            Pageable pageable);

    // Filter by tags only (any of the given tags)
    @Query("SELECT DISTINCT p FROM Problem p JOIN p.tags t WHERE p.deleted = false AND t IN :tags")
    Page<Problem> findByTagsIn(@Param("tags") List<String> tags, Pageable pageable);

    Optional<Problem> findByHash(String hash);


    @Query("SELECT p FROM Problem p WHERE p.deleted = false " +
            "AND (:difficulty IS NULL OR p.difficulty = :difficulty) " +
            "AND (:title IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :title, '%')))")
    Page<Problem> findAllByFilters(@Param("difficulty") Difficulty difficulty,
                                   @Param("title") String title,
                                   Pageable pageable);
}
