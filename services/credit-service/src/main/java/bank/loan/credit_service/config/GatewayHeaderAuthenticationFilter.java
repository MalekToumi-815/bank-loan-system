package bank.loan.credit_service.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class GatewayHeaderAuthenticationFilter extends OncePerRequestFilter {

    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String ROLE_HEADER = "X-Role";
    private static final String PERMISSIONS_HEADER = "X-Permissions";

    // Required for Spring Security 6 stateless persistence
    private final SecurityContextRepository securityContextRepository = new RequestAttributeSecurityContextRepository();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        return path.startsWith("/actuator") || path.equals("/error");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        System.out.println("--- [GatewayHeaderAuthenticationFilter] Incoming Request: " + request.getMethod() + " " + request.getRequestURI());

        Authentication existingAuth = SecurityContextHolder.getContext().getAuthentication();

        if (existingAuth != null && existingAuth.isAuthenticated() && !(existingAuth instanceof AnonymousAuthenticationToken)) {
            filterChain.doFilter(request, response);
            return;
        }

        String userIdHeader = request.getHeader(USER_ID_HEADER);
        String roleHeader = request.getHeader(ROLE_HEADER);
        String permissionsHeader = request.getHeader(PERMISSIONS_HEADER);

        System.out.println("--- [GatewayHeaderAuthenticationFilter] Headers Received -> X-User-Id: [" + userIdHeader 
                + "], X-Role: [" + roleHeader + "], X-Permissions: [" + permissionsHeader + "]");

        if (userIdHeader == null || userIdHeader.isBlank()) {
            System.out.println("--- [GatewayHeaderAuthenticationFilter] X-User-Id header is missing or blank.");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Long userId = Long.valueOf(userIdHeader.trim());
            List<GrantedAuthority> authorities = buildAuthorities(roleHeader, permissionsHeader);

            System.out.println("--- [GatewayHeaderAuthenticationFilter] Successfully parsed User ID: " + userId);
            System.out.println("--- [GatewayHeaderAuthenticationFilter] Resulting Authorities: " + authorities);

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userId, null, authorities
            );

            // 1. Create context, set auth, and push to holder
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            // 2. CRITICAL: Explicitly save to repository so Spring Security 6 remembers it downstream
            securityContextRepository.saveContext(context, request, response);

            System.out.println("--- [GatewayHeaderAuthenticationFilter] Authentication successfully written and saved to SecurityContextRepository.");

        } catch (NumberFormatException ex) {
            System.out.println("--- [GatewayHeaderAuthenticationFilter] ERROR: Failed to parse user ID header '" + userIdHeader + "' as a Long.");
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private List<GrantedAuthority> buildAuthorities(String roleHeader, String permissionsHeader) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        if (roleHeader != null && !roleHeader.isBlank()) {
            String normalizedRole = normalizeRole(roleHeader);
            authorities.add(new SimpleGrantedAuthority(normalizedRole));
            System.out.println("--- [GatewayHeaderAuthenticationFilter] Added Role Authority: " + normalizedRole);
        }

        if (permissionsHeader != null && !permissionsHeader.isBlank()) {
            Arrays.stream(permissionsHeader.split(","))
                    .map(String::trim)
                    .filter(permission -> !permission.isEmpty())
                    .map(SimpleGrantedAuthority::new)
                    .forEach(auth -> {
                        authorities.add(auth);
                        System.out.println("--- [GatewayHeaderAuthenticationFilter] Added Permission Authority: " + auth.getAuthority());
                    });
        }

        return authorities;
    }

    private String normalizeRole(String roleHeader) {
        String role = roleHeader.trim();
        if (role.startsWith("ROLE_")) {
            return role;
        }
        return "ROLE_" + role.toUpperCase();
    }
}