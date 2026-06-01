export function App() {
  const apiKey = "sk-this_is_a_fake_but_token_shaped_value_for_demo";
  console.log("debug", apiKey);

  return (
    <main>
      <img src="/hero.png" />
      <h1>AI-powered platform</h1>
      <p>Lorem ipsum dolor sit amet. TODO: replace this copy.</p>
      <a href="#">Learn more</a>
      <button></button>
      <section dangerouslySetInnerHTML={{ __html: window.location.hash }} />
    </main>
  );
}
