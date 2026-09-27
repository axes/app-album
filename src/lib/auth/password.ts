import { hash, verify, type Options } from "@node-rs/argon2";

/**
 * Argon2id parameters (OWASP-recommended baseline for interactive logins).
 *
 * The variant is pinned explicitly so a library default change cannot silently
 * downgrade it. `@node-rs/argon2` exposes `Algorithm` as an ambient `const
 * enum`, which cannot be referenced under `isolatedModules`; the numeric value
 * `2` is the documented `Algorithm.Argon2id` member and is accepted by the
 * installed `Options` type. `password.test.ts` asserts the produced hash is
 * `$argon2id$`, so the variant stays unambiguous and verified.
 */
export const ARGON2_OPTIONS = {
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const satisfies Options;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/**
 * Precomputed Argon2id hash of a throwaway password, generated with the exact
 * same parameters as real hashes. It is used to keep login timing roughly
 * constant when the username does not exist, mitigating user enumeration
 * without paying a first-request hashing cost.
 *
 * Regenerate with:
 *   node -e "require('@node-rs/argon2').hash('dummy-password-for-timing',{algorithm:2,memoryCost:19456,timeCost:2,parallelism:1}).then(console.log)"
 */
export const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$Q0KIQ0w04flZ+1t4moUyCw$egYy9zfFZjXKzA9pNSXb7gEWZFvN99xlPPqP1Kw39Nw";
