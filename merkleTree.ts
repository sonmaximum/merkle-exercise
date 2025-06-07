import {createHash} from 'crypto';

function taggedHash(tag: string, message: Buffer): Buffer {
    const tagHash = createHash('sha256')
        .update(tag)
        .digest();
    const hash = createHash('sha256');
    hash.update(tagHash);
    hash.update(tagHash);
    hash.update(message);
    return hash.digest();
}

