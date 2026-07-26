document.addEventListener("DOMContentLoaded", () => {
    const projectRaw = localStorage.getItem("wovenDays_currentProject");
    if (!projectRaw) {
        window.location.href = "create.html";
        return;
    }

    const project = JSON.parse(projectRaw);

    document.getElementById("navProjectTitle").textContent = project.name;
    document.getElementById("blanketDimensions").textContent = `${project.width} stitches wide`;

    const logDateInput = document.getElementById("logDate");
    const logInputContainer = document.getElementById("logInputContainer");
    const logForm = document.getElementById("logForm");
    const canvas = document.getElementById("blanketCanvas");
    const ctx = canvas.getContext("2d");
    const canvasWrapper = canvas.parentElement;

    const todayStr = new Date().toISOString().split("T")[0];
    logDateInput.value = todayStr;

    function renderLogInput() {
        logInputContainer.innerHTML = "";
        const label = document.createElement("label");

        if (project.legend.some(item => item.min !== null || item.max !== null)) {
            label.textContent = `Value for ${project.type}`;
            const input = document.createElement("input");
            input.type = "number";
            input.id = "dailyValue";
            input.step = "any";
            input.required = true;
            input.placeholder = "Enter numeric value...";
            logInputContainer.appendChild(label);
            logInputContainer.appendChild(input);
        } else {
            label.textContent = "Select Option";
            const select = document.createElement("select");
            select.id = "dailyValue";
            select.required = true;

            const defaultOpt = document.createElement("option");
            defaultOpt.value = "";
            defaultOpt.textContent = "Choose entry...";
            select.appendChild(defaultOpt);

            project.legend.forEach(item => {
                const opt = document.createElement("option");
                opt.value = item.id;
                opt.textContent = item.label;
                select.appendChild(opt);
            });

            logInputContainer.appendChild(label);
            logInputContainer.appendChild(select);
        }
    }

    function matchColor(val) {
        if (val === undefined || val === null || val === "") return null;

        for (const item of project.legend) {
            if (item.min !== null || item.max !== null) {
                const num = parseFloat(val);
                const minVal = item.min !== null ? item.min : -Infinity;
                const maxVal = item.max !== null ? item.max : Infinity;
                if (num >= minVal && num <= maxVal) {
                    return item;
                }
            } else if (item.id === val || item.label === val) {
                return item;
            }
        }
        return null;
    }

    function renderBlanket() {
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);
        const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

        const wrapperStyles = canvasWrapper ? window.getComputedStyle(canvasWrapper) : null;
        const wrapperPaddingX = wrapperStyles ? (parseFloat(wrapperStyles.paddingLeft) + parseFloat(wrapperStyles.paddingRight)) : 0;
        const wrapperPaddingY = wrapperStyles ? (parseFloat(wrapperStyles.paddingTop) + parseFloat(wrapperStyles.paddingBottom)) : 0;

        const canvasWidth = Math.max(280, Math.floor((canvasWrapper?.clientWidth || 400) - wrapperPaddingX));
        const canvasHeight = Math.max(560, Math.floor((canvasWrapper?.clientHeight || 620) - wrapperPaddingY));
        const rowHeight = canvasHeight / totalDays;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "#F8EFE5";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        let loggedCount = 0;
        let currentDate = new Date(start);

        for (let i = 0; i < totalDays; i++) {
            const dateStr = currentDate.toISOString().split("T")[0];
            const logEntry = project.logs[dateStr];
            const y = i * rowHeight;

            if (logEntry) {
                const matched = matchColor(logEntry.val);
                if (matched) {
                    ctx.fillStyle = matched.color;
                    ctx.fillRect(0, y, canvasWidth, Math.ceil(rowHeight));
                    
                    // Texture overlay line for yarn stitch simulation
                    if (rowHeight >= 2) {
                        ctx.fillStyle = "rgba(0,0,0,0.06)";
                        ctx.fillRect(0, y + rowHeight - 1, canvasWidth, 1);
                    }
                    loggedCount++;
                }
            } else {
                // Empty row grid guideline
                ctx.fillStyle = "#EFE6D8";
                ctx.fillRect(0, y, canvasWidth, 1);
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        document.getElementById("statCompleted").textContent = loggedCount;
        document.getElementById("statRemaining").textContent = Math.max(0, totalDays - loggedCount);
        const percent = Math.round((loggedCount / totalDays) * 100);
        document.getElementById("statPercent").textContent = `${percent}%`;
        document.getElementById("progressFill").style.width = `${percent}%`;
    }

    function updateInstructionForDate(dateStr) {
        const start = new Date(project.startDate);
        const target = new Date(dateStr);
        const dayNum = Math.ceil((target - start) / (1000 * 60 * 60 * 24)) + 1;

        document.getElementById("dayBadge").textContent = `Day ${Math.max(1, dayNum)}`;

        const logEntry = project.logs[dateStr];
        const swatchCircle = document.getElementById("swatchCircle");
        const colorName = document.getElementById("instructionColorName");
        const details = document.getElementById("instructionDetails");
        const text = document.getElementById("instructionText");

        if (logEntry) {
            const matched = matchColor(logEntry.val);
            if (matched) {
                swatchCircle.style.backgroundColor = matched.color;
                colorName.textContent = matched.label;
                details.textContent = `Logged value: ${logEntry.val}`;
                text.innerHTML = `Crochet <strong>${project.width} single crochet</strong> stitches across Row ${Math.max(1, dayNum)} using <strong>${matched.label}</strong> yarn.`;
                return;
            }
        }

        swatchCircle.style.backgroundColor = "#ccc";
        colorName.textContent = "No log for this date";
        details.textContent = "Enter a value above";
        text.textContent = "Log a value above to calculate today's crochet row instruction.";
    }

    // Export Canvas Image Feature
    document.getElementById("exportImgBtn").addEventListener("click", () => {
        const link = document.createElement("a");
        link.download = `${project.name.replace(/\s+/g, '_')}_blanket.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });

    // Printable Instructions Feature
    document.getElementById("printInstructionsBtn").addEventListener("click", () => {
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);
        const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

        document.getElementById("printProjectTitle").textContent = `${project.name} - Pattern Instructions`;
        document.getElementById("printProjectMeta").textContent = `Type: ${project.type} | Width: ${project.width} stitches | Dates: ${project.startDate} to ${project.endDate}`;

        const legendContainer = document.getElementById("printLegend");
        legendContainer.innerHTML = "";
        project.legend.forEach(item => {
            const box = document.createElement("div");
            box.className = "print-legend-item";
            box.innerHTML = `<span class="print-swatch" style="background:${item.color}"></span> <strong>${item.label}</strong>`;
            legendContainer.appendChild(box);
        });

        const tableBody = document.getElementById("printTableBody");
        tableBody.innerHTML = "";
        let currentDate = new Date(start);

        for (let i = 0; i < totalDays; i++) {
            const dateStr = currentDate.toISOString().split("T")[0];
            const logEntry = project.logs[dateStr];
            const matched = logEntry ? matchColor(logEntry.val) : null;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>Row ${i + 1}</td>
                <td>${dateStr}</td>
                <td>${logEntry ? logEntry.val : '-'}</td>
                <td>
                    ${matched ? `<span class="print-swatch" style="background:${matched.color}"></span> ${matched.label}` : '<em>Unlogged</em>'}
                </td>
                <td>Crochet ${project.width} single crochet stitches in ${matched ? matched.label : 'assigned'} yarn.</td>
                <td>${logEntry ? '✓ Done' : 'Pending'}</td>
            `;
            tableBody.appendChild(tr);

            currentDate.setDate(currentDate.getDate() + 1);
        }

        window.print();
    });

    logDateInput.addEventListener("change", (e) => {
        const val = project.logs[e.target.value]?.val || "";
        const input = document.getElementById("dailyValue");
        if (input) input.value = val;
        updateInstructionForDate(e.target.value);
    });

    logForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const dateStr = logDateInput.value;
        const val = document.getElementById("dailyValue").value;

        project.logs[dateStr] = { val: val, timestamp: Date.now() };
        localStorage.setItem("wovenDays_currentProject", JSON.stringify(project));

        renderBlanket();
        updateInstructionForDate(dateStr);
    });

    /*document.getElementById("backupBtn").addEventListener("click", () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
        const anchor = document.createElement("a");
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", `${project.name.replace(/\s+/g, '_')}_backup.json`);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    });*/

    document.getElementById("resetBtn").addEventListener("click", () => {
        if (confirm("Start a new blanket? Make sure you backed up your data first!")) {
            localStorage.removeItem("wovenDays_currentProject");
            window.location.href = "create.html";
        }
    });

    document.getElementById("demoDataBtn")?.addEventListener("click", () => {
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);
        const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
        const hasNumericRanges = project.legend.some(item => item.min !== null || item.max !== null);

        project.logs = {};

        for (let i = 0; i < totalDays; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + i);
            const dateStr = currentDate.toISOString().split("T")[0];
            const rule = project.legend[Math.floor(Math.random() * project.legend.length)];

            let val;
            if (hasNumericRanges) {
                const min = Number.isFinite(parseFloat(rule.min)) ? parseFloat(rule.min) : 0;
                const max = Number.isFinite(parseFloat(rule.max)) ? parseFloat(rule.max) : min + 10;
                const low = Math.min(min, max);
                const high = Math.max(min, max);
                val = (Math.random() * (high - low) + low).toFixed(1);
            } else {
                val = rule.id || rule.label;
            }

            project.logs[dateStr] = { val, timestamp: Date.now() };
        }

        localStorage.setItem("wovenDays_currentProject", JSON.stringify(project));

        const selectedDate = logDateInput.value || todayStr;
        const selectedLog = project.logs[selectedDate]?.val || "";
        const input = document.getElementById("dailyValue");
        if (input) input.value = selectedLog;

        renderBlanket();
        updateInstructionForDate(selectedDate);
    });

    window.addEventListener("resize", renderBlanket);

    renderLogInput();
    renderBlanket();
    updateInstructionForDate(todayStr);
});
