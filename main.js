// Farm Management System - Main Application
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize database
    await farmDB.init();
    
    // Set current date in all date inputs
    setCurrentDate();
    
    // Load data for current page
    loadPageData();
    
    // Initialize event listeners
    initEventListeners();
    
    // Update dashboard stats
    updateDashboardStats();
});

// Set current date in date inputs
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]:not([data-no-default])');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

// Load data based on current page
async function loadPageData() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    switch(page) {
        case 'index.html':
            await loadDashboardData();
            break;
        case 'expenses.html':
            await loadExpenses();
            break;
        case 'feed-consumption.html':
            await loadFeedConsumption();
            break;
        case 'attendance.html':
            await loadAttendance();
            break;
        case 'employees.html':
            await loadEmployees();
            break;
        case 'egg-records.html':
            await loadEggRecords();
            break;
        case 'medicine.html':
            await loadMedicineRecords();
            break;
        case 'mortality.html':
            await loadMortalityRecords();
            break;
        case 'feed-orders.html':
            await loadFeedOrders();
            break;
        case 'tasks.html':
            await loadTasks();
            break;
    }
}

// Initialize all event listeners
function initEventListeners() {
    // Form submissions
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
    
    // Delete buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const btn = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
            handleDelete(btn);
        }
        
        // Edit buttons
        if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
            const btn = e.target.classList.contains('edit-btn') ? e.target : e.target.closest('.edit-btn');
            handleEdit(btn);
        }
        
        // Print buttons
        if (e.target.classList.contains('print-btn')) {
            printTable(e.target.dataset.table);
        }
        
        // Export buttons
        if (e.target.classList.contains('export-btn')) {
            exportToCSV(e.target.dataset.type);
        }
    });
    
    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Filter functionality
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', handleFilter);
    });
}

// Handle form submissions
async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Get store name from form ID
    const formId = form.id.toLowerCase();
    let storeName = '';
    
    if (formId.includes('expense')) storeName = 'expenses';
    else if (formId.includes('feed')) storeName = 'feedConsumption';
    else if (formId.includes('attendance')) storeName = 'attendance';
    else if (formId.includes('employee')) storeName = 'employees';
    else if (formId.includes('egg')) storeName = 'eggRecords';
    else if (formId.includes('medicine')) storeName = 'medicine';
    else if (formId.includes('mortality')) storeName = 'mortality';
    else if (formId.includes('feedorder')) storeName = 'feedOrders';
    else if (formId.includes('task')) storeName = 'tasks';
    
    if (!storeName) {
        alert('Could not determine data type. Please check form ID.');
        return;
    }
    
    try {
        // Convert numeric fields
        if (data.amount) data.amount = parseFloat(data.amount);
        if (data.quantity) data.quantity = parseFloat(data.quantity);
        if (data.price) data.price = parseFloat(data.price);
        
        // Add timestamp
        data.timestamp = new Date().toISOString();
        
        // Save to database
        await farmDB.add(storeName, data);
        
        // Show success message
        showNotification(`${formId.replace('-form', '').toUpperCase()} record added successfully!`, 'success');
        
        // Reset form
        form.reset();
        setCurrentDate();
        
        // Refresh table
        await loadPageData();
        
        // Update dashboard if on dashboard
        if (window.location.pathname.includes('index.html')) {
            await updateDashboardStats();
        }
        
    } catch (error) {
        console.error('Error saving data:', error);
        showNotification('Error saving data. Please try again.', 'error');
    }
}

// Handle delete operations
async function handleDelete(button) {
    const id = button.dataset.id;
    const type = button.dataset.type;
    
    if (!id || !type) {
        console.error('Delete button missing data-id or data-type');
        return;
    }
    
    if (confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
        try {
            await farmDB.delete(type, id);
            showNotification('Record deleted successfully!', 'success');
            await loadPageData();
        } catch (error) {
            console.error('Error deleting record:', error);
            showNotification('Error deleting record.', 'error');
        }
    }
}

// Handle edit operations
async function handleEdit(button) {
    const id = button.dataset.id;
    const type = button.dataset.type;
    
    // Load data for editing
    const allData = await farmDB.getAll(type);
    const item = allData.find(item => item.id === id);
    
    if (!item) {
        showNotification('Record not found.', 'error');
        return;
    }
    
    // Populate form (you'll need to implement based on your form structure)
    // This is a simplified version - you'll need to adjust for each form
    const form = document.getElementById(`${type}-form`);
    if (form) {
        Object.keys(item).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = item[key];
            }
        });
        
        // Change form to update mode
        form.dataset.editId = id;
        form.querySelector('button[type="submit"]').textContent = 'Update Record';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="close-notification">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Close button event
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.remove();
    });
}

// Update dashboard statistics
async function updateDashboardStats() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get today's expenses
        const allExpenses = await farmDB.getAll('expenses');
        const todaysExpenses = allExpenses
            .filter(exp => exp.date === today)
            .reduce((sum, exp) => sum + (exp.amount || 0), 0);
        
        // Get today's eggs
        const allEggs = await farmDB.getAll('eggRecords');
        const todaysEggs = allEggs
            .filter(egg => egg.date === today)
            .reduce((sum, egg) => sum + (egg.quantity || 0), 0);
        
        // Get today's mortality
        const allMortality = await farmDB.getAll('mortality');
        const todaysMortality = allMortality
            .filter(mort => mort.date === today)
            .reduce((sum, mort) => sum + (mort.quantity || 0), 0);
        
        // Get today's attendance
        const allAttendance = await farmDB.getAll('attendance');
        const todaysAttendance = allAttendance
            .filter(att => att.date === today && att.status === 'present')
            .length;
        
        // Get total employees
        const allEmployees = await farmDB.getAll('employees');
        const totalEmployees = allEmployees.length;
        
        // Update UI
        updateElementText('#total-expenses', formatCurrency(todaysExpenses));
        updateElementText('#total-eggs', todaysEggs.toLocaleString());
        updateElementText('#total-mortality', todaysMortality);
        updateElementText('#attendance-rate', `${todaysAttendance}/${totalEmployees}`);
        
        // Update charts
        updateDashboardCharts();
        
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

