package com.example.thanhtoannoibo.DTO.Request.User;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateAvatarRequest {

    @NotBlank(message = "IMAGE_URL_REQUIRED")
    private String imageUrl;
}
