import type { User, ReserveProof } from './types';
import { computeMerkleRoot, computeMerkleProof } from '../merkle';

const users: User[] = [
    { id: 1, balance: 1111 },
    { id: 2, balance: 2222 },
    { id: 3, balance: 3333 },
    { id: 4, balance: 4444 },
    { id: 5, balance: 5555 },
    { id: 6, balance: 6666 },
    { id: 7, balance: 7777 },
    { id: 8, balance: 8888 },
];

export function serializeUser(user: User): Buffer {
    return Buffer.from(`(${user.id},${user.balance})`, 'utf8');
}

function getSortedUsers(): User[] {
    return [...users].sort((a, b) => a.id - b.id);
}

function getAllUserData(): Buffer[] {
    return getSortedUsers().map(serializeUser);
}

export function getAllUsers(): User[] {
    return getSortedUsers();
}

export function computeReserveRoot(): string {
    const userData = getAllUserData();
    const root = computeMerkleRoot(userData, 'ProofOfReserve_Leaf', 'ProofOfReserve_Branch');
    return root.toString('hex');
}

export function generateReserveProof(userId: number): ReserveProof | null {
    const sortedUsers = getSortedUsers();
    const userIndex = sortedUsers.findIndex(user => user.id === userId);
    if (userIndex === -1) return null;

    const user = sortedUsers[userIndex];
    const userData = sortedUsers.map(serializeUser);

    const proofNodes = computeMerkleProof(
        userData,
        userIndex,
        'ProofOfReserve_Leaf',
        'ProofOfReserve_Branch'
    );

    return {
        balance: user.balance,
        proof: proofNodes.map(node => [node.hash.toString('hex'), node.position]),
    };
}

