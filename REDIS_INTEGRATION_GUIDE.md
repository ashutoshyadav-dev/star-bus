# Redis Integration Guide for AP Bus Seva Backend

## Overview

The backend already has `RedisConfig.java` — you only need to wire up a
**RedisSessionRepository** and swap the `AuthSession` DB lookups for Redis
lookups in `AuthService`.

---

## Step 1 — Add Redis dependencies to `pom.xml`

```xml
<!-- pom.xml — inside <dependencies> -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.session</groupId>
  <artifactId>spring-session-data-redis</artifactId>
</dependency>
<dependency>
  <groupId>io.lettuce</groupId>
  <artifactId>lettuce-core</artifactId>
</dependency>
```

---

## Step 2 — `application.yml` Redis config

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}   # leave empty for local dev
      timeout: 2000ms
      lettuce:
        pool:
          max-active: 20
          max-idle:   10
          min-idle:   2

# Access token TTL (match your JWT expiry)
auth:
  access-token-ttl-seconds:  900      # 15 min
  refresh-token-ttl-seconds: 604800   # 7 days
```

---

## Step 3 — `RedisConfig.java` (update existing file)

Location: `src/main/java/com/apsts/apbusseva/config/RedisConfig.java`

```java
@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        Jackson2JsonRedisSerializer<Object> serializer =
            new Jackson2JsonRedisSerializer<>(Object.class);
        ObjectMapper mapper = new ObjectMapper();
        mapper.activateDefaultTyping(
            mapper.getPolymorphicTypeValidator(),
            ObjectMapper.DefaultTyping.NON_FINAL
        );
        serializer.setObjectMapper(mapper);

        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(serializer);
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(serializer);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(15))
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair
                    .fromSerializer(new GenericJackson2JsonRedisSerializer())
            );
        return RedisCacheManager.builder(factory)
            .cacheDefaults(config)
            .build();
    }
}
```

---

## Step 4 — Create `RedisSessionRepository`

**Location:**
`src/main/java/com/apsts/apbusseva/repository/redis/RedisSessionRepository.java`

```java
package com.apsts.apbusseva.repository.redis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Repository
@RequiredArgsConstructor
public class RedisSessionRepository {

    private final RedisTemplate<String, Object> redisTemplate;

    // Key prefixes
    private static final String ACCESS_KEY  = "auth:access:";   // access_token jti → userId
    private static final String REFRESH_KEY = "auth:refresh:";  // refresh_token jti → userId
    private static final String USER_SESSIONS_KEY = "auth:user:"; // userId → Set<jti>

    // ─────────────────────────────────────────────────────────────────────────
    // Store tokens
    // ─────────────────────────────────────────────────────────────────────────

    public void storeAccessToken(String jti, String userId, Duration ttl) {
        redisTemplate.opsForValue().set(ACCESS_KEY + jti, userId, ttl);
        redisTemplate.opsForSet().add(USER_SESSIONS_KEY + userId, jti);
    }

    public void storeRefreshToken(String jti, String userId, Duration ttl) {
        redisTemplate.opsForValue().set(REFRESH_KEY + jti, userId, ttl);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Validate tokens
    // ─────────────────────────────────────────────────────────────────────────

    public boolean isAccessTokenValid(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(ACCESS_KEY + jti));
    }

