package com.example.thanhtoannoibo.Service.Catalog.Manager;

import java.util.UUID;

public interface ICatalogWriter <C, U, R>{
    R create(C request);
    R update(UUID id, U request);
}
