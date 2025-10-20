# KareMatch AWS Lightsail Deployment Checklist

**Last Updated**: 2025-10-19
**Target Deployment**: AWS Lightsail Container Service (Nano - 512MB RAM)
**Database**: RDS PostgreSQL db.t4g.micro
**Region**: us-east-1

---

## 🎯 **Deployment Status**

- [ ] **Phase 1**: Critical Pre-Deployment Fixes (Required before first successful deployment)
- [ ] **Phase 2**: Post-Deployment Optimizations (Before second deployment)
- [ ] **Phase 3**: Production Hardening (First week in production)

---

## 🔴 **PHASE 1: CRITICAL PRE-DEPLOYMENT FIXES**

**Target**: Complete before deploying to Lightsail
**Estimated Time**: ~80 minutes
**Status**: Must complete all items

### ✅ 1. Parameter Store Integration (30 minutes)

**Priority**: P0 - BLOCKER
**Why**: Code uses Secrets Manager but secrets are in Parameter Store
**Impact**: Container will crash on startup with "Failed to load secrets"

#### Tasks:

- [ ] **1.1** Install AWS SDK for SSM
  ```bash
  npm install @aws-sdk/client-ssm
  ```

- [ ] **1.2** Add Parameter Store functions to `server/lib/secrets.ts`
  - [ ] Import SSMClient and GetParameterCommand
  - [ ] Create `getSSMClient()` function
  - [ ] Create `fetchParameterFromSSM(paramName)` function

- [ ] **1.3** Update `loadSecrets()` function in `server/lib/secrets.ts`
  - [ ] Add `useParameterStore` check
  - [ ] Fetch all 3 parameters: `/karematch/database-url`, `/karematch/session-secret`, `/karematch/encryption-key`
  - [ ] Set `process.env` variables after loading
  - [ ] Add detailed console logging for debugging

- [ ] **1.4** Add Lightsail environment variable
  ```
  USE_PARAMETER_STORE=true
  ```

- [ ] **1.5** Test locally with Parameter Store
  ```bash
  export USE_PARAMETER_STORE=true
  export AWS_REGION=us-east-1
  export AWS_EXECUTION_ENV=AWS_ECS_FARGATE  # Simulate AWS environment
  npm run build
  npm start
  ```

**Verification**:
- [ ] Logs show "Fetching secrets from AWS Systems Manager Parameter Store"
- [ ] Logs show "✅ Successfully loaded secrets from Parameter Store"
- [ ] Server starts without errors

---

### ✅ 2. Lazy Database Initialization (20 minutes)

**Priority**: P0 - BLOCKER
**Why**: Database connection at import time crashes container
**Impact**: Container exits before health check, deployment canceled

#### Tasks:

- [ ] **2.1** Update `server/db.ts` to lazy initialization
  - [ ] Remove immediate connection on import
  - [ ] Create `getDb()` function with lazy init
  - [ ] Add Proxy for backward compatibility
  - [ ] Add database connection logging
  - [ ] Change SSL config: `rejectUnauthorized: false`

- [ ] **2.2** Add connection pool configuration
  ```typescript
  max: 5,                    // Max 5 connections per container
  idle_timeout: 60,          // Close idle after 60s
  max_lifetime: 60 * 30,     // Recycle every 30 min
  connect_timeout: 10,       // 10s timeout
  ```

- [ ] **2.3** Add `getDbClient()` export for graceful shutdown

- [ ] **2.4** Test that database doesn't connect until first query
  ```bash
  npm run build
  npm start
  # Should see: "serving on port 5000" BEFORE database connection
  ```

**Verification**:
- [ ] Logs show server starts BEFORE database connection
- [ ] Health endpoint responds before DB connects
- [ ] First API call triggers database connection

---

### ✅ 3. Lazy Session Store Initialization (20 minutes)

**Priority**: P0 - BLOCKER
**Why**: PgSession constructor connects synchronously, can crash container
**Impact**: Container crash if database unreachable

#### Tasks:

