-- ============================================================================
-- CREATE ADMIN USER IN SUPABASE
-- ============================================================================
-- Purpose: Create admin user for accessing analytics dashboards
-- Safe to run multiple times - checks if user exists first
-- ============================================================================

DO $$
DECLARE
  v_user_id VARCHAR;
  v_hashed_password TEXT;
  v_email TEXT := 'admin@karematch.com';
BEGIN
  RAISE NOTICE '👤 Creating admin user...';

  -- Check if user already exists
  SELECT id INTO v_user_id FROM users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  Admin user already exists with ID: %', v_user_id;
  ELSE
    -- Bcrypt hash for password "admin123" (generated with cost factor 10)
    v_hashed_password := '$2b$10$aQrCz99CqiuddbOhG5hcKuhG8xn9JNMLW8NKM3hTLoPEq743GNRFq';

    -- Insert admin user
    INSERT INTO users (id, email, password, role, created_at)
    VALUES (
      gen_random_uuid()::VARCHAR,
      v_email,
      v_hashed_password,
      'admin',
      NOW()
    )
    RETURNING id INTO v_user_id;

    RAISE NOTICE '✅ Admin user created with ID: %', v_user_id;

    -- Create admin_users entry
    INSERT INTO admin_users (id, user_id, role, created_at)
    VALUES (
      gen_random_uuid()::VARCHAR,
      v_user_id,
      'admin',
      NOW()
    );

    RAISE NOTICE '✅ Admin user entry created in admin_users table';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ADMIN USER READY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email:    admin@karematch.com';
  RAISE NOTICE 'Password: admin123';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Login at: https://therapyconnect-iec4.onrender.com/login';
  RAISE NOTICE '========================================';
END $$;
