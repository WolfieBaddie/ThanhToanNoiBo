package com.example.thanhtoannoibo.Service.Security;
import com.example.thanhtoannoibo.DTO.Response.Auth.PermissionResponse;
import com.example.thanhtoannoibo.DTO.Response.Auth.RoleResponse;
import com.example.thanhtoannoibo.Entity.Role;
import com.example.thanhtoannoibo.Repository.Security.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;

    /**
     * Lấy tất cả Role kèm theo Permission của chúng
     */
    public List<RoleResponse> getAllRoles() {
        List<Role> roles = roleRepository.findAll();

        return roles.stream().map(role -> {
            // 1. Map Permissions của Role đó
            Set<PermissionResponse> permissionDTOs = role.getPermissions().stream()
                    .map(p -> PermissionResponse.builder()
                            .permissionCode(p.getPermissionCode())
                            .permissionName(p.getPermissionName())
                            .resourceType(p.getResourceType())
                            .action(p.getAction())
                            .build())
                    .collect(Collectors.toSet());

            // 2. Map Role và gán Permissions vào
            return RoleResponse.builder()
                    .roleId(role.getRoleId())
                    .roleCode(role.getRoleCode())
                    .roleName(role.getRoleName())
                    .description(role.getDescription())
                    .permissions(permissionDTOs)
                    .build();
        }).collect(Collectors.toList());
    }
}
