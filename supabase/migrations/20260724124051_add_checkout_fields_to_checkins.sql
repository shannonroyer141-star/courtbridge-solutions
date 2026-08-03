alter table checkins
  add column if not exists checked_out_at timestamp without time zone,
  add column if not exists checkout_latitude double precision,
  add column if not exists checkout_longitude double precision,
  add column if not exists checkout_gps_accuracy_meters double precision;