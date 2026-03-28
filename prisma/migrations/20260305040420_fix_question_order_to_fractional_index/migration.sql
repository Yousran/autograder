BEGIN;

-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "order" SET DEFAULT 'a0',
ALTER COLUMN "order" SET DATA TYPE TEXT;

-- Backfill existing integer-as-text order values to fractional index format
-- Alphabet: 0-9 A-Z a-z (62 chars), supports up to 3844 questions per test
UPDATE "Question"
SET "order" = 'a' ||
  CASE WHEN "order"::integer >= 62 THEN
    substring('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      FROM ("order"::integer / 62) + 1 FOR 1) ||
    substring('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      FROM ("order"::integer % 62) + 1 FOR 1)
  ELSE
    substring('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      FROM "order"::integer + 1 FOR 1)
  END
WHERE "order" ~ '^[0-9]+$';

COMMIT;