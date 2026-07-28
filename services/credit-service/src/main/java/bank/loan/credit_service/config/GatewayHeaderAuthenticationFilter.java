package bank.loan.credit_service.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String userIdHeader = request.getHeader(USER_ID_HEADER);
        String roleHeader = request.getHeader(ROLE_HEADER);
        String permissionsHeader = request.getHeader(PERMISSIONS_HEADER);

        if (userIdHeader == null || userIdHeader.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Long userId = Long.valueOf(userIdHeader.trim());
            List<GrantedAuthority> authorities = buildAuthorities(roleHeader, permissionsHeader);

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userId, null, authorities
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (NumberFormatException ex) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private List<GrantedAuthority> buildAuthorities(String roleHeader, String permissionsHeader) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        if (roleHeader != null && !roleHeader.isBlank()) {
            authorities.add(new SimpleGrantedAuthority(normalizeRole(roleHeader)));
        }

        if (permissionsHeader != null && !permissionsHeader.isBlank()) {
            Arrays.stream(permissionsHeader.split(","))
                    .map(String::trim)
                    .filter(permission -> !permission.isEmpty())
                    .map(SimpleGrantedAuthority::new)
                    .forEach(authorities::add);
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
