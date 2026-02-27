package com.example.thanhtoannoibo.Service.User.Manager;

import com.example.thanhtoannoibo.DTO.Request.User.UserFilterRequest;
import com.example.thanhtoannoibo.Entity.Role;
import com.example.thanhtoannoibo.Entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Component
public class UserSpecificationBuilder {

    public Specification<User> build(UserFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Keyword
            if (StringUtils.hasText(filter.getKeyword())) {
                String key = "%" + filter.getKeyword().toLowerCase().trim() + "%";
                Predicate namePred = cb.like(cb.lower(root.get("fullName")), key);
                Predicate emailPred = cb.like(cb.lower(root.get("email")), key);
                Predicate phonePred = cb.like(root.get("phoneNumber"), key);
                Predicate usernamePred = cb.like(cb.lower(root.get("username")), key);
                predicates.add(cb.or(namePred, emailPred, phonePred, usernamePred));
            }

            // 2. Status
            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            // 3. Role
            if (StringUtils.hasText(filter.getRole())) {
                Join<User, Role> roleJoin = root.join("roles", JoinType.LEFT);
                String roleName = filter.getRole().toUpperCase();
                if (!roleName.startsWith("ROLE_")) {
                    roleName = "ROLE_" + roleName;
                }
                predicates.add(cb.equal(roleJoin.get("roleCode"), roleName));
            }

            // 4. Date Range
            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getFromDate().atStartOfDay()));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getToDate().atTime(23, 59, 59)));
            }

            query.distinct(true);
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}