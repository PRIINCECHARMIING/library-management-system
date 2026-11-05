# Library Management System - Enterprise REST API

A production-ready **Library Management System REST API** built with Node.js, Express, and modern security best practices.

---

## 🌟 Core Requirements & Implementations

| Requirement | Implementation Detail | Location |
| :--- | :--- | :--- |
| **Authentication** | User registration, login, profile retrieval, password update | [`src/controllers/auth.controller.js`](server/src/controllers/auth.controller.js) |
| **Authorization** | Role-Based Access Control (`admin`, `librarian`, `member`) | [`src/middleware/rbac.js`](server/src/middleware/rbac.js) |
| **JWT Tokens** | Signed HS256 tokens with 24h expiry, bearer token validation | [`src/utils/jwt.js`](server/src/utils/jwt.js), [`src/middleware/jwtAuth.js`](server/src/middleware/jwtAuth.js) |
| **API Key Validation**| Client identification, status checks (`active`/`revoked`), key generation & revocation | [`src/middleware/apiKeyAuth.js`](server/src/middleware/apiKeyAuth.js), [`src/services/apiKey.service.js`](server/src/services/apiKey.service.js) |
| **Password Hashing** | Salted `bcryptjs` hashing with 10 salt rounds; plain text never persisted or returned | [`src/utils/password.js`](server/src/utils/password.js) |
| **REST API** | Full CRUD for Books, Categories, Borrowings, Users, and API Keys | [`src/routes/`](server/src/routes/) |
| **HTTPS/TLS Security**| Dual HTTP (`:8000`) & HTTPS (`:8443`) servers, TLSv1.2+ minimum, Helmet security headers, rate limiting | [`src/utils/tls.js`](server/src/utils/tls.js), [`src/middleware/security.js`](server/src/middleware/security.js) |
| **Input Validation** | Strict type-safe schema validation with field-by-field error reporting | [`src/middleware/validator.js`](server/src/middleware/validator.js), [`src/validators/`](server/src/validators/) |
| **Automated Testing**| 66 automated unit & integration tests covering 100% of core flows | [`server/tests/`](server/tests/) |

---

## 🚀 Quick Start

### 1. Install & Test
```bash
cd LibraryManagementSystem/server
npm install
npm test
```

### 2. Start the Server
```bash
npm start
```
The server will start both HTTP and HTTPS listeners:
- **HTTP Server**: `http://localhost:8000`
- **HTTPS Server**: `https://localhost:8443`
- **Interactive Documentation**: `http://localhost:8000/`
- **Health Check**: `http://localhost:8000/api/v1/health`

---

## 🔑 Pre-Seeded Test Credentials

### API Keys
| Type | Header (`x-api-key`) | Notes |
| :--- | :--- | :--- |
| **Master Key** | `lms_master_key_live_9948271635882` | Full administrative bypass & key management |
| **Partner Key** | `lms_partner_key_pub_8473920194857` | Standard client key |
| **Revoked Key** | `lms_revoked_key_old_1122334455667` | Used to verify 403 Revoked enforcement |

### User Accounts
| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@library.com` | `Admin@123` | Full system control, manage users, generate/revoke API keys |
| **Librarian** | `librarian@library.com` | `Librarian@123` | Create/edit/delete books & categories, issue/return books |
| **Member** | `john.doe@example.com` | `Member@123` | Browse catalog, borrow books, view own loan history |
| **Member** | `jane.smith@example.com` | `Member@123` | Secondary test member account |

---

## 🧪 Test Results Summary

```text
 ✓ tests/validation.test.js (4 tests)
 ✓ tests/books.test.js (10 tests)
 ✓ tests/categories.test.js (8 tests)
 ✓ tests/rbac.test.js (9 tests)
 ✓ tests/apiKey.test.js (9 tests)
 ✓ tests/borrowings.test.js (7 tests)
 ✓ tests/security.test.js (7 tests)
 ✓ tests/auth.test.js (12 tests)

Test Files  8 passed (8)
     Tests  66 passed (66)
```

---

## 📡 REST API Reference

All requests to `/api/v1/*` (except `/api/v1/health`) require the `x-api-key` header.
Protected endpoints additionally require `Authorization: Bearer <jwt-token>`.

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register a new member
- `POST /api/v1/auth/login` - Authenticate and obtain JWT token
- `GET /api/v1/auth/me` - Get current user profile (JWT required)
- `POST /api/v1/auth/change-password` - Update password (JWT required)

### Book Management Endpoints
- `GET /api/v1/books` - List, filter, search, and paginate books
- `GET /api/v1/books/stats` - Inventory statistics
- `GET /api/v1/books/:id` - Get book details
- `POST /api/v1/books` - Add new book (*Librarian/Admin*)
- `PUT /api/v1/books/:id` - Update book details (*Librarian/Admin*)
- `DELETE /api/v1/books/:id` - Delete book (*Librarian/Admin*)

### Borrowing & Loans Endpoints
- `POST /api/v1/borrowings/borrow` - Borrow a book (*Member/Librarian*)
- `POST /api/v1/borrowings/return` - Return a borrowed book (*Member/Librarian*)
- `GET /api/v1/borrowings/my` - Current user loan history (*Member*)
- `GET /api/v1/borrowings` - View all transactions (*Librarian/Admin*)

### Security & Key Management Endpoints
- `POST /api/v1/keys` - Create client API key (*Admin*)
- `GET /api/v1/keys` - List all API keys with masked secrets (*Admin*)
- `DELETE /api/v1/keys/:id` - Revoke an API key (*Admin*)
- `GET /api/v1/health` - Public health & security configuration status
