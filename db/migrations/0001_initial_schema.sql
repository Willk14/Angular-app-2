BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS app;

CREATE TYPE payment_status_enum AS ENUM (
    'INITIATED',
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REVERSED'
);

CREATE TYPE payment_method_enum AS ENUM (
    'SYSTEM',
    'MPESA',
    'BANK_TRANSFER',
    'CASH',
    'OTHER'
);

CREATE TYPE ledger_entry_type_enum AS ENUM (
    'DEBIT',
    'CREDIT'
);

CREATE FUNCTION app.current_landlord_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
    SELECT NULLIF(current_setting('app.current_landlord_id', true), '')::UUID
$$;

CREATE TABLE landlords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    business_name TEXT,
    mpesa_shortcode VARCHAR(12) NOT NULL UNIQUE,
    primary_phone VARCHAR(15) NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT landlords_shortcode_format_check
        CHECK (mpesa_shortcode ~ '^[0-9]{5,12}$'),
    CONSTRAINT landlords_primary_phone_format_check
        CHECK (primary_phone ~ '^254[0-9]{9}$')
);

CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES landlords(id),
    name TEXT NOT NULL,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city TEXT NOT NULL DEFAULT 'Nairobi',
    county TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT properties_id_landlord_unique UNIQUE (id, landlord_id),
    CONSTRAINT properties_name_per_landlord_unique UNIQUE (landlord_id, name)
);

CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES landlords(id),
    property_id UUID NOT NULL,
    unit_number TEXT NOT NULL,
    bedrooms SMALLINT NOT NULL DEFAULT 1,
    monthly_rent NUMERIC(14, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT units_id_landlord_unique UNIQUE (id, landlord_id),
    CONSTRAINT units_property_landlord_fk
        FOREIGN KEY (property_id, landlord_id)
        REFERENCES properties(id, landlord_id),
    CONSTRAINT units_number_per_property_unique
        UNIQUE (property_id, unit_number),
    CONSTRAINT units_bedrooms_check CHECK (bedrooms >= 0),
    CONSTRAINT units_monthly_rent_check CHECK (monthly_rent >= 0)
);

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES landlords(id),
    unit_id UUID,
    full_name TEXT NOT NULL,
    primary_phone VARCHAR(15) NOT NULL,
    email TEXT,
    national_id VARCHAR(20),
    lease_start_date DATE,
    lease_end_date DATE,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tenants_id_landlord_unique UNIQUE (id, landlord_id),
    CONSTRAINT tenants_unit_landlord_fk
        FOREIGN KEY (unit_id, landlord_id)
        REFERENCES units(id, landlord_id),
    CONSTRAINT tenants_phone_per_landlord_unique
        UNIQUE (landlord_id, primary_phone),
    CONSTRAINT tenants_primary_phone_format_check
        CHECK (primary_phone ~ '^254[0-9]{9}$'),
    CONSTRAINT tenants_lease_dates_check
        CHECK (
            lease_end_date IS NULL
            OR lease_start_date IS NULL
            OR lease_end_date >= lease_start_date
        ),
    CONSTRAINT tenants_status_check
        CHECK (status IN ('ACTIVE', 'NOTICE_GIVEN', 'VACATED'))
);

