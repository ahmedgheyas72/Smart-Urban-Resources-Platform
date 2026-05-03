package COE_Group4.userprofile.dto;

public class UserStatsDto {

    private Long totalBookings;
    private Long activeBookings;
    private Long totalIssues;
    private Long openIssues;

    public UserStatsDto() {}

    public UserStatsDto(Long totalBookings, Long activeBookings, Long totalIssues, Long openIssues) {
        this.totalBookings = totalBookings;
        this.activeBookings = activeBookings;
        this.totalIssues = totalIssues;
        this.openIssues = openIssues;
    }

    public Long getTotalBookings() { return totalBookings; }
    public void setTotalBookings(Long totalBookings) { this.totalBookings = totalBookings; }

    public Long getActiveBookings() { return activeBookings; }
    public void setActiveBookings(Long activeBookings) { this.activeBookings = activeBookings; }

    public Long getTotalIssues() { return totalIssues; }
    public void setTotalIssues(Long totalIssues) { this.totalIssues = totalIssues; }

    public Long getOpenIssues() { return openIssues; }
    public void setOpenIssues(Long openIssues) { this.openIssues = openIssues; }
}
