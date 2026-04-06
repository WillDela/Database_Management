const API_BASE = "http://127.0.0.1:5000";

// TAB SWITCHING
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
});

// TOAST
let toastTimer = null;
function showToast(text, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = text;
    toast.className = `toast ${isError ? 'error' : 'success'} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// FORMAT CELL — rounds floats, replaces null
function formatCell(value) {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number' && !Number.isInteger(value)) return value.toFixed(2);
    return value;
}

// RENDER TABLE
function renderTable(containerId, headers, rows) {
    const container = document.getElementById(containerId);

    if (!rows || rows.length === 0) {
        container.innerHTML = '<p class="empty">No records found.</p>';
        return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';

    const table = document.createElement('table');

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach(row => {
        const tr = document.createElement('tr');
        const cells = Array.isArray(row) ? row : [row];
        cells.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = formatCell(cell);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);

    const count = document.createElement('p');
    count.className = 'row-count';
    count.textContent = `${rows.length} record${rows.length !== 1 ? 's' : ''}`;

    container.innerHTML = '';
    container.appendChild(wrap);
    container.appendChild(count);
}

// FETCH HELPER
async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    let data;
    try {
        data = await response.json();
    } catch (_) {
        data = { message: 'Invalid JSON response from server.' };
    }
    if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
}

// WORKOUTS
async function loadWorkouts() {
    try {
        const data = await fetchJson(`${API_BASE}/workouts`);
        renderTable('workoutsTable', ['Name', 'Date', 'Type'], data);
    } catch (error) {
        showToast('Failed to load workouts.', true);
    }
}

async function loadFilteredWorkouts() {
    try {
        const data = await fetchJson(`${API_BASE}/workouts/filter?minCalories=200&minDuration=30`);
        renderTable('workoutsTable', ['ID', 'Date', 'Duration (min)', 'Type', 'Calories', 'User ID'], data);
    } catch (error) {
        showToast('Failed to load filtered workouts.', true);
    }
}

async function loadWorkoutExercises() {
    try {
        const data = await fetchJson(`${API_BASE}/analytics/workout-exercises`);
        renderTable('workoutsTable', ['Workout ID', 'Type', 'Exercise', 'Sets', 'Reps', 'Weight (lbs)'], data);
    } catch (error) {
        showToast('Failed to load workout exercises.', true);
    }
}

// USERS
async function loadUsers() {
    try {
        const data = await fetchJson(`${API_BASE}/users`);
        renderTable('usersTable', ['ID', 'Name', 'Email', 'Age', 'Goal'], data);
    } catch (error) {
        showToast('Failed to load users.', true);
    }
}

async function addUser() {
    const name  = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const age   = document.getElementById('age').value.trim();
    const goal  = document.getElementById('goal').value.trim();

    if (!name || !email || !age) {
        showToast('Name, email, and age are required.', true);
        return;
    }

    try {
        const data = await fetchJson(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, age, goal })
        });
        showToast(data.message);
        ['name', 'email', 'age', 'goal'].forEach(id => document.getElementById(id).value = '');
        loadUsers();
    } catch (error) {
        showToast(error.message, true);
    }
}

async function deleteUser() {
    const userId = document.getElementById('deleteUserId').value.trim();
    if (!userId) {
        showToast('Provide a user ID to delete.', true);
        return;
    }

    try {
        const data = await fetchJson(`${API_BASE}/users/${userId}`, { method: 'DELETE' });
        showToast(data.message);
        document.getElementById('deleteUserId').value = '';
        loadUsers();
    } catch (error) {
        showToast(error.message, true);
    }
}

// ANALYTICS
async function loadSummary() {
    try {
        const data = await fetchJson(`${API_BASE}/summary`);
        renderTable('analyticsTable', ['User ID', 'Total Calories'], data);
    } catch (error) {
        showToast('Failed to load calories summary.', true);
    }
}

async function loadAboveAverage() {
    try {
        const data = await fetchJson(`${API_BASE}/analytics/above-average`);
        renderTable('analyticsTable', ['Name'], data);
    } catch (error) {
        showToast('Failed to load above-average users.', true);
    }
}

async function loadIntensity() {
    try {
        const data = await fetchJson(`${API_BASE}/analytics/intensity`);
        renderTable('analyticsTable', ['Workout ID', 'Intensity'], data);
    } catch (error) {
        showToast('Failed to load intensity data.', true);
    }
}

async function loadViewSummary() {
    try {
        const data = await fetchJson(`${API_BASE}/analytics/view-summary`);
        renderTable('analyticsTable', ['User ID', 'Total Workouts', 'Total Calories'], data);
    } catch (error) {
        showToast('Failed to load view summary.', true);
    }
}

async function loadMaxCalories() {
    try {
        const data = await fetchJson(`${API_BASE}/analytics/max-calories`);
        renderTable('analyticsTable', ['User ID', 'Max Calories'], data);
    } catch (error) {
        showToast('Failed to load max calories.', true);
    }
}

async function loadAvgCalories() {
    try {
        const data = await fetchJson(`${API_BASE}/avg-calories`);
        renderTable('analyticsTable', ['Average Calories Burned'], data);
    } catch (error) {
        showToast('Failed to load average calories.', true);
    }
}

// MANAGE
async function updateWorkout() {
    const workoutId = document.getElementById('updateWorkoutId').value.trim();
    const duration  = document.getElementById('updateDuration').value.trim();
    const calories  = document.getElementById('updateCalories').value.trim();

    if (!workoutId || !duration || !calories) {
        showToast('All three fields are required.', true);
        return;
    }

    try {
        const data = await fetchJson(`${API_BASE}/workouts/${workoutId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duration, calories })
        });
        showToast(data.message);
        ['updateWorkoutId', 'updateDuration', 'updateCalories'].forEach(id => {
            document.getElementById(id).value = '';
        });
    } catch (error) {
        showToast(error.message, true);
    }
}
