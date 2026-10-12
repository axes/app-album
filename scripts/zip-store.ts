/**
 * Tiny STORE-only ZIP writer — UI-04A.1.
 *
 * No npm dependencies. Uses only `node:zlib` for the required CRC32 and
 * emits a minimal ZIP 2.0 local file header per entry. Compression is fixed
 * to STORE (method 0) on purpose: the package is a few kB, designers open
 * these files locally, and STORE keeps the implementation trivial and
 * deterministic.
 *
 * NOT a general-purpose ZIP library. Only the methods needed by
 * `build-ui-reference.ts` are implemented (STORE, single disk, no symlinks,
 * no encryption, no zip64). That is the contract.
 */

import { createHash } from "node:crypto";
import { deflateRawSync, crc32 } from "node:zlib";

export type ZipEntry = { name: string; data: Buffer | Uint8Array };

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b08;
const SIG_END = 0x06054b50;

function toBuffer(input: Buffer | Uint8Array): Buffer {
  return Buffer.isBuffer(input) ? input : Buffer.from(input);
}

function writeUint16(value: number, out: Buffer, offset: number): void {
  out.writeUInt16LE(value & 0xffff, offset);
}

function writeUint32(value: number, out: Buffer, offset: number): void {
  // ZIP uses 32-bit lengths; the package is small enough to never need zip64.
  out.writeUInt32LE(value >>> 0, offset);
}

export function buildZip(entries: ZipEntry[]): Buffer {
  const chunks: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const data = toBuffer(entry.data);
    const name = Buffer.from(entry.name, "utf8");
    const crc = crc32(data) >>> 0;
    const size = data.length;
    // Fixed DOS timestamp keeps byte output identical across executions.
    const time = 0;
    const date = 0x0021; // 1980-01-01

    const local = Buffer.alloc(30);
    writeUint32(SIG_LOCAL, local, 0);
    writeUint16(20, local, 4); // version needed
    writeUint16(0, local, 6); // flags
    writeUint16(0, local, 8); // method 0 (STORE)
    writeUint16(time, local, 10);
    writeUint16(date, local, 12);
    writeUint32(crc, local, 14);
    writeUint32(size, local, 18);
    writeUint32(size, local, 22);
    writeUint16(name.length, local, 26);
    writeUint16(0, local, 28);

    chunks.push(local, name, data);

    const centralEntry = Buffer.alloc(46);
    writeUint32(SIG_CENTRAL, centralEntry, 0);
    writeUint16(20, centralEntry, 4); // version made by
    writeUint16(20, centralEntry, 6); // version needed
    writeUint16(0, centralEntry, 8); // flags
    writeUint16(0, centralEntry, 10); // STORE
    writeUint16(time, centralEntry, 12);
    writeUint16(date, centralEntry, 14);
    writeUint32(crc, centralEntry, 16);
    writeUint32(size, centralEntry, 20);
    writeUint32(size, centralEntry, 24);
    writeUint16(name.length, centralEntry, 28);
    writeUint16(0, centralEntry, 30); // extra
    writeUint16(0, centralEntry, 32); // comment
    writeUint16(0, centralEntry, 34); // disk
    writeUint16(0, centralEntry, 36); // internal attrs
    writeUint32(0, centralEntry, 38); // external attrs
    writeUint32(offset, centralEntry, 42);
    central.push(centralEntry, name);

    offset += local.length + name.length + data.length;
  }

  const centralStart = offset;
  let centralSize = 0;
  for (const piece of central) centralSize += piece.length;
  const end = Buffer.alloc(22);
  writeUint32(SIG_END, end, 0);
  writeUint16(0, end, 4);
  writeUint16(0, end, 6);
  writeUint16(entries.length, end, 8);
  writeUint16(entries.length, end, 10);
  writeUint32(centralSize, end, 12);
  writeUint32(centralStart, end, 16);
  writeUint16(0, end, 20);

  return Buffer.concat([...chunks, ...central, end]);
}

/** Stable content hash used by the determinism test. */
export function packageFingerprint(entries: ZipEntry[]): string {
  return createHash("sha256").update(buildZip(entries)).digest("hex");
}

/** Deflate helper retained for future use; currently unused (STORE only). */
export function deflateRaw(input: Buffer | Uint8Array): Buffer {
  return deflateRawSync(toBuffer(input));
}
