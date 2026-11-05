# Library Management System - Enterprise REST API

A production-ready **Library Management System REST API** built with Node.js, Express, and modern security best practices.

---

## 🌟 Core Requirements & Implementations

| Requirement | Implementation Detail | Location |
| :--- | :--- | :--- |
| **Authentication** | User registration, login, profile retrieval, password update | [`LibraryManagementSystem/server/src/controllers/auth.controller.js`](LibraryManagementSystem/server/src/controllers/auth.controller.js) |
| **Authorization** | Role-Based Access Control (`admin`, `librarian`, `member`) | [`LibraryManagementSystem/server/src/middleware/rbac.js`](LibraryManagementSystem/server/src/middleware/rbac.js) |
| **JWT Tokens** | Signed HS256 tokens with 24h expiry, bearer token validation | [`LibraryManagementSystem/server/src/utils/jwt.js`](LibraryManagementSystem/server/src/utils/jwt.js), [`LibraryManagementSystem/server/src/middleware/jwtAuth.js`](LibraryManagementSystem/server/src/middleware/jwtAuth.js) |
| **API Key Validation**| Client identification, status checks (`active`/`revoked`), key generation & revocation | [`LibraryManagementSystem/server/src/middleware/apiKeyAuth.js`](LibraryManagementSystem/server/src/middleware/apiKeyAuth.js), [`LibraryManagementSystem/server/src/services/apiKey.service.js`](LibraryManagementSystem/server/src/services/apiKey.service.js) |
| **Password Hashing** | Salted `bcryptjs` hashing with 10 salt rounds; plain text never persisted or returned | [`LibraryManagementSystem/server/src/utils/password.js`](LibraryManagementSystem/server/src/utils/password.js) |
| **REST API** | Full CRUD for Books, Categories, Borrowings, Users, and API Keys | [`LibraryManagementSystem/server/src/routes/`](LibraryManagementSystem/server/src/routes/) |
| **HTTPS/TLS Security**| Dual HTTP (`:8000`) & HTTPS (`:8443`) servers, TLSv1.2+ minimum, Helmet security headers, rate limiting | [`LibraryManagementSystem/server/src/utils/tls.js`](LibraryManagementSystem/server/src/utils/tls.js), [`LibraryManagementSystem/server/src/middleware/security.js`](LibraryManagementSystem/server/src/middleware/security.js) |
| **Input Validation** | Strict type-safe schema validation with field-by-field error reporting | [`LibraryManagementSystem/server/src/middleware/validator.js`](LibraryManagementSystem/server/src/middleware/validator.js), [`LibraryManagementSystem/server/src/validators/`](LibraryManagementSystem/server/src/validators/) |
| **Automated Testing**| 66 automated unit & integration tests covering 100% of core flows | [`LibraryManagementSystem/server/tests/`](LibraryManagementSystem/server/tests/) |

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
