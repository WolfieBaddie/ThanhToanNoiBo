package com.example.thanhtoannoibo.Entity.Catalog;
import com.example.thanhtoannoibo.Common.CatalogStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "master_services", schema = "app")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MasterService {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "master_id")
    private UUID masterId;

    @Column(name = "service_code", nullable = false, unique = true)
    private String serviceCode; // STD_...

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    @Column(name = "fixed_price", nullable = false)
    private BigDecimal fixedPrice;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private CatalogStatus status = CatalogStatus.ACTIVE;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private ServiceCategory category;
}
