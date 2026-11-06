-- EcoManage — skema Supabase (PostgreSQL) + RLS (RBAC) + Storage.
-- Data contoh = DATA DEMONSTRASI fiktif (Desa Lembah Hijau), bukan data lingkungan sebenarnya.

create type app_role as enum ('admin','warga','petugas','pemerintah');
create type report_status as enum ('menunggu','diverifikasi','dalam_penanganan','selesai','ditolak');
create type waste_cat as enum ('plastik','kertas','logam','kaca','organik','residu');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  role app_role not null default 'warga',
  phone text not null default '',
  address text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Akun baru SELALU 'warga'; hanya admin yang bisa mengubah role.
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create function auth_role() returns app_role language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create function guard_role_change() returns trigger language plpgsql as $$
begin
  if new.role <> old.role and coalesce(auth_role(),'warga') <> 'admin' then
    raise exception 'Hanya administrator yang dapat mengubah role';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on profiles for each row execute function guard_role_change();

create table reports (
  id bigint generated always as identity primary key,
  reporter_id uuid references profiles(id),
  reporter_name text not null,
  title text not null check (char_length(title) between 5 and 120),
  description text not null,
  category waste_cat not null,
  status report_status not null default 'menunggu',
  lat double precision not null,
  lng double precision not null,
  address text not null,
  estimated_kg numeric not null check (estimated_kg > 0),
  volume_kg numeric,
  photo_before text,   -- path di Supabase Storage (bucket report-photos)
  photo_after text,
  officer_id uuid references profiles(id),
  note text not null default '',
  reject_reason text not null default '',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on reports (reporter_id);
create index on reports (status);

create table schedules (id bigint generated always as identity primary key, area text not null, day_of_week int not null check (day_of_week between 1 and 7), time_label text not null, waste_type text not null, notes text not null default '');
create table places (id text primary key, name text not null, kind text not null, lat double precision not null, lng double precision not null, address text not null default '', hours text not null default '');
create table hotspots (id bigint generated always as identity primary key, name text not null, lat double precision not null, lng double precision not null, level text not null check (level in ('rendah','sedang','tinggi')), note text not null default '');
create table prices (category waste_cat primary key, price_per_kg numeric not null check (price_per_kg >= 0), recyclable boolean not null);

create table nasabah (id bigint generated always as identity primary key, profile_id uuid references profiles(id), full_name text not null, phone text not null default '', address text not null default '', is_demo boolean not null default false, joined_at date not null default current_date);
create table setoran (
  id bigint generated always as identity primary key,
  nasabah_id bigint not null references nasabah(id),
  category waste_cat not null,
  weight_kg numeric not null check (weight_kg > 0),
  price_per_kg numeric not null,
  total_value numeric generated always as (weight_kg * price_per_kg) stored,
  note text not null default '',
  recorded_by uuid references profiles(id),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index on setoran (nasabah_id);

create table notifications (id bigint generated always as identity primary key, user_id uuid references profiles(id), role app_role, title text not null, body text not null, kind text not null, href text, read_by uuid[] not null default '{}', created_at timestamptz not null default now());
create table announcements (id bigint generated always as identity primary key, title text not null, body text not null, author_id uuid references profiles(id), created_at timestamptz not null default now());
create table activity_log (id bigint generated always as identity primary key, actor_id uuid references profiles(id), actor_name text not null, action text not null, detail text not null default '', created_at timestamptz not null default now());

-- Notifikasi otomatis: laporan baru -> petugas+admin; perubahan status -> pelapor.
create function notify_report() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into notifications (role, title, body, kind, href) select r, 'Laporan baru', new.title, 'laporan', '/app/laporan' from unnest(array['admin','petugas']::app_role[]) r;
    insert into activity_log (actor_id, actor_name, action, detail) values (new.reporter_id, new.reporter_name, 'Membuat laporan', new.title);
  elsif new.status <> old.status then
    new.updated_at = now();
    if new.reporter_id is not null then
      insert into notifications (user_id, title, body, kind, href) values (new.reporter_id, 'Status laporan berubah', new.title || ' → ' || new.status, 'status', '/app/laporan');
    end if;
  end if;
  return new;
end $$;
create trigger reports_notify_ins after insert on reports for each row execute function notify_report();
create trigger reports_notify_upd before update on reports for each row execute function notify_report();

-- ===== RLS =====
alter table profiles enable row level security;       alter table reports enable row level security;
alter table schedules enable row level security;      alter table places enable row level security;
alter table hotspots enable row level security;       alter table prices enable row level security;
alter table nasabah enable row level security;        alter table setoran enable row level security;
alter table notifications enable row level security;  alter table announcements enable row level security;
alter table activity_log enable row level security;

create policy p_sel on profiles for select using (id = auth.uid() or auth_role() in ('admin','pemerintah'));
create policy p_upd_own on profiles for update using (id = auth.uid() or auth_role() = 'admin');

create policy r_sel on reports for select using (reporter_id = auth.uid() or auth_role() in ('admin','petugas','pemerintah') or (is_demo and auth_role() is not null));
create policy r_ins on reports for insert with check (reporter_id = auth.uid() and auth_role() in ('warga','admin'));
create policy r_upd on reports for update using (auth_role() in ('admin','petugas'));

create policy ref_sel_sched on schedules for select using (true);
create policy ref_sel_places on places for select using (true);
create policy ref_sel_hot on hotspots for select using (auth_role() is not null);
create policy ref_sel_price on prices for select using (auth_role() is not null);
create policy ref_w_sched on schedules for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy ref_w_price on prices for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

create policy n_sel on nasabah for select using (profile_id = auth.uid() or auth_role() in ('admin','petugas','pemerintah'));
create policy n_ins on nasabah for insert with check (auth_role() in ('admin','petugas') or profile_id = auth.uid());
create policy s_sel on setoran for select using (auth_role() in ('admin','petugas','pemerintah') or nasabah_id in (select id from nasabah where profile_id = auth.uid()));
create policy s_ins on setoran for insert with check (auth_role() in ('admin','petugas') and recorded_by = auth.uid());

create policy no_sel on notifications for select using (user_id = auth.uid() or role = auth_role() or (user_id is null and role is null));
create policy no_upd on notifications for update using (user_id = auth.uid() or role = auth_role() or (user_id is null and role is null));
create policy an_sel on announcements for select using (auth_role() is not null);
create policy an_ins on announcements for insert with check (auth_role() in ('admin','pemerintah') and author_id = auth.uid());
create policy al_sel on activity_log for select using (auth_role() in ('admin','pemerintah'));
create policy al_ins on activity_log for insert with check (actor_id = auth.uid());

-- ===== Storage: foto laporan (path: {user_id}/{nama-file}) =====
insert into storage.buckets (id, name, public) values ('report-photos','report-photos', true) on conflict do nothing;
create policy "foto_baca" on storage.objects for select using (bucket_id = 'report-photos');
create policy "foto_tulis" on storage.objects for insert to authenticated with check (bucket_id = 'report-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===== Data demonstrasi (fiktif) =====
insert into prices values ('plastik',2500,true),('kertas',1800,true),('logam',9000,true),('kaca',300,true),('organik',400,true),('residu',0,false);
insert into places values
 ('bank','Bank Sampah Melati','bank',-7.8022,110.4144,'Balai Dusun Melati','Senin–Sabtu 08.00–14.00'),
 ('tps','TPS Utama','tps',-7.8008,110.4162,'Jl. Kenanga','Setiap hari 06.00–17.00'),
 ('kantor','Kantor Desa Lembah Hijau','kantor',-7.8016,110.4136,'Jl. Melati No. 12','Senin–Jumat 08.00–15.00');
insert into hotspots (name,lat,lng,level,note) values
 ('Tepian Sungai Mawar',-7.7988,110.4088,'tinggi','Menumpuk setelah hujan deras'),
 ('Belakang Pasar Desa',-7.8038,110.4156,'sedang','Sisa dagang sore hari'),
 ('Gang Melati Utara',-7.8054,110.4106,'tinggi','Jalan sempit untuk truk'),
 ('TPS Dusun Kenanga',-7.7976,110.4192,'rendah','Terlayani jadwal rutin');
insert into schedules (area,day_of_week,time_label,waste_type,notes) values
 ('Dusun Mawar',1,'07.00','Organik','Pisahkan sisa dapur dari kemasan'),
 ('Dusun Melati',2,'07.00','Anorganik','Plastik, kertas, dan logam'),
 ('Dusun Kenanga',3,'07.00','Organik','Wadah tertutup'),
 ('Dusun Anggrek',4,'07.00','Anorganik','Ikat kardus agar tidak basah'),
 ('Pasar Desa',5,'08.00','Campuran','Prioritas sisa dagang'),
 ('Bank Sampah Melati',6,'08.00–14.00','Setoran','Penimbangan dan pencatatan nilai');
insert into nasabah (full_name,phone,address,is_demo) values ('Siti Rahmawati','0813-0000-2001','Dusun Melati',true),('Budi Santosa','0813-0000-2002','Dusun Mawar',true),('Wulan Anggraini','0813-0000-2003','Dusun Kenanga',true);
insert into setoran (nasabah_id,category,weight_kg,price_per_kg,is_demo) values (1,'plastik',4.5,2500,true),(1,'kertas',6,1800,true),(2,'logam',3.2,9000,true),(3,'organik',10,400,true);
insert into reports (reporter_name,title,description,category,status,lat,lng,address,estimated_kg,is_demo) values
 ('Warga Demo','Tumpukan sampah di tepi sungai','Menumpuk sejak hujan semalam','plastik','menunggu',-7.7988,110.4088,'Tepian Sungai Mawar',40,true),
 ('Warga Demo','Sampah pasar belum diangkut','Sisa dagang menumpuk di belakang pasar','organik','dalam_penanganan',-7.8038,110.4156,'Belakang Pasar Desa',80,true),
 ('Warga Demo','Kardus menumpuk di gang','Menutup sebagian jalan','kertas','selesai',-7.8054,110.4106,'Gang Melati Utara',25,true);
