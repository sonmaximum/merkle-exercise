import { createHash } from 'crypto';

const tagHashCache = new Map<string, Buffer>();

export function taggedHash(tag: string, message: Buffer): Buffer {
    let tagHash = tagHashCache.get(tag);
    if (!tagHash) {
        tagHash = createHash('sha256').update(tag).digest();
        tagHashCache.set(tag, tagHash);
    }
    const hash = createHash('sha256');
    hash.update(tagHash);
    hash.update(tagHash);
    hash.update(message);
    return hash.digest();
}
