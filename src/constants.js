export const VERSION = '0.1.0';

export const SEVERITY_WEIGHT = {
  critical: 25,
  high: 12,
  medium: 6,
  low: 2,
  info: 0
};

export const SEVERITY_RANK = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4
};

export const DEFAULT_IGNORE = [
  '.git',
  'node_modules',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.cache',
  '.venv',
  'venv',
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  '.agentproof',
  'AGENT_PROOF_REPORT.md',
  'agentproof-report.md',
  'agentproof-report.html',
  'agentproof-summary.json',
  'agentproof-receipt.json',
  'agentproof-pr-comment.md',
  'agentproof.sarif',
  'agentproof-badge.svg'
];

export const TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.json', '.md', '.mdx', '.html', '.css', '.scss',
  '.vue', '.svelte', '.py', '.rb', '.go', '.rs', '.java',
  '.kt', '.swift', '.php', '.yml', '.yaml', '.toml', '.env',
  '.sh', '.bash', '.zsh', '.sql', '.graphql', '.gql'
]);

export const UI_EXTENSIONS = new Set(['.jsx', '.tsx', '.html', '.vue', '.svelte', '.mdx']);

export const DEFAULT_SLOP_PHRASES = [
  'lorem ipsum',
  'coming soon',
  'stay tuned',
  'your trusted partner',
  'elevate your experience',
  'seamless experience',
  'premium experience',
  'unlock your potential',
  'ai-powered platform',
  'revolutionize the way',
  'one stop solution',
  'game changer',
  'john doe',
  'jane doe',
  'acme corp',
  'placeholder',
  'todo',
  'fixme',
  'as an ai language model'
];

export const RISK_PROFILES = {
  relaxed: {
    failUnder: 65,
    budgets: { critical: 0, high: 8, medium: 30 },
    description: 'For exploratory branches where signal matters more than blocking.'
  },
  standard: {
    failUnder: 80,
    budgets: { critical: 0, high: 3, medium: 14 },
    description: 'Default gate for agent-generated pull requests.'
  },
  strict: {
    failUnder: 90,
    budgets: { critical: 0, high: 0, medium: 6 },
    description: 'For production-bound code, client work, auth, billing, and security-sensitive changes.'
  }
};
