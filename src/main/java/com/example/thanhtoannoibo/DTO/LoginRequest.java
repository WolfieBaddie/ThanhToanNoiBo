package com.example.thanhtoannoibo.DTO;
import com.example.thanhtoannoibo.Common.IdentityProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    // optional: device/IP/userAgent nhận từ controller/filter
    private String deviceId;
    private String ip;
    private String userAgent;
}
