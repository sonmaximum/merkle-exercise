export interface User {
    id: number;
    balance: number;
}

export interface ReserveProof {
    balance: number; // User's balance
    proof: [string, number][]; // Array of Merkle proof nodes as tuples: hash string and position bit
}
