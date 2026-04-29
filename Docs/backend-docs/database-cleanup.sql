-- ========================================
-- SUPABASE DATABASE CLEANUP SCRIPT
-- ========================================
-- This script clears all users with plain text passwords
-- After running this, restart your Spring Boot app
-- The DataLoader will create a test user with hashed password
-- ========================================

-- Delete all existing users
DELETE FROM users;

-- Reset the ID sequence (optional, for clean IDs)
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- Verify the table is empty
SELECT COUNT(*) as total_users FROM users;

-- ========================================
-- EXPECTED RESULT: 
-- - All users deleted
-- - total_users should be 0
-- - Restart your Spring Boot application
-- - The test user will be recreated with:
--   Email: test@smilecare.com
--   Password: 123456 (hashed in database)
-- ========================================
