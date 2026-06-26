-- Add latitude and longitude to Leader table
ALTER TABLE "leaders" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "leaders" ADD COLUMN "longitude" DOUBLE PRECISION;
