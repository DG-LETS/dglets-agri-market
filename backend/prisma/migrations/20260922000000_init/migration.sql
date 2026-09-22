-- ============================================================
-- DG-LETS Agri Market — Initial Migration Baseline
-- Generated: 2026-09-22
--
-- This migration establishes a version-controlled baseline for
-- the existing schema. It was created manually from the current
-- prisma/schema.prisma because no prior migration history existed.
--
-- Before running `prisma migrate deploy` in production for the
-- first time, verify that this matches the actual live database
-- schema (run `prisma migrate diff` against the live DB first).
-- ============================================================

-- ─── Enums ───────────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM (
  'FARMER', 'BUYER', 'TRADER', 'AGGREGATOR',
  'PROCESSOR', 'EXPORTER', 'HAULAGE', 'ADMIN'
);

CREATE TYPE "UserStatus" AS ENUM (
  'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'
);

CREATE TYPE "VerificationStatus" AS ENUM (
  'UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'
);

CREATE TYPE "ProductStatus" AS ENUM (
  'DRAFT', 'PUBLISHED', 'PAUSED', 'SOLD_OUT', 'DELETED'
);

CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP',
  'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED',
  'CANCELLED', 'DISPUTED', 'REFUNDED'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING', 'PROCESSING', 'PAID', 'FAILED',
  'REFUNDED', 'PARTIALLY_REFUNDED'
);

CREATE TYPE "NotificationType" AS ENUM (
  'ORDER', 'PAYMENT', 'MESSAGE', 'VERIFICATION',
  'DELIVERY', 'REWARD', 'SYSTEM', 'MARKET_PRICE'
);

CREATE TYPE "HaulageJobStatus" AS ENUM (
  'OPEN', 'AWARDED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'
);

CREATE TYPE "HaulageApplicationStatus" AS ENUM (
  'PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'
);

CREATE TYPE "FeeType" AS ENUM (
  'REGISTRATION', 'TRANSACTION', 'HAULAGE_COMMISSION', 'LISTING'
);

CREATE TYPE "FeeStatus" AS ENUM (
  'PENDING', 'PAID', 'WAIVED', 'FAILED'
);

-- ─── Identity ─────────────────────────────────────────────────

CREATE TABLE "users" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email"         TEXT,
  "phone"         TEXT NOT NULL,
  "passwordHash"  TEXT,
  "role"          "UserRole" NOT NULL DEFAULT 'BUYER',
  "status"        "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
  "firstName"     TEXT NOT NULL,
  "lastName"      TEXT NOT NULL,
  "profileImage"  TEXT,
  "referralCode"  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "referredBy"    TEXT,
  "pushToken"     TEXT,
  "lastLoginAt"   TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key"  ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key"  ON "users"("phone");
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

