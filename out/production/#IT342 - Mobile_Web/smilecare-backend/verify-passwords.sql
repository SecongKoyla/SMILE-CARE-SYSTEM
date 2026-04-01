-- ========================================
-- VERIFY PASSWORD HASHING
-- ========================================
-- Run this query to check if passwords are properly hashed
-- BCrypt hashed passwords always start with "$2a$" or "$2b$"
-- and are 60 characters long
-- ========================================

SELECT 
    id,
    email,
    full_name as fullName,
    role,
    CASE 
        WHEN password_hash LIKE '$2a$%' OR password_hash LIKE '$2b$%' THEN '✓ HASHED'
        ELSE '✗ PLAIN TEXT'
    END as password_status,
    LENGTH(password_hash) as hash_length,
    created_at
FROM users
ORDER BY id;

-- ========================================
-- EXPECTED RESULT AFTER FIXING:
-- - password_status should show "✓ HASHED"
-- - hash_length should be 60
-- - password_hash should look like: 
--   $2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
-- ========================================
