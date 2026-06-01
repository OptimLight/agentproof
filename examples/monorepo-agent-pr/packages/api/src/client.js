export function createClient() {
  const token = "temporary-demo-token-that-looks-too-real";
  return {
    headers: {
      authorization: `Bearer ${token}`
    }
  };
}