CREATE TABLE utility_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES landlords(id),
    unit_id UUID NOT NULL,
    tenant_id UUID,
    utility_type TEXT NOT NULL,
    reading_date DATE NOT NULL,
    previous_reading NUMERIC(14, 3) NOT NULL,
    current_reading NUMERIC(14, 3) NOT NULL,
    unit_rate NUMERIC(14, 2) NOT NULL,
    fixed_charge NUMERIC(14, 2) NOT NULL DEFAULT 0,
    consumption_units NUMERIC(14, 3)
        GENERATED ALWAYS AS (current_reading - previous_reading) STORED,
    charge_amount NUMERIC(14, 2)
        GENERATED ALWAYS AS (
            ((current_reading - previous_reading) * unit_rate) + fixed_charge
        ) STORED,
    meter_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT utility_readings_unit_landlord_fk
        FOREIGN KEY (unit_id, landlord_id)
        REFERENCES units(id, landlord_id),
    CONSTRAINT utility_readings_tenant_landlord_fk
        FOREIGN KEY (tenant_id, landlord_id)
        REFERENCES tenants(id, landlord_id),
    CONSTRAINT utility_readings_type_check
        CHECK (utility_type IN ('WATER', 'ELECTRICITY', 'GAS')),
    CONSTRAINT utility_readings_values_check
        CHECK (
            previous_reading >= 0
            AND current_reading >= previous_reading
            AND unit_rate >= 0
            AND fixed_charge >= 0
        ),
    CONSTRAINT utility_readings_unit_type_date_unique
        UNIQUE (unit_id, utility_type, reading_date)
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES landlords(id),
    tenant_id UUID NOT NULL,
    unit_id UUID NOT NULL,
    invoice_number TEXT NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    amount_due NUMERIC(14, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'ISSUED',
    description TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT invoices_id_landlord_unique UNIQUE (id, landlord_id),
    CONSTRAINT invoices_tenant_landlord_fk
        FOREIGN KEY (tenant_id, landlord_id)
        REFERENCES tenants(id, landlord_id),
    CONSTRAINT invoices_unit_landlord_fk
        FOREIGN KEY (unit_id, landlord_id)
        REFERENCES units(id, landlord_id),
    CONSTRAINT invoices_number_per_landlord_unique
        UNIQUE (landlord_id, invoice_number),
    CONSTRAINT invoices_billing_period_check
        CHECK (billing_period_end >= billing_period_start),
    CONSTRAINT invoices_amount_due_check CHECK (amount_due > 0),
    CONSTRAINT invoices_status_check
        CHECK (
            status IN (
                'DRAFT',
                'ISSUED',
                'PARTIALLY_PAID',
                'PAID',
                'OVERDUE',
                'VOID'
            )
        )
);

CREATE TABLE raw_payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES landlords(id),
    provider TEXT NOT NULL DEFAULT 'SAFARICOM_DARAJA',
    provider_event_id TEXT,
    event_type TEXT NOT NULL,
    payment_status payment_status_enum NOT NULL,
    mpesa_receipt_number VARCHAR(20),
    raw_payload TEXT NOT NULL,
    payload_json JSONB GENERATED ALWAYS AS (raw_payload::JSONB) STORED,
    request_headers JSONB NOT NULL DEFAULT '{}'::JSONB,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT raw_payment_webhooks_id_landlord_unique
        UNIQUE (id, landlord_id),
    CONSTRAINT raw_payment_webhooks_provider_event_unique
        UNIQUE (provider, provider_event_id),
    CONSTRAINT raw_payment_webhooks_receipt_format_check
        CHECK (
            mpesa_receipt_number IS NULL
            OR mpesa_receipt_number ~ '^[A-Z0-9]{10,20}$'
        ),
    CONSTRAINT raw_payment_webhooks_payload_object_check
        CHECK (jsonb_typeof(payload_json) = 'object')
);

CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES landlords(id),
    transaction_group_id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    invoice_id UUID,
    raw_payment_webhook_id UUID,
    reversal_of_entry_id UUID,
    entry_type ledger_entry_type_enum NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'KES',
    payment_method payment_method_enum NOT NULL,
    payment_status payment_status_enum NOT NULL,
    mpesa_receipt_number VARCHAR(20) UNIQUE,
    account_reference TEXT,
    description TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ledger_entries_id_landlord_unique UNIQUE (id, landlord_id),
    CONSTRAINT ledger_entries_tenant_landlord_fk
        FOREIGN KEY (tenant_id, landlord_id)
        REFERENCES tenants(id, landlord_id),
    CONSTRAINT ledger_entries_invoice_landlord_fk
        FOREIGN KEY (invoice_id, landlord_id)
        REFERENCES invoices(id, landlord_id),
    CONSTRAINT ledger_entries_webhook_landlord_fk
        FOREIGN KEY (raw_payment_webhook_id, landlord_id)
        REFERENCES raw_payment_webhooks(id, landlord_id),
    CONSTRAINT ledger_entries_reversal_landlord_fk
        FOREIGN KEY (reversal_of_entry_id, landlord_id)
        REFERENCES ledger_entries(id, landlord_id),
    CONSTRAINT ledger_entries_amount_check CHECK (amount > 0),
    CONSTRAINT ledger_entries_currency_check CHECK (currency = 'KES'),
    CONSTRAINT ledger_entries_receipt_format_check
        CHECK (
            mpesa_receipt_number IS NULL
            OR mpesa_receipt_number ~ '^[A-Z0-9]{10,20}$'
        ),
    CONSTRAINT ledger_entries_reversal_check
        CHECK (
            (payment_status = 'REVERSED' AND reversal_of_entry_id IS NOT NULL)
            OR (payment_status <> 'REVERSED' AND reversal_of_entry_id IS NULL)
        )
);

CREATE TABLE unassigned_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES landlords(id),
    raw_payment_webhook_id UUID NOT NULL,
    mpesa_receipt_number VARCHAR(20) NOT NULL UNIQUE,
    account_reference TEXT NOT NULL,
    payer_phone VARCHAR(15),
    payer_name TEXT,
    amount NUMERIC(14, 2) NOT NULL,
    payment_status payment_status_enum NOT NULL,
    mismatch_reason TEXT NOT NULL,
    resolved_tenant_id UUID,
    resolved_ledger_entry_id UUID,
    received_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unassigned_payments_webhook_landlord_fk
        FOREIGN KEY (raw_payment_webhook_id, landlord_id)
        REFERENCES raw_payment_webhooks(id, landlord_id),
    CONSTRAINT unassigned_payments_tenant_landlord_fk
        FOREIGN KEY (resolved_tenant_id, landlord_id)
        REFERENCES tenants(id, landlord_id),
    CONSTRAINT unassigned_payments_ledger_landlord_fk
        FOREIGN KEY (resolved_ledger_entry_id, landlord_id)
        REFERENCES ledger_entries(id, landlord_id),
    CONSTRAINT unassigned_payments_amount_check CHECK (amount > 0),
    CONSTRAINT unassigned_payments_receipt_format_check
        CHECK (mpesa_receipt_number ~ '^[A-Z0-9]{10,20}$'),
    CONSTRAINT unassigned_payments_payer_phone_format_check
        CHECK (
            payer_phone IS NULL
            OR payer_phone ~ '^254[0-9]{9}$'
        ),
    CONSTRAINT unassigned_payments_resolution_check
        CHECK (
            (
                resolved_tenant_id IS NULL
                AND resolved_ledger_entry_id IS NULL
                AND resolved_at IS NULL
            )
            OR (
                resolved_tenant_id IS NOT NULL
                AND resolved_ledger_entry_id IS NOT NULL
                AND resolved_at IS NOT NULL
            )
        )
);

CREATE TABLE user_device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID NOT NULL REFERENCES landlords(id),
    tenant_id UUID,
    device_token TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_device_tokens_tenant_landlord_fk
        FOREIGN KEY (tenant_id, landlord_id)
        REFERENCES tenants(id, landlord_id),
    CONSTRAINT user_device_tokens_platform_check
        CHECK (platform IN ('ANDROID', 'IOS', 'WEB'))
);

CREATE UNIQUE INDEX landlords_primary_phone_idx
    ON landlords(primary_phone);
CREATE INDEX properties_landlord_id_idx
    ON properties(landlord_id);
CREATE INDEX units_landlord_id_idx
    ON units(landlord_id);
CREATE INDEX units_property_id_idx
    ON units(property_id);
