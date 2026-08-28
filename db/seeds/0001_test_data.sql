BEGIN;

SELECT set_config(
    'app.current_landlord_id',
    '10000000-0000-4000-8000-000000000001',
    TRUE
);

INSERT INTO landlords (
    id,
    full_name,
    business_name,
    mpesa_shortcode,
    primary_phone,
    email
) VALUES (
    '10000000-0000-4000-8000-000000000001',
    'John Kamau',
    'Kamau Property Management',
    '123456',
    '254712345678',
    'john.kamau@example.com'
);

INSERT INTO properties (
    id,
    landlord_id,
    name,
    address_line_1,
    city,
    county
) VALUES (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Kilimani Heights',
    'Dennis Pritt Road, Kilimani',
    'Nairobi',
    'Nairobi'
);

INSERT INTO units (
    id,
    landlord_id,
    property_id,
    unit_number,
    bedrooms,
    monthly_rent
) VALUES
(
    '30000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Unit A4',
    1,
    15000.00
),
(
    '30000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Unit A5',
    1,
    15000.00
);

INSERT INTO tenants (
    id,
    landlord_id,
    unit_id,
    full_name,
    primary_phone,
    email,
    national_id,
    lease_start_date,
    status
) VALUES (
    '40000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000004',
    'Mary Wanjiku',
    '254798765432',
    'mary.wanjiku@example.com',
    '28765432',
    '2026-01-01',
    'ACTIVE'
);

INSERT INTO invoices (
    id,
    landlord_id,
    tenant_id,
    unit_id,
    invoice_number,
    billing_period_start,
    billing_period_end,
    due_date,
    amount_due,
    status,
    description,
    issued_at
) VALUES (
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000004',
    'INV-2026-08-A4',
    '2026-08-01',
    '2026-08-31',
    '2026-09-05',
    15500.00,
    'ISSUED',
    'August 2026 rent and water charges',
    '2026-08-28 09:00:00+03'
);

INSERT INTO ledger_entries (
    id,
    landlord_id,
    transaction_group_id,
    tenant_id,
    invoice_id,
    entry_type,
    amount,
    currency,
    payment_method,
    payment_status,
    account_reference,
    description,
    occurred_at
) VALUES (
    '60000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'DEBIT',
    15500.00,
    'KES',
    'SYSTEM',
    'COMPLETED',
    'UNIT-A4-202608',
    'Invoice INV-2026-08-A4 posted',
    '2026-08-28 09:00:00+03'
);

COMMIT;
