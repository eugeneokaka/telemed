create table public.users (
id uuid not null,
first_name text null,
last_name text null,
age integer null,
gender text null,
role text null default 'patient'::text,
created_at timestamp with time zone null default now(),
updated_at timestamp with time zone null default now(),
onboarded boolean null default false,
constraint users_pkey primary key (id),
constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
constraint users_role_check check (
(
role = any (
array['doctor'::text, 'patient'::text, 'admin'::text]
)
)
)
) TABLESPACE pg_default;

create trigger handle_updated_at BEFORE
update on users for EACH row
execute FUNCTION moddatetime ('updated_at');

create table public.messages (
id uuid not null default gen_random_uuid (),
room_id uuid not null,
sender_id uuid not null,
message text null,
attachment_url text null,
created_at timestamp with time zone null default now(),
constraint messages_pkey primary key (id),
constraint messages_sender_id_fkey foreign KEY (sender_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.chat_rooms (
id uuid not null default gen_random_uuid (),
booking_id uuid null,
patient_id uuid not null,
doctor_id uuid not null,
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
constraint chat_rooms_pkey primary key (id),
constraint chat_rooms_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete CASCADE,
constraint chat_rooms_doctor_id_fkey foreign KEY (doctor_id) references users (id) on delete CASCADE,
constraint chat_rooms_patient_id_fkey foreign KEY (patient_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;
