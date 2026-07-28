const WOVENDAYS_PROJECTS_KEY = "wovenDays_projects";
const WOVENDAYS_CURRENT_PROJECT_ID_KEY = "wovenDays_currentProjectId";
const WOVENDAYS_CURRENT_PROJECT_DATA_KEY = "wovenDays_currentProject";

function wovendaysReadProjects() {
    const raw = localStorage.getItem(WOVENDAYS_PROJECTS_KEY);

    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch {
            // Fall through to the legacy single-project path.
        }
    }

    const legacyProjectRaw = localStorage.getItem(WOVENDAYS_CURRENT_PROJECT_DATA_KEY);
    if (!legacyProjectRaw) {
        return [];
    }

    try {
        const legacyProject = JSON.parse(legacyProjectRaw);
        if (legacyProject && legacyProject.id) {
            const normalized = {
                ...legacyProject,
                createdAt: legacyProject.createdAt || legacyProject.updatedAt || Date.now(),
                updatedAt: legacyProject.updatedAt || Date.now()
            };

            localStorage.setItem(WOVENDAYS_PROJECTS_KEY, JSON.stringify([normalized]));
            localStorage.setItem(WOVENDAYS_CURRENT_PROJECT_ID_KEY, normalized.id);
            localStorage.setItem(WOVENDAYS_CURRENT_PROJECT_DATA_KEY, JSON.stringify(normalized));
            return [normalized];
        }
    } catch {
        // Ignore malformed legacy state.
    }

    return [];
}

function wovendaysWriteProjects(projects) {
    localStorage.setItem(WOVENDAYS_PROJECTS_KEY, JSON.stringify(projects));
}

function wovendaysSaveProject(project) {
    const projects = wovendaysReadProjects();
    const nextProject = {
        ...project,
        createdAt: project.createdAt || Date.now(),
        updatedAt: Date.now()
    };

    const nextProjects = projects.filter((existing) => existing.id !== nextProject.id);
    nextProjects.unshift(nextProject);

    wovendaysWriteProjects(nextProjects);
    localStorage.setItem(WOVENDAYS_CURRENT_PROJECT_ID_KEY, nextProject.id);
    localStorage.setItem(WOVENDAYS_CURRENT_PROJECT_DATA_KEY, JSON.stringify(nextProject));

    return nextProject;
}

function wovendaysGetCurrentProject() {
    const currentId = localStorage.getItem(WOVENDAYS_CURRENT_PROJECT_ID_KEY);
    const projects = wovendaysReadProjects();

    if (currentId) {
        const selected = projects.find((project) => project.id === currentId);
        if (selected) {
            localStorage.setItem(WOVENDAYS_CURRENT_PROJECT_DATA_KEY, JSON.stringify(selected));
            return selected;
        }
    }

    const legacyProjectRaw = localStorage.getItem(WOVENDAYS_CURRENT_PROJECT_DATA_KEY);
    if (legacyProjectRaw) {
        try {
            const legacyProject = JSON.parse(legacyProjectRaw);
            if (legacyProject && legacyProject.id) {
                wovendaysSaveProject(legacyProject);
                return legacyProject;
            }
        } catch {
            // Ignore malformed legacy state.
        }
    }

    const fallbackProject = projects[0] || null;
    if (fallbackProject) {
        wovendaysSetCurrentProject(fallbackProject.id);
    }

    return fallbackProject;
}

function wovendaysSetCurrentProject(projectId) {
    const projects = wovendaysReadProjects();
    const selected = projects.find((project) => project.id === projectId);

    if (selected) {
        localStorage.setItem(WOVENDAYS_CURRENT_PROJECT_ID_KEY, selected.id);
        localStorage.setItem(WOVENDAYS_CURRENT_PROJECT_DATA_KEY, JSON.stringify(selected));
    }

    return selected || null;
}

function wovendaysDeleteProject(projectId) {
    const projects = wovendaysReadProjects().filter((project) => project.id !== projectId);
    wovendaysWriteProjects(projects);

    const currentId = localStorage.getItem(WOVENDAYS_CURRENT_PROJECT_ID_KEY);
    if (currentId === projectId) {
        localStorage.removeItem(WOVENDAYS_CURRENT_PROJECT_ID_KEY);
        localStorage.removeItem(WOVENDAYS_CURRENT_PROJECT_DATA_KEY);

        if (projects.length > 0) {
            wovendaysSetCurrentProject(projects[0].id);
        }
    }

    return projects;
}
