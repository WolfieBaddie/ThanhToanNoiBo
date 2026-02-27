export interface PermissionResponse {
    permissionId: string;
    permissionCode: string;
    permissionName: string;
    resourceType: string;
    action: string;
}

export interface RoleResponse {
    roleId: string;
    roleCode: string;
    roleName: string;
    description: string;
    permissions: PermissionResponse[];
}