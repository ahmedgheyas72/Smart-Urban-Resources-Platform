package COE_Group4.userprofile.repository;

import COE_Group4.userprofile.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StatsRepository extends JpaRepository<User, Long> {

    @Query(value = "SELECT COUNT(*) FROM bookings WHERE user_id = :userId", nativeQuery = true)
    Long countTotalBookings(@Param("userId") Long userId);

    @Query(value = "SELECT COUNT(*) FROM bookings WHERE user_id = :userId AND status IN ('ACTIVE','CONFIRMED')", nativeQuery = true)
    Long countActiveBookings(@Param("userId") Long userId);

    @Query(value = "SELECT COUNT(*) FROM issues WHERE user_id = :userId", nativeQuery = true)
    Long countTotalIssues(@Param("userId") Long userId);

    @Query(value = "SELECT COUNT(*) FROM issues WHERE user_id = :userId AND status != 'CLOSED'", nativeQuery = true)
    Long countOpenIssues(@Param("userId") Long userId);
}