- [ ] **3.1** Update `server/routes.ts` session store initialization
  - [ ] Replace immediate `new PgSession()` with lazy `getSessionStore()` function
  - [ ] Add try/catch error handling
  - [ ] Add fallback to MemoryStore on failure
  - [ ] Change SSL config: `rejectUnauthorized: false`

- [ ] **3.2** Configure session store pool settings
  ```typescript
  pool: {
    max: 3,                     // Max 3 for session store
    min: 1,
    idleTimeoutMillis: 60000,   // 60s
    connectionTimeoutMillis: 10000,
  }
  ```

- [ ] **3.3** Add session store error logging
  ```typescript
  errorLog: (error: Error) => {
    console.error("Session store error:", error.message);
  }
  ```

- [ ] **3.4** Test session store with unreachable database
  ```bash
  export DATABASE_URL="postgresql://wrong:wrong@localhost:5432/test"
  npm start
  # Should fall back to MemoryStore, NOT crash
  ```

**Verification**:
- [ ] Server starts even with invalid DATABASE_URL
- [ ] Logs show "⚠️ Falling back to MemoryStore" on error
- [ ] Container doesn't crash

---

### ✅ 4. Graceful Shutdown Handling (15 minutes)

**Priority**: P0 - CRITICAL
**Why**: No SIGTERM handler = leaked connections + corrupted sessions
**Impact**: Database connection exhaustion, data corruption

#### Tasks:

- [ ] **4.1** Add signal handlers to `server/index.ts`
  - [ ] Create `gracefulShutdown(signal)` function
  - [ ] Add `process.on('SIGTERM')` handler
  - [ ] Add `process.on('SIGINT')` handler
  - [ ] Add `process.on('uncaughtException')` handler
  - [ ] Add `process.on('unhandledRejection')` handler

- [ ] **4.2** Implement shutdown sequence
  - [ ] Close HTTP server (stop accepting requests)
  - [ ] Close database connections with timeout
  - [ ] Log shutdown progress
  - [ ] Exit with appropriate code

- [ ] **4.3** Update `server/db.ts`
  - [ ] Store client reference in global
  - [ ] Export `getDbClient()` function

- [ ] **4.4** Test graceful shutdown
  ```bash
  npm start
  # In another terminal:
  kill -SIGTERM <pid>
  # Should see: "SIGTERM received - starting graceful shutdown"
  ```

**Verification**:
- [ ] SIGTERM triggers shutdown
- [ ] Logs show "HTTP server closed"
- [ ] Logs show "Database connections closed"
- [ ] Process exits cleanly

---

### ✅ 5. Node.js Memory Limit (5 minutes)

**Priority**: P1 - HIGH
**Why**: Lightsail Nano has only 512MB RAM
**Impact**: OOM kills, container restarts

#### Tasks:

- [ ] **5.1** Update Dockerfile CMD
  ```dockerfile
  # Before
  CMD ["node", "dist/index.js"]

  # After - Limit heap to 384MB
  CMD ["node", "--max-old-space-size=384", "dist/index.js"]
  ```

- [ ] **5.2** Add memory monitoring to health endpoint in `server/index.ts`
  ```typescript
  memory: {
    heapUsed: `${heapUsedMB}MB`,
    heapTotal: `${heapTotalMB}MB`,
    percentage: Math.round((heapUsedMB / 384) * 100) + "%",
  }
  ```

- [ ] **5.3** Test memory limit locally
  ```bash
  node --max-old-space-size=384 dist/index.js
  curl http://localhost:5000/health
  # Check memory.percentage in response
  ```

**Verification**:
- [ ] Health endpoint returns memory usage
- [ ] Heap usage stays under 384MB
- [ ] No memory warnings in logs

---

### ✅ 6. Connection Pool Optimization (10 minutes)

**Priority**: P1 - HIGH
**Why**: db.t4g.micro has max 87 connections, need to prevent exhaustion
**Impact**: "Too many connections" errors

#### Tasks:

- [ ] **6.1** Update `server/db.ts` pool settings
  ```typescript
  max: 5,                    // ✅ Max 5 connections per container
  idle_timeout: 60,
  max_lifetime: 60 * 30,
  connect_timeout: 10,
  ```

