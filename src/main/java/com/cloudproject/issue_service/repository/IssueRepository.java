package com.cloudproject.issue_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.cloudproject.issue_service.entity.Issue;

public interface IssueRepository extends JpaRepository<Issue, Long> {
    List<Issue> findByUserId(Long userId);
}