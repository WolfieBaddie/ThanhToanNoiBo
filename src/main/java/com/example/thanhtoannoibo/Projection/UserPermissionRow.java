package com.example.thanhtoannoibo.Projection;
import java.util.UUID;

public interface UserPermissionRow {
    UUID getUserId();
    UUID getServiceUnitId();      // NULL = global
    String getPermissionCode();
}
