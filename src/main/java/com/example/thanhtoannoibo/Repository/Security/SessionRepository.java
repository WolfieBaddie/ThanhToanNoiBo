package com.example.thanhtoannoibo.Repository.Security;

import com.example.thanhtoannoibo.Entity.Security.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository  extends JpaRepository<UserSession, UUID> {
    Optional<UserSession> findByToken(String refreshTokenHash);
}
