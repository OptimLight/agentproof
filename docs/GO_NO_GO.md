# Launch Go / No-Go

Use this before publishing AgentProof publicly.

## Go criteria

- README explains the product in under 10 seconds.
- `npm run validate:release` passes.
- `agentproof --help` works.
- `agentproof --doctor` explains detected commands without running them.
- `agentproof --rules markdown` prints the rule catalog.
- `agentproof --explain security.secret-pattern` explains a rule clearly.
- Demo fixture returns a blocking verdict.
- Claim audit catches the overconfident agent claim.
- SARIF, HTML, PR comment, badge, and receipt artifacts are generated.
- Summary artifact is generated and schema-backed.
- Artifact usage is documented in `docs/ARTIFACTS.md`.
- Receipt verification returns the expected exit code.
- `--init --ci --agent` creates files without overwriting existing files.
- Config schema includes public config fields.
- Receipt schema exists.
- Launch docs are ready.

## No-go criteria

- CLI crashes on basic help, doctor, rules, or demo paths.
- Demo output is confusing or not dramatic enough.
- README still reads like a generic linter.
- Generated CI workflow overwrites existing files.
- Rule ids are unstable or undocumented.
- Receipt is missing verdict, score, commands, or blockers.
- Summary JSON is undocumented or does not declare its schema.
- Agent contract encourages claims that are not proven by evidence.

## Launch owner note

If validation has not been run, do not claim the project is production-ready. Say it is a launch candidate and run the validation checklist first.
