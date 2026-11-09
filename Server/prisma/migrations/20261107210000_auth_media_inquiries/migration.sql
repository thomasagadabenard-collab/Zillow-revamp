-- Additive Zillow Elite updates. Existing property, image, account, and order rows are retained.
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'REVIEWED', 'CONTACTED', 'CLOSED');

ALTER TABLE "Property"
  ADD COLUMN "kitchens" INTEGER NOT NULL DEFAULT 1,
  ALTER COLUMN "currency" SET DEFAULT 'USD';

ALTER TABLE "PropertyImage"
  ADD COLUMN "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE';

CREATE TABLE "PasswordResetToken" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "tokenHash" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PropertyInquiry" (
  "id" UUID NOT NULL,
  "fullName" VARCHAR(160) NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "phone" VARCHAR(40) NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "propertyType" VARCHAR(60) NOT NULL,
  "city" VARCHAR(120) NOT NULL,
  "address" VARCHAR(240) NOT NULL,
  "price" DECIMAL(20,2) NOT NULL,
  "bedrooms" INTEGER NOT NULL DEFAULT 0,
  "bathrooms" INTEGER NOT NULL DEFAULT 0,
  "kitchens" INTEGER NOT NULL DEFAULT 1,
  "description" TEXT NOT NULL,
  "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyInquiry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PropertyInquiryMedia" (
  "id" UUID NOT NULL,
  "inquiryId" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "url" TEXT NOT NULL,
  "mediaType" "MediaType" NOT NULL DEFAULT 'IMAGE',
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PropertyInquiryMedia_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");
CREATE INDEX "PropertyInquiry_status_createdAt_idx" ON "PropertyInquiry"("status", "createdAt");
CREATE INDEX "PropertyInquiry_email_createdAt_idx" ON "PropertyInquiry"("email", "createdAt");
CREATE INDEX "PropertyInquiryMedia_inquiryId_position_idx" ON "PropertyInquiryMedia"("inquiryId", "position");

ALTER TABLE "PasswordResetToken"
  ADD CONSTRAINT "PasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyInquiryMedia"
  ADD CONSTRAINT "PropertyInquiryMedia_inquiryId_fkey"
  FOREIGN KEY ("inquiryId") REFERENCES "PropertyInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
