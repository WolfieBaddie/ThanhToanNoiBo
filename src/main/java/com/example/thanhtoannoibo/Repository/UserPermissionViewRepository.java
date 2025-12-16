package com.example.thanhtoannoibo.Repository;

import com.example.thanhtoannoibo.Entity.UserAccount;
import com.example.thanhtoannoibo.Projection.UserPermissionRow;
import org.springframework.data.repository.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;


public interface UserPermissionViewRepository extends Repository<UserAccount, Long> {

    @Query(value = """
      SELECT
        user_id        AS userId,
        service_unit_id AS serviceUnitId,
        permission_code AS permissionCode
      FROM auth.v_user_permissions
      WHERE user_id = :userId
      """, nativeQuery = true)
    List<UserPermissionRow> findPermissionsByUserId(@Param("userId" )UUID userId);
}
