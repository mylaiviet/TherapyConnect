-- ============================================================================
-- SUPABASE ANALYTICS SEED DATA
-- ============================================================================
-- Purpose: Generate 30 days of realistic analytics test data
-- Safe to run multiple times - clears existing data first
-- Execution time: ~5-10 seconds
-- ============================================================================

-- OPTIONAL: Clear existing analytics data (uncomment if you want fresh data)
-- TRUNCATE TABLE page_views CASCADE;
-- TRUNCATE TABLE location_searches CASCADE;

-- ============================================================================
-- GENERATE PAGE VIEWS DATA (30 days, ~3000-6000 views)
-- ============================================================================

DO $$
DECLARE
  v_session_id UUID;
  v_date TIMESTAMP;
  v_city TEXT;
  v_state TEXT;
  v_page_path TEXT;
  v_referrer TEXT;
  v_device TEXT;
  v_browser TEXT;
  v_location_method TEXT;
  v_is_new_session BOOLEAN;
  v_days_ago INT;
  v_views_today INT;
  v_i INT;

  -- Arrays for random selection
  cities TEXT[] := ARRAY[
    'San Francisco|CA', 'Los Angeles|CA', 'New York|NY', 'Brooklyn|NY',
    'Chicago|IL', 'Houston|TX', 'Austin|TX', 'Seattle|WA',
    'Boston|MA', 'Denver|CO', 'Portland|OR', 'Miami|FL',
    'Atlanta|GA', 'Philadelphia|PA', 'Phoenix|AZ'
  ];

  page_paths TEXT[] := ARRAY[
    '/', '/therapist-search', '/match', '/about', '/how-it-works'
  ];

  referrers TEXT[] := ARRAY[
    'google.com', 'facebook.com', 'twitter.com', 'instagram.com', 'direct', NULL
  ];

  devices TEXT[] := ARRAY['desktop', 'mobile', 'tablet'];
  browsers TEXT[] := ARRAY['Chrome', 'Safari', 'Firefox', 'Edge'];
  location_methods TEXT[] := ARRAY['ip', 'gps', 'manual', 'unknown'];

BEGIN
  RAISE NOTICE '🌱 Seeding page views data...';

  -- Generate data for past 30 days
  FOR v_days_ago IN 0..29 LOOP
    -- Random number of views per day (50-200)
    v_views_today := 50 + floor(random() * 151)::INT;

    -- Generate session for this day
    v_session_id := gen_random_uuid();

    FOR v_i IN 1..v_views_today LOOP
      -- Calculate timestamp for this view
      v_date := NOW() - (v_days_ago || ' days')::INTERVAL
                + (floor(random() * 24)::INT || ' hours')::INTERVAL
                + (floor(random() * 60)::INT || ' minutes')::INTERVAL;

      -- Random location
      DECLARE
        city_state TEXT := cities[1 + floor(random() * array_length(cities, 1))::INT];
      BEGIN
        v_city := split_part(city_state, '|', 1);
        v_state := split_part(city_state, '|', 2);
      END;

      -- Random page path
      v_page_path := page_paths[1 + floor(random() * array_length(page_paths, 1))::INT];

      -- Random referrer
      v_referrer := referrers[1 + floor(random() * array_length(referrers, 1))::INT];

      -- Random device/browser
      v_device := devices[1 + floor(random() * array_length(devices, 1))::INT];
      v_browser := browsers[1 + floor(random() * array_length(browsers, 1))::INT];
      v_location_method := location_methods[1 + floor(random() * array_length(location_methods, 1))::INT];

      -- 30% chance of new session
      v_is_new_session := random() < 0.3;

      -- Create new session occasionally
      IF random() < 0.2 THEN
        v_session_id := gen_random_uuid();
      END IF;

      -- Insert page view
      INSERT INTO page_views (
        session_id, is_new_session, page_path, referrer_domain,
        device_type, browser_family, city, state, country,
        location_method, created_at
      ) VALUES (
        v_session_id, v_is_new_session, v_page_path, v_referrer,
        v_device, v_browser, v_city, v_state, 'USA',
        v_location_method, v_date
      );
    END LOOP;

    IF v_days_ago % 10 = 0 THEN
      RAISE NOTICE '  ✓ Generated data for day % (% views)', v_days_ago, v_views_today;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Page views seeded successfully!';
END $$;

-- ============================================================================
-- GENERATE LOCATION SEARCHES DATA (30 days, ~600-2400 searches)
-- ============================================================================

DO $$
DECLARE
  v_session_id UUID;
  v_date TIMESTAMP;
  v_search_city TEXT;
  v_search_state TEXT;
  v_radius INT;
  v_location_method TEXT;
  v_results_found INT;
  v_results_clicked INT;
  v_had_specialty BOOLEAN;
  v_had_insurance BOOLEAN;
  v_had_modality BOOLEAN;
  v_had_gender BOOLEAN;
  v_days_ago INT;
  v_searches_today INT;
  v_i INT;

  -- Arrays for random selection
  cities TEXT[] := ARRAY[
    'San Francisco|CA', 'Los Angeles|CA', 'New York|NY', 'Brooklyn|NY',
    'Chicago|IL', 'Houston|TX', 'Austin|TX', 'Seattle|WA',
    'Boston|MA', 'Denver|CO', 'Portland|OR', 'Miami|FL',
    'Atlanta|GA', 'Philadelphia|PA', 'Phoenix|AZ'
  ];

  radii INT[] := ARRAY[10, 25, 50, 100, 150, 200];
  location_methods TEXT[] := ARRAY['ip', 'gps', 'manual'];

