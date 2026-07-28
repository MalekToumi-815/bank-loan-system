package bank.loan.account_service.config;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class InternalHeaderFilter extends OncePerRequestFilter {

    private final String expectedSecret;

    public InternalHeaderFilter(String expectedSecret) {
        this.expectedSecret = expectedSecret;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        return path.startsWith("/actuator") || path.equals("/error");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String secret = request.getHeader("X-Internal-Secret");

        // 1. Hard Gate: Reject any request missing the valid shared secret
        if (expectedSecret == null || !expectedSecret.equals(secret)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        // 2. Secret is verified. Check if this is a user request or a service-to-service request
        String userId = request.getHeader("X-User-Id");

        if (userId == null || userId.isBlank()) {
            // No user context present -> System-level request, set ROLE_INTERNAL
            Authentication auth = new UsernamePasswordAuthenticationToken(
                    "gateway", null, List.of(new SimpleGrantedAuthority("ROLE_INTERNAL")));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        // If X-User-Id IS present, do NOT set ROLE_INTERNAL here.
        // Let GatewayHeaderAuthenticationFilter set the user's specific context & roles next.

        chain.doFilter(request, response);
    }
}