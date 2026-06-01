-- Create Category table for admin-managed menu categories
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- Seed the existing default categories so they are manageable rows
INSERT INTO "Category" ("id", "name", "sortOrder", "updatedAt") VALUES
    ('cat_seed_burgers', 'Signature Burgers & Sandwiches', 0, CURRENT_TIMESTAMP),
    ('cat_seed_salads', 'Salads with Protein', 1, CURRENT_TIMESTAMP),
    ('cat_seed_comfort', 'Comfort Favorites', 2, CURRENT_TIMESTAMP),
    ('cat_seed_sides', 'Sides & Snacks', 3, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
