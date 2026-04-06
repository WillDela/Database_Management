const API_BASE = "http://127.0.0.1:5000";

function setMessage(text, isError = false) {
    const message = document.getElementById("message");
    message.textContent = text;
    message.style.color = isError ? "red" : "green";
}

function renderList(listId, rows, formatter) {
    const list = document.getElementById(listId);
    list.innerHTML = "";

    if (!rows || rows.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No records found.";
        list.appendChild(li);
        return;
    }

    rows.forEach((item, index) => {
        const li = document.createElement("li");
        li.style.animationDelay = `${index * 0.05}s`;
        li.textContent = formatter(item);
        list.appendChild(li);
    });
}

function setListLoading(listId) {
    renderList(listId, [["Loading..."]], (row) => row[0]);
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);

    let data;
    try {
        data = await response.json();
    } catch (_) {
        data = { message: "Invalid JSON response from server." };
    }

    if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
}

async function loadWorkouts() {
    setListLoading("workoutsList");
    try {
        const data = await fetchJson(`${API_BASE}/workouts`);
        renderList("workoutsList", data, (item) => `${item[0]} - ${item[1]} - ${item[2] || "N/A"}`);
    } catch (error) {
        console.error("loadWorkouts failed:", error);
        renderList("workoutsList", [], (item) => item);
        setMessage("Failed to load workouts.", true);
    }
}

async function loadSummary() {
    setListLoading("workoutsList");
    try {
        const data = await fetchJson(`${API_BASE}/summary`);
        renderList("workoutsList", data, (item) => `User ${item[0]} total calories: ${item[1]}`);
    } catch (error) {
        console.error("loadSummary failed:", error);
        renderList("workoutsList", [], (item) => item);
        setMessage("Failed to load summary.", true);
    }
}

async function loadAboveAverage() {
    setListLoading("workoutsList");
    try {
        const data = await fetchJson(`${API_BASE}/analytics/above-average`);
        renderList("workoutsList", data, (item) => `Above-average user: ${item[0]}`);
    } catch (error) {
        console.error("loadAboveAverage failed:", error);
        renderList("workoutsList", [], (item) => item);
        setMessage("Failed to load above-average users.", true);
    }
}

async function loadIntensity() {
    setListLoading("workoutsList");
    try {
        const data = await fetchJson(`${API_BASE}/analytics/intensity`);
        renderList("workoutsList", data, (item) => `Workout ${item[0]} intensity: ${item[1]}`);
    } catch (error) {
        console.error("loadIntensity failed:", error);
        renderList("workoutsList", [], (item) => item);
        setMessage("Failed to load intensity data.", true);
    }
}

async function loadViewSummary() {
    setListLoading("workoutsList");
    try {
        const data = await fetchJson(`${API_BASE}/analytics/view-summary`);
        renderList("workoutsList", data, (item) => `User ${item[0]} | workouts: ${item[1]} | calories: ${item[2]}`);
    } catch (error) {
        console.error("loadViewSummary failed:", error);
        renderList("workoutsList", [], (item) => item);
        setMessage("Failed to load view summary.", true);
    }
}

async function loadMaxCalories() {
    setListLoading("workoutsList");
    try {
        const data = await fetchJson(`${API_BASE}/analytics/max-calories`);
        renderList("workoutsList", data, (item) => `User ${item[0]} max calories: ${item[1]}`);
    } catch (error) {
        console.error("loadMaxCalories failed:", error);
        renderList("workoutsList", [], (item) => item);
        setMessage("Failed to load max calories.", true);
    }
}

async function loadAvgCalories() {
    setListLoading("workoutsList");
    try {
        const data = await fetchJson(`${API_BASE}/avg-calories`);
        renderList("workoutsList", data, (item) => `Average calories burned: ${item[0].toFixed(2)}`);
    } catch (error) {
        console.error("loadAvgCalories failed:", error);
        renderList("workoutsList", [], (item) => item);
        setMessage("Failed to load average calories.", true);
    }
}

async function loadWorkoutExercises() {
    setListLoading("workoutsList");
    try {
        const data = await fetchJson(`${API_BASE}/analytics/workout-exercises`);
        renderList("workoutsList", data, (item) =>
            `Workout ${item[0]} (${item[1] || "N/A"}) - ${item[2]}: ${item[3]} sets x ${item[4]} reps @ ${item[5]} lbs`
        );
    } catch (error) {
        console.error("loadWorkoutExercises failed:", error);
        renderList("workoutsList", [], (item) => item);
        setMessage("Failed to load workout exercises.", true);
    }
}

async function loadFilteredWorkouts() {
    setListLoading("workoutsList");
    try {
        const data = await fetchJson(`${API_BASE}/workouts/filter?minCalories=200&minDuration=30`);
        renderList("workoutsList", data, (item) => `Workout ${item[0]} - ${item[3] || "N/A"} - ${item[4]} cal - ${item[2]} min`);
    } catch (error) {
        console.error("loadFilteredWorkouts failed:", error);
        renderList("workoutsList", [], (item) => item);
        setMessage("Failed to load filtered workouts.", true);
    }
}

async function loadUsers() {
    setListLoading("usersList");
    try {
        const data = await fetchJson(`${API_BASE}/users`);
        renderList("usersList", data, (user) => `${user[0]}: ${user[1]} - ${user[2]} (${user[3]} yrs, goal: ${user[4] || "N/A"})`);
    } catch (error) {
        console.error("loadUsers failed:", error);
        renderList("usersList", [], (item) => item);
        setMessage("Failed to load users.", true);
    }
}

async function addUser() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const age = document.getElementById("age").value.trim();
    const goal = document.getElementById("goal").value.trim();

    if (!name || !email || !age) {
        setMessage("Please fill name, email, and age.", true);
        return;
    }

    try {
        const data = await fetchJson(`${API_BASE}/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, age, goal })
        });
        setMessage(data.message);
        loadUsers();
    } catch (error) {
        console.error("addUser failed:", error);
        setMessage(error.message, true);
    }
}

async function updateWorkout() {
    const workoutId = document.getElementById("updateWorkoutId").value.trim();
    const duration = document.getElementById("updateDuration").value.trim();
    const calories = document.getElementById("updateCalories").value.trim();

    if (!workoutId || !duration || !calories) {
        setMessage("Provide workout ID, duration, and calories.", true);
        return;
    }

    try {
        const data = await fetchJson(`${API_BASE}/workouts/${workoutId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ duration, calories })
        });
        setMessage(data.message);
        loadWorkouts();
    } catch (error) {
        console.error("updateWorkout failed:", error);
        setMessage(error.message, true);
    }
}

async function deleteUser() {
    const userId = document.getElementById("deleteUserId").value.trim();
    if (!userId) {
        setMessage("Provide user ID to delete.", true);
        return;
    }

    try {
        const data = await fetchJson(`${API_BASE}/users/${userId}`, {
            method: "DELETE"
        });
        setMessage(data.message);
        loadUsers();
    } catch (error) {
        console.error("deleteUser failed:", error);
        setMessage(error.message, true);
    }
}
