package com.example.thanhtoannoibo.Repository;

import com.example.thanhtoannoibo.Entity.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
}
