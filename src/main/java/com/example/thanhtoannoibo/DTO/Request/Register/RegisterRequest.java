package com.example.thanhtoannoibo.DTO.Request.Register;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class RegisterRequest {
    public String username;
    public String password;
    public String fullName;
    public String email;
    public String phoneNumber;
}
