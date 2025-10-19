Matching Scoring Logic Overview
The app uses a 0-100 point scoring system implemented in therapistMatcher.ts:142-243 with the following components:
Core Scoring Breakdown (calculateMatchScore function)
Factor	Points	Criteria
Base Score	20	Therapist is accepting new clients
Location Match	30	Exact ZIP code OR city name match (case-insensitive, partial)
Session Format	15	Matches preferred format (virtual/in-person)
10	Therapist offers both formats when user wants "either"
Therapy Approach	20	Therapist specializes in user's preferred modality
Insurance	15	Accepts user's insurance provider
Out-of-Pocket	10	Session fee is $50-$150 (affordable range)
Specialties	15	Top specialties match treatment goals
Experience	5	5+ years in practice
Profile Completeness	3	Has detailed bio (100+ characters)
Proximity Boost	0-20	Distance-based bonus (see below)
Location Matching (CRITICAL Filter)
The system implements strict location filtering at therapistMatcher.ts:156-176:
✅ 30 points if therapist's ZIP code exactly matches user's location
✅ 30 points if therapist's city name matches user's location (case-insensitive, partial)
❌ 0 points for wrong location - NO fallback points
🚫 Hard filter: Only therapists with hasLocationMatch = true are returned (line 95)
🚫 Minimum score of 30 required to appear in results (line 101)
Proximity Boosting (Currently Disabled)
The proximityMatcher.ts calculates distances using the Haversine formula, but it's currently disabled due to SQL syntax errors (line 14-16). When enabled, it would add bonus points based on distance:
≤10 miles: +20 points
11-25 miles: +15 points
26-50 miles: +10 points
51-100 miles: +5 points
>100 miles: 0 bonus points
Final Ranking
Therapists are sorted by:
Match score (highest first) - line 106-114
Distance (closest first, for ties)
Example Score Calculation
For a user in Minneapolis seeking anxiety treatment with insurance:
Base: 20 points (accepting clients)
Location: 30 points (Minneapolis match)
Specialties: 15 points (anxiety listed)
Insurance: 15 points (accepts Blue Cross)
Experience: 5 points (8 years)
Session format: 15 points (offers virtual)
Total: 100 points ⭐
The system prevents showing therapists from different cities (e.g., won't show Boston therapists to Denver patients) through the hard location filter requirement.