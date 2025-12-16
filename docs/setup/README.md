# Spring Boot Local Infrastructure (Docker Compose)

Tài liệu này mô tả cách chạy bộ hạ tầng local phục vụ dự án **Java Spring Boot** gồm:

- **PostgreSQL**
- **pgAdmin**
- **Redis**
- **RabbitMQ** (kèm **Management UI**)

Mục tiêu: bạn chỉ cần chạy `docker compose up -d` là có đầy đủ các service backend phổ biến để phát triển local.

---

## 1) Yêu cầu

- Docker Desktop (Windows/Mac) hoặc Docker Engine (Linux)
- Docker Compose v2+ (thường đã tích hợp trong Docker Desktop)
- Port trống trên máy: **5432**, **5050**, **6379**, **5672**, **15672** (hoặc bạn đổi trong `.env`)

Kiểm tra nhanh:

```bash
docker version
docker compose version
```

---

## 2) Cấu trúc thư mục khuyến nghị

```text
.
├─ docker-compose.yml
├─ .env
└─ db/
   └─ init/           # (tuỳ chọn) các file .sql để init DB
```

> Nếu bạn dùng init scripts cho Postgres, hãy đặt file `*.sql` trong `db/init/` và bật mount trong `docker-compose.yml` (phần “Init DB”).

---

## 3) Cấu hình môi trường `.env` (khuyến nghị)

Tạo file `.env` cùng cấp với `docker-compose.yml`:

```env
TZ=Asia/Bangkok

POSTGRES_DB=app_db
POSTGRES_USER=app_user
POSTGRES_PASSWORD=app_password
POSTGRES_PORT=5432

PGADMIN_DEFAULT_EMAIL=admin@local.dev
PGADMIN_DEFAULT_PASSWORD=admin123
PGADMIN_PORT=5050

REDIS_PORT=6379

RABBITMQ_USER=rabbit
RABBITMQ_PASSWORD=rabbit123
RABBITMQ_PORT=5672
RABBITMQ_MGMT_PORT=15672
```

Gợi ý:
- Với team, không commit `.env` chứa mật khẩu thật; dùng `.env.example` và hướng dẫn tự copy.
- Mật khẩu ở đây phù hợp local dev, không dùng cho production.

---

## 4) Chạy hệ thống

### 4.1 Start

```bash
docker compose up -d
```

### 4.2 Kiểm tra trạng thái

```bash
docker compose ps
```

Xem log theo thời gian thực:

```bash
docker compose logs -f
```

Log theo service:

```bash
docker compose logs -f postgres
docker compose logs -f rabbitmq
docker compose logs -f redis
docker compose logs -f pgadmin
```

### 4.3 Stop

```bash
docker compose down
```

### 4.4 Reset toàn bộ dữ liệu (xoá volumes)

Cảnh báo: thao tác này xoá dữ liệu Postgres / Redis / RabbitMQ / pgAdmin.

```bash
docker compose down -v
```

---

## 5) Thông tin truy cập dịch vụ

### 5.1 PostgreSQL

- Host (từ máy bạn): `localhost`
- Port: `5432` (hoặc `POSTGRES_PORT`)
- Database: `POSTGRES_DB`
- Username: `POSTGRES_USER`
- Password: `POSTGRES_PASSWORD`

Kết nối bằng `psql` (nếu có):

```bash
psql -h localhost -p 5432 -U app_user -d app_db
```

> Nếu Spring Boot chạy **trong container** cùng network, hostname Postgres là **`postgres`** (tên service).

---

### 5.2 pgAdmin

- URL: `http://localhost:5050` (hoặc `PGADMIN_PORT`)
- Email: `PGADMIN_DEFAULT_EMAIL`
- Password: `PGADMIN_DEFAULT_PASSWORD`

**Tạo kết nối tới Postgres trong pgAdmin**:

- Register → Server
  - Name: `local-postgres` (tuỳ bạn)
- Tab **Connection**
  - Host name/address: `postgres`
  - Port: `5432`
  - Maintenance database: `app_db`
  - Username: `app_user`
  - Password: `app_password`

Lý do host dùng `postgres`: pgAdmin chạy trong Docker network, nó gọi Postgres qua DNS nội bộ theo tên service.