- [ ] **6.2** Update `server/routes.ts` session pool settings
  ```typescript
  pool: {
    max: 3,                  // ✅ Max 3 for session store
    min: 1,
    idleTimeoutMillis: 60000,
  }
  ```

- [ ] **6.3** Calculate total connections
  - Per container: 5 (app) + 3 (sessions) = 8
  - 3 containers: 8 × 3 = 24 total
  - RDS max: 87
  - ✅ Buffer: 63 connections (safe!)

- [ ] **6.4** Add connection health checks
  ```typescript
  connection: {
    application_name: 'karematch',
    keepalives: 1,
    keepalives_idle: 30,
  }
  ```

**Verification**:
- [ ] Connection pool limits set correctly
- [ ] No "connection pool exhausted" errors
- [ ] Idle connections closed after timeout

---

### ✅ 7. Update Lightsail Configuration (10 minutes)

**Priority**: P0 - BLOCKER
**Why**: Health check too aggressive, DATABASE_URL needs SSL fix
**Impact**: Healthy containers marked unhealthy, deployment canceled

#### Tasks:

- [ ] **7.1** Update DATABASE_URL in Lightsail environment variables
  ```
  # Before
  postgresql://postgres:Welcome2ppmsi%21@karematch-db...?sslmode=require

  # After - Use sslmode=no-verify
  postgresql://postgres:Welcome2ppmsi%21@karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=no-verify
  ```

- [ ] **7.2** Update Health Check Configuration
  - Path: `/health`
  - Timeout: **10 seconds** (increased from 2s)
  - Interval: **10 seconds** (increased from 5s)
  - Healthy threshold: **2**
  - Unhealthy threshold: **3**

- [ ] **7.3** Verify all Lightsail environment variables
  ```
  AWS_REGION=us-east-1
  NODE_ENV=production
  PORT=5000
  USE_PARAMETER_STORE=true
  DATABASE_URL=postgresql://postgres:Welcome2ppmsi%21@karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=no-verify
  SESSION_SECRET=ire9naslXt6kh8DPqPm+KACgT6YMqv95VQl4r2v+YAHumjMYoyKBVFIXbDyOSDXg
  ENCRYPTION_KEY=pDKEOfmV0N8nm4AsxAq4FsF+erq1ijJ1Qx5NMw+0NfM=
  ```

**Verification**:
- [ ] Health check path matches endpoint
- [ ] Timeouts are realistic for DB connections
- [ ] All environment variables present

---

### ✅ 8. Enhanced Startup Logging (10 minutes)

**Priority**: P1 - HIGH
**Why**: No logs visible when container crashes early
**Impact**: Can't debug deployment failures

#### Tasks:

- [ ] **8.1** Add comprehensive startup logging to `server/index.ts`
  ```typescript
  console.log("=== KareMatch Container Starting ===");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("PORT:", process.env.PORT);
  console.log("AWS_REGION:", process.env.AWS_REGION);
  console.log("Has DATABASE_URL:", !!process.env.DATABASE_URL);
  console.log("Has SESSION_SECRET:", !!process.env.SESSION_SECRET);
  console.log("Has ENCRYPTION_KEY:", !!process.env.ENCRYPTION_KEY);
  ```

- [ ] **8.2** Add checkpoint logging
  - [ ] "✅ Secrets loaded"
  - [ ] "✅ Health endpoint registered"
  - [ ] "✅ Routes registered"
  - [ ] "✅ Static files configured"
  - [ ] "serving on port 5000"

- [ ] **8.3** Add error logging with delay before exit
  ```typescript
  catch (error) {
    console.error("❌ FATAL STARTUP ERROR:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack");
    console.log("Waiting 60s before exit to allow log viewing...");
    setTimeout(() => process.exit(1), 60000);
  }
  ```

**Verification**:
- [ ] Logs appear in Lightsail console
- [ ] Can see which step failed
- [ ] 60-second delay allows viewing error logs

---

### ✅ 9. Build and Test Phase 1 Changes (15 minutes)

**Priority**: P0 - REQUIRED
**Why**: Validate all changes before deploying

#### Tasks:

