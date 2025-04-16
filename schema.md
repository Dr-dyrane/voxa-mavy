# Voxa — Supabase Schema Overview & Design Notes

## 📘 Project Overview
Voxa is designed as a robust, real-time capable backend powered by Supabase — offering scalable authentication, storage, realtime updates, and fine-grained Row Level Security (RLS). This document combines both system design insights and a full schema inspection report of the database.

---

## 💡 System Design Highlights
- **Authentication**: Built-in via Supabase Auth, with RLS on `auth.users` and related tables.
- **Data Modeling**: Structured using Postgres schemas: `auth`, `public`, `storage`, `realtime`, `vault`, `supabase_migrations`.
- **Security**: Row-Level Security (RLS) is used to enforce access rules, especially for user-facing data.
- **Realtime Features**: Enabled selectively on specific tables to optimize WebSocket traffic and performance.
- **Migration Tracking**: Versioned using `schema_migrations` for traceable schema updates.

---

## 🗂️ Schema Overview
This list was generated using the following SQL query to programmatically inspect your Supabase project's entire schema:

```sql
WITH table_policies AS (
  SELECT 
    pol.schemaname, 
    pol.tablename, 
    string_agg(pol.policyname || ': ' || pol.cmd || ' (' || pol.permissive || ')', ' | ') as policies
  FROM pg_policies pol
  GROUP BY pol.schemaname, pol.tablename
),
realtime_enabled_tables AS (
  SELECT 
    pt.schemaname, 
    pt.tablename
  FROM pg_publication_tables pt
  WHERE pt.publicationname = 'supabase_realtime'
),
constraints_info AS (
  SELECT 
    c.table_schema,
    c.table_name,
    string_agg(c.constraint_name || ' (' || c.constraint_type || ')', ' | ') AS constraints
  FROM information_schema.table_constraints c
  GROUP BY c.table_schema, c.table_name
)
SELECT 
  c.table_schema AS schema_name,
  c.table_name,
  t.relrowsecurity AS rls_enabled,
  t.relforcerowsecurity AS rls_forced,
  COALESCE(tp.policies, 'No policies') AS policies,
  CASE WHEN rt.schemaname IS NOT NULL THEN '✅' ELSE '❌' END AS realtime_enabled,
  COALESCE(ci.constraints, 'No constraints') AS constraints
FROM information_schema.tables c
LEFT JOIN pg_class t
  ON c.table_name = t.relname
LEFT JOIN table_policies tp
  ON c.table_schema = tp.schemaname AND c.table_name = tp.tablename
LEFT JOIN realtime_enabled_tables rt
  ON c.table_schema = rt.schemaname AND c.table_name = rt.tablename
LEFT JOIN constraints_info ci
  ON c.table_schema = ci.table_schema AND c.table_name = ci.table_name
WHERE c.table_type = 'BASE TABLE'
ORDER BY c.table_schema, c.table_name;
```

---

## 📋 Supabase Tables Summary

Sure — here’s a **clean, comprehensive Supabase table documentation** you can use — formatted properly for clear reading and future reference (maybe even for your technical docs or audit):

---

# 📋 Supabase Database Overview

