-- Same bug: both write paths use toISOString() (true UTC) into a naive column.
-- supabase/functions/send-sms/index.ts writes sms_logs.sent_at this way.
-- src/screens/FounderDocs.jsx writes founder_docs.updated_at this way.
alter table sms_logs
  alter column sent_at type timestamptz using sent_at at time zone 'UTC',
  alter column created_at type timestamptz using created_at at time zone 'UTC';

alter table founder_docs
  alter column updated_at type timestamptz using updated_at at time zone 'UTC';
