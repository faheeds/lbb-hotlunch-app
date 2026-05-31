-- Add optional category to MenuItem for admin-managed menu categories
ALTER TABLE "MenuItem" ADD COLUMN "category" TEXT;
