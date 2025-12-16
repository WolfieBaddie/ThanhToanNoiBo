package com.example.thanhtoannoibo.Controller;

import com.example.thanhtoannoibo.DTO.LoginRequest;
import com.example.thanhtoannoibo.DTO.LoginResponse;
import com.example.thanhtoannoibo.Service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("OK");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest req,
            HttpServletRequest http
    ) {
        req.setIp(resolveClientIp(http));
        req.setUserAgent(http.getHeader("User-Agent"));
        req.setDeviceId(http.getHeader("X-Device-Id"));
        return ResponseEntity.ok(authService.login(req));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
