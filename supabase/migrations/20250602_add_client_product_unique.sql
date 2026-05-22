-- Add unique constraint for clients (company_id + email)
-- Prevents duplicate clients per company
alter table public.clients
add constraint clients_company_email_unique
unique (company_id, email);

-- Also add for products (company_id + name)
alter table public.products
add constraint products_company_name_unique
unique (company_id, name);