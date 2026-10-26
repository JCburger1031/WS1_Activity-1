
const form = document.getElementById("scheduleForm");
const scheduleList = document.getElementById("scheduleList");
const search = document.getElementById("search");
const emptyMessage = document.getElementById("emptyMessage");
const dateInput = document.getElementById("date");

let schedules = [];

try {
    schedules = JSON.parse(
        localStorage.getItem("barangaySchedules") || "[]"
    );

    if (!Array.isArray(schedules)) {
        schedules = [];
    }
} catch {
    schedules = [];
}

// Set today's date as the earliest selectable date.
function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

dateInput.min = getToday();

function saveSchedules() {
    localStorage.setItem(
        "barangaySchedules",
        JSON.stringify(schedules)
    );
}

function updateSummary() {
    const today = getToday();

    document.getElementById("totalSchedules").textContent =
        schedules.length;

    document.getElementById("upcomingSchedules").textContent =
        schedules.filter(s =>
            s.date >= today && s.status !== "Completed"
        ).length;

    document.getElementById("completedSchedules").textContent =
        schedules.filter(s => s.status === "Completed").length;
}

function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    return cell;
}

function renderSchedules() {
    scheduleList.replaceChildren();

    const keyword = search.value.trim().toLowerCase();

    const filtered = schedules
        .filter(s =>
            [s.activity, s.area, s.team, s.notes]
                .some(value =>
                    String(value || "").toLowerCase().includes(keyword)
                )
        )
        .sort((a, b) =>
            (a.date + a.time).localeCompare(b.date + b.time)
        );

    emptyMessage.hidden = filtered.length > 0;

    filtered.forEach(schedule => {
        const row = document.createElement("tr");

        row.append(
            createCell(schedule.activity),
            createCell(schedule.area),
            createCell(schedule.date),
            createCell(schedule.time),
            createCell(schedule.team)
        );

        // Status dropdown
        const statusCell = document.createElement("td");
        const statusSelect = document.createElement("select");

        ["Scheduled", "In Progress", "Completed"].forEach(status => {
            const option = document.createElement("option");
            option.value = status;
            option.textContent = status;
            statusSelect.appendChild(option);
        });

        statusSelect.value = schedule.status;

        statusSelect.addEventListener("change", () => {
            schedule.status = statusSelect.value;
            saveSchedules();
            renderSchedules();
        });

        const statusClass = {
            "Scheduled": "status-scheduled",
            "In Progress": "status-progress",
            "Completed": "status-completed"
        };

        statusSelect.className =
            `status ${statusClass[schedule.status]}`;

        statusCell.appendChild(statusSelect);
        row.appendChild(statusCell);

        // Action buttons
        const actionCell = document.createElement("td");

        const detailsButton = document.createElement("button");
        detailsButton.textContent = "Details";
        detailsButton.className = "action-button";

        detailsButton.addEventListener("click", () => {
            alert(
                "Activity: " + schedule.activity +
                "\nArea: " + schedule.area +
                "\nDate: " + schedule.date +
                "\nTime: " + schedule.time +
                "\nAssigned Team: " + schedule.team +
                "\nNotes: " + (schedule.notes || "None")
            );
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "action-button delete-button";

        deleteButton.addEventListener("click", () => {
            if (confirm("Delete this cleaning schedule?")) {
                schedules = schedules.filter(
                    s => s.id !== schedule.id
                );

                saveSchedules();
                renderSchedules();
            }
        });

        actionCell.append(detailsButton, deleteButton);
        row.appendChild(actionCell);

        scheduleList.appendChild(row);
    });

    updateSummary();
}

form.addEventListener("submit", event => {
    event.preventDefault();

    const activity = document.getElementById("activity").value.trim();
    const area = document.getElementById("area").value.trim();
    const date = dateInput.value;
    const time = document.getElementById("time").value;
    const team = document.getElementById("team").value.trim();
    const notes = document.getElementById("notes").value.trim();

    if (!activity || !area || !date || !time || !team) {
        alert("Please complete all required fields.");
        return;
    }

    if (date < getToday()) {
        alert("Please choose today or a future date.");
        return;
    }

    const schedule = {
        id: Date.now().toString() +
            Math.random().toString(36).slice(2),
        activity,
        area,
        date,
        time,
        team,
        notes,
        status: "Scheduled"
    };

    schedules.push(schedule);
    saveSchedules();

    form.reset();
    dateInput.min = getToday();

    renderSchedules();

    alert("Cleaning schedule added successfully!");
});

search.addEventListener("input", renderSchedules);

// Display saved schedules when the page opens.
renderSchedules();
