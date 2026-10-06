/** Lets the forecast script import extensionless TypeScript the way the app does. */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier)) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}
