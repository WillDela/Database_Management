const API_BASE = "http://127.0.0.1:5000";

// TAB SWITCHING
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');

        if (tab.dataset.tab === 'users') loadUsers();
        if (tab.dataset.tab === 'analytics') loadStats();
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

// BUTTON LOADING STATE
function setButtonLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
        btn.dataset.originalText = btn.textContent;
        btn.textContent = 'Loading...';
        btn.disabled = true;
    } else {
        btn.textContent = btn.dataset.originalText || btn.textContent;
        btn.disabled = false;
    }
}

// ACTIVE QUERY BUTTON HIGHLIGHT
function setActiveButton(btn) {
    if (!btn) return;
    const group = btn.closest('.btn-group');
    if (group) {
        group.querySelectorAll('button').forEach(b => b.classList.remove('btn-active'));
    }
    btn.classList.add('btn-active');
}

// INPUT VALIDATION
function markError(id) {
    document.getElementById(id).classList.add('input-error');
}
function clearErrors(...ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('input-error');
    });
}

// FORMAT CELL
function formatCell(value) {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number' && !Number.isInteger(value)) return value.toFixed(2);
    return value;
}

// INTENSITY BADGE
function intensityBadge(level) {
    const badge = document.createElement('span');
    badge.textContent = level || 'N/A';
    badge.className = `badge badge-${(level || '').toLowerCase()}`;
    return badge;
}

// RENDER TABLE — optional formatters: { colIndex: (value) => string | HTMLElement }
function renderTable(containerId, headers, rows, formatters = {}) {
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
        cells.forEach((cell, i) => {
            const td = document.createElement('td');
            if (formatters[i]) {
                const result = formatters[i](cell);
                if (result instanceof HTMLElement) {
                    td.appendChild(result);
                } else {
                    td.textContent = result;
                }
            } else {
                td.textContent = formatCell(cell);
            }
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

// STATS STRIP — loads automatically when Analytics tab opens
async function loadStats() {
    try {
        const [users, workouts, avgData] = await Promise.all([
            fetchJson(`${API_BASE}/users`),
            fetchJson(`${API_BASE}/workouts`),
            fetchJson(`${API_BASE}/avg-calories`)
        ]);
        document.getElementById('stat-users').textContent = users.length;
        document.getElementById('stat-workouts').textContent = workouts.length;
        const avg = avgData[0]?.[0];
        document.getElementById('stat-avg-cal').textContent = avg != null ? Number(avg).toFixed(1) : 'N/A';
    } catch (_) {
        // stats are non-critical, fail silently
    }
}

// WORKOUTS
async function loadWorkouts(btn) {
    setButtonLoading(btn, true);
    setActiveButton(btn);
    try {
        const data = await fetchJson(`${API_BASE}/workouts`);
        renderTable('workoutsTable', ['Name', 'Date', 'Type'], data);
    } catch (error) {
        showToast('Failed to load workouts.', true);
    } finally {
        setButtonLoading(btn, false);
    }
}

async function loadFilteredWorkouts(btn) {
    setButtonLoading(btn, true);
    setActiveButton(btn);
    try {
        const data = await fetchJson(`${API_BASE}/workouts/filter?minCalories=200&minDuration=30`);
        renderTable('workoutsTable', ['ID', 'Date', 'Duration (min)', 'Type', 'Calories', 'User ID'], data);
    } catch (error) {
        showToast('Failed to load filtered workouts.', true);
    } finally {
        setButtonLoading(btn, false);
    }
}

async function loadWorkoutExercises(btn) {
    setButtonLoading(btn, true);
    setActiveButton(btn);
    try {
        const data = await fetchJson(`${API_BASE}/analytics/workout-exercises`);
        renderTable('workoutsTable', ['Workout ID', 'Type', 'Exercise', 'Sets', 'Reps', 'Weight (lbs)'], data);
    } catch (error) {
        showToast('Failed to load workout exercises.', true);
    } finally {
        setButtonLoading(btn, false);
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

    clearErrors('name', 'email', 'age');

    let hasError = false;
    if (!name)  { markError('name');  hasError = true; }
    if (!email) { markError('email'); hasError = true; }
    if (!age)   { markError('age');   hasError = true; }
    if (hasError) {
        showToast('Please fill in the required fields.', true);
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
    clearErrors('deleteUserId');
    if (!userId) {
        markError('deleteUserId');
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
async function loadSummary(btn) {
    setButtonLoading(btn, true);
    setActiveButton(btn);
    try {
        const data = await fetchJson(`${API_BASE}/summary`);
        renderTable('analyticsTable', ['User ID', 'Total Calories'], data);
    } catch (error) {
        showToast('Failed to load calories summary.', true);
    } finally {
        setButtonLoading(btn, false);
    }
}

async function loadAboveAverage(btn) {
    setButtonLoading(btn, true);
    setActiveButton(btn);
    try {
        const data = await fetchJson(`${API_BASE}/analytics/above-average`);
        renderTable('analyticsTable', ['Name'], data);
    } catch (error) {
        showToast('Failed to load above-average users.', true);
    } finally {
        setButtonLoading(btn, false);
    }
}

async function loadIntensity(btn) {
    setButtonLoading(btn, true);
    setActiveButton(btn);
    try {
        const data = await fetchJson(`${API_BASE}/analytics/intensity`);
        renderTable('analyticsTable', ['Workout ID', 'Intensity'], data, {
            1: (val) => intensityBadge(val)
        });
    } catch (error) {
        showToast('Failed to load intensity data.', true);
    } finally {
        setButtonLoading(btn, false);
    }
}

async function loadViewSummary(btn) {
    setButtonLoading(btn, true);
    setActiveButton(btn);
    try {
        const data = await fetchJson(`${API_BASE}/analytics/view-summary`);
        renderTable('analyticsTable', ['User ID', 'Total Workouts', 'Total Calories'], data);
    } catch (error) {
        showToast('Failed to load view summary.', true);
    } finally {
        setButtonLoading(btn, false);
    }
}

async function loadMaxCalories(btn) {
    setButtonLoading(btn, true);
    setActiveButton(btn);
    try {
        const data = await fetchJson(`${API_BASE}/analytics/max-calories`);
        renderTable('analyticsTable', ['User ID', 'Max Calories'], data);
    } catch (error) {
        showToast('Failed to load max calories.', true);
    } finally {
        setButtonLoading(btn, false);
    }
}

async function loadAvgCalories(btn) {
    setButtonLoading(btn, true);
    setActiveButton(btn);
    try {
        const data = await fetchJson(`${API_BASE}/avg-calories`);
        renderTable('analyticsTable', ['Average Calories Burned'], data);
    } catch (error) {
        showToast('Failed to load average calories.', true);
    } finally {
        setButtonLoading(btn, false);
    }
}

// MANAGE
async function updateWorkout() {
    const workoutId = document.getElementById('updateWorkoutId').value.trim();
    const duration  = document.getElementById('updateDuration').value.trim();
    const calories  = document.getElementById('updateCalories').value.trim();

    clearErrors('updateWorkoutId', 'updateDuration', 'updateCalories');

    let hasError = false;
    if (!workoutId) { markError('updateWorkoutId'); hasError = true; }
    if (!duration)  { markError('updateDuration');  hasError = true; }
    if (!calories)  { markError('updateCalories');  hasError = true; }
    if (hasError) {
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

// INIT — auto-load workouts on page open
loadWorkouts();
