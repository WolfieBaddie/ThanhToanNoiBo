package com.example.thanhtoannoibo.Repository.Security;

import com.example.thanhtoannoibo.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    public Optional<User> findByUsername(String UserName);
    public Optional<User> findByUserId(UUID userId);
    public Optional<User> findByEmail(String email);
}
