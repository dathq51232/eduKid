# Audio m?u cho English Journey Shadowing

Bucket Supabase: `english-shadowing-audio` (public read; t?i ?a 10 MB/file). B?n thu ???c ph?c v? theo URL public c?a Supabase Storage.

## C?ch ??t t?n

N?p m?t file MP3 cho m?i c?u theo m?u:

`<storyId>/<storyIndex 3 ch? s?>.mp3`

V? d?: `source-1-part-1/001.mp3`, `source-1-part-1/002.mp3`. C? 200 c?u trong 12 m?ch chuy?n. Gi? ??ng t?n th? m?c v? s? th? t? ?? tr?nh ph?t t? t?m th?y audio.

## Th? m?c m?ch chuy?n

- `source-1-part-1/`
- `source-1-part-2/`
- `source-1-part-5/`
- `source-1-part-6/`
- `source-1-part-7/`
- `source-1-part-3/`
- `source-1-part-4/`
- `source-2-part-2/`
- `source-2-part-1/`
- `source-5-part-1/`
- `source-3-part-1/`
- `source-4-part-1/`

T?i c?c th? m?c l?n Storage bucket `english-shadowing-audio` trong Supabase Studio. M?i file d?ng `audio/mpeg`. Kh?ng c?n policy upload c?ng khai; ch? qu?n tr? vi?n d? ?n n?n n?p ho?c thay audio.

Khi ch?a c? file, Shadowing t? ??c c?u b?ng Web Speech API. Sau khi file MP3 ???c t?i l?n ??ng ???ng d?n, n?t nghe s? ph?t b?n thu m?u.
