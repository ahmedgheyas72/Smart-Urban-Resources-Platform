package COE_Group4.resource.dto;

import java.time.LocalTime;

public class ResourceDto {

    private Long id;
    private String name;
    private boolean bookable;
    private LocalTime openingTime;
    private LocalTime closingTime;

    public ResourceDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public boolean isBookable() { return bookable; }
    public void setBookable(boolean bookable) { this.bookable = bookable; }

    public LocalTime getOpeningTime() { return openingTime; }
    public void setOpeningTime(LocalTime openingTime) { this.openingTime = openingTime; }

    public LocalTime getClosingTime() { return closingTime; }
    public void setClosingTime(LocalTime closingTime) { this.closingTime = closingTime; }
}
