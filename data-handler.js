// Google Sheets Integration
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
const API_KEY = 'YOUR_GOOGLE_API_KEY';
const SHEET_NAMES = {
    expenses: 'Expenses',
    feed: 'FeedConsumption',
    attendance: 'Attendance',
    employees: 'Employees',
    eggs: 'EggRecords',
    medicine: 'Medicine',
    mortality: 'Mortality',
    feedOrders: 'FeedOrders'
};

// Load data from Google Sheets
async function loadFromSheets(sheetName) {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values) {
            const headers = data.values[0];
            const rows = data.values.slice(1);
            return rows.map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header.toLowerCase()] = row[index] || '';
                });
                return obj;
            });
        }
        return [];
    } catch (error) {
        console.error('Error loading from Google Sheets:', error);
        return [];
    }
}

// Save data to Google Sheets
async function saveToSheets(sheetName, data) {
    // Convert object to array
    const values = data.map(obj => Object.values(obj));
    
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: values
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error saving to Google Sheets:', error);
        throw error;
    }
}

// Sync local data with Google Sheets
async function syncData() {
    const syncPromises = Object.entries(SHEET_NAMES).map(async ([key, sheetName]) => {
        const sheetData = await loadFromSheets(sheetName);
        farmData[key] = sheetData;
    });
    
    await Promise.all(syncPromises);
    saveData(); // Save to localStorage
    alert('Data synchronized successfully!');
}

// Initialize Google Sheets connection
function initGoogleSheets() {
    // Check if API key is set
    if (!API_KEY || API_KEY === 'YOUR_GOOGLE_API_KEY') {
        console.warn('Google Sheets API key not configured. Using local storage only.');
        return false;
    }
    
    // Load data on page load
    document.addEventListener('DOMContentLoaded', async () => {
        await syncData();
        console.log('Google Sheets data loaded');
    });
    
    return true;
}