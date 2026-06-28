import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let serviceAccount;
try {
  serviceAccount = require('../config/serviceAccount.json');
} catch (e) {
  console.error('==============================================');
  console.error('FATAL: serviceAccount.json not found.');
  console.error('Steps to fix:');
  console.error('1. Go to Firebase Console');
  console.error('2. Project Settings → Service accounts');
  console.error('3. Click Generate new private key');
  console.error('4. Save as server/config/serviceAccount.json');
  console.error('5. Add it to .gitignore immediately');
  console.error('==============================================');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure db directory exists for simulation mode
const DB_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DB_DIR, 'db.json');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ issues: [], users: [], comments: [] }, null, 2));
}

// In-Memory/JSON File Mock Database Client for Simulation Mode
class MockDbEngine {
  constructor(filePath) {
    this.filePath = filePath;
  }
  read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return { issues: [], users: [], comments: [] };
    }
  }
  write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }
  readCollection(colName) {
    const data = this.read();
    return data[colName] || [];
  }
  readDoc(colName, id) {
    const list = this.readCollection(colName);
    return list.find(item => item.id === id) || null;
  }
  writeDoc(colName, id, docData) {
    const dbData = this.read();
    if (!dbData[colName]) dbData[colName] = [];
    const idx = dbData[colName].findIndex(item => item.id === id);
    const savedData = { ...docData, id };
    if (idx >= 0) {
      dbData[colName][idx] = savedData;
    } else {
      dbData[colName].push(savedData);
    }
    this.write(dbData);
  }
  deleteDoc(colName, id) {
    const dbData = this.read();
    if (!dbData[colName]) return;
    dbData[colName] = dbData[colName].filter(item => item.id !== id);
    this.write(dbData);
  }
}

const mockEngine = new MockDbEngine(DB_FILE);

class MockDocument {
  constructor(colName, id) {
    this.colName = colName;
    this.id = id;
  }
  async get() {
    const data = mockEngine.readDoc(this.colName, this.id);
    return {
      id: this.id,
      exists: !!data,
      data: () => data
    };
  }
  async set(data, options = {}) {
    const current = mockEngine.readDoc(this.colName, this.id) || {};
    const merged = options.merge ? { ...current, ...data } : { ...data, id: this.id };
    mockEngine.writeDoc(this.colName, this.id, merged);
    return { writeTime: new Date() };
  }
  async update(data) {
    const current = mockEngine.readDoc(this.colName, this.id);
    if (!current) throw new Error(`Document ${this.id} not found in ${this.colName}`);
    const updated = { ...current, ...data };
    mockEngine.writeDoc(this.colName, this.id, updated);
    return { writeTime: new Date() };
  }
  async delete() {
    mockEngine.deleteDoc(this.colName, this.id);
    return { writeTime: new Date() };
  }
}

class MockCollection {
  constructor(colName) {
    this.colName = colName;
    this.filters = [];
    this.order = null;
    this.limVal = null;
  }
  where(field, op, val) {
    this.filters.push({ field, op, val });
    return this;
  }
  orderBy(field, dir = 'asc') {
    this.order = { field, dir };
    return this;
  }
  limit(val) {
    this.limVal = val;
    return this;
  }
  doc(id) {
    return new MockDocument(this.colName, id);
  }
  async add(data) {
    const id = Math.random().toString(36).substring(2, 15);
    const docRef = new MockDocument(this.colName, id);
    await docRef.set({ ...data, id });
    return { id, get: () => docRef.get() };
  }
  async get() {
    let list = mockEngine.readCollection(this.colName);
    // Apply filters
    for (const f of this.filters) {
      list = list.filter(item => {
        const val = item[f.field];
        if (f.op === '==') return val === f.val;
        if (f.op === '>=') return val >= f.val;
        if (f.op === '<=') return val <= f.val;
        if (f.op === 'in') return Array.isArray(f.val) ? f.val.includes(val) : false;
        if (f.op === 'array-contains') return Array.isArray(val) ? val.includes(f.val) : false;
        return true;
      });
    }
    // Apply sorting
    if (this.order) {
      const { field, dir } = this.order;
      list.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === undefined || valB === undefined) return 0;
        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    // Apply limit
    if (this.limVal) {
      list = list.slice(0, this.limVal);
    }
    const docs = list.map(item => ({
      id: item.id,
      exists: true,
      data: () => item
    }));
    return {
      docs,
      empty: docs.length === 0,
      forEach: (cb) => docs.forEach(cb)
    };
  }
}

class MockFirestore {
  collection(colName) {
    return new MockCollection(colName);
  }
}

let db;
let isSimulationMode = false;

// Attempt real initialization or fall back to simulation
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
    });
  }
  db = admin.firestore();
  isSimulationMode = false;
  console.log('Firebase Firestore connected successfully.');
} catch (error) {
  console.error('Firebase connection failed:', error.message);
  console.error('Check your serviceAccount.json file.');
  process.exit(1);
}

export { db, isSimulationMode };
