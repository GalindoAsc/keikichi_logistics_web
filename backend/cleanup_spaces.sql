-- SQL script to manually clean up duplicate spaces
-- Run this directly in your PostgreSQL database

-- First, let's see the current state
SELECT 
    t.id as trip_id,
    t.origin,
    t.destination,
    t.total_spaces as configured_spaces,
    COUNT(s.id) as actual_spaces,
    COUNT(s.id) - t.total_spaces as excess_spaces
FROM trips t
LEFT JOIN spaces s ON s.trip_id = t.id
GROUP BY t.id, t.origin, t.destination, t.total_spaces
HAVING COUNT(s.id) > t.total_spaces;

-- To clean up duplicates for a specific trip, run this:
-- Replace {TRIP_ID} with the actual trip ID

-- Delete excess available spaces (keeping the ones with lowest space_number)
WITH excess_spaces AS (
    SELECT s.id
    FROM spaces s
    JOIN trips t ON t.id = s.trip_id
    WHERE s.trip_id = '{TRIP_ID}'
      AND s.status = 'available'
    ORDER BY s.space_number DESC
    LIMIT (
        SELECT COUNT(*) - t.total_spaces
        FROM spaces s2
        JOIN trips t ON t.id = s2.trip_id
        WHERE s2.trip_id = '{TRIP_ID}'
    )
)
DELETE FROM spaces
WHERE id IN (SELECT id FROM excess_spaces);
