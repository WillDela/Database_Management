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

// SWITCH TO WORKOUTS TAB — used by the Manage tab reference link
function switchToWorkouts() {
    document.querySelector('[data-tab="workouts"]').click();
}

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
    const group = btn.closest('.btn-group') || btn.closest('.filter-row');
    if (group) {
        group.querySelectorAll('button').forEach(b => b.classList.remove('btn-active'));
    }
    btn.classList.add('btn-active');
}

// INPUT VALIDATION
function markError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('input-error');
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

// STATS STRIP
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

// Item 5: reads live input values instead of hardcoded numbers
async function loadFilteredWorkouts(btn) {
    const minCalories = document.getElementById('filterCalories').value || 0;
    const minDuration = document.getElementById('filterDuration').value || 0;

    clearErrors('filterCalories', 'filterDuration');

    if (minCalories < 0) { markError('filterCalories'); showToast('Min calories cannot be negative.', true); return; }
    if (minDuration < 0) { markError('filterDuration'); showToast('Min duration cannot be negative.', true); return; }

    setButtonLoading(btn, true);
    setActiveButton(btn);
    try {
        const data = await fetchJson(
            `${API_BASE}/workouts/filter?minCalories=${minCalories}&minDuration=${minDuration}`
        );
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

// Item 2: confirmation before destructive delete
async function deleteUser() {
    const userId = document.getElementById('deleteUserId').value.trim();
    clearErrors('deleteUserId');

    if (!userId) {
        markError('deleteUserId');
        showToast('Provide a user ID to delete.', true);
        return;
    }

    if (!confirm(`Delete user ${userId}? This cannot be undone.`)) return;

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
        renderTable('analyticsTable', ['Name', 'Total Calories'], data);
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
        renderTable('analyticsTable', ['Name', 'Total Workouts', 'Total Calories'], data);
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
        renderTable('analyticsTable', ['Name', 'Max Calories'], data);
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

// MANAGE — Update Workout
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

// Item 6: Add Workout
async function addWorkout() {
    const workoutDate    = document.getElementById('workoutDate').value.trim();
    const workoutType    = document.getElementById('workoutType').value.trim();
    const workoutDuration = document.getElementById('workoutDuration').value.trim();
    const workoutCalories = document.getElementById('workoutCalories').value.trim();
    const userId         = document.getElementById('workoutUserId').value.trim();

    clearErrors('workoutDate', 'workoutDuration', 'workoutCalories', 'workoutUserId');

    let hasError = false;
    if (!workoutDate)     { markError('workoutDate');     hasError = true; }
    if (!workoutDuration) { markError('workoutDuration'); hasError = true; }
    if (!workoutCalories) { markError('workoutCalories'); hasError = true; }
    if (!userId)          { markError('workoutUserId');   hasError = true; }
    if (hasError) {
        showToast('Date, duration, calories, and user ID are required.', true);
        return;
    }

    try {
        const data = await fetchJson(`${API_BASE}/workouts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                workout_date: workoutDate,
                workout_type: workoutType || null,
                duration: Number(workoutDuration),
                calories: Number(workoutCalories),
                user_id: Number(userId)
            })
        });
        showToast(data.message);
        ['workoutDate', 'workoutType', 'workoutDuration', 'workoutCalories', 'workoutUserId'].forEach(id => {
            document.getElementById(id).value = '';
        });
    } catch (error) {
        showToast(error.message, true);
    }
}

// Item 4: Add Food Log
async function addFoodLog() {
    const foodName = document.getElementById('foodName').value.trim();
    const calories = document.getElementById('foodCalories').value.trim();
    const mealType = document.getElementById('mealType').value.trim();
    const logDate  = document.getElementById('logDate').value.trim();
    const userId   = document.getElementById('foodUserId').value.trim();

    clearErrors('foodName', 'foodCalories', 'logDate', 'foodUserId');

    let hasError = false;
    if (!foodName) { markError('foodName');    hasError = true; }
    if (!calories) { markError('foodCalories'); hasError = true; }
    if (!logDate)  { markError('logDate');      hasError = true; }
    if (!userId)   { markError('foodUserId');   hasError = true; }
    if (hasError) {
        showToast('Please fill in the required fields.', true);
        return;
    }

    try {
        const data = await fetchJson(`${API_BASE}/foodlog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                food_name: foodName,
                calories: Number(calories),
                meal_type: mealType || null,
                log_date: logDate,
                user_id: Number(userId)
            })
        });
        showToast(data.message);
        ['foodName', 'foodCalories', 'mealType', 'logDate', 'foodUserId'].forEach(id => {
            document.getElementById(id).value = '';
        });
    } catch (error) {
        showToast(error.message, true);
    }
}

// Item 4: Delete Food Log
async function deleteFoodLog() {
    const foodName = document.getElementById('deleteFoodName').value.trim();
    const userId   = document.getElementById('deleteFoodUserId').value.trim();

    clearErrors('deleteFoodName', 'deleteFoodUserId');

    let hasError = false;
    if (!foodName) { markError('deleteFoodName');   hasError = true; }
    if (!userId)   { markError('deleteFoodUserId'); hasError = true; }
    if (hasError) {
        showToast('Food name and user ID are required.', true);
        return;
    }

    if (!confirm(`Delete "${foodName}" from user ${userId}'s food log?`)) return;

    try {
        const data = await fetchJson(`${API_BASE}/foodlog`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ food_name: foodName, user_id: Number(userId) })
        });
        showToast(data.message);
        ['deleteFoodName', 'deleteFoodUserId'].forEach(id => {
            document.getElementById(id).value = '';
        });
    } catch (error) {
        showToast(error.message, true);
    }
}

// INIT — auto-load workouts on page open with active button highlighted
const allWorkoutsBtn = document.getElementById('btn-all-workouts');
loadWorkouts(allWorkoutsBtn);
