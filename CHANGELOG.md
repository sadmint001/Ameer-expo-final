# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Ticket number generation (crypto-random, zero-ambiguity characters) and QR code generation for entry verification.
- Cloudflare Turnstile integration on the registration form to prevent automated spam.
- Basic SEO files (`robots.txt` and `sitemap.xml`).
- Confirmation emails to registrants using Resend.
- Submission abuse throttling for registration and exhibitor lead endpoints.
- Retry path for failed or timed-out VIP payments.
- Security hardening migration (RLS policies and function permissions).
- VIP pass payment flow via Pesapal integration.
- Language Switcher on the registration form.

### Changed

- Rebuilt registration confirmation emails as responsive HTML `<table>` layouts with brand colors and inline QR codes.
- Consolidated `/exhibit` lead-capture to use the primary `partner_inquiries` table, mapping fields and preserving tier selections, while deprecating the legacy endpoint.
- Refactored `Hero` and `Footer` components to extract external URLs to constants.
- Updated registration flow to correctly use Supabase and handle Pesapal UUID mismatches.

### Fixed

- Fixed a duplicate registration bug where payment timeouts/retries created new database rows instead of resuming the pending attempt.
- Fixed a hardcoded Pesapal sandbox URL in the IPN handler that prevented production payments from completing.
- Fixed migration file extensions (`.txt` to `.sql`) and sequence numbering to prevent Supabase sync issues.
- Removed production-leaking environment variable debug logs from the Supabase admin client.
- Fixed eslint dependency version conflict.
- Fixed registration confirmation polling by resolving the ID discrepancy (UUID vs Reference Code).
- Replaced broken remote image references with locally hosted assets.
- Removed unused `@libsql/client` dependencies.
