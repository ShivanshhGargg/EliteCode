package com.shivansh.EliteCode.service;

import com.shivansh.EliteCode.model.Account;

public interface OAuthAccountService {
    Account upsertOAuthAccount(String provider, String providerId, String email,
                               String firstName, String lastName);
}