# Field Governance Matrix

## User Profile Fields

| Field | User Readable | User Editable | Admin Readable | Admin Editable | Compliance Controlled | Finance Controlled | Super Admin Controlled | System Only | Sensitive Masked | Immutable |
|---|---|---|---|---|---|---|---|---|---|---|
| id | No | No | Yes | No | No | No | No | Yes | No | Yes |
| user_id | No | No | Yes | No | No | No | No | Yes | No | Yes |
| first_name | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| middle_name | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| last_name | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| suffix | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| full_name | Yes | No (Derived)| Yes | No | No | No | No | No | No | No |
| display_name | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| date_of_birth | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| gender | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| preferred_language | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| timezone | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| alternate_mobile_number| Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| address_line_1 | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| address_line_2 | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| barangay | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| city | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| province | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| postal_code | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| country | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| address_encrypted | No | No | No | No | No | No | No | Yes | Yes | No |
| emergency_contact_name | Yes | Yes | Yes | No | No | No | Yes | No | No | No |
| emergency_contact_relationship| Yes | Yes | Yes | No | No | No | Yes | No | No | No |
| emergency_contact_number | Yes | Yes | Yes | No | No | No | Yes | No | No | No |
| email_notifications_enabled | Yes | Yes | Yes | No | No | No | Yes | No | No | No |
| sms_notifications_enabled | Yes | Yes | Yes | No | No | No | Yes | No | No | No |
| push_notifications_enabled | Yes | Yes | Yes | No | No | No | Yes | No | No | No |
| profile_completion_percentage| Yes | No | Yes | No | No | No | No | Yes | No | No |
| profile_photo | Yes | Yes | Yes | No | No | No | Yes | No | No | No |
| verification_status | Yes | No | Yes | No | Yes | No | Yes | No | No | No |
| trust_score | Yes | No | Yes | No | Yes | No | Yes | Yes | No | No |
| updated_at | Yes | No | Yes | No | No | No | No | Yes | No | No |

## Business Profile Fields

| Field | User Readable | User Editable | Admin Readable | Admin Editable | Compliance Controlled | Finance Controlled | Super Admin Controlled | System Only | Sensitive Masked | Immutable |
|---|---|---|---|---|---|---|---|---|---|---|
| id | No | No | Yes | No | No | No | No | Yes | No | Yes |
| user_id | No | No | Yes | No | No | No | No | Yes | No | Yes |
| business_name | Yes | Yes | Yes | Yes | Yes | No | Yes | No | No | No |
| business_type | Yes | Yes | Yes | Yes | Yes | No | Yes | No | No | No |
| business_contact_number | Yes | Yes | Yes | Yes | Yes | No | Yes | No | No | No |
| business_email | Yes | Yes | Yes | Yes | Yes | No | Yes | No | No | No |
| tax_identification_number | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No | Yes | No |
| business_registration_number | Yes | Yes | Yes | Yes | Yes | No | Yes | No | No | No |
| business_description | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| business_address | Yes | Yes | Yes | Yes | No | No | Yes | No | No | No |
| authorized_representative | Yes | Yes | Yes | Yes | Yes | No | Yes | No | No | No |
| verification_status | Yes | No | Yes | No | Yes | No | Yes | No | No | No |
| updated_at | Yes | No | Yes | No | No | No | No | Yes | No | No |
