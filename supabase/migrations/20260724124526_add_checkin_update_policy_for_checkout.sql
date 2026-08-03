create policy "Clients can update their own checkin for checkout"
on checkins
for update
to authenticated
using (client_id in (select id from clients where auth_user_id = auth.uid()))
with check (client_id in (select id from clients where auth_user_id = auth.uid()));