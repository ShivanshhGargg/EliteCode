package com.shivansh.EliteCode.security;

import com.shivansh.EliteCode.model.Account;
import com.shivansh.EliteCode.model.User;
import com.shivansh.EliteCode.repository.AccountRepository;
import com.shivansh.EliteCode.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private static final String LOCAL_PROVIDER = "local";
    private static final String DEFAULT_ROLE = "USER";

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    @Override
    public @NonNull UserDetails loadUserByUsername(@NonNull String email)
            throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with email: " + email));

        String role = accountRepository.findByUserEmailAndProvider(email, LOCAL_PROVIDER)
                .map(Account::getRole)
                .map(Account.Role::name)
                .orElse(DEFAULT_ROLE);

        return new UserPrincipal(user.getId(), user.getEmail(), role);
    }
}
