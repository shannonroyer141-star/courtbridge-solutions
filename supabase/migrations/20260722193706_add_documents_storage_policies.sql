create policy "Provider and client can view own documents storage"
on storage.objects for select
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1]::uuid in (select id from clients where provider_id = auth.uid())
    or (storage.foldername(name))[1]::uuid in (select id from clients where auth_user_id = auth.uid())
  )
);

create policy "Provider and client can upload own documents storage"
on storage.objects for insert
with check (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1]::uuid in (select id from clients where provider_id = auth.uid())
    or (storage.foldername(name))[1]::uuid in (select id from clients where auth_user_id = auth.uid())
  )
);

create policy "Provider can delete own documents storage"
on storage.objects for delete
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1]::uuid in (select id from clients where provider_id = auth.uid())
);