BEGIN
  RAISE NOTICE '🔍 Seeding location searches data...';

  -- Generate data for past 30 days
  FOR v_days_ago IN 0..29 LOOP
    -- Random number of searches per day (20-80)
    v_searches_today := 20 + floor(random() * 61)::INT;

    FOR v_i IN 1..v_searches_today LOOP
      -- Calculate timestamp
      v_date := NOW() - (v_days_ago || ' days')::INTERVAL
                + (floor(random() * 24)::INT || ' hours')::INTERVAL
                + (floor(random() * 60)::INT || ' minutes')::INTERVAL;

      -- Random session (could be from page views or new)
      v_session_id := gen_random_uuid();

      -- Random location
      DECLARE
        city_state TEXT := cities[1 + floor(random() * array_length(cities, 1))::INT];
      BEGIN
        v_search_city := split_part(city_state, '|', 1);
        v_search_state := split_part(city_state, '|', 2);
      END;

      -- Random radius
      v_radius := radii[1 + floor(random() * array_length(radii, 1))::INT];

      -- Random location method
      v_location_method := location_methods[1 + floor(random() * array_length(location_methods, 1))::INT];

      -- Random results (0-25 therapists found)
      v_results_found := floor(random() * 26)::INT;

      -- Clicks (0-3, but only if results exist)
      IF v_results_found > 0 THEN
        v_results_clicked := floor(random() * LEAST(v_results_found, 3) + 1)::INT;
      ELSE
        v_results_clicked := 0;
      END IF;

      -- Random filters (progressively less common)
      v_had_specialty := random() < 0.4;  -- 40% use specialty filter
      v_had_insurance := random() < 0.3;  -- 30% use insurance filter
      v_had_modality := random() < 0.2;   -- 20% use modality filter
      v_had_gender := random() < 0.1;     -- 10% use gender filter

      -- Insert location search
      INSERT INTO location_searches (
        session_id, search_city, search_state, search_zip,
        radius_miles, location_method, results_found, results_clicked,
        had_specialty_filter, had_insurance_filter, had_modality_filter,
        had_gender_filter, created_at
      ) VALUES (
        v_session_id, v_search_city, v_search_state, NULL,
        v_radius, v_location_method, v_results_found, v_results_clicked,
        v_had_specialty, v_had_insurance, v_had_modality,
        v_had_gender, v_date
      );
    END LOOP;

    IF v_days_ago % 10 = 0 THEN
      RAISE NOTICE '  ✓ Generated data for day % (% searches)', v_days_ago, v_searches_today;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Location searches seeded successfully!';
END $$;

-- ============================================================================
-- SUMMARY: Show what was created
-- ============================================================================

DO $$
DECLARE
  v_page_view_count INT;
  v_search_count INT;
  v_unique_sessions INT;
  v_date_range TEXT;
BEGIN
  SELECT COUNT(*) INTO v_page_view_count FROM page_views;
  SELECT COUNT(*) INTO v_search_count FROM location_searches;
  SELECT COUNT(DISTINCT session_id) INTO v_unique_sessions FROM page_views;
  SELECT
    TO_CHAR(MIN(created_at), 'YYYY-MM-DD') || ' to ' || TO_CHAR(MAX(created_at), 'YYYY-MM-DD')
  INTO v_date_range
  FROM page_views;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ANALYTICS DATA SEEDED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Page Views:        %', v_page_view_count;
  RAISE NOTICE 'Location Searches: %', v_search_count;
  RAISE NOTICE 'Unique Sessions:   %', v_unique_sessions;
  RAISE NOTICE 'Date Range:        %', v_date_range;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '1. Visit your deployed site: https://therapyconnect-iec4.onrender.com';
  RAISE NOTICE '2. Login to admin dashboard: /admin/login';
  RAISE NOTICE '3. Navigate to analytics dashboards';
  RAISE NOTICE '4. Click "Refresh Data" to load charts';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - uncomment to run)
-- ============================================================================

-- Check page views by city
-- SELECT city, state, COUNT(*) as views
-- FROM page_views
-- GROUP BY city, state
-- ORDER BY views DESC
-- LIMIT 10;

-- Check searches by location method
-- SELECT location_method, COUNT(*) as searches, AVG(results_found) as avg_results
-- FROM location_searches
-- GROUP BY location_method
-- ORDER BY searches DESC;

-- Check daily activity
-- SELECT
--   DATE(created_at) as date,
--   COUNT(*) as page_views,
--   COUNT(DISTINCT session_id) as unique_sessions
-- FROM page_views
-- GROUP BY DATE(created_at)
-- ORDER BY date DESC
-- LIMIT 7;
