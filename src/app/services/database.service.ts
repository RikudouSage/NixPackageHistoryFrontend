import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private db: IDBDatabase | null = null;

  public async getItem(key: string): Promise<string | null> {
    const db = await this.open();
    return new Promise<string | null>(resolve => {
      const transaction = db.transaction('cache', 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);
      request.onsuccess = () => {
        if (request.result === undefined) {
          resolve(null);
          return;
        }
        resolve(request.result.value);
      };
    });
  }

  public async setItem(key: string, value: string): Promise<void> {
    const db = await this.open();
    return new Promise(resolve => {
      const transaction = db.transaction('cache', 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put({
        key: key,
        value: value,
      });
      request.onsuccess = () => resolve();
    });
  }

  private async open(): Promise<IDBDatabase> {
    if (this.db === null) {
      const database = new Promise<IDBDatabase>(resolve => {
        const request = window.indexedDB.open('nix_os_search', 1);
        request.onupgradeneeded = event => {
          const db = request.result;
          for (let version = event.oldVersion; version <= (event.newVersion ?? 0); ++version) {
            switch (version) {
              case 0:
                db.createObjectStore('cache', {
                  keyPath: 'key',
                  autoIncrement: false,
                });
                break;
            }
          }
        };
        request.onsuccess = () => {
          resolve(request.result);
        };
      });
      this.db = await database;
    }

    return this.db;
  }
}
