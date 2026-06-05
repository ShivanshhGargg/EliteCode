package com.shivansh.EliteCode.security;

import com.shivansh.EliteCode.model.User;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import lombok.Getter;
import lombok.NonNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class UserPrincipal implements UserDetails {
    @Getter
    private final UUID id;
    @Getter
    private final String email;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(User user) {
        this(user.getId(), user.getEmail(), "ROLE_USER");
    }

    public UserPrincipal(UUID id, String email, String role) {
        this.id = id;
        this.email = email;
        this.authorities = List.of(new SimpleGrantedAuthority(normalizeRole(role)));
    }

    public static UserPrincipal fromClaims(Map<String, Object> claims) {
        if (claims == null) {
            throw new IllegalArgumentException("JWT claims must not be null");
        }

        Object userIdClaim = claims.get("userId");
        Object emailClaim = claims.get("email");
        Object roleClaim = claims.get("role");

        if (userIdClaim == null || emailClaim == null) {
            throw new IllegalArgumentException("JWT claims missing required userId/email");
        }

        UUID id = UUID.fromString(String.valueOf(userIdClaim));
        String email = String.valueOf(emailClaim);
        String role = roleClaim == null ? "ROLE_USER" : String.valueOf(roleClaim);
        return new UserPrincipal(id, email, role);
    }

    private static String normalizeRole(String role) {
        String resolved = (role == null || role.isBlank()) ? "USER" : role.trim();
        return resolved.startsWith("ROLE_") ? resolved : "ROLE_" + resolved;
    }

    @Override
    @NonNull
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return null; // JWT does not require password
    }

    @Override
    @NonNull
    public String getUsername() {
        return email;
    }

}