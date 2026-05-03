package COE_Group4.userprofile.security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Map;

public class UserContext {

    @SuppressWarnings("unchecked")
    private static Map<String, Object> getDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof UsernamePasswordAuthenticationToken token) {
            return (Map<String, Object>) token.getDetails();
        }
        throw new IllegalStateException("No authenticated user in context");
    }

    public static Long getUserId() {
        return (Long) getDetails().get("userId");
    }

    public static String getUserEmail() {
        return (String) getDetails().get("email");
    }

    public static boolean isAdmin() {
        return "ADMIN".equals(getDetails().get("role"));
    }
}
