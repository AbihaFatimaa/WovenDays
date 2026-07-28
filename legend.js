document.addEventListener("DOMContentLoaded", () => {
    const project = typeof wovendaysGetCurrentProject === "function"
        ? wovendaysGetCurrentProject()
        : JSON.parse(localStorage.getItem("wovenDays_currentProject"));

    if (!project) {
        window.location.href = "create.html";
        return;
    }

    const container = document.getElementById("legendRows");
    const addRowBtn = document.getElementById("addRowBtn");
    const legendForm = document.getElementById("legendForm");

    document.getElementById("legendHeading").textContent = `${project.name} Legend`;

    const defaultTemplates = {
        Mood: [
            { label: "Amazing 😊", color: "#F3C64F" },
            { label: "Happy 🙂", color: "#8FA382" },
            { label: "Neutral 😐", color: "#7A9A95" },
            { label: "Sad 😔", color: "#9C82A3" },
            { label: "Bad 😭", color: "#C86D51" }
        ],
        Temperature: [
            { min: "", max: 9, color: "#4A90E2", label: "< 10°C (Cold)" },
            { min: 10, max: 19, color: "#8FA382", label: "10–19°C (Mild)" },
            { min: 20, max: 29, color: "#F3C64F", label: "20–29°C (Warm)" },
            { min: 30, max: "", color: "#C86D51", label: "30°C+ (Hot)" }
        ],
        Reading: [
            { min: 0, max: 0, color: "#D8CBBA", label: "0 pages" },
            { min: 1, max: 25, color: "#8FA382", label: "1–25 pages" },
            { min: 26, max: 50, color: "#7A9A95", label: "26–50 pages" },
            { min: 51, max: "", color: "#9C82A3", label: "50+ pages" }
        ]
    };

    const initialList = defaultTemplates[project.type] || [
        { label: "Option 1", color: "#A67C52" },
        { label: "Option 2", color: "#8FA382" }
    ];

    function createRowDOM(item = {}) {
        const row = document.createElement("div");
        row.className = "legend-row";

        const isNumeric = ["Temperature", "Reading", "Fitness", "Hydration"].includes(project.type);

        if (isNumeric) {
            row.innerHTML = `
                <input type="color" class="color-picker" value="${item.color || '#A67C52'}">
                <input type="number" class="val-min" placeholder="Min" value="${item.min !== undefined ? item.min : ''}">
                <span>to</span>
                <input type="number" class="val-max" placeholder="Max" value="${item.max !== undefined ? item.max : ''}">
                <input type="text" class="label-text" placeholder="Label" value="${item.label || ''}">
                <button type="button" class="remove-btn" title="Delete Row">×</button>
            `;
        } else {
            row.innerHTML = `
                <input type="color" class="color-picker" value="${item.color || '#A67C52'}">
                <input type="text" class="label-text" placeholder="Label (e.g. Happy)" value="${item.label || ''}" required>
                <button type="button" class="remove-btn" title="Delete Row">×</button>
            `;
        }

        row.querySelector(".remove-btn").addEventListener("click", () => {
            if (container.children.length > 1) {
                row.remove();
            } else {
                alert("Your blanket needs at least one color!");
            }
        });

        container.appendChild(row);
    }

    initialList.forEach(item => createRowDOM(item));

    addRowBtn.addEventListener("click", () => createRowDOM());

    legendForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const legendItems = [];
        const rows = container.querySelectorAll(".legend-row");

        rows.forEach((row, index) => {
            const color = row.querySelector(".color-picker").value;
            const label = row.querySelector(".label-text").value.trim();
            const minEl = row.querySelector(".val-min");
            const maxEl = row.querySelector(".val-max");

            legendItems.push({
                id: "color_" + (index + 1),
                color: color,
                label: label || `Category ${index + 1}`,
                min: minEl && minEl.value !== "" ? parseFloat(minEl.value) : null,
                max: maxEl && maxEl.value !== "" ? parseFloat(maxEl.value) : null
            });
        });

        project.legend = legendItems;
        if (typeof wovendaysSaveProject === "function") {
            wovendaysSaveProject(project);
        } else {
            localStorage.setItem("wovenDays_currentProject", JSON.stringify(project));
        }
        window.location.href = "dashboard.html";
    });
});
