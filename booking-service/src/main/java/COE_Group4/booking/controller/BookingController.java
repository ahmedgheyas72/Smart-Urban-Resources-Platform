package COE_Group4.booking.controller;

import COE_Group4.booking.dto.BookingResponse;
import COE_Group4.booking.dto.CreateBookingRequest;
import COE_Group4.booking.dto.UpdateBookingRequest;
import COE_Group4.booking.security.UserContext;
import COE_Group4.booking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final UserContext userContext;

    public BookingController(BookingService bookingService, UserContext userContext) {
        this.bookingService = bookingService;
        this.userContext = userContext;
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        Long userId = Long.parseLong(userContext.getUserId());
        return ResponseEntity.ok(bookingService.createBooking(userId, request));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable UUID bookingId) {
        Long userId = Long.parseLong(userContext.getUserId());
        return ResponseEntity.ok(bookingService.getBookingById(bookingId, userId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponse>> getMyBookings() {
        Long userId = Long.parseLong(userContext.getUserId());
        return ResponseEntity.ok(bookingService.getBookingsByUser(userId));
    }

    @GetMapping("/my/active")
    public ResponseEntity<List<BookingResponse>> getMyActiveBookings() {
        Long userId = Long.parseLong(userContext.getUserId());
        return ResponseEntity.ok(bookingService.getActiveBookingsByUser(userId));
    }

    @GetMapping("/my/history")
    public ResponseEntity<List<BookingResponse>> getMyBookingHistory() {
        Long userId = Long.parseLong(userContext.getUserId());
        return ResponseEntity.ok(bookingService.getPastBookingsByUser(userId));
    }

    @DeleteMapping("/{bookingId}")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable UUID bookingId) {
        Long userId = Long.parseLong(userContext.getUserId());
        return ResponseEntity.ok(bookingService.cancelBooking(bookingId, userId));
    }

    @PutMapping("/{bookingId}")
    public ResponseEntity<BookingResponse> updateBooking(
            @PathVariable UUID bookingId,
            @Valid @RequestBody UpdateBookingRequest request) {
        Long userId = Long.parseLong(userContext.getUserId());
        return ResponseEntity.ok(bookingService.updateBooking(bookingId, userId, request));
    }
}
