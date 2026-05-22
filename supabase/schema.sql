-- InvoiceGen Database Schema
-- Run this in Supabase SQL Editor (Project → SQL Editor)

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  plan text default 'free' check (plan in ('free', 'pro', 'scale')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- COMPANIES (businesses)
-- =============================================
create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  address text,
  email text,
  vat_number text,
  logo_url text,
  default_vat_rate numeric(3,1) default 21,
  default_payment_terms integer default 30,
  stripe_account_id text,
  stripe_onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- CLIENTS
-- =============================================
create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  name text not null,
  company text,
  email text not null,
  address text,
  city text,
  postcode text,
  country text,
  vat_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- INVOICES
-- =============================================
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  invoice_number text not null,
  type text default 'standard' check (type in ('standard', 'proforma', 'credit_note', 'recurring')),
  status text default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date date default current_date,
  due_date date default (current_date + interval '30 days'),
  payment_terms integer default 30,
  notes text,
  subtotal numeric(12,2) default 0,
  vat_total numeric(12,2) default 0,
  total numeric(12,2) default 0,
  currency text default 'EUR',
  stripe_payment_link_id text,
  stripe_payment_link_url text,
  paid_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- INVOICE ITEMS
-- =============================================
create table if not exists public.invoice_items (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  description text not null,
  quantity numeric(10,2) default 1,
  unit_price numeric(12,2) default 0,
  vat_rate numeric(5,2) default 0,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- =============================================
-- PRODUCTS / SERVICES CATALOG
-- =============================================
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  name text not null,
  description text,
  unit_price numeric(12,2) not null default 0,
  unit text default 'item',
  category text,
  vat_rate numeric(5,2) default 0,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- BANK DETAILS
-- =============================================
create table if not exists public.bank_details (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  account_holder text,
  bank_name text,
  iban text,
  swift_bic text,
  account_number text,
  sort_code text,
  currency text default 'EUR',
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Products
alter table public.products enable row level security;
create policy "Users manage own products" on public.products
  for all using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );

-- Bank details
alter table public.bank_details enable row level security;
create policy "Users manage own bank details" on public.bank_details
  for all using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );

-- =============================================
-- RECURRING PROFILES
-- =============================================
create table if not exists public.recurring_profiles (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly', 'quarterly')),
  start_date date not null default current_date,
  next_run date,
  auto_send boolean default false,
  template_items jsonb not null default '[]',
  template_notes text,
  template_currency text default 'EUR',
  template_vat_rate numeric(5,2) default 0,
  is_active boolean default true,
  last_generated timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- SENT REMINDERS
-- =============================================
create table if not exists public.sent_reminders (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  reminder_type text not null check (reminder_type in ('due_soon', 'on_due', 'overdue', 'first_reminder', 'second_reminder', 'final_reminder')),
  sent_at timestamptz default now(),
  sent_via text default 'email',
  created_at timestamptz default now()
);

-- =============================================
-- REMINDER SETTINGS (per company)
-- =============================================
create table if not exists public.reminder_settings (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null unique,
  enabled boolean default true,
  due_soon_days integer default 3,
  auto_reminders boolean default true,
  first_reminder_days integer default 1,
  second_reminder_days integer default 7,
  final_reminder_days integer default 14,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Recurring profiles
alter table public.recurring_profiles enable row level security;
create policy "Users manage own recurring profiles" on public.recurring_profiles
  for all using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );

-- Sent reminders
alter table public.sent_reminders enable row level security;
create policy "Users manage own reminders" on public.sent_reminders
  for all using (
    invoice_id in (select id from public.invoices where company_id in (
      select id from public.companies where user_id = auth.uid()
    ))
  );

-- Reminder settings
alter table public.reminder_settings enable row level security;
create policy "Users manage own reminder settings" on public.reminder_settings
  for all using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Calculate next run date for recurring profiles
create or replace function public.calculate_next_run(current_run date, frequency text)
returns date as $$
begin
  return case frequency
    when 'weekly'    then current_run + interval '1 week'
    when 'biweekly'   then current_run + interval '2 weeks'
    when 'monthly'   then current_run + interval '1 month'
    when 'quarterly' then current_run + interval '3 months'
  end;
end;
$$ language plpgsql security definer;

-- Get company ID by user ID
create or replace function public.get_company_id(p_user_id uuid)
returns uuid as $$
  select id from public.companies where user_id = p_user_id limit 1;
$$ language sql security definer;

-- Generate next invoice number per company
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Companies
alter table public.companies enable row level security;
create policy "Users manage own companies" on public.companies
  for all using (auth.uid() = user_id);

-- Clients
alter table public.clients enable row level security;
create policy "Users manage own clients" on public.clients
  for all using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );

-- Invoices
alter table public.invoices enable row level security;
create policy "Users manage own invoices" on public.invoices
  for all using (
    company_id in (select id from public.companies where user_id = auth.uid())
  );

-- Invoice items
alter table public.invoice_items enable row level security;
create policy "Users manage own invoice items" on public.invoice_items
  for all using (
    invoice_id in (select id from public.invoices where company_id in (
      select id from public.companies where user_id = auth.uid()
    ))
  );

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Generate next invoice number per company
create or replace function public.generate_invoice_number(company_id uuid)
returns text as $$
declare
  next_num integer;
  prefix text;
begin
  select to_char(current_date, 'YYYYMM') into prefix;

  select coalesce(max(
    cast(regexp_replace(invoice_number, '[^0-9]', '', 'g') as integer)
  ), 0) + 1
  into next_num
  from public.invoices
  where company_id = $1
    and invoice_number ~ ('^' || prefix));

  return 'INV-' || prefix || '-' || lpad(next_num::text, 4, '0');
end;
$$ language plpgsql security definer;