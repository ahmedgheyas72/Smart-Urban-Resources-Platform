package COE_Group4.issue.service;

import COE_Group4.issue.dto.CreateIssueRequest;
import COE_Group4.issue.entity.Issue;
import COE_Group4.issue.repository.IssueRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class IssueService {

    private static final List<String> VALID_STATUSES =
            List.of("SUBMITTED", "IN_PROGRESS", "RESOLVED", "CLOSED");

    private final IssueRepository issueRepository;

    public IssueService(IssueRepository issueRepository) {
        this.issueRepository = issueRepository;
    }

    public Issue createIssue(CreateIssueRequest request, Long userId) {
        Issue issue = new Issue();
        issue.setUserId(userId);
        issue.setResourceId(request.getResourceId());
        issue.setCategory(request.getCategory());
        issue.setDescription(request.getDescription());
        issue.setImageUrl(request.getImageUrl());
        issue.setStatus("SUBMITTED");
        return issueRepository.save(issue);
    }

    public List<Issue> getIssuesByUserId(Long userId) {
        return issueRepository.findByUserId(userId);
    }

    public List<Issue> getAllIssues() {
        return issueRepository.findAll();
    }

    public Issue updateStatus(Long id, String status) {
        if (!VALID_STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid status. Must be one of: SUBMITTED, IN_PROGRESS, RESOLVED, CLOSED");
        }
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found"));
        issue.setStatus(status);
        return issueRepository.save(issue);
    }
}