---

### 5.3 Redis

- Host (từ máy bạn): `localhost`
- Port: `6379` (hoặc `REDIS_PORT`)
- Mặc định không password

Test nhanh:

```bash
docker exec -it infra-redis redis-cli ping
# PONG
```

> Nếu Spring Boot chạy **trong container**: `spring.data.redis.host=redis`

---

### 5.4 RabbitMQ

- AMQP: `amqp://localhost:5672` (hoặc `RABBITMQ_PORT`)
- Management UI: `http://localhost:15672` (hoặc `RABBITMQ_MGMT_PORT`)
- Username: `rabbit`
- Password: `rabbit123`

Test nhanh:

```bash
docker exec -it infra-rabbitmq rabbitmq-diagnostics -q ping
```

---

## 6) Cấu hình Spring Boot (mẫu)

### 6.1 Khi Spring Boot chạy trực tiếp trên máy (không Docker)

`application.properties`:

```properties
spring.application.name=ThanhToanNoiBo
spring.datasource.url=jdbc:postgresql://[::1]:5432/app_db
spring.datasource.username=app_user
spring.datasource.password=app_password
debug=true

spring.data.redis.host=localhost
spring.data.redis.port=6379

spring.rabbitmq.host=localhost
spring.rabbitmq.port=5672
spring.rabbitmq.username=rabbit
spring.rabbitmq.password=rabbit123
```




## 7) Healthcheck & phụ thuộc dịch vụ

Compose được cấu hình healthcheck cho:
- Postgres: `pg_isready`
- Redis: `redis-cli ping`
- RabbitMQ: `rabbitmq-diagnostics ping`

`pgadmin` được cấu hình `depends_on` theo `service_healthy` của Postgres để giảm lỗi kết nối do Postgres chưa sẵn sàng.

---

## 8) Volumes & dữ liệu

Dữ liệu được lưu persist qua Docker volumes:

- `postgres-data`: dữ liệu Postgres
- `pgadmin-data`: cấu hình pgAdmin
- `redis-data`: dữ liệu Redis (AOF)
- `rabbitmq-data`: dữ liệu RabbitMQ

Xem volumes:

```bash
docker volume ls
```

---

## 9) Lỗi thường gặp & cách xử lý

### 9.1 Port đã bị chiếm
Triệu chứng: `bind: address already in use`

Cách xử lý:
- Đổi port trong `.env` (ví dụ `POSTGRES_PORT=5433`) rồi `docker compose up -d`
- Hoặc tắt service đang dùng port đó

---

### 9.2 pgAdmin không kết nối được Postgres
Nguyên nhân phổ biến:
- Bạn đặt host là `localhost` thay vì `postgres` trong pgAdmin.
- Postgres chưa healthy.

Cách xử lý:
- Trong pgAdmin, dùng host: `postgres`
- Kiểm tra `docker compose ps` xem Postgres đã healthy chưa
- Xem log: `docker compose logs -f postgres`

---

### 9.3 Spring Boot kết nối DB thất bại
Kiểm tra:
- Nếu app chạy trên máy: dùng `localhost`
- Nếu app chạy trong container: dùng `postgres` (tên service)
- Kiểm tra username/password/database trùng với `.env`

---

## 10) Ghi chú bảo mật (quan trọng)

Cấu hình trong repo này **chỉ phù hợp local development**:
- Mật khẩu nằm trong `.env`
- Không bật TLS cho RabbitMQ/Postgres
- Không cấu hình firewall / network policy

Với staging/production:
- Dùng secret manager
- Tách network, hạn chế port expose
- Bật TLS và hardening theo chuẩn của tổ chức

---

## 11) Lệnh hữu ích

Xoá container cũ và chạy lại:

```bash
docker compose down -v
docker compose up -d
```

Rebuild (nếu bạn thêm service app có Dockerfile):

```bash
docker compose up -d --build
```

Xem tài nguyên:

```bash
docker stats
```

---

## 12) Tham chiếu nhanh

- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`
- Redis: `localhost:6379`
- RabbitMQ AMQP: `localhost:5672`
- RabbitMQ UI: `http://localhost:15672`

---

