package COE_Group4.booking.repository;

import COE_Group4.booking.entity.Booking;
import COE_Group4.booking.entity.BookingStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByUserId(Long userId, Sort sort);

    Optional<Booking> findByIdAndUserId(UUID id, Long userId);

    List<Booking> findByUserIdAndStatusAndEndTimeAfter(
            Long userId, BookingStatus status, LocalDateTime currentTime, Sort sort);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.userId = :userId
        AND (b.endTime < :currentTime OR b.status = :cancelledStatus)
    """)
    List<Booking> findBookingHistoryByUserId(
            @Param("userId") Long userId,
            @Param("currentTime") LocalDateTime currentTime,
            @Param("cancelledStatus") BookingStatus cancelledStatus,
            Sort sort);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.resourceId = :resourceId
        AND b.status = :status
        AND :startTime < b.endTime
        AND :endTime > b.startTime
    """)
    List<Booking> findConflictingBookings(
            @Param("resourceId") Long resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("status") BookingStatus status);

    @Query("""
        SELECT b FROM Booking b
        WHERE b.resourceId = :resourceId
        AND b.status = :status
        AND b.id <> :bookingId
        AND :startTime < b.endTime
        AND :endTime > b.startTime
    """)
    List<Booking> findConflictingBookingsExcludingCurrent(
            @Param("bookingId") UUID bookingId,
            @Param("resourceId") Long resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("status") BookingStatus status);

    List<Booking> findByUserIdAndStatusAndStartTimeBetween(
            Long userId, BookingStatus status,
            LocalDateTime startOfDay, LocalDateTime endOfDay);
}
