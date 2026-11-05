import bcrypt from 'bcryptjs';
import { ROLES, API_KEY_STATUS } from '../config/constants.js';

// Pre-computed bcrypt hashes with 10 salt rounds for deterministic test startup
const HASH_ADMIN = bcrypt.hashSync('Admin@123', 10);
const HASH_LIBRARIAN = bcrypt.hashSync('Librarian@123', 10);
const HASH_MEMBER = bcrypt.hashSync('Member@123', 10);

export function getInitialSeedData() {
  const now = new Date().toISOString();

  const categories = [
    {
      id: 'cat-1',
      name: 'Computer Science',
      description: 'Software engineering, algorithms, system design, and architecture',
      createdAt: now
    },
    {
      id: 'cat-2',
      name: 'Fiction & Literature',
      description: 'Classic novels, modern fiction, and literary masterpieces',
      createdAt: now
    },
    {
      id: 'cat-3',
      name: 'Science & Mathematics',
      description: 'Physics, cosmology, biology, and applied mathematics',
      createdAt: now
    },
    {
      id: 'cat-4',
      name: 'History & Philosophy',
      description: 'World history, civilizations, ethics, and philosophical theories',
      createdAt: now
    }
  ];

  const books = [
    {
      id: 'book-1',
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      isbn: '978-0132350884',
      categoryId: 'cat-1',
      categoryName: 'Computer Science',
      publishedYear: 2008,
      totalCopies: 5,
      availableCopies: 5,
      location: 'Shelf CS-01',
      description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'book-2',
      title: 'The Pragmatic Programmer: Your Journey to Mastery',
      author: 'Andrew Hunt, David Thomas',
      isbn: '978-0201616224',
      categoryId: 'cat-1',
      categoryName: 'Computer Science',
      publishedYear: 1999,
      totalCopies: 3,
      availableCopies: 3,
      location: 'Shelf CS-02',
      description: 'Illustrates the best practices and major pitfalls of many different aspects of software development.',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'book-3',
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      isbn: '978-1449373320',
      categoryId: 'cat-1',
      categoryName: 'Computer Science',
      publishedYear: 2017,
      totalCopies: 4,
      availableCopies: 4,
      location: 'Shelf CS-03',
      description: 'The big ideas behind reliable, scalable, and maintainable systems.',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'book-4',
      title: '1984',
      author: 'George Orwell',
      isbn: '978-0451524935',
      categoryId: 'cat-2',
      categoryName: 'Fiction & Literature',
      publishedYear: 1949,
      totalCopies: 2,
      availableCopies: 2,
      location: 'Shelf FIC-05',
      description: 'A dystopian novel examining government surveillance, totalitarianism, and truth manipulation.',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'book-5',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0060935467',
      categoryId: 'cat-2',
      categoryName: 'Fiction & Literature',
      publishedYear: 1960,
      totalCopies: 3,
      availableCopies: 3,
      location: 'Shelf FIC-08',
      description: 'Compassionate and dramatic novel exploring racial injustice in the American South.',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'book-6',
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      isbn: '978-0553380163',
      categoryId: 'cat-3',
      categoryName: 'Science & Mathematics',
      publishedYear: 1988,
      totalCopies: 2,
      availableCopies: 2,
      location: 'Shelf SCI-02',
      description: 'A landmark exploration of cosmology, black holes, the Big Bang, and the nature of time.',
      createdAt: now,
      updatedAt: now
    }
  ];

  const users = [
    {
      id: 'user-admin-1',
      name: 'System Administrator',
      email: 'admin@library.com',
      passwordHash: HASH_ADMIN,
      role: ROLES.ADMIN,
      status: 'active',
      phone: '+1-555-0100',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'user-librarian-1',
      name: 'Sarah Connor',
      email: 'librarian@library.com',
      passwordHash: HASH_LIBRARIAN,
      role: ROLES.LIBRARIAN,
      status: 'active',
      phone: '+1-555-0101',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'user-member-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      passwordHash: HASH_MEMBER,
      role: ROLES.MEMBER,
      status: 'active',
      phone: '+1-555-0102',
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'user-member-2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      passwordHash: HASH_MEMBER,
      role: ROLES.MEMBER,
      status: 'active',
      phone: '+1-555-0103',
      createdAt: now,
      updatedAt: now
    }
  ];

  const apiKeys = [
    {
      id: 'key-1',
      key: 'lms_master_key_live_9948271635882',
      clientName: 'Admin System Console',
      status: API_KEY_STATUS.ACTIVE,
      tier: 'admin',
      createdBy: 'system',
      createdAt: now
    },
    {
      id: 'key-2',
      key: 'lms_partner_key_pub_8473920194857',
      clientName: 'Campus Mobile Client',
      status: API_KEY_STATUS.ACTIVE,
      tier: 'standard',
      createdBy: 'user-admin-1',
      createdAt: now
    },
    {
      id: 'key-3',
      key: 'lms_revoked_key_old_1122334455667',
      clientName: 'Deprecated External Webhook',
      status: API_KEY_STATUS.REVOKED,
      tier: 'standard',
      createdBy: 'user-admin-1',
      createdAt: now
    }
  ];

  return {
    categories,
    books,
    users,
    apiKeys,
    borrowings: []
  };
}