    public boolean isRefreshTokenValid(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(REFRESH_KEY + jti));
    }

    public Optional<String> getUserIdByRefreshToken(String jti) {
        Object val = redisTemplate.opsForValue().get(REFRESH_KEY + jti);
        return Optional.ofNullable(val).map(Object::toString);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Revoke tokens (logout)
    // ─────────────────────────────────────────────────────────────────────────

    /** Revoke a single session (logout current device) */
    public void revokeAccessToken(String jti, String userId) {
        redisTemplate.delete(ACCESS_KEY + jti);
        redisTemplate.opsForSet().remove(USER_SESSIONS_KEY + userId, jti);
        log.info("Session revoked: jti={} userId={}", jti, userId);
    }

    /** Revoke all sessions for a user (logout all devices) */
    public void revokeAllSessions(String userId) {
        Set<Object> jtis = redisTemplate.opsForSet().members(USER_SESSIONS_KEY + userId);
        if (jtis != null) {
            jtis.forEach(jti -> redisTemplate.delete(ACCESS_KEY + jti.toString()));
        }
        redisTemplate.delete(USER_SESSIONS_KEY + userId);
        log.info("All sessions revoked for userId={}", userId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OTP storage
    // ─────────────────────────────────────────────────────────────────────────

    public void storeOtp(String requestId, String otpHash, Duration ttl) {
        redisTemplate.opsForValue().set("otp:" + requestId, otpHash, ttl);
    }

    public Optional<String> getOtp(String requestId) {
        Object val = redisTemplate.opsForValue().get("otp:" + requestId);
        return Optional.ofNullable(val).map(Object::toString);
    }

    public void deleteOtp(String requestId) {
        redisTemplate.delete("otp:" + requestId);
    }
}
```

---

## Step 5 — Update `AuthService` to use Redis

In `AuthService`, inject `RedisSessionRepository` and replace DB-based
session checks with Redis calls.

### Key changes:

```java
@Service
@RequiredArgsConstructor
public class AuthService {

    private final RedisSessionRepository redisRepo;
    private final AuthSessionRepository  dbSessionRepo;  // keep for audit trail
    private final JwtUtil                jwtUtil;

    @Value("${auth.access-token-ttl-seconds:900}")
    private long accessTtlSeconds;

    @Value("${auth.refresh-token-ttl-seconds:604800}")
    private long refreshTtlSeconds;

    // ── After generating tokens ──────────────────────────────────────────────
    private AuthResponse buildAndStoreSession(User user, ...) {
        String accessToken  = jwtUtil.generateAccessToken(user, ...);
        String refreshToken = jwtUtil.generateRefreshToken(user, ...);

        String accessJti  = jwtUtil.extractJti(accessToken);
        String refreshJti = jwtUtil.extractJti(refreshToken);

        // Store in Redis (fast lookup during every request)
        redisRepo.storeAccessToken(accessJti,  user.getId(), Duration.ofSeconds(accessTtlSeconds));
        redisRepo.storeRefreshToken(refreshJti, user.getId(), Duration.ofSeconds(refreshTtlSeconds));

        // Also persist to DB for audit trail (optional — can be async)
        saveDbSession(user, accessJti, refreshJti, ...);

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .accessTokenExpiresIn(accessTtlSeconds)
            // ... rest of fields
            .build();
    }

    // ── Logout current device ────────────────────────────────────────────────
    public void logout(String jti, String userId, ...) {
        redisRepo.revokeAccessToken(jti, userId);
        // update DB session status to REVOKED (audit)
    }

    // ── Logout all devices ───────────────────────────────────────────────────
    public void logoutAll(String userId, ...) {
        redisRepo.revokeAllSessions(userId);
        // update DB sessions to REVOKED
    }

    // ── Token refresh ────────────────────────────────────────────────────────
    public AuthResponse refreshToken(TokenRefreshDto dto, ...) {
        String refreshJti = jwtUtil.extractJti(dto.getRefreshToken());

        if (!redisRepo.isRefreshTokenValid(refreshJti)) {
            throw new UnauthorizedException("Refresh token is invalid or expired");
        }

        String userId = redisRepo.getUserIdByRefreshToken(refreshJti)
            .orElseThrow(() -> new UnauthorizedException("Session not found"));

        // Rotate: delete old refresh token, issue new pair
        redisRepo.deleteOtp(refreshJti);  // reuse deleteOtp or add deleteRefreshToken
        User user = userRepo.findById(userId).orElseThrow();
        return buildAndStoreSession(user, ...);
    }
}
```

---

## Step 6 — JWT Filter: validate against Redis

In your JWT filter (`JwtAuthFilter` or equivalent), after parsing the token,
check Redis to ensure the session is still active:

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil               jwtUtil;
    private final RedisSessionRepository redisRepo;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ... {
        String token = extractBearerToken(request);
        if (token != null && jwtUtil.isValid(token)) {
            String jti    = jwtUtil.extractJti(token);
            String userId = jwtUtil.extractSubject(token);

            // ✅ KEY CHECK: is this session still alive in Redis?
            if (redisRepo.isAccessTokenValid(jti)) {
                Authentication auth = buildAuthentication(token, userId);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
            // If not in Redis → token is revoked → 401 (no auth set)
        }
        chain.doFilter(request, response);
    }
}
```

---

## Step 7 — OTP via Redis (replace DB OTP table)

In `OtpService`, store OTPs in Redis instead of the `otp_requests` table:

```java
@Service
@RequiredArgsConstructor
public class OtpService {

    private final RedisSessionRepository redisRepo;

    private static final Duration OTP_TTL = Duration.ofMinutes(10);

    public OtpResponse requestOtp(OtpRequestDto dto, ...) {
        String requestId = UUID.randomUUID().toString();
        String otp       = generateOtp();           // 6-digit
        String otpHash   = hashOtp(otp);            // BCrypt or SHA-256

        // Store in Redis with TTL
        redisRepo.storeOtp(requestId, otpHash, OTP_TTL);

        // Send via SMS gateway
        smsService.send(dto.getPhone(), "Your OTP is: " + otp);

        return OtpResponse.builder()
            .requestId(requestId)
            .expiresIn(OTP_TTL.getSeconds())
            .build();
    }

    public boolean verifyOtp(String requestId, String otp) {
        return redisRepo.getOtp(requestId)
            .map(hash -> BCrypt.checkpw(otp, hash))
            .orElse(false);
    }

    public void invalidateOtp(String requestId) {
        redisRepo.deleteOtp(requestId);
    }
}
```

---

## Redis Key Schema Summary

| Key Pattern             | Value                  | TTL          | Purpose                  |
|-------------------------|------------------------|--------------|--------------------------|
| `auth:access:{jti}`     | userId (String)        | 15 min       | Validate access token    |
| `auth:refresh:{jti}`    | userId (String)        | 7 days       | Validate refresh token   |
| `auth:user:{userId}`    | Set\<jti\>             | No TTL       | Track all user sessions  |
| `otp:{requestId}`       | hashedOtp (String)     | 10 min       | OTP verification         |

---

## Local Redis Setup (Docker)

```bash
# Start Redis container
docker run -d \
  --name apbus-redis \
  -p 6379:6379 \
  redis:7-alpine

# Verify
docker exec -it apbus-redis redis-cli ping
# → PONG
```

For production, use Redis with password:

```bash
docker run -d \
  --name apbus-redis \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --requirepass your_secure_password
```

Update `application-prod.yml`:
```yaml
spring.data.redis.password: your_secure_password
```

---

## File Checklist

| File | Action |
|------|--------|
| `pom.xml` | Add Redis + Spring Session dependencies |
| `application.yml` | Add redis host/port/ttl config |
| `config/RedisConfig.java` | Update existing file with serializer |
| `repository/redis/RedisSessionRepository.java` | **CREATE NEW** |
| `service/AuthService.java` | Inject & use RedisSessionRepository |
| `service/OtpService.java` | Store OTPs in Redis |
| `security/JwtAuthFilter.java` | Add Redis session validation |