CREATE INDEX tenants_landlord_id_idx
    ON tenants(landlord_id);
CREATE INDEX tenants_unit_id_idx
    ON tenants(unit_id);
CREATE INDEX tenants_primary_phone_idx
    ON tenants(primary_phone);
CREATE UNIQUE INDEX tenants_one_active_lease_per_unit_idx
    ON tenants(unit_id)
    WHERE unit_id IS NOT NULL AND status = 'ACTIVE';
CREATE INDEX utility_readings_landlord_id_idx
    ON utility_readings(landlord_id);
CREATE INDEX utility_readings_unit_id_idx
    ON utility_readings(unit_id);
CREATE INDEX utility_readings_tenant_id_idx
    ON utility_readings(tenant_id);
CREATE INDEX invoices_landlord_id_idx
    ON invoices(landlord_id);
CREATE INDEX invoices_tenant_id_idx
    ON invoices(tenant_id);
CREATE INDEX invoices_unit_id_idx
    ON invoices(unit_id);
CREATE INDEX raw_payment_webhooks_landlord_id_idx
    ON raw_payment_webhooks(landlord_id);
CREATE INDEX raw_payment_webhooks_mpesa_receipt_number_idx
    ON raw_payment_webhooks(mpesa_receipt_number);
CREATE INDEX ledger_entries_landlord_id_idx
    ON ledger_entries(landlord_id);
CREATE INDEX ledger_entries_tenant_id_idx
    ON ledger_entries(tenant_id);
CREATE INDEX ledger_entries_invoice_id_idx
    ON ledger_entries(invoice_id);
CREATE INDEX ledger_entries_raw_payment_webhook_id_idx
    ON ledger_entries(raw_payment_webhook_id);
CREATE INDEX ledger_entries_reversal_of_entry_id_idx
    ON ledger_entries(reversal_of_entry_id);
CREATE INDEX ledger_entries_transaction_group_id_idx
    ON ledger_entries(transaction_group_id);
CREATE INDEX unassigned_payments_landlord_id_idx
    ON unassigned_payments(landlord_id);
CREATE INDEX unassigned_payments_raw_payment_webhook_id_idx
    ON unassigned_payments(raw_payment_webhook_id);
CREATE INDEX unassigned_payments_resolved_tenant_id_idx
    ON unassigned_payments(resolved_tenant_id);
CREATE INDEX unassigned_payments_resolved_ledger_entry_id_idx
    ON unassigned_payments(resolved_ledger_entry_id);
CREATE INDEX user_device_tokens_landlord_id_idx
    ON user_device_tokens(landlord_id);
CREATE INDEX user_device_tokens_tenant_id_idx
    ON user_device_tokens(tenant_id);

CREATE FUNCTION app.reject_immutable_table_mutation()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
    RAISE EXCEPTION '% is append-only; % is not permitted', TG_TABLE_NAME, TG_OP
        USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER ledger_entries_reject_update_delete
BEFORE UPDATE OR DELETE ON ledger_entries
FOR EACH ROW
EXECUTE FUNCTION app.reject_immutable_table_mutation();

CREATE TRIGGER raw_payment_webhooks_reject_update_delete
BEFORE UPDATE OR DELETE ON raw_payment_webhooks
FOR EACH ROW
EXECUTE FUNCTION app.reject_immutable_table_mutation();

ALTER TABLE landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlords FORCE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties FORCE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE units FORCE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE utility_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_readings FORCE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE raw_payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_payment_webhooks FORCE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries FORCE ROW LEVEL SECURITY;
ALTER TABLE unassigned_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE unassigned_payments FORCE ROW LEVEL SECURITY;
ALTER TABLE user_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_device_tokens FORCE ROW LEVEL SECURITY;

CREATE POLICY landlords_tenant_isolation
    ON landlords
    FOR ALL
    USING (id = app.current_landlord_id())
    WITH CHECK (id = app.current_landlord_id());

