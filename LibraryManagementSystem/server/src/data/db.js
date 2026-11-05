import fs from 'fs';
import path from 'path';
import { env } from '../config/environment.js';
import { getInitialSeedData } from './seed.js';

class Database {
  constructor() {
    this.filePath = env.DATA_FILE_PATH;
    this.memoryStore = null;
    this.init();
  }

  init() {
    // If running in test mode or memory-only, initialize with seed
    if (process.env.NODE_ENV === 'test') {
      this.memoryStore = getInitialSeedData();
      return;
    }

    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.memoryStore = JSON.parse(raw);
      } else {
        this.memoryStore = getInitialSeedData();
        this.persist();
      }
    } catch {
      this.memoryStore = getInitialSeedData();
    }
  }

  persist() {
    if (process.env.NODE_ENV === 'test') return;
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.memoryStore, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to persist database file:', err.message);
    }
  }

  reset() {
    this.memoryStore = getInitialSeedData();
    this.persist();
    return this.memoryStore;
  }

  getCollection(name) {
    if (!this.memoryStore[name]) {
      this.memoryStore[name] = [];
    }
    return this.memoryStore[name];
  }

  find(collectionName, filterFn = null) {
    const list = this.getCollection(collectionName);
    if (!filterFn) return [...list];
    return list.filter(filterFn);
  }

  findOne(collectionName, filterFn) {
    const list = this.getCollection(collectionName);
    return list.find(filterFn) || null;
  }

  findById(collectionName, id) {
    const list = this.getCollection(collectionName);
    return list.find(item => item.id === id) || null;
  }

  insert(collectionName, item) {
    const list = this.getCollection(collectionName);
    const newItem = {
      id: item.id || `${collectionName.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...item,
      createdAt: item.createdAt || new Date().toISOString()
    };
    list.push(newItem);
    this.persist();
    return { ...newItem };
  }

  update(collectionName, id, updates) {
    const list = this.getCollection(collectionName);
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    list[index] = updated;
    this.persist();
    return { ...updated };
  }

  delete(collectionName, id) {
    const list = this.getCollection(collectionName);
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return false;

    list.splice(index, 1);
    this.persist();
    return true;
  }

  count(collectionName, filterFn = null) {
    return this.find(collectionName, filterFn).length;
  }
}

export const db = new Database();
