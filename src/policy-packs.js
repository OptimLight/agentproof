export const POLICY_PACKS = {
  'relaxed-prototype': {
    description: 'Experiments, internal demos, and throwaway prototypes.',
    config: {
      $schema: 'https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.config.schema.json',
      profile: 'relaxed',
      failUnder: 65,
      maxFiles: 900,
      commandTimeoutSeconds: 90,
      ignore: ['fixtures', 'snapshots', 'generated'],
      slopPhrases: ['coming soon', 'premium experience', 'lorem ipsum'],
      commands: [],
      budgets: { critical: 0, high: 8, medium: 30 },
      severityOverrides: {
        'slop.generic-copy': 'low',
        'hygiene.console-log': 'low'
      },
      suppressions: []
    }
  },
  'standard-pr-gate': {
    description: 'Balanced default for normal agent-generated pull requests.',
    config: {
      $schema: 'https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.config.schema.json',
      profile: 'standard',
      failUnder: 80,
      maxFiles: 1200,
      commandTimeoutSeconds: 120,
      baseline: '.agentproof/baseline.json',
      ignore: ['fixtures', 'snapshots', 'generated'],
      slopPhrases: ['coming soon', 'premium experience', 'lorem ipsum'],
      commands: [],
      budgets: { critical: 0, high: 3, medium: 14 },
      severityOverrides: {},
      suppressions: []
    }
  },
  'strict-client-delivery': {
    description: 'Production-bound client work and agency delivery.',
    config: {
      $schema: 'https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.config.schema.json',
      profile: 'strict',
      failUnder: 90,
      maxFiles: 1500,
      commandTimeoutSeconds: 180,
      baseline: '.agentproof/baseline.json',
      ignore: ['fixtures', 'snapshots', 'generated'],
      slopPhrases: ['coming soon', 'premium experience', 'lorem ipsum', 'trusted by thousands'],
      commands: [],
      budgets: { critical: 0, high: 0, medium: 6, low: 30 },
      severityOverrides: {},
      suppressions: []
    }
  },
  'mvp-client-delivery': {
    description: 'Strict production gate for MVPs where code and UI must both be client-ready.',
    config: {
      $schema: 'https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.config.schema.json',
      profile: 'strict',
      failUnder: 90,
      maxFiles: 1800,
      commandTimeoutSeconds: 180,
      baseline: '.agentproof/baseline.json',
      ignore: ['fixtures', 'snapshots', 'generated'],
      slopPhrases: ['coming soon', 'premium experience', 'lorem ipsum', 'trusted by thousands', 'revolutionize the way'],
      commands: [],
      design: {
        enabled: true,
        type: 'saas',
        url: '',
        routes: ['/'],
        viewports: ['mobile', 'desktop'],
        strictness: 'strict',
        ai: {
          enabled: false,
          blocking: false
        }
      },
      budgets: { critical: 0, high: 0, medium: 6, low: 30 },
      severityOverrides: {
        'design.layout.horizontal-overflow': 'critical',
        'design.hero.too-tall': 'high',
        'design.cta.below-fold': 'high',
        'design.color.low-contrast': 'high'
      },
      suppressions: []
    }
  },
  'security-sensitive': {
    description: 'Auth, billing, payments, secrets, infrastructure, and high-risk changes.',
    config: {
      $schema: 'https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.config.schema.json',
      profile: 'strict',
      failUnder: 95,
      maxFiles: 2000,
      commandTimeoutSeconds: 240,
      baseline: '.agentproof/baseline.json',
      ignore: ['fixtures', 'snapshots', 'generated'],
      slopPhrases: ['coming soon', 'premium experience', 'lorem ipsum', 'trusted by thousands'],
      commands: [],
      budgets: { critical: 0, high: 0, medium: 3, low: 15 },
      severityOverrides: {
        'security.unsafe-html': 'high',
        'security.env-committed': 'critical',
        'claims.done-conflicts-with-findings': 'critical'
      },
      suppressions: []
    }
  },
  'legacy-adoption': {
    description: 'Messy existing repos where known debt should stay visible but not block new work.',
    config: {
      $schema: 'https://raw.githubusercontent.com/runstudio/agentproof/main/schemas/agentproof.config.schema.json',
      profile: 'standard',
      failUnder: 80,
      maxFiles: 1500,
      commandTimeoutSeconds: 180,
      baseline: '.agentproof/baseline.json',
      ignore: ['fixtures', 'snapshots', 'generated', 'vendor'],
      slopPhrases: ['coming soon', 'premium experience', 'lorem ipsum'],
      commands: [],
      budgets: { critical: 0, high: 2, medium: 12, low: 50 },
      severityOverrides: {},
      suppressions: [
        {
          id: 'slop.generic-copy',
          file: 'docs/internal-drafts/*',
          reason: 'Internal drafts are allowed while legacy docs are cleaned up.',
          expires: '2026-12-31'
        }
      ]
    }
  }
};

export function getPolicyPack(name) {
  return POLICY_PACKS[name] || null;
}

export function renderPolicyPacksMarkdown() {
  const lines = ['# AgentProof Policy Packs', ''];
  lines.push('| Pack | Description | Profile | Fail under |');
  lines.push('|---|---|---|---:|');
  for (const [name, pack] of Object.entries(POLICY_PACKS)) {
    lines.push(`| \`${name}\` | ${pack.description} | ${pack.config.profile} | ${pack.config.failUnder} |`);
  }
  lines.push('');
  lines.push('Use with:');
  lines.push('');
  lines.push('```bash');
  lines.push('agentproof --init --policy-pack strict-client-delivery');
  lines.push('```');
  lines.push('');
  return `${lines.join('\n')}\n`;
}