CREATE POLICY properties_tenant_isolation
    ON properties
    FOR ALL
    USING (landlord_id = app.current_landlord_id())
    WITH CHECK (landlord_id = app.current_landlord_id());

CREATE POLICY units_tenant_isolation
    ON units
    FOR ALL
    USING (landlord_id = app.current_landlord_id())
    WITH CHECK (landlord_id = app.current_landlord_id());

CREATE POLICY tenants_tenant_isolation
    ON tenants
    FOR ALL
    USING (landlord_id = app.current_landlord_id())
    WITH CHECK (landlord_id = app.current_landlord_id());

CREATE POLICY utility_readings_tenant_isolation
    ON utility_readings
    FOR ALL
    USING (landlord_id = app.current_landlord_id())
    WITH CHECK (landlord_id = app.current_landlord_id());

CREATE POLICY invoices_tenant_isolation
    ON invoices
    FOR ALL
    USING (landlord_id = app.current_landlord_id())
    WITH CHECK (landlord_id = app.current_landlord_id());

CREATE POLICY raw_payment_webhooks_select_isolation
    ON raw_payment_webhooks
    FOR SELECT
    USING (landlord_id = app.current_landlord_id());

CREATE POLICY raw_payment_webhooks_insert_isolation
    ON raw_payment_webhooks
    FOR INSERT
    WITH CHECK (landlord_id = app.current_landlord_id());

CREATE POLICY ledger_entries_select_isolation
    ON ledger_entries
    FOR SELECT
    USING (landlord_id = app.current_landlord_id());

CREATE POLICY ledger_entries_insert_isolation
    ON ledger_entries
    FOR INSERT
    WITH CHECK (landlord_id = app.current_landlord_id());

CREATE POLICY unassigned_payments_tenant_isolation
    ON unassigned_payments
    FOR ALL
    USING (landlord_id = app.current_landlord_id())
    WITH CHECK (landlord_id = app.current_landlord_id());

CREATE POLICY user_device_tokens_tenant_isolation
    ON user_device_tokens
    FOR ALL
    USING (landlord_id = app.current_landlord_id())
    WITH CHECK (landlord_id = app.current_landlord_id());

CREATE VIEW tenant_balances_view
WITH (security_invoker = TRUE)
AS
SELECT
    tenants.landlord_id,
    tenants.id AS tenant_id,
    tenants.full_name AS tenant_name,
    tenants.primary_phone,
    COALESCE(
        SUM(ledger_entries.amount) FILTER (
            WHERE ledger_entries.entry_type = 'DEBIT'
              AND ledger_entries.payment_status IN ('COMPLETED', 'REVERSED')
        ),
        0
    )::NUMERIC(14, 2) AS total_debits,
    COALESCE(
        SUM(ledger_entries.amount) FILTER (
            WHERE ledger_entries.entry_type = 'CREDIT'
              AND ledger_entries.payment_status IN ('COMPLETED', 'REVERSED')
        ),
        0
    )::NUMERIC(14, 2) AS total_credits,
    (
        COALESCE(
            SUM(ledger_entries.amount) FILTER (
                WHERE ledger_entries.entry_type = 'DEBIT'
                  AND ledger_entries.payment_status IN ('COMPLETED', 'REVERSED')
            ),
            0
        )
        -
        COALESCE(
            SUM(ledger_entries.amount) FILTER (
                WHERE ledger_entries.entry_type = 'CREDIT'
                  AND ledger_entries.payment_status IN ('COMPLETED', 'REVERSED')
            ),
            0
        )
    )::NUMERIC(14, 2) AS balance,
    MAX(ledger_entries.occurred_at) AS last_ledger_entry_at
FROM tenants
LEFT JOIN ledger_entries
    ON ledger_entries.tenant_id = tenants.id
   AND ledger_entries.landlord_id = tenants.landlord_id
GROUP BY
    tenants.landlord_id,
    tenants.id,
    tenants.full_name,
    tenants.primary_phone;

COMMIT;
