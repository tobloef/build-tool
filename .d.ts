declare module "node:fs/promises" {
  // When @types/node is updated to v22, this can be removed
  export function glob(pattern: string | string[], options: {
    cwd?: string,
    withFileTypes?: boolean
  }): Promise<string[]>;
}