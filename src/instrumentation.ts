// Runs once when the server starts. An unsafe DEMO_MODE deployment stops here, before serving
// any request. Outside DEMO_MODE this does nothing.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.DEMO_MODE !== "true") return;
  const { assertDemoSafe } = await import("./lib/config");
  assertDemoSafe();
}
