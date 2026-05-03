package COE_Group4.issue.repository;

import COE_Group4.issue.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueRepository extends JpaRepository<Issue, Long> {
    List<Issue> findByUserId(Long userId);
}
