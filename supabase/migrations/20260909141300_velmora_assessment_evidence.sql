/*
# Add assessment evidence transparency fields

## Overview
Adds two non-destructive fields to crop assessments so Velmora can clearly separate evidence used from information still missing.

## Modified Tables
- `crop_assessments.evidence_used` (text array): Records the inputs considered, such as the crop image, farmer observations, weather, and field history.
- `crop_assessments.missing_evidence` (text array): Records useful information that was not available or could improve confidence.

## Security
- Existing row-level security and owner-scoped policies remain unchanged.
- No existing data is removed or modified.

## Notes
1. Both fields default to an empty array for older assessments.
2. The fields support honest uncertainty without inventing evidence.
*/

ALTER TABLE crop_assessments
  ADD COLUMN IF NOT EXISTS evidence_used text[] NOT NULL DEFAULT '{}';

ALTER TABLE crop_assessments
  ADD COLUMN IF NOT EXISTS missing_evidence text[] NOT NULL DEFAULT '{}';
