export function getEnv(value: string): unknown {
  let envSource = import.meta.env || process.env;
  return envSource[value];
}