CREATE TABLE "farmer_profiles" (
  "id"                TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"            TEXT NOT NULL,
  "farmName"          TEXT,
  "farmLocation"      TEXT,
  "state"             TEXT NOT NULL,
  "lga"               TEXT,
  "geoLat"            DOUBLE PRECISION,
  "geoLng"            DOUBLE PRECISION,
  "products"          TEXT[],
  "productionCapacity" TEXT,
  "farmSize"          TEXT,
  "farmImages"        TEXT[],
  "bio"               TEXT,
  "yearsOfFarming"    INTEGER,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "farmer_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "farmer_profiles_userId_key" ON "farmer_profiles"("userId");

CREATE TABLE "buyer_profiles" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"       TEXT NOT NULL,
  "businessName" TEXT,
  "buyerType"    TEXT,
  "state"        TEXT,
  "lga"          TEXT,
  "address"      TEXT,
  "geoLat"       DOUBLE PRECISION,
  "geoLng"       DOUBLE PRECISION,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "buyer_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "buyer_profiles_userId_key" ON "buyer_profiles"("userId");

-- ─── Auth tokens ──────────────────────────────────────────────

CREATE TABLE "otp_tokens" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "token"     TEXT NOT NULL,
  "purpose"   TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "otp_tokens_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "otp_tokens_userId_idx" ON "otp_tokens"("userId");

CREATE TABLE "refresh_tokens" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "token"     TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- ─── Marketplace ──────────────────────────────────────────────

CREATE TABLE "categories" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"        TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "description" TEXT,
  "icon"        TEXT,
  "image"       TEXT,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

CREATE TABLE "products" (
  "id"                 TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "sellerId"           TEXT NOT NULL,
  "categoryId"         TEXT NOT NULL,
  "name"               TEXT NOT NULL,
  "slug"               TEXT NOT NULL,
  "description"        TEXT,
  "price"              DOUBLE PRECISION NOT NULL,
  "priceUnit"          TEXT NOT NULL DEFAULT 'kg',
  "quantity"           DOUBLE PRECISION NOT NULL,
  "quantityUnit"       TEXT NOT NULL DEFAULT 'kg',
  "moq"                DOUBLE PRECISION NOT NULL DEFAULT 1,
  "qualityGrade"       TEXT,
  "harvestDate"        TIMESTAMP(3),
  "processingStatus"   TEXT,
  "state"              TEXT NOT NULL,
  "lga"                TEXT,
  "geoLat"             DOUBLE PRECISION,
  "geoLng"             DOUBLE PRECISION,
  "deliveryAvailable"  BOOLEAN NOT NULL DEFAULT false,
  "images"             TEXT[],
  "status"             "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  "viewCount"          INTEGER NOT NULL DEFAULT 0,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "products_sellerId_idx"   ON "products"("sellerId");
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX "products_status_idx"     ON "products"("status");
CREATE INDEX "products_state_idx"      ON "products"("state");

CREATE TABLE "saved_products" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "saved_products_userId_productId_key" ON "saved_products"("userId","productId");

-- ─── Orders ───────────────────────────────────────────────────

CREATE TABLE "orders" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orderNumber"     TEXT NOT NULL,
  "buyerId"         TEXT NOT NULL,
  "sellerId"        TEXT NOT NULL,
  "status"          "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "paymentStatus"   "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "subtotal"        DOUBLE PRECISION NOT NULL,
  "platformFee"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "deliveryFee"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total"           DOUBLE PRECISION NOT NULL,
  "deliveryAddress" TEXT,
  "deliveryState"   TEXT,
  "notes"           TEXT,
  "paidAt"          TIMESTAMP(3),
  "confirmedAt"     TIMESTAMP(3),
  "completedAt"     TIMESTAMP(3),
  "cancelledAt"     TIMESTAMP(3),
  "cancelReason"    TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
CREATE INDEX "orders_buyerId_idx"  ON "orders"("buyerId");
CREATE INDEX "orders_sellerId_idx" ON "orders"("sellerId");
CREATE INDEX "orders_status_idx"   ON "orders"("status");

CREATE TABLE "order_items" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orderId"   TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity"  DOUBLE PRECISION NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "subtotal"  DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- ─── Payments ─────────────────────────────────────────────────

CREATE TABLE "payments" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orderId"      TEXT NOT NULL,
  "amount"       DOUBLE PRECISION NOT NULL,
  "currency"     TEXT NOT NULL DEFAULT 'NGN',
  "provider"     TEXT NOT NULL,
  "providerRef"  TEXT,
  "status"       "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "platformFee"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sellerAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "metadata"     JSONB,
  "paidAt"       TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payments_orderId_key"     ON "payments"("orderId");
CREATE UNIQUE INDEX "payments_providerRef_key" ON "payments"("providerRef");

-- ─── Messaging ────────────────────────────────────────────────

CREATE TABLE "conversations" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "participants"  TEXT[],
  "productId"     TEXT,
  "orderId"       TEXT,
  "lastMessageAt" TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messages" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "conversationId" TEXT NOT NULL,
  "senderId"       TEXT NOT NULL,
  "body"           TEXT NOT NULL,
  "attachments"    TEXT[],
  "readAt"         TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- ─── Trust & Reputation ───────────────────────────────────────

CREATE TABLE "verifications" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"          TEXT NOT NULL,
  "phoneVerified"   BOOLEAN NOT NULL DEFAULT false,
  "emailVerified"   BOOLEAN NOT NULL DEFAULT false,
  "identityStatus"  "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "businessStatus"  "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "farmStatus"      "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "identityDocUrl"  TEXT,
  "businessDocUrl"  TEXT,
  "farmDocUrl"      TEXT,
  "reviewedBy"      TEXT,
  "reviewedAt"      TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "verifications_userId_key" ON "verifications"("userId");

CREATE TABLE "reviews" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orderId"    TEXT NOT NULL,
  "authorId"   TEXT NOT NULL,
  "subjectId"  TEXT NOT NULL,
  "productId"  TEXT,
  "rating"     INTEGER NOT NULL,
  "comment"    TEXT,
  "isVerified" BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "reviews_subjectId_idx" ON "reviews"("subjectId");

-- ─── Notifications ────────────────────────────────────────────

CREATE TABLE "notifications" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL,
  "type"      "NotificationType" NOT NULL,
  "title"     TEXT NOT NULL,
  "body"      TEXT NOT NULL,
  "data"      JSONB,
  "readAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- ─── Rewards ──────────────────────────────────────────────────

CREATE TABLE "reward_wallets" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"         TEXT NOT NULL,
  "balance"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lifetimeEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lifetimeUsed"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "level"          TEXT NOT NULL DEFAULT 'seed',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reward_wallets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "reward_wallets_userId_key" ON "reward_wallets"("userId");

CREATE TABLE "reward_transactions" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "walletId"    TEXT NOT NULL,
  "amount"      DOUBLE PRECISION NOT NULL,
  "type"        TEXT NOT NULL,
  "source"      TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "referenceId" TEXT,
  "balanceAfter" DOUBLE PRECISION NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reward_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "reward_transactions_walletId_idx" ON "reward_transactions"("walletId");

-- ─── Market Intelligence ──────────────────────────────────────

CREATE TABLE "market_prices" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "product"    TEXT NOT NULL,
  "categoryId" TEXT,
  "state"      TEXT NOT NULL,
  "city"       TEXT,
  "priceMin"   DOUBLE PRECISION NOT NULL,
  "priceMax"   DOUBLE PRECISION NOT NULL,
  "priceAvg"   DOUBLE PRECISION NOT NULL,
  "unit"       TEXT NOT NULL DEFAULT 'kg',
  "source"     TEXT NOT NULL DEFAULT 'admin',
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "market_prices_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "market_prices_product_idx" ON "market_prices"("product");
CREATE INDEX "market_prices_state_idx"   ON "market_prices"("state");

-- ─── Audit ────────────────────────────────────────────────────

CREATE TABLE "audit_logs" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT,
  "action"    TEXT NOT NULL,
  "entity"    TEXT NOT NULL,
  "entityId"  TEXT,
  "oldValues" JSONB,
  "newValues" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- ─── Haulage ──────────────────────────────────────────────────

CREATE TABLE "haulage_profiles" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"          TEXT NOT NULL,
  "companyName"     TEXT,
  "bio"             TEXT,
  "vehicleType"     TEXT NOT NULL,
  "vehicleCapacity" DOUBLE PRECISION NOT NULL,
  "licensePlate"    TEXT,
  "yearsExperience" INTEGER,
  "coverageStates"  TEXT[],
  "coverageRoutes"  TEXT,
  "isAvailable"     BOOLEAN NOT NULL DEFAULT true,
  "rating"          DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalJobs"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "haulage_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "haulage_profiles_userId_key" ON "haulage_profiles"("userId");

CREATE TABLE "haulage_jobs" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orderId"         TEXT NOT NULL,
  "status"          "HaulageJobStatus" NOT NULL DEFAULT 'OPEN',
  "awardedToId"     TEXT,
  "offeredFee"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "agreedFee"       DOUBLE PRECISION,
  "platformCut"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "pickupState"     TEXT,
  "pickupAddress"   TEXT,
  "deliveryState"   TEXT,
  "deliveryAddress" TEXT,
  "cargoSummary"    TEXT,
  "totalWeight"     DOUBLE PRECISION,
  "pickupDate"      TIMESTAMP(3),
  "deliveredAt"     TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "haulage_jobs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "haulage_jobs_orderId_key"      ON "haulage_jobs"("orderId");
CREATE INDEX        "haulage_jobs_status_idx"        ON "haulage_jobs"("status");
CREATE INDEX        "haulage_jobs_pickupState_idx"   ON "haulage_jobs"("pickupState");
CREATE INDEX        "haulage_jobs_deliveryState_idx" ON "haulage_jobs"("deliveryState");

CREATE TABLE "haulage_applications" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "jobId"            TEXT NOT NULL,
  "applicantId"      TEXT NOT NULL,
  "haulageProfileId" TEXT NOT NULL,
  "status"           "HaulageApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "proposedFee"      DOUBLE PRECISION,
  "note"             TEXT,
  "appliedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt"      TIMESTAMP(3),
  CONSTRAINT "haulage_applications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "haulage_applications_jobId_applicantId_key" ON "haulage_applications"("jobId","applicantId");
CREATE INDEX        "haulage_applications_applicantId_idx"       ON "haulage_applications"("applicantId");

-- ─── Fees ─────────────────────────────────────────────────────

CREATE TABLE "platform_fees" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL,
  "type"        "FeeType" NOT NULL,
  "amount"      DOUBLE PRECISION NOT NULL,
  "currency"    TEXT NOT NULL DEFAULT 'NGN',
  "status"      "FeeStatus" NOT NULL DEFAULT 'PENDING',
  "referenceId" TEXT,
  "paystackRef" TEXT,
  "description" TEXT NOT NULL,
  "dueAt"       TIMESTAMP(3),
  "paidAt"      TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_fees_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "platform_fees_paystackRef_key" ON "platform_fees"("paystackRef");
CREATE INDEX        "platform_fees_userId_idx"       ON "platform_fees"("userId");
CREATE INDEX        "platform_fees_type_idx"         ON "platform_fees"("type");
CREATE INDEX        "platform_fees_status_idx"       ON "platform_fees"("status");

-- ─── Foreign Keys ─────────────────────────────────────────────

ALTER TABLE "farmer_profiles"       ADD CONSTRAINT "farmer_profiles_userId_fkey"        FOREIGN KEY ("userId")    REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "buyer_profiles"        ADD CONSTRAINT "buyer_profiles_userId_fkey"          FOREIGN KEY ("userId")    REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "haulage_profiles"      ADD CONSTRAINT "haulage_profiles_userId_fkey"        FOREIGN KEY ("userId")    REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "otp_tokens"            ADD CONSTRAINT "otp_tokens_userId_fkey"              FOREIGN KEY ("userId")    REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "refresh_tokens"        ADD CONSTRAINT "refresh_tokens_userId_fkey"          FOREIGN KEY ("userId")    REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "products"              ADD CONSTRAINT "products_sellerId_fkey"              FOREIGN KEY ("sellerId")  REFERENCES "users"("id");
ALTER TABLE "products"              ADD CONSTRAINT "products_categoryId_fkey"            FOREIGN KEY ("categoryId") REFERENCES "categories"("id");
ALTER TABLE "saved_products"        ADD CONSTRAINT "saved_products_userId_fkey"          FOREIGN KEY ("userId")    REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "saved_products"        ADD CONSTRAINT "saved_products_productId_fkey"       FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;
ALTER TABLE "orders"                ADD CONSTRAINT "orders_buyerId_fkey"                 FOREIGN KEY ("buyerId")   REFERENCES "users"("id");
ALTER TABLE "orders"                ADD CONSTRAINT "orders_sellerId_fkey"                FOREIGN KEY ("sellerId")  REFERENCES "users"("id");
ALTER TABLE "order_items"           ADD CONSTRAINT "order_items_orderId_fkey"            FOREIGN KEY ("orderId")   REFERENCES "orders"("id") ON DELETE CASCADE;
ALTER TABLE "order_items"           ADD CONSTRAINT "order_items_productId_fkey"          FOREIGN KEY ("productId") REFERENCES "products"("id");
ALTER TABLE "payments"              ADD CONSTRAINT "payments_orderId_fkey"               FOREIGN KEY ("orderId")   REFERENCES "orders"("id");
ALTER TABLE "messages"              ADD CONSTRAINT "messages_conversationId_fkey"        FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE;
ALTER TABLE "messages"              ADD CONSTRAINT "messages_senderId_fkey"              FOREIGN KEY ("senderId")  REFERENCES "users"("id");
ALTER TABLE "verifications"         ADD CONSTRAINT "verifications_userId_fkey"           FOREIGN KEY ("userId")    REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "reviews"               ADD CONSTRAINT "reviews_orderId_fkey"                FOREIGN KEY ("orderId")   REFERENCES "orders"("id");
ALTER TABLE "reviews"               ADD CONSTRAINT "reviews_authorId_fkey"               FOREIGN KEY ("authorId")  REFERENCES "users"("id");
ALTER TABLE "reviews"               ADD CONSTRAINT "reviews_subjectId_fkey"              FOREIGN KEY ("subjectId") REFERENCES "users"("id");
ALTER TABLE "reviews"               ADD CONSTRAINT "reviews_productId_fkey"              FOREIGN KEY ("productId") REFERENCES "products"("id");
ALTER TABLE "notifications"         ADD CONSTRAINT "notifications_userId_fkey"           FOREIGN KEY ("userId")    REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "reward_wallets"        ADD CONSTRAINT "reward_wallets_userId_fkey"          FOREIGN KEY ("userId")    REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "reward_transactions"   ADD CONSTRAINT "reward_transactions_walletId_fkey"   FOREIGN KEY ("walletId")  REFERENCES "reward_wallets"("id") ON DELETE CASCADE;
ALTER TABLE "audit_logs"            ADD CONSTRAINT "audit_logs_userId_fkey"              FOREIGN KEY ("userId")    REFERENCES "users"("id");
ALTER TABLE "haulage_jobs"          ADD CONSTRAINT "haulage_jobs_orderId_fkey"           FOREIGN KEY ("orderId")   REFERENCES "orders"("id");
ALTER TABLE "haulage_jobs"          ADD CONSTRAINT "haulage_jobs_awardedToId_fkey"       FOREIGN KEY ("awardedToId") REFERENCES "users"("id");
ALTER TABLE "haulage_applications"  ADD CONSTRAINT "haulage_applications_jobId_fkey"     FOREIGN KEY ("jobId")     REFERENCES "haulage_jobs"("id") ON DELETE CASCADE;
ALTER TABLE "haulage_applications"  ADD CONSTRAINT "haulage_applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "users"("id");
ALTER TABLE "haulage_applications"  ADD CONSTRAINT "haulage_applications_haulageProfileId_fkey" FOREIGN KEY ("haulageProfileId") REFERENCES "haulage_profiles"("id");
ALTER TABLE "platform_fees"         ADD CONSTRAINT "platform_fees_userId_fkey"           FOREIGN KEY ("userId")    REFERENCES "users"("id") ON DELETE CASCADE;
