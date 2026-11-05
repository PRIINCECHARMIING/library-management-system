export const ROLES = Object.freeze({
  ADMIN: 'admin',
  LIBRARIAN: 'librarian',
  MEMBER: 'member'
});

export const BORROW_STATUS = Object.freeze({
  ACTIVE: 'active',
  RETURNED: 'returned',
  OVERDUE: 'overdue'
});

export const API_KEY_STATUS = Object.freeze({
  ACTIVE: 'active',
  REVOKED: 'revoked'
});

export const BOOK_STATUS = Object.freeze({
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable'
});

export const LIBRARY_RULES = Object.freeze({
  DEFAULT_LOAN_DAYS: 14,
  MAX_ACTIVE_LOANS_PER_MEMBER: 5,
  DAILY_FINE_RATE: 0.50 // USD per day overdue
});
