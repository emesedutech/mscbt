/**
 * Emes CBT - Offline Database Manager (IndexedDB)
 */

const DB_NAME = 'emes_cbt_student_db';
const DB_VERSION = 2; // Incremented version

export class CBTDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Simpan soal (cache)
        if (!db.objectStoreNames.contains('questions')) {
          db.createObjectStore('questions', { keyPath: 'id' });
        }
        
        // Simpan jawaban siswa
        if (!db.objectStoreNames.contains('answers')) {
          db.createObjectStore('answers', { keyPath: 'questionId' });
        }

        // Simpan metadata jadwal/sesi untuk offline listing
        if (!db.objectStoreNames.contains('schedules')) {
          db.createObjectStore('schedules', { keyPath: 'id' });
        }

        // Simpan state session aktif
        if (!db.objectStoreNames.contains('session')) {
          db.createObjectStore('session', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Mengubah perform menjadi PUBLIC agar bisa diakses oleh komponen eksternal
   */
  public async perform(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<any> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = action(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Schedules (Offline Dashboard Data)
  async saveSchedules(schedules: any[]): Promise<void> {
    const transaction = this.db!.transaction('schedules', 'readwrite');
    const store = transaction.objectStore('schedules');
    store.clear();
    schedules.forEach(s => store.put(s));
    return new Promise((resolve) => transaction.oncomplete = () => resolve());
  }

  async getSchedules(): Promise<any[]> {
    return this.perform('schedules', 'readonly', store => store.getAll());
  }

  // Questions
  async saveQuestions(questions: any[]): Promise<void> {
    const transaction = this.db!.transaction('questions', 'readwrite');
    const store = transaction.objectStore('questions');
    // Important: We filter and keep questions for multiple banks
    questions.forEach(q => store.put(q));
    return new Promise((resolve) => transaction.oncomplete = () => resolve());
  }

  async getQuestionsByBankId(bankId: string): Promise<any[]> {
    const all = await this.perform('questions', 'readonly', store => store.getAll());
    return all.filter((q: any) => q.bank_id === bankId);
  }

  async clearExamData(): Promise<void> {
    const transaction = this.db!.transaction(['questions', 'answers', 'session', 'schedules'], 'readwrite');
    transaction.objectStore('questions').clear();
    transaction.objectStore('answers').clear();
    transaction.objectStore('session').clear();
    transaction.objectStore('schedules').clear();
    return new Promise((resolve) => transaction.oncomplete = () => resolve());
  }

  // Answers
  async saveAnswer(answer: any): Promise<void> {
    return this.perform('answers', 'readwrite', store => store.put({
      ...answer,
      updatedAt: new Date().toISOString()
    }));
  }

  async getAnswers(): Promise<any[]> {
    return this.perform('answers', 'readonly', store => store.getAll());
  }
}

export const cbtDb = new CBTDatabase();