// Update element text safely
function updateElementText(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = text;
    }
}

// Format currency
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Update dashboard charts
async function updateDashboardCharts() {
    // This would integrate with your charting library
    // For now, we'll just log
    console.log('Updating dashboard charts...');
}

// Load and display expenses
async function loadExpenses() {
    try {
        const expenses = await farmDB.getAll('expenses');
        const tbody = document.querySelector('#expenses-table tbody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(expense.date)}</td>
                <td><span class="badge ${expense.category}">${expense.category}</span></td>
                <td>${expense.description || ''}</td>
                <td>${formatCurrency(expense.amount || 0)}</td>
                <td>${expense.paymentMethod || 'Cash'}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${expense.id}" data-type="expenses">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${expense.id}" data-type="expenses">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Update summary
        const total = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        updateElementText('#expenses-total', formatCurrency(total));
        
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

// Load and display feed consumption
async function loadFeedConsumption() {
    try {
        const feedData = await farmDB.getAll('feedConsumption');
        const tbody = document.querySelector('#feed-table tbody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        feedData.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(record.date)}</td>
                <td>${record.shed || 'All'}</td>
                <td>${record.feedType || 'Layer Feed'}</td>
                <td>${record.quantity || 0} kg</td>
                <td>${record.bags || 0} bags</td>
                <td>${record.notes || ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${record.id}" data-type="feedConsumption">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${record.id}" data-type="feedConsumption">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading feed consumption:', error);
    }
}

// Load and display attendance
async function loadAttendance() {
    try {
        const attendance = await farmDB.getAll('attendance');
        const employees = await farmDB.getAll('employees');
        
        const tbody = document.querySelector('#attendance-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        attendance.forEach(record => {
            const employee = employees.find(emp => emp.id === record.employeeId);
            const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(record.date)}</td>
                <td>${employeeName}</td>
                <td>${employee?.employeeId || 'N/A'}</td>
                <td><span class="badge ${record.status}">${record.status || 'Absent'}</span></td>
                <td>${record.checkIn || '--:--'}</td>
                <td>${record.checkOut || '--:--'}</td>
                <td>${record.notes || ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${record.id}" data-type="attendance">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${record.id}" data-type="attendance">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

// Load and display employees
async function loadEmployees() {
    try {
        const employees = await farmDB.getAll('employees');
        const tbody = document.querySelector('#employees-table tbody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        employees.forEach(employee => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.employeeId || 'N/A'}</td>
                <td>${employee.firstName || ''} ${employee.lastName || ''}</td>
                <td>${employee.position || 'Worker'}</td>
                <td>${employee.department || 'General'}</td>
                <td>${formatCurrency(employee.salary || 0)}</td>
                <td>${employee.phone || 'N/A'}</td>
                <td>${employee.status || 'Active'}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${employee.id}" data-type="employees">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${employee.id}" data-type="employees">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Load and display egg records
async function loadEggRecords() {
    try {
        const eggs = await farmDB.getAll('eggRecords');
        const tbody = document.querySelector('#eggs-table tbody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        eggs.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(record.date)}</td>
                <td>${record.shed || 'All'}</td>
                <td>${record.quantity || 0}</td>
                <td>${record.grade || 'A'}</td>
                <td>${record.defective || 0}</td>
                <td>${formatCurrency(record.price || 0)}</td>
                <td>${record.notes || ''}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${record.id}" data-type="eggRecords">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${record.id}" data-type="eggRecords">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Calculate total
        const total = eggs.reduce((sum, egg) => sum + (egg.quantity || 0), 0);
        updateElementText('#total-eggs-collected', total.toLocaleString());
        
    } catch (error) {
        console.error('Error loading egg records:', error);
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Export to CSV
async function exportToCSV(dataType) {
    try {
        const data = await farmDB.getAll(dataType);
        
        if (!data.length) {
            showNotification('No data to export', 'warning');
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                // Handle values with commas
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${dataType}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showNotification('Data exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showNotification('Error exporting data', 'error');
    }
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const table = e.target.closest('.table-container').querySelector('tbody');
    
    if (!table) return;
    
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Handle filter
function handleFilter(e) {
    const filterValue = e.target.value;
    const filterType = e.target.dataset.filter;
    const table = e.target.closest('.table-container').querySelector('tbody');
    
    if (!table || !filterValue) return;
    
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        if (filterValue === 'all') {
            row.style.display = '';
        } else {
            const cell = row.querySelector(`td:nth-child(${getColumnIndex(filterType)})`);
            const cellValue = cell ? cell.textContent.toLowerCase() : '';
            row.style.display = cellValue.includes(filterValue.toLowerCase()) ? '' : 'none';
        }
    });
}

// Get column index for filtering
function getColumnIndex(filterType) {
    const map = {
        'category': 2,
        'status': 4,
        'shed': 2,
        'grade': 4,
        'department': 4
    };
    
    return map[filterType] || 1;
}