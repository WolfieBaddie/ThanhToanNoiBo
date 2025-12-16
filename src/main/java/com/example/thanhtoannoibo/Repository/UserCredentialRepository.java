package com.example.thanhtoannoibo.Repository;

import com.example.thanhtoannoibo.Entity.UserCredential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
public interface UserCredentialRepository extends JpaRepository<UserCredential, UUID> {
}
