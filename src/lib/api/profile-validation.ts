import { NextResponse } from 'next/server';
import {
  EMPLOYEE_EDITABLE_FIELDS,
  ADMIN_EDITABLE_FIELDS,
  DocumentItem,
} from '@/types/profile';

const MAX_STRING_LENGTH = 500;
const MAX_DOCUMENTS = 25;

type FieldValue = string | null | DocumentItem[];
interface FieldResult {
  ok: boolean;
  value?: FieldValue;
  error?: string;
}

/**
 * Field-level validators. Every PATCH path runs its payload through here
 * before touching the DB — the frontend form is never trusted to enforce
 * permissions or shapes.
 */
function validateString(maxLength = MAX_STRING_LENGTH) {
  return (value: unknown): FieldResult => {
    if (typeof value !== 'string') {
      return { ok: false, error: 'Must be a string.' };
    }
    const trimmed = value.trim();
    if (trimmed.length > maxLength) {
      return { ok: false, error: `Must be at most ${maxLength} characters.` };
    }
    return { ok: true, value: trimmed };
  };
}

/** photo_url: allow clearing with empty string; otherwise must be http(s). */
function validatePhotoUrl(value: unknown): FieldResult {
  if (typeof value !== 'string') {
    return { ok: false, error: 'photo_url must be a string.' };
  }
  const trimmed = value.trim();
  if (trimmed === '') return { ok: true, value: null };
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return { ok: false, error: 'photo_url must be an http(s) URL.' };
    }
    return { ok: true, value: trimmed };
  } catch {
    return { ok: false, error: 'photo_url must be a valid URL.' };
  }
}

function validateDate(value: unknown): FieldResult {
  const key = 'date_of_joining';
  if (typeof value !== 'string') {
    return { ok: false, error: `${key} must be a YYYY-MM-DD string.` };
  }
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { ok: false, error: `${key} must use the YYYY-MM-DD format.` };
  }
  const parsed = new Date(`${trimmed}T00:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().split('T')[0] !== trimmed
  ) {
    return { ok: false, error: `${key} is not a valid calendar date.` };
  }
  return { ok: true, value: trimmed };
}

function validateEmploymentType(value: unknown): FieldResult {
  const allowed = ['Full-time', 'Part-time', 'Contract', 'Intern'];
  if (typeof value !== 'string') {
    return { ok: false, error: 'employment_type must be a string.' };
  }
  const trimmed = value.trim();
  if (!allowed.includes(trimmed)) {
    return {
      ok: false,
      error: `employment_type must be one of: ${allowed.join(', ')}.`,
    };
  }
  return { ok: true, value: trimmed };
}

/** documents: array of {name, url}; ids/uploaded_at assigned server-side. */
function validateDocuments(value: unknown): FieldResult {
  if (!Array.isArray(value)) {
    return { ok: false, error: 'documents must be an array.' };
  }
  if (value.length > MAX_DOCUMENTS) {
    return {
      ok: false,
      error: `documents may contain at most ${MAX_DOCUMENTS} entries.`,
    };
  }

  const docs: DocumentItem[] = [];
  for (let i = 0; i < value.length; i++) {
    const entry = value[i];
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return {
        ok: false,
        error: `documents[${i}] must be an object with name and url.`,
      };
    }
    const record = entry as Record<string, unknown>;
    if (
      typeof record.name !== 'string' ||
      !record.name.trim() ||
      record.name.trim().length > 200
    ) {
      return {
        ok: false,
        error: `documents[${i}].name must be a non-empty string of at most 200 characters.`,
      };
    }
    if (typeof record.url !== 'string' || !/^https?:\/\/.+/.test(record.url.trim())) {
      return {
        ok: false,
        error: `documents[${i}].url must be an http(s) URL.`,
      };
    }
    docs.push({
      id:
        typeof record.id === 'string'
          ? record.id
          : `doc-${Date.now()}-${i}`,
      name: record.name.trim(),
      url: record.url.trim(),
      uploadedAt:
        typeof record.uploaded_at === 'string'
          ? record.uploaded_at
          : new Date().toISOString(),
      category: 'other',
    });
  }
  return { ok: true, value: docs };
}

export type ProfilePatchPayload = Record<string, string | null | DocumentItem[]>;

const FIELD_VALIDATORS: Record<string, (value: unknown) => FieldResult> = {
  full_name: validateString(120),
  phone: validateString(20),
  address: validateString(MAX_STRING_LENGTH),
  designation: validateString(120),
  department: validateString(120),
  employment_type: validateEmploymentType,
  date_of_joining: validateDate,
  photo_url: validatePhotoUrl,
  documents: validateDocuments,
};

interface AllowlistResult {
  ok: boolean;
  /** Normalized payload ready for the DB update. Present when ok. */
  payload?: ProfilePatchPayload;
  response?: NextResponse;
}

/**
 * Enforce the field allowlist against an arbitrary JSON body.
 *
 * - Unknown / forbidden keys => 403 listing exactly which fields were rejected
 *   (so anyone poking the API sees the boundary is real).
 * - Known keys that fail validation => 400 with per-field reasons.
 * - Empty effective payload => 400.
 */
export function enforceAllowlist(
  body: unknown,
  mode: 'employee' | 'admin'
): AllowlistResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Request body must be a JSON object.' },
        { status: 400 }
      ),
    };
  }

  const allowed =
    mode === 'employee'
      ? (EMPLOYEE_EDITABLE_FIELDS as readonly string[])
      : (ADMIN_EDITABLE_FIELDS as readonly string[]);

  const input = body as Record<string, unknown>;
  const rejected = Object.keys(input).filter((key) => !allowed.includes(key));
  if (rejected.length > 0) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            mode === 'employee'
              ? 'Your role may only edit: phone, address, photo_url. The following fields were rejected by the server:'
              : 'The following fields are not editable through this endpoint:',
          rejected_fields: rejected,
        },
        { status: 403 }
      ),
    };
  }

  const payload: ProfilePatchPayload = {};
  const fieldErrors: Record<string, string> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;

    const result = FIELD_VALIDATORS[key](value);
    if (!result.ok) {
      fieldErrors[key] = result.error ?? 'Invalid value.';
    } else {
      payload[key] = result.value as string | null | DocumentItem[];
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Validation failed.', field_errors: fieldErrors },
        { status: 400 }
      ),
    };
  }

  if (Object.keys(payload).length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'No valid fields supplied to update.' },
        { status: 400 }
      ),
    };
  }

  return { ok: true, payload };
}
