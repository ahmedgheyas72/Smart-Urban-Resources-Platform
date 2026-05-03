package COE_Group4.booking.security;

import io.jsonwebtoken.Claims;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class UserContext {

    public String getUserId() {
        return getAuthentication().getName();
    }

    public String getUserEmail() {
        return getClaims().get("email", String.class);
    }

    public String getUserName() {
        return getClaims().get("name", String.class);
    }

    public String getUserRole() {
        return getClaims().get("role", String.class);
    }

    public boolean isAdmin() {
        return "ADMIN".equals(getUserRole());
    }

    private Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    private Claims getClaims() {
        return (Claims) getAuthentication().getDetails();
    }
}
