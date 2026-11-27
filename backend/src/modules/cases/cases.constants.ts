export const SOURCE_KINDS = ['manual_entry', 'test_fixture'] as const;
export type AllowedSourceKind = (typeof SOURCE_KINDS)[number];

export const SOURCE_KEY_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,79}$/;
// eslint-disable-next-line no-control-regex
export const NO_CONTROL_CHARS_REGEX = /^[^\x00-\x1f\x7f]*$/;
export const NON_BLANK_REGEX = /\S/;
export const NON_SPACE_ONLY_REGEX = /[^ ]/;
export const CASE_SCOPES = ['analyst', 'vocal'] as const;
export type CaseScope = (typeof CASE_SCOPES)[number];