- [ ] **9.1** Install new dependencies
  ```bash
  npm install @aws-sdk/client-ssm
  npm install  # Ensure all dependencies up to date
  ```

- [ ] **9.2** Run TypeScript compilation
  ```bash
  npm run check
  # Should complete with no errors
  ```

- [ ] **9.3** Build application
  ```bash
  npm run build
  # Verify dist/index.js created
  # Verify client/dist exists
  ```

- [ ] **9.4** Test production build locally
  ```bash
  export NODE_ENV=production
  export PORT=5000
  export DATABASE_URL="postgresql://postgres:Welcome2ppmsi!@karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=no-verify"
  export SESSION_SECRET="ire9naslXt6kh8DPqPm+KACgT6YMqv95VQl4r2v+YAHumjMYoyKBVFIXbDyOSDXg"
  export ENCRYPTION_KEY="pDKEOfmV0N8nm4AsxAq4FsF+erq1ijJ1Qx5NMw+0NfM="

  npm start
  ```

- [ ] **9.5** Verify startup sequence
  - [ ] "KareMatch Container Starting" appears first
  - [ ] "✅ Secrets loaded" (or Parameter Store message)
  - [ ] "✅ Health endpoint registered"
  - [ ] "✅ Routes registered"
  - [ ] "serving on port 5000"

- [ ] **9.6** Test health endpoint
  ```bash
  curl http://localhost:5000/health
  # Should return JSON with status: "healthy"
  ```

- [ ] **9.7** Test API endpoint
  ```bash
  curl http://localhost:5000/api/therapists
  # Should return therapist data or empty array
  ```

- [ ] **9.8** Test graceful shutdown
  ```bash
  # Get process ID
  ps aux | grep node
  # Send SIGTERM
  kill -SIGTERM <pid>
  # Should see graceful shutdown logs
  ```

**Verification**:
- [ ] No TypeScript errors
- [ ] Build completes successfully
- [ ] Server starts locally
- [ ] Health check works
- [ ] API endpoints work
- [ ] Graceful shutdown works

---

### ✅ 10. Build and Push Docker Image (10 minutes)

**Priority**: P0 - REQUIRED
**Why**: Need updated image in Lightsail

#### Tasks:

- [ ] **10.1** Build Docker image locally
  ```bash
  docker build -t karematch:latest .
  ```

- [ ] **10.2** Test Docker image locally
  ```bash
  docker run -p 5000:5000 \
    -e NODE_ENV=production \
    -e PORT=5000 \
    -e DATABASE_URL="postgresql://postgres:Welcome2ppmsi!@karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=no-verify" \
    -e SESSION_SECRET="ire9naslXt6kh8DPqPm+KACgT6YMqv95VQl4r2v+YAHumjMYoyKBVFIXbDyOSDXg" \
    -e ENCRYPTION_KEY="pDKEOfmV0N8nm4AsxAq4FsF+erq1ijJ1Qx5NMw+0NfM=" \
    karematch:latest
  ```

- [ ] **10.3** Verify Docker container
  ```bash
  # In another terminal
  curl http://localhost:5000/health
  docker logs <container_id>  # Check for startup logs
  ```

- [ ] **10.4** Tag image for Lightsail
  ```bash
  # Get Lightsail registry URL from console
  docker tag karematch:latest <lightsail-registry-url>:karematch.latest
  ```

- [ ] **10.5** Push to Lightsail registry
  ```bash
  # Authenticate to Lightsail
  aws lightsail push-container-image \
    --service-name karematch \
    --label latest \
    --image karematch:latest
  ```

**Verification**:
- [ ] Docker build succeeds
- [ ] Container runs locally
- [ ] Health check works in Docker
- [ ] Image pushed to Lightsail

---

### ✅ 11. Deploy to Lightsail (5 minutes)

**Priority**: P0 - REQUIRED
**Why**: Deploy updated container

#### Tasks:

- [ ] **11.1** Update Lightsail container configuration
  - Container name: `karematch`
  - Image: Latest pushed image
  - Port: 5000
  - Environment variables: All 6 variables set

- [ ] **11.2** Click "Save and deploy"

