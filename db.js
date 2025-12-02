// Farm Management Database System
class FarmDatabase {
    constructor() {
        this.dbName = 'FarmManagementDB';
        this.version = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                
                // Create object stores for all modules
                const stores = [
                    'expenses', 'feedConsumption', 'attendance', 
                    'employees', 'eggRecords', 'medicine', 
                    'mortality', 'feedOrders', 'tasks', 'settings'
                ];

                stores.forEach(store => {
                    if (!this.db.objectStoreNames.contains(store)) {
                        const objectStore = this.db.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
                        
                        // Create indexes for each store based on usage
                        switch(store) {
                            case 'expenses':
                                objectStore.createIndex('date', 'date', { unique: false });
                                objectStore.createIndex('category', 'category', { unique: false });
                                break;
                            case 'attendance':
                                objectStore.createIndex('date', 'date', { unique: false });
                                objectStore.createIndex('employeeId', 'employeeId', { unique: false });
                                break;
                            case 'eggRecords':
                                objectStore.createIndex('date', 'date', { unique: false });
                                objectStore.createIndex('shed', 'shed', { unique: false });
                                break;
                        }
                    }
                });
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database initialized successfully');
                resolve(this.db);
            };
        });
    }

    // Generic CRUD operations
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add({ 
                ...data, 
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                createdAt: new Date().toISOString() 
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async update(storeName, id, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({ ...data, id });

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async query(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
}

// Initialize global database instance
const farmDB = new FarmDatabase();