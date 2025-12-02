// Farm Management System - Main JavaScript

// Global Data Storage (Replace with actual backend)
let farmData = {
    expenses: [],
    feedConsumption: [],
    attendance: [],
    employees: [],
    eggRecords: [],
    medicine: [],
    mortality: [],
    feedOrders: []
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    // Load saved data from localStorage
    loadData();
    
    // Set current date in date fields
    setCurrentDate();
    
    // Initialize event listeners
    initEventListeners();
});

// Load Data from localStorage
function loadData() {
    const savedData = localStorage.getItem('farmData');
    if (savedData) {
        farmData = JSON.parse(savedData);
        console.log('Data loaded from localStorage');
    }
}

// Save Data to localStorage
function saveData() {
    localStorage.setItem('farmData', JSON.stringify(farmData));
    console.log('Data saved to localStorage');
}

// Set current date in date inputs
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

// Initialize Event Listeners
function initEventListeners() {
    // Form submission handlers
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
    
    // Delete buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this record?')) {
                deleteRecord(e.target.dataset.type, e.target.dataset.id);
            }
        }
    });
}

// Handle Form Submissions
function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Generate ID
    data.id = Date.now();
    data.createdAt = new Date().toISOString();
    
    // Determine data type from form ID
    let dataType;
    if (form.id.includes('expense')) dataType = 'expenses';
    else if (form.id.includes('feed')) dataType = 'feedConsumption';
    else if (form.id.includes('attendance')) dataType = 'attendance';
    else if (form.id.includes('employee')) dataType = 'employees';
    else if (form.id.includes('egg')) dataType = 'eggRecords';
    else if (form.id.includes('medicine')) dataType = 'medicine';
    else if (form.id.includes('mortality')) dataType = 'mortality';
    else if (form.id.includes('feedOrder')) dataType = 'feedOrders';
    
    if (dataType) {
        farmData[dataType].push(data);
        saveData();
        alert('Record saved successfully!');
        form.reset();
        setCurrentDate();
        
        // Refresh table if exists
        refreshTable(dataType);
    }
}

// Delete Record
function deleteRecord(type, id) {
    farmData[type] = farmData[type].filter(item => item.id != id);
    saveData();
    refreshTable(type);
}

// Refresh Table Display
function refreshTable(dataType) {
    const table = document.querySelector(`table[data-type="${dataType}"]`);
    if (table) {
        // Implement table refresh logic based on your HTML structure
        console.log(`Refreshing ${dataType} table`);
    }
}

// Export Data to CSV
function exportToCSV(dataType, filename) {
    const data = farmData[dataType];
    if (!data.length) {
        alert('No data to export');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

// Generate Reports
function generateReport(type, startDate, endDate) {
    const filteredData = farmData[type].filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
    });
    
    // Calculate summary
    const summary = {
        total: filteredData.length,
        amount: filteredData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    };
    
    return { data: filteredData, summary };
}

// Utility Functions
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

// Dashboard Calculations
function getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    
    return {
        todaysExpenses: farmData.expenses
            .filter(e => e.date === today)
            .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
        
        todaysEggs: farmData.eggRecords
            .filter(e => e.date === today)
            .reduce((sum, e) => sum + (parseInt(e.quantity) || 0), 0),
        
        todaysMortality: farmData.mortality
            .filter(m => m.date === today)
            .reduce((sum, m) => sum + (parseInt(m.quantity) || 0), 0),
        
        staffPresent: farmData.attendance
            .filter(a => a.date === today && a.status === 'present')
            .length
    };
}

// Print Function
function printReport(elementId) {
    const printContent = document.getElementById(elementId).innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    location.reload();
}