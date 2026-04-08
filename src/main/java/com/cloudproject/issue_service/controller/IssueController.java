package com.cloudproject.issue_service.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;

import com.cloudproject.issue_service.entity.Issue;
import com.cloudproject.issue_service.repository.IssueRepository;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    private final IssueRepository issueRepository;

    public IssueController(IssueRepository issueRepository) {
        this.issueRepository = issueRepository;
    }

    // 1. USER: Create Issue
    @PostMapping
    public Issue createIssue(@RequestBody Issue issue) {
        issue.setStatus("SUBMITTED");
        return issueRepository.save(issue);
    }

    // 2. USER: Get their issues
    @GetMapping("/{userId}")
    public List<Issue> getUserIssues(@PathVariable Long userId) {
        return issueRepository.findByUserId(userId);
    }

    // 3. ADMIN: Get all issues
    @GetMapping
    public List<Issue> getAllIssues(@RequestParam String role) {
        if (!role.equals("ADMIN")) {
            throw new RuntimeException("Unauthorized");
        }
        return issueRepository.findAll();
    }

    // 4. ADMIN: Update status
    @PutMapping("/{id}/status")
    public Issue updateStatus(@PathVariable Long id,
                             @RequestParam String status,
                             @RequestParam String role) {

        if (!role.equals("ADMIN")) {
            throw new RuntimeException("Unauthorized");
        }

        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Issue not found"));

        issue.setStatus(status);
        return issueRepository.save(issue);
    }
}