- [ ] **11.3** Monitor deployment logs
  - Watch for "Creating..." messages
  - Look for "Started 1 new node"
  - Wait for "Running" status

- [ ] **11.4** Check deployment logs for errors
  - Look for startup sequence logs
  - Verify no error messages
  - Check for "serving on port 5000"

- [ ] **11.5** Test deployed application
  ```bash
  # Get Lightsail public URL
  curl https://<your-lightsail-url>/health
  ```

**Verification**:
- [ ] Deployment completes successfully
- [ ] Status shows "Running"
- [ ] Health endpoint responds
- [ ] No error logs

---

## 🟠 **PHASE 2: POST-DEPLOYMENT OPTIMIZATIONS**

**Target**: Complete before second deployment
**Estimated Time**: ~60 minutes
**Status**: Optional for first deployment, required for production stability

### ✅ 12. Database Migration Automation (30 minutes)

**Priority**: P2 - RECOMMENDED
**Why**: Manual migrations don't scale
**Impact**: Schema drift, manual errors

#### Tasks:

- [ ] **12.1** Choose migration strategy:
  - [ ] **Option A**: Container startup migrations (simple)
  - [ ] **Option B**: Separate migration container (zero-downtime)
  - [ ] **Option C**: Manual pre-deployment (safest)

- [ ] **12.2** If Option A (Startup Migrations):
  - [ ] Add `runMigrations()` function to `server/index.ts`
  - [ ] Call before `registerRoutes()`
  - [ ] Add error handling and logging
  - [ ] Test migration failure behavior

- [ ] **12.3** If Option B (Separate Container):
  - [ ] Create migration-specific Dockerfile
  - [ ] Add Lightsail container: `karematch-migrations`
  - [ ] Configure to run once before app deployment
  - [ ] Test migration container

- [ ] **12.4** Add migration rollback procedure
  - [ ] Document rollback steps
  - [ ] Test rollback on staging database

**Verification**:
- [ ] Migrations run automatically
- [ ] Schema matches shared/schema.ts
- [ ] Migration failures logged properly

---

### ✅ 13. Production Monitoring Setup (30 minutes)

**Priority**: P2 - RECOMMENDED
**Why**: Need visibility into production issues
**Impact**: Can't debug production problems

#### Tasks:

- [ ] **13.1** Set up CloudWatch Logs
  - [ ] Enable Lightsail container logs
  - [ ] Configure log retention (7 days recommended)
  - [ ] Create log groups

- [ ] **13.2** Create CloudWatch Alarms
  - [ ] High memory usage (>80%)
  - [ ] High CPU usage (>80%)
  - [ ] Container restart count
  - [ ] Health check failures

- [ ] **13.3** Set up error alerting
  - [ ] SNS topic for alerts
  - [ ] Email/SMS notifications
  - [ ] Slack integration (optional)

- [ ] **13.4** Test monitoring
  - [ ] Trigger test alarm
  - [ ] Verify notifications received
  - [ ] Check log aggregation

**Verification**:
- [ ] Logs visible in CloudWatch
- [ ] Alarms configured
- [ ] Notifications working

---

## 🟢 **PHASE 3: PRODUCTION HARDENING**

**Target**: Complete in first week of production
**Estimated Time**: ~2 hours
**Status**: Nice to have, improves reliability

### ✅ 14. Error Recovery & Circuit Breaker (45 minutes)

**Priority**: P3 - OPTIONAL
**Why**: Handle temporary database failures gracefully
**Impact**: Better user experience during outages

#### Tasks:

- [ ] **14.1** Create `server/lib/circuit-breaker.ts`
  - [ ] Implement `withRetry()` function
  - [ ] Add exponential backoff
  - [ ] Add max retry limit

- [ ] **14.2** Add connection health checks to `server/db.ts`
  ```typescript
  connection: {
    keepalives: 1,
    keepalives_idle: 30,
  }
  ```

- [ ] **14.3** Wrap critical operations with retry logic
  - [ ] User authentication
  - [ ] Therapist searches
  - [ ] Appointment booking

- [ ] **14.4** Add circuit breaker state logging
  - [ ] Log retry attempts
  - [ ] Log successful retries
  - [ ] Log final failures

- [ ] **14.5** Test error recovery
  - [ ] Simulate database connection loss
  - [ ] Verify automatic retry
  - [ ] Check user-facing error messages

**Verification**:
- [ ] Retries work for transient errors
- [ ] Users see friendly error messages
- [ ] Logs show retry attempts

---

### ✅ 15. Performance Optimization (45 minutes)

**Priority**: P3 - OPTIONAL
**Why**: Improve response times and resource usage
**Impact**: Better user experience, lower costs

#### Tasks:

- [ ] **15.1** Enable response compression
  ```bash
  npm install compression
  ```
  - [ ] Add compression middleware to `server/index.ts`
  - [ ] Configure compression level

- [ ] **15.2** Add response caching for static data
  - [ ] Cache therapist profiles (5 minutes)
  - [ ] Cache ZIP code lookups (1 hour)
  - [ ] Add cache headers

- [ ] **15.3** Optimize database queries
  - [ ] Add indexes to frequently queried columns
  - [ ] Review slow query log
  - [ ] Optimize N+1 queries

- [ ] **15.4** Load test application
  - [ ] Use Apache Bench or k6
  - [ ] Test 100 concurrent users
  - [ ] Identify bottlenecks

**Verification**:
- [ ] Response times <500ms for most requests
- [ ] Memory usage stable under load
- [ ] No performance degradation

---

### ✅ 16. Security Hardening (30 minutes)

**Priority**: P3 - RECOMMENDED
**Why**: HIPAA compliance and data protection
**Impact**: Regulatory compliance, user trust

#### Tasks:

- [ ] **16.1** Add security headers
  ```bash
  npm install helmet
  ```
  - [ ] Configure Helmet middleware
  - [ ] Set CSP headers
  - [ ] Enable HSTS

- [ ] **16.2** Enable rate limiting
  ```bash
  npm install express-rate-limit
  ```
  - [ ] Limit auth endpoints (5 requests/15 min)
  - [ ] Limit API endpoints (100 requests/15 min)
  - [ ] Log rate limit violations

- [ ] **16.3** Add request validation
  - [ ] Validate all API inputs
  - [ ] Sanitize user inputs
  - [ ] Add request size limits

- [ ] **16.4** Security audit
  - [ ] Run npm audit
  - [ ] Update vulnerable packages
  - [ ] Review dependency licenses

**Verification**:
- [ ] Security headers present in responses
- [ ] Rate limiting blocks excessive requests
- [ ] No critical vulnerabilities

---

### ✅ 17. Static Assets to S3/CloudFront (2 hours)

**Priority**: P3 - OPTIONAL (after 1000+ users)
**Why**: Reduce container memory usage, add CDN caching
**Impact**: Better performance, lower Lightsail costs

#### Tasks:

- [ ] **17.1** Create S3 bucket
  ```bash
  aws s3 mb s3://karematch-static --region us-east-1
  ```

- [ ] **17.2** Configure S3 bucket for static hosting
  - [ ] Enable public read access
  - [ ] Set bucket policy
  - [ ] Configure CORS

- [ ] **17.3** Create CloudFront distribution
  - [ ] Origin: S3 bucket
  - [ ] Enable HTTPS
  - [ ] Configure cache behaviors

- [ ] **17.4** Update build process
  - [ ] Upload dist/public to S3 after build
  - [ ] Update vite.config.ts with CDN URL
  - [ ] Test asset loading

- [ ] **17.5** Deploy and test
  - [ ] Build with CDN URL
  - [ ] Verify assets load from CloudFront
  - [ ] Check cache headers

**Verification**:
- [ ] Assets load from CloudFront
- [ ] Container memory usage reduced
- [ ] Faster page load times

---

## 📊 **DEPLOYMENT READINESS SCORECARD**

### Critical (Must Complete)
- [ ] Parameter Store integration
- [ ] Lazy database initialization
- [ ] Lazy session store initialization
- [ ] Graceful shutdown handlers
- [ ] Memory limits configured
- [ ] Connection pools optimized
- [ ] Lightsail config updated
- [ ] Enhanced logging added
- [ ] Docker image built and tested
- [ ] Deployed to Lightsail successfully

