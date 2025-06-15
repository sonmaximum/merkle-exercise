# Proof of Reserve API

A TypeScript implementation of a Proof of Reserve API using Merkle trees for cryptographic verification of user balances.  Developed by Max Juchheim.

## Overview

This API provides cryptographic proofs of user reserves using Merkle trees. It allows clients to:
- Get the current Merkle root of all user balances
- Generate cryptographic proofs for specific user balances
- Verify the integrity of the reserve data

## Features

- Merkle tree implementation for efficient cryptographic proofs using BIP340 Tagged Hashes
- RESTful API endpoints for root and proof generation
- TypeScript implementation with type safety
- Comprehensive test coverage
- Error handling and input validation
- Concurrent request handling

## API Endpoints

### Health Check
```
GET /health
```
Returns the API health status and uptime.

### Merkle Root
```
GET /merkle-root
```
Returns the current Merkle root of all user balances.

### Merkle Proof
```
GET /merkle-proof/:userId
```
Generates a cryptographic proof for a specific user's balance.

Parameters:
- `userId`: Positive integer ID of the user

Response:
```js
{
    "balance": number,
    "proof": Array<[string, 0|1]> // [hex-encoded string for each node, and node position bit
}
```
## Instructions

### Installation

1. Clone the repository, and navigate to root directory

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server with hot reloading:
```bash
npm run dev
```

### Build and run the project:
```bash
npm run build
npm start
```

## Testing

Run the test suite:
```bash
npm test
```

After running tests open `coverage/lcov-report/index.html` in your browser to view the full coverage report.

## Project Structure

```
src/
├── merkle/           # Merkle tree implementation
│   ├── calculator.ts # Merkle tree calculation logic
│   ├── hasher.ts     # Hash function utilities
│   └── index.ts      # Public exports
├── proof-of-reserve/ # Business logic
│   ├── service.ts    # Reserve proof generation
│   ├── types.ts      # Service data structures
│   └── index.ts      # Public exports
├── server.ts         # Express server setup
└── index.ts          # Entry point

test/
├── merkle.test.ts    # Merkle tree tests
├── reserve.test.ts   # Reserve service tests
└── server.test.ts    # API endpoint tests
```

## Technical Details

### Merkle Tree Implementation
- Uses tagged hashing for domain separation
- Supports arbitrary number of leaves
- Efficient proof generation
- Consistent root computation

### Security Features
- Input validation for user IDs
- Error handling for malformed requests
- Protection against concurrent request issues
- Proper HTTP status codes for different scenarios

### Performance Considerations
- Efficient hash computation
- Optimized tree traversal
- Concurrent request handling
- Memory-efficient data structures

## Error Handling

The API returns appropriate HTTP status codes:
- 200: Successful request
- 400: Invalid user ID
- 404: User not found
- 500: Server error

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Merkle tree implementation based on Bitcoin's tagged hash approach
- TypeScript for type safety
- Node.js - JavaScript runtime
- Express.js for the web server
- Jest for testing
- ts-node for TypeScript execution
- supertest for HTTP testing
- ts-jest for TypeScript testing support

### Dependencies
- Production: `express`
- Development `jest`, `supertest`, `typescript`

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3+-007ACC?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.x-000000?logo=express)](https://expressjs.com/)
[![Jest](https://img.shields.io/badge/Jest-29.7.x-C21325?logo=jest)](https://jestjs.io/)
[![ts-node](https://img.shields.io/badge/ts--node-10.9.x-3178C6?logo=typescript)](https://github.com/TypeStrong/ts-node)
[![supertest](https://img.shields.io/badge/supertest-7.1.x-000000?logo=supertest)](https://github.com/visionmedia/supertest)
[![ts-jest](https://img.shields.io/badge/ts--jest-29.3.x-99425B?logo=jest)](https://github.com/kulshekhar/ts-jest)

## Future Improvements

### User features
* Add proof validation/verification tools

### Performance and Scalability
* Replace in-memory storage with dedicated persistent database (possibly NoSQL)
* Cache daily computed Merkle roots (Redis)
* Batch process chunked Merkle tree calculations
* Chron schedule Merkle tree calculations after daily db updates

### Security
* JWT-based API authentication, potentially role-based control
* Rate limiting (e.g. 50 req/min/IP)

### Reliability and Operations
* Structured Logging
* Containerization (e.g. Docker)
* Load Balancing
* Implement CI/CD pipelines
* API documentation (OpenAPI/Swagger)