| Schema               | Table Name                | RLS Enabled | RLS Forced | Policies                                                                                                                                                                            | Realtime Enabled | Constraints                                                                                                                                                     |
|----------------------|---------------------------|-------------|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **auth**             | audit_log_entries         | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `audit_log_entries_pkey` (PRIMARY KEY)                                                                                                                          |
| **auth**             | flow_state                | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `flow_state_pkey` (PRIMARY KEY)                                                                                                                                  |
| **auth**             | identities                | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `identities_pkey` (PRIMARY KEY), `identities_provider_id_provider_unique` (UNIQUE), `identities_user_id_fkey` (FOREIGN KEY)                                      |
| **auth**             | instances                 | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `instances_pkey` (PRIMARY KEY)                                                                                                                                   |
| **auth**             | mfa_amr_claims            | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `amr_id_pk` (PRIMARY KEY), `mfa_amr_claims_session_id_authentication_method_pkey` (UNIQUE), `mfa_amr_claims_session_id_fkey` (FOREIGN KEY)                       |
| **auth**             | mfa_challenges            | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `mfa_challenges_auth_factor_id_fkey` (FOREIGN KEY), `mfa_challenges_pkey` (PRIMARY KEY)                                                                          |
| **auth**             | mfa_factors               | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `mfa_factors_last_challenged_at_key` (UNIQUE), `mfa_factors_pkey` (PRIMARY KEY), `mfa_factors_user_id_fkey` (FOREIGN KEY)                                        |
| **auth**             | one_time_tokens           | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `one_time_tokens_pkey` (PRIMARY KEY), `one_time_tokens_user_id_fkey` (FOREIGN KEY)                                                                               |
| **auth**             | refresh_tokens            | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `refresh_tokens_pkey` (PRIMARY KEY), `refresh_tokens_session_id_fkey` (FOREIGN KEY), `refresh_tokens_token_unique` (UNIQUE)                                      |
| **auth**             | saml_providers            | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `saml_providers_entity_id_key` (UNIQUE), `saml_providers_pkey` (PRIMARY KEY), `saml_providers_sso_provider_id_fkey` (FOREIGN KEY)                                |
| **auth**             | saml_relay_states         | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `saml_relay_states_flow_state_id_fkey` (FOREIGN KEY), `saml_relay_states_pkey` (PRIMARY KEY), `saml_relay_states_sso_provider_id_fkey` (FOREIGN KEY)             |
| **auth**             | schema_migrations         | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `schema_migrations_pkey` (PRIMARY KEY)                                                                                                                           |
| **auth**             | sessions                  | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `sessions_pkey` (PRIMARY KEY), `sessions_user_id_fkey` (FOREIGN KEY)                                                                                             |
| **auth**             | sso_domains               | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `sso_domains_pkey` (PRIMARY KEY), `sso_domains_sso_provider_id_fkey` (FOREIGN KEY)                                                                               |
| **auth**             | sso_providers             | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `sso_providers_pkey` (PRIMARY KEY)                                                                                                                               |
| **auth**             | users                     | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `users_phone_key` (UNIQUE), `users_pkey` (PRIMARY KEY)                                                                                                           |
| **public**           | calls                     | ✅          | ❌          | Users can access / create / read / update their own calls                                                                                                                           | ✅               | `calls_caller_id_fkey`, `calls_pkey`, `calls_receiver_id_fkey`                                                                                                    |
| **public**           | conversations             | ✅          | ❌          | Users can access / create / read / update conversations they participate in                                                                                                         | ✅               | `conversations_last_message_id_fkey`, `conversations_pkey`                                                                                                        |
| **public**           | friends                   | ✅          | ❌          | Users can manage their friends                                                                                                                                                      | ❌               | `friends_friend_id_fkey`, `friends_pkey`, `friends_user_id_fkey`                                                                                                  |
| **public**           | messages                  | ✅          | ❌          | Users can insert / read / update messages they sent or received                                                                                                                     | ✅               | `messages_pkey`, `messages_receiver_id_fkey`, `messages_sender_id_fkey`                                                                                           |
| **public**           | notifications             | ✅          | ❌          | Users can access their notifications                                                                                                                                                 | ❌               | `notifications_pkey`, `notifications_user_id_fkey`                                                                                                               |
| **public**           | presence                  | ✅          | ❌          | Users can insert / update / read their own presence                                                                                                                                 | ✅               | `presence_pkey`, `presence_user_id_fkey`                                                                                                                         |
| **public**           | signaling                 | ✅          | ❌          | Users can access / create / read their own signaling data                                                                                                                            | ✅               | `signaling_pkey`, `signaling_receiver_id_fkey`, `signaling_sender_id_fkey`                                                                                       |
| **public**           | users                     | ✅          | ❌          | Public read access, users can insert / update their own profile                                                                                                                     | ✅               | `users_id_fkey`, `users_pkey`, `users_username_key`                                                                                                               |
| **realtime**         | messages_2025_04_13        | ❌          | ❌          | No policies                                                                                                                                                                         | ❌               | `messages_2025_04_13_pkey` (PRIMARY KEY)                                                                                                                         |
| **realtime**         | messages_2025_04_14        | ❌          | ❌          | No policies                                                                                                                                                                         | ❌               | `messages_2025_04_14_pkey` (PRIMARY KEY)                                                                                                                         |
| **realtime**         | messages_2025_04_15        | ❌          | ❌          | No policies                                                                                                                                                                         | ❌               | `messages_2025_04_15_pkey` (PRIMARY KEY)                                                                                                                         |
| **realtime**         | messages_2025_04_16        | ❌          | ❌          | No policies                                                                                                                                                                         | ❌               | `messages_2025_04_16_pkey` (PRIMARY KEY)                                                                                                                         |
| **realtime**         | messages_2025_04_17        | ❌          | ❌          | No policies                                                                                                                                                                         | ❌               | `messages_2025_04_17_pkey` (PRIMARY KEY)                                                                                                                         |
| **realtime**         | messages_2025_04_18        | ❌          | ❌          | No policies                                                                                                                                                                         | ❌               | `messages_2025_04_18_pkey` (PRIMARY KEY)                                                                                                                         |
| **realtime**         | messages_2025_04_19        | ❌          | ❌          | No policies                                                                                                                                                                         | ❌               | `messages_2025_04_19_pkey` (PRIMARY KEY)                                                                                                                         |
| **realtime**         | schema_migrations         | ❌          | ❌          | No policies                                                                                                                                                                         | ❌               | `schema_migrations_pkey` (PRIMARY KEY)                                                                                                                           |
| **realtime**         | subscription              | ❌          | ❌          | No policies                                                                                                                                                                         | ❌               | `pk_subscription` (PRIMARY KEY)                                                                                                                                  |
| **storage**          | buckets                   | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `buckets_pkey` (PRIMARY KEY)                                                                                                                                     |
| **storage**          | migrations                | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `migrations_name_key` (UNIQUE), `migrations_pkey` (PRIMARY KEY)                                                                                                   |
| **storage**          | objects                   | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `objects_bucketId_fkey` (FOREIGN KEY), `objects_pkey` (PRIMARY KEY)                                                                                              |
| **storage**          | s3_multipart_uploads      | ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `s3_multipart_uploads_bucket_id_fkey` (FOREIGN KEY), `s3_multipart_uploads_pkey` (PRIMARY KEY)                                                                   |
| **storage**          | s3_multipart_uploads_parts| ✅          | ❌          | No policies                                                                                                                                                                         | ❌               | `s3_multipart_uploads_parts_bucket_id_fkey`, `s3_multipart_uploads_parts_pkey`, `s3_multipart_uploads_parts_upload_id_fkey`                                      |
| **supabase_migrations** | schema_migrations      | ❌          | ❌          | No policies                                                                                                                                                                         | ❌               | `schema_migrations_pkey` (PRIMARY KEY)                                                                                                                           |
| **vault**            | secrets                   | ❌          | ❌          | No policies                                                                                                                                                                         | ❌               | `secrets_pkey` (PRIMARY KEY)                                                                                                                                    |

---

✅ = Enabled  
❌ = Disabled / False  


---

💡 Notes:

RLS Enabled: Ensures Row Level Security is active for the table, enforcing data isolation at the database level.

Policies: If no policies are defined, even if RLS is enabled, access is effectively blocked until explicit policies are created.

Realtime Enabled: Marks whether table changes are streamed via Supabase Realtime WebSocket.

Constraints: Overview of PRIMARY KEY, UNIQUE and FOREIGN KEY definitions that enforce relational integrity.

✅ This schema overview can be regenerated as part of your deployment audit or Supabase migration routine.Let me know if you want me to format this into a markdown file for docs/ or a README block!