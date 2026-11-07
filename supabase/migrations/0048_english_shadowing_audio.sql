-- Public English listening samples for the English Journey Shadowing step.
-- Uploads stay restricted to trusted project operators through the Supabase dashboard.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'english-shadowing-audio',
  'english-shadowing-audio',
  true,
  10485760,
  array['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
