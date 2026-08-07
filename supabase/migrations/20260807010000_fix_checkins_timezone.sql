-- checkins.checked_in_at / checked_out_at were stored as timestamp without time zone.
-- The app always wrote true UTC instants (Date.toISOString()), so the stored digits
-- are UTC clock readings with no marker -- the browser then displayed them as if they
-- were already local time, showing times 4 hours ahead of Eastern. Reinterpreting the
-- existing values as UTC and converting the column to timestamptz fixes both the
-- existing rows and all future reads/writes.
alter table checkins
  alter column checked_in_at type timestamptz using checked_in_at at time zone 'UTC',
  alter column checked_out_at type timestamptz using checked_out_at at time zone 'UTC';
