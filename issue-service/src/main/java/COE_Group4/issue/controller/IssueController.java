package COE_Group4.issue.controller;

import COE_Group4.issue.dto.CreateIssueRequest;
import COE_Group4.issue.entity.Issue;
import COE_Group4.issue.security.UserContext;
import COE_Group4.issue.service.AzureBlobService;
import COE_Group4.issue.service.IssueService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    private final IssueService issueService;
    private final AzureBlobService azureBlobService;
    private final UserContext userContext;

    public IssueController(IssueService issueService, AzureBlobService azureBlobService, UserContext userContext) {
        this.issueService = issueService;
        this.azureBlobService = azureBlobService;
        this.userContext = userContext;
    }

    @PostMapping
    public Issue createIssue(@Valid @RequestBody CreateIssueRequest request) {
        Long userId = Long.parseLong(userContext.getUserId());
        return issueService.createIssue(request, userId);
    }

    @PostMapping("/upload-image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        String imageUrl = azureBlobService.uploadFile(file);
        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }

    @GetMapping("/my")
    public List<Issue> getMyIssues() {
        Long userId = Long.parseLong(userContext.getUserId());
        return issueService.getIssuesByUserId(userId);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Issue> getAllIssues() {
        return issueService.getAllIssues();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Issue updateStatus(@PathVariable Long id, @RequestParam String status) {
        return issueService.updateStatus(id, status);
    }
}
