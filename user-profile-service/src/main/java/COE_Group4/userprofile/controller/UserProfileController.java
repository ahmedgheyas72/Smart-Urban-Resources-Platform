package COE_Group4.userprofile.controller;

import COE_Group4.userprofile.dto.UpdateProfileRequest;
import COE_Group4.userprofile.dto.UserProfileDto;
import COE_Group4.userprofile.dto.UserStatsDto;
import COE_Group4.userprofile.security.UserContext;
import COE_Group4.userprofile.service.UserProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getProfile() {
        return ResponseEntity.ok(userProfileService.getProfile(UserContext.getUserId()));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileDto> updateProfile(@RequestBody UpdateProfileRequest request) {
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new IllegalArgumentException("fullName must not be blank");
        }
        return ResponseEntity.ok(userProfileService.updateProfile(UserContext.getUserId(), request.getFullName()));
    }

    @GetMapping("/me/stats")
    public ResponseEntity<UserStatsDto> getStats() {
        return ResponseEntity.ok(userProfileService.getStats(UserContext.getUserId()));
    }
}
