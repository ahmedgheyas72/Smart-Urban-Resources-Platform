package COE_Group4.booking.service;

import COE_Group4.booking.client.ResourceClient;
import COE_Group4.booking.dto.BookingResponse;
import COE_Group4.booking.dto.CreateBookingRequest;
import COE_Group4.booking.dto.ResourceDto;
import COE_Group4.booking.dto.UpdateBookingRequest;
import COE_Group4.booking.entity.Booking;
import COE_Group4.booking.entity.BookingStatus;
import COE_Group4.booking.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private static final Logger logger = LoggerFactory.getLogger(BookingService.class);
    private static final long MAX_BOOKING_DURATION_MINUTES = 120;
    private static final long MAX_TOTAL_BOOKED_MINUTES_PER_DAY = 240;

    private final BookingRepository bookingRepository;
    private final ResourceClient resourceClient;
    private final JdbcTemplate jdbcTemplate;

    public BookingService(BookingRepository bookingRepository,
                          ResourceClient resourceClient,
                          JdbcTemplate jdbcTemplate) {
        this.bookingRepository = bookingRepository;
        this.resourceClient = resourceClient;
        this.jdbcTemplate = jdbcTemplate;
    }

    public long getTotalBookings() {
        return bookingRepository.count();
    }

    @Transactional
    public BookingResponse createBooking(Long userId, CreateBookingRequest request) {
        try {
            validateTimeRange(request.getStartTime(), request.getEndTime());
            validateNotInPast(request.getStartTime());

            ResourceDto resource = resourceClient.getResourceById(request.getResourceId());
            if (resource == null) {
                throw new IllegalArgumentException("Resource not found with id: " + request.getResourceId());
            }
            validateResourceIsBookable(resource);
            validateWithinOperatingHours(resource, request.getStartTime(), request.getEndTime());

            lockResourceForBooking(request.getResourceId());

            validateBookingLimits(userId, request.getStartTime(), request.getEndTime());
            validateNoConflict(request.getResourceId(), request.getStartTime(), request.getEndTime());

            Booking booking = new Booking();
            booking.setUserId(userId);
            booking.setResourceId(request.getResourceId());
            booking.setStartTime(request.getStartTime());
            booking.setEndTime(request.getEndTime());
            booking.setSubAmenity(request.getSubAmenity());
            booking.setStatus(BookingStatus.ACTIVE);

            return mapToResponse(bookingRepository.save(booking));
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Booking creation failed for userId={} resourceId={}", userId, request.getResourceId(), e);
            throw e;
        }
    }

    public BookingResponse getBookingById(UUID bookingId, Long userId) {
        Booking booking = bookingRepository.findByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found for this user."));
        return mapToResponse(booking);
    }

    public List<BookingResponse> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserId(userId, Sort.by(Sort.Direction.ASC, "startTime"))
                .stream().map(this::mapToResponse).toList();
    }

    public List<BookingResponse> getActiveBookingsByUser(Long userId) {
        return bookingRepository.findByUserIdAndStatusAndEndTimeAfter(
                userId, BookingStatus.ACTIVE, LocalDateTime.now(),
                Sort.by(Sort.Direction.ASC, "startTime")
        ).stream().map(this::mapToResponse).toList();
    }

    public List<BookingResponse> getPastBookingsByUser(Long userId) {
        return bookingRepository.findBookingHistoryByUserId(
                userId, LocalDateTime.now(), BookingStatus.CANCELLED,
                Sort.by(Sort.Direction.DESC, "startTime")
        ).stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public BookingResponse cancelBooking(UUID bookingId, Long userId) {
        Booking booking = bookingRepository.findByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found for this user."));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Booking is already cancelled.");
        }
        if (!LocalDateTime.now().isBefore(booking.getStartTime())) {
            throw new IllegalArgumentException("Booking cannot be cancelled after the reservation start time.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        return mapToResponse(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponse updateBooking(UUID bookingId, Long userId, UpdateBookingRequest request) {
        Booking booking = bookingRepository.findByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found for this user."));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Cancelled bookings cannot be updated.");
        }
        if (!LocalDateTime.now().isBefore(booking.getStartTime())) {
            throw new IllegalArgumentException("Booking cannot be updated after the reservation start time.");
        }

        validateTimeRange(request.getStartTime(), request.getEndTime());
        validateNotInPast(request.getStartTime());

        ResourceDto resource = resourceClient.getResourceById(booking.getResourceId());
        validateResourceIsBookable(resource);
        validateWithinOperatingHours(resource, request.getStartTime(), request.getEndTime());

        lockResourceForBooking(booking.getResourceId());

        validateBookingLimitsForUpdate(
                booking.getId(), booking.getUserId(),
                booking.getStartTime(), booking.getEndTime(),
                request.getStartTime(), request.getEndTime());

        validateNoConflictExcludingCurrent(
                booking.getId(), booking.getResourceId(),
                request.getStartTime(), request.getEndTime());

        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setSubAmenity(request.getSubAmenity());

        return mapToResponse(bookingRepository.save(booking));
    }

    // PostgreSQL advisory lock prevents concurrent bookings on the same resource
    private void lockResourceForBooking(Long resourceId) {
        jdbcTemplate.query(
                "SELECT pg_advisory_xact_lock(hashtext(?))",
                ps -> ps.setString(1, resourceId.toString()),
                rs -> null
        );
    }

    private void validateResourceIsBookable(ResourceDto resource) {
        if (!resource.isBookable()) {
            throw new IllegalArgumentException("This resource is not available for booking.");
        }
    }

    private void validateWithinOperatingHours(ResourceDto resource,
                                               LocalDateTime startTime, LocalDateTime endTime) {
        LocalTime openingTime = resource.getOpeningTime();
        LocalTime closingTime = resource.getClosingTime();

        if (openingTime == null || closingTime == null) {
            throw new IllegalArgumentException("Resource operating hours are not available.");
        }
        if (openingTime.equals(closingTime)) {
            return; // equal times = open 24 hours
        }

        boolean withinHours = closingTime.isAfter(openingTime)
                ? isWithinSameDayOperatingHours(openingTime, closingTime, startTime, endTime)
                : isWithinOvernightOperatingHours(openingTime, closingTime, startTime, endTime);

        if (!withinHours) {
            throw new IllegalArgumentException("Booking time must be within the resource operating hours.");
        }
    }

    private boolean isWithinSameDayOperatingHours(LocalTime open, LocalTime close,
                                                   LocalDateTime start, LocalDateTime end) {
        if (!start.toLocalDate().equals(end.toLocalDate())) return false;
        return !start.toLocalTime().isBefore(open) && !end.toLocalTime().isAfter(close);
    }

    private boolean isWithinOvernightOperatingHours(LocalTime open, LocalTime close,
                                                     LocalDateTime start, LocalDateTime end) {
        LocalDate startDate = start.toLocalDate();
        LocalDateTime windowStart, windowEnd;

        if (start.toLocalTime().isBefore(close)) {
            windowStart = startDate.minusDays(1).atTime(open);
            windowEnd   = startDate.atTime(close);
        } else {
            windowStart = startDate.atTime(open);
            windowEnd   = startDate.plusDays(1).atTime(close);
        }
        return !start.isBefore(windowStart) && !end.isAfter(windowEnd);
    }

    private void validateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }
    }

    private void validateNotInPast(LocalDateTime startTime) {
        if (startTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Booking start time cannot be in the past.");
        }
    }

    private void validateBookingLimits(Long userId, LocalDateTime startTime, LocalDateTime endTime) {
        long requested = Duration.between(startTime, endTime).toMinutes();
        if (requested > MAX_BOOKING_DURATION_MINUTES) {
            throw new IllegalArgumentException("A single booking cannot exceed 120 minutes.");
        }
        long existing = getTotalBookedMinutesForUserOnDate(userId, startTime.toLocalDate());
        if (existing + requested > MAX_TOTAL_BOOKED_MINUTES_PER_DAY) {
            throw new IllegalArgumentException(
                    "Daily booking limit exceeded. A user cannot book more than 240 minutes per day.");
        }
    }

    private void validateBookingLimitsForUpdate(UUID bookingId, Long userId,
                                                 LocalDateTime oldStart, LocalDateTime oldEnd,
                                                 LocalDateTime newStart, LocalDateTime newEnd) {
        long newMinutes = Duration.between(newStart, newEnd).toMinutes();
        if (newMinutes > MAX_BOOKING_DURATION_MINUTES) {
            throw new IllegalArgumentException("A single booking cannot exceed 120 minutes.");
        }
        long existing = getTotalBookedMinutesForUserOnDate(userId, newStart.toLocalDate());
        if (oldStart.toLocalDate().equals(newStart.toLocalDate())) {
            existing -= Duration.between(oldStart, oldEnd).toMinutes();
        }
        if (existing + newMinutes > MAX_TOTAL_BOOKED_MINUTES_PER_DAY) {
            throw new IllegalArgumentException(
                    "Daily booking limit exceeded. A user cannot book more than 240 minutes per day.");
        }
    }

    private long getTotalBookedMinutesForUserOnDate(Long userId, LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay().minusNanos(1);
        return bookingRepository
                .findByUserIdAndStatusAndStartTimeBetween(userId, BookingStatus.ACTIVE, startOfDay, endOfDay)
                .stream()
                .mapToLong(b -> Duration.between(b.getStartTime(), b.getEndTime()).toMinutes())
                .sum();
    }

    private void validateNoConflict(Long resourceId, LocalDateTime startTime, LocalDateTime endTime) {
        if (!bookingRepository.findConflictingBookings(resourceId, startTime, endTime, BookingStatus.ACTIVE).isEmpty()) {
            throw new IllegalArgumentException("The selected time slot is already booked for this resource.");
        }
    }

    private void validateNoConflictExcludingCurrent(UUID bookingId, Long resourceId,
                                                      LocalDateTime startTime, LocalDateTime endTime) {
        if (!bookingRepository.findConflictingBookingsExcludingCurrent(
                bookingId, resourceId, startTime, endTime, BookingStatus.ACTIVE).isEmpty()) {
            throw new IllegalArgumentException(
                    "The selected updated time slot is already booked for this resource.");
        }
    }

    private BookingResponse mapToResponse(Booking booking) {
        BookingResponse r = new BookingResponse();
        r.setId(booking.getId());
        r.setUserId(booking.getUserId());
        r.setResourceId(booking.getResourceId());
        r.setStartTime(booking.getStartTime());
        r.setEndTime(booking.getEndTime());
        r.setStatus(booking.getStatus());
        r.setSubAmenity(booking.getSubAmenity());
        r.setCreatedAt(booking.getCreatedAt());
        r.setUpdatedAt(booking.getUpdatedAt());
        return r;
    }
}
