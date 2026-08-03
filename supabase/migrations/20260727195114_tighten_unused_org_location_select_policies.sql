-- organizations/locations are unused by the app (0 rows, no code references them),
-- but their SELECT policy let any authenticated user from any agency read every
-- row. Tighten to match the already-correct "Providers see own X" ALL policies
-- so if these tables are ever wired up later, they're safe by default.
drop policy if exists "Authenticated users view organizations" on public.organizations;
drop policy if exists "Authenticated users view locations" on public.locations;
