document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("blanketForm");

    // Set default dates (Today -> 1 Year from today) for convenience
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);

    document.getElementById("startDate").value = today.toISOString().split("T")[0];
    document.getElementById("endDate").value = nextYear.toISOString().split("T")[0];

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Build the project configuration object
        const projectData = {
            id: "wovendays_" + Date.now(),
            name: document.getElementById("projectName").value.trim(),
            type: document.getElementById("blanketType").value,
            width: parseInt(document.getElementById("width").value, 10),
            startDate: document.getElementById("startDate").value,
            endDate: document.getElementById("endDate").value,
            legend: [], // Will be filled in Step 2
            logs: {}    // Will hold date key -> log value mapping
        };

        // Save to localStorage
        localStorage.setItem("wovenDays_currentProject", JSON.stringify(projectData));

        // Navigate to Step 2
        window.location.href = "legend.html";
    });
});