const TOKEN_PATTERNS = [
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bghp_[A-Za-z0-9_]{20,}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g,
  /\bsk-[A-Za-z0-9_-]{12,}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+/-]{12,}=*/gi
];

const ASSIGNMENT_PATTERN = /((?:api[_-]?key|secret|token|password)\s*[:=]\s*['"])[^'"]{4,}(['"])/gi;

export function redactText(value) {
  if (value == null) return value;
  let output = String(value);

  for (const pattern of TOKEN_PATTERNS) {
    output = output.replace(pattern, (match) => {
      if (/^bearer\s+/i.test(match)) return 'Bearer [REDACTED]';
      return '[REDACTED]';
    });
  }

  output = output.replace(ASSIGNMENT_PATTERN, '$1[REDACTED]$2');
  return output;
}
