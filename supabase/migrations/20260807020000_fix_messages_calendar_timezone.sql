-- Same root cause as the checkins fix: timestamp without time zone columns storing
-- UTC clock digits with no marker, displayed as if already local. Confirmed the
-- database session timezone is UTC, so reinterpreting existing values as UTC is
-- correct for both client-inserted (toISOString()) and default now() rows.
alter table messages
  alter column sent_at type timestamptz using sent_at at time zone 'UTC',
  alter column created_at type timestamptz using created_at at time zone 'UTC';

alter table calendar_events
  alter column start_time type timestamptz using start_time at time zone 'UTC',
  alter column end_time type timestamptz using end_time at time zone 'UTC',
  alter column created_at type timestamptz using created_at at time zone 'UTC';