**Score**: ___/10 ✅ (Need 10/10 to deploy)

### Recommended (Should Complete)
- [ ] Database migrations automated
- [ ] CloudWatch monitoring set up
- [ ] Error recovery implemented
- [ ] Security headers added
- [ ] Rate limiting enabled

**Score**: ___/5 (Nice to have)

### Optional (Can Wait)
- [ ] Performance optimizations
- [ ] Static assets on CloudFront
- [ ] Load testing completed

**Score**: ___/3 (Future improvements)

---

## 🚨 **ROLLBACK PLAN**

If deployment fails, follow these steps:

1. **Immediate Rollback**:
   - [ ] Revert to previous Lightsail deployment
   - [ ] Check RDS connection count: `SELECT count(*) FROM pg_stat_activity;`
   - [ ] Kill zombie connections if needed

2. **Debug**:
   - [ ] Check Lightsail logs for error messages
   - [ ] Verify environment variables in Lightsail console
   - [ ] Test Parameter Store access with AWS CLI
   - [ ] Verify DATABASE_URL format

3. **Recovery**:
   - [ ] Fix identified issues locally
   - [ ] Test thoroughly before redeploying
   - [ ] Update this checklist with lessons learned

---

## 📝 **DEPLOYMENT LOG**

| Date | Phase | Status | Issues | Notes |
|------|-------|--------|--------|-------|
| 2025-10-19 | Initial Setup | ⏳ In Progress | - | Created checklist |
|  |  |  |  |  |
|  |  |  |  |  |

---

## 🎯 **SUCCESS CRITERIA**

Deployment is considered successful when:

- [x] RDS database created and accessible
- [x] Database schema initialized (tables created)
- [x] Secrets stored in Parameter Store
- [ ] Container deploys without cancellation
- [ ] Health check returns 200 OK
- [ ] Application accessible via public URL
- [ ] Can view therapist list
- [ ] Can create appointments
- [ ] Logs show no errors
- [ ] Memory usage <80%
- [ ] CPU usage <50%
- [ ] Response times <1 second

---

## 📚 **REFERENCE INFORMATION**

### Environment Variables (Lightsail)
```
AWS_REGION=us-east-1
NODE_ENV=production
PORT=5000
USE_PARAMETER_STORE=true
DATABASE_URL=postgresql://postgres:Welcome2ppmsi%21@karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=no-verify
SESSION_SECRET=ire9naslXt6kh8DPqPm+KACgT6YMqv95VQl4r2v+YAHumjMYoyKBVFIXbDyOSDXg
ENCRYPTION_KEY=pDKEOfmV0N8nm4AsxAq4FsF+erq1ijJ1Qx5NMw+0NfM=
```

### Parameter Store Paths
- `/karematch/database-url`
- `/karematch/session-secret`
- `/karematch/encryption-key`

### RDS Connection Details
- Endpoint: `karematch-db.cm1ksgqm0c00.us-east-1.rds.amazonaws.com`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: `Welcome2ppmsi!` (URL-encoded: `Welcome2ppmsi%21`)

### Container Specifications
- Service: Lightsail Container Service
- Size: Nano (512MB RAM, 0.25 vCPU)
- Containers: 3 replicas
- Port: 5000

### Health Check Configuration
- Path: `/health`
- Timeout: 10 seconds
- Interval: 10 seconds
- Healthy threshold: 2
- Unhealthy threshold: 3

---

## ✅ **NEXT STEPS**

After completing this checklist:

1. **Monitor for 24 hours**
   - Watch CloudWatch logs
   - Check memory/CPU metrics
   - Monitor error rates

2. **User Testing**
   - Test all critical user flows
   - Verify appointment booking works
   - Check chatbot functionality

3. **Iterate**
   - Fix any issues found
   - Optimize based on real usage
   - Update checklist with learnings

---

**Last Updated**: 2025-10-19
**Version**: 1.0
**Status**: Ready for Phase 1 implementation
