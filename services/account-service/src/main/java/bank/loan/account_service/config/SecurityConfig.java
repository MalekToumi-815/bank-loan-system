package bank.loan.account_service.config;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;


@Configuration
@EnableWebSecurity
@EnableMethodSecurity 
public class SecurityConfig {

    @Value("${internal.shared-secret}")
    private String expectedSecret;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           GatewayHeaderAuthenticationFilter gatewayHeaderAuthenticationFilter) throws Exception {
        
        InternalHeaderFilter internalHeaderFilter = new InternalHeaderFilter(expectedSecret);

        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/error").permitAll()
                .anyRequest().authenticated()
            )
            // 1. Guard Filter runs first to verify secret
            .addFilterBefore(internalHeaderFilter, UsernamePasswordAuthenticationFilter.class)
            // 2. User Filter runs second (after internal secret is verified)
            .addFilterAfter(gatewayHeaderAuthenticationFilter, internalHeaderFilter.getClass()) 
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(e -> e.authenticationEntryPoint((request, response, authEx) -> {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            }));
            
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}