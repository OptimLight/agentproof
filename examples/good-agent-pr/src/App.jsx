const features = [
  'Checks agent claims against local evidence',
  'Creates a portable receipt for code review',
  'Blocks risky pull requests before merge'
];

export function App() {
  return (
    <main aria-labelledby="page-title">
      <img src="/hero.png" alt="AgentProof report showing an AI pull request risk score" />
      <h1 id="page-title">Ship agent-written code with proof</h1>
      <p>
        AgentProof reviews generated pull requests for security smells, missing evidence,
        weak UI hygiene, and unverifiable completion claims.
      </p>
      <a href="/docs" aria-label="Read the AgentProof documentation">Read the docs</a>
      <button type="button">Generate proof receipt</button>
      <ul>
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </main>
  );
}
