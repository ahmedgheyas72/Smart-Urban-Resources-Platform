package COE_Group4.userprofile.service;

import COE_Group4.userprofile.dto.UserProfileDto;
import COE_Group4.userprofile.dto.UserStatsDto;
import COE_Group4.userprofile.entity.User;
import COE_Group4.userprofile.repository.StatsRepository;
import COE_Group4.userprofile.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final StatsRepository statsRepository;

    public UserProfileService(UserRepository userRepository, StatsRepository statsRepository) {
        this.userRepository = userRepository;
        this.statsRepository = statsRepository;
    }

    public UserProfileDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        return toDto(user);
    }

    @Transactional
    public UserProfileDto updateProfile(Long userId, String fullName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        user.setFullName(fullName);
        return toDto(userRepository.save(user));
    }

    public UserStatsDto getStats(Long userId) {
        return new UserStatsDto(
                statsRepository.countTotalBookings(userId),
                statsRepository.countActiveBookings(userId),
                statsRepository.countTotalIssues(userId),
                statsRepository.countOpenIssues(userId)
        );
    }

    private UserProfileDto toDto(User user) {
        return new UserProfileDto(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }
}
