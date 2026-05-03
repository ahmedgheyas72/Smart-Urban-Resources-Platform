package COE_Group4.booking.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class UpdateBookingRequest {

    @NotNull(message = "startTime is required")
    private LocalDateTime startTime;

    @NotNull(message = "endTime is required")
    private LocalDateTime endTime;

    private String subAmenity;

    public UpdateBookingRequest() {}

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public String getSubAmenity() { return subAmenity; }
    public void setSubAmenity(String subAmenity) { this.subAmenity = subAmenity; }
}
