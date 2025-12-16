package com.example.thanhtoannoibo.Repository;
import com.example.thanhtoannoibo.Common.IdentityProvider;
import com.example.thanhtoannoibo.Entity.UserIdentity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserIdentityRepository  extends JpaRepository<UserIdentity, UUID>{
    Optional<UserIdentity> findByProviderAndIdentifier(IdentityProvider provider, String identifier);
}
