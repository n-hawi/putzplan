// ---------------------------
// Household Cleaning App
// ---------------------------

// Initialize variables
let tasks = [];
let showCompleted = false;
let lastRoom = '';
let lastCategory = '';
let currentSort = { field: 'room', asc: true }; // default sorting

// Initialize Socket.IO for live updates
const socket = io();
let isUpdatingFromSocket = false;

// Socket.IO event listeners for live updates
socket.on('initialTasks', (serverTasks) => {
    isUpdatingFromSocket = true;
    tasks = serverTasks;
    tasks.forEach(task => {
        if (task.done !== undefined) {
            task.completed = task.done;
            delete task.done;
        }
    });
    renderTasks();
    isUpdatingFromSocket = false;
});

socket.on('taskUpdated', (data) => {
    if (!isUpdatingFromSocket) {
        // Save scroll position before update
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        tasks[data.index].completed = data.task.done;
        renderTasks();
        showNotification('Task wurde von anderem Nutzer aktualisiert');
        
        // Restore scroll position on mobile
        if (window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            setTimeout(() => {
                window.scrollTo(0, scrollPosition);
            }, 0);
        }
    }
});

socket.on('taskAdded', (data) => {
    if (!isUpdatingFromSocket) {
        // Save scroll position before update
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        const newTask = data.task;
        newTask.completed = newTask.done;
        delete newTask.done;
        tasks.push(newTask);
        renderTasks();
        showNotification('Neue Aufgabe wurde hinzugefügt');
        
        // Restore scroll position on mobile
        if (window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            setTimeout(() => {
                window.scrollTo(0, scrollPosition);
            }, 0);
        }
    }
});

socket.on('taskDeleted', (data) => {
    if (!isUpdatingFromSocket) {
        // Save scroll position before update
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        tasks.splice(data.index, 1);
        renderTasks();
        showNotification('Aufgabe wurde gelöscht');
        
        // Restore scroll position on mobile
        if (window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            setTimeout(() => {
                window.scrollTo(0, scrollPosition);
            }, 0);
        }
    }
});

socket.on('tasksReset', () => {
    if (!isUpdatingFromSocket) {
        // Save scroll position before update
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        tasks.forEach(t => t.completed = false);
        renderTasks();
        showNotification('Alle Aufgaben wurden zurückgesetzt');
        
        // Restore scroll position on mobile
        if (window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            setTimeout(() => {
                window.scrollTo(0, scrollPosition);
            }, 0);
        }
    }
});

socket.on('taskEdited', (data) => {
    if (!isUpdatingFromSocket) {
        // Save scroll position before update
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        const editedTask = data.task;
        editedTask.completed = editedTask.done;
        delete editedTask.done;
        tasks[data.index] = editedTask;
        renderTasks();
        showNotification('Aufgabe wurde bearbeitet');
        
        // Restore scroll position on mobile
        if (window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            setTimeout(() => {
                window.scrollTo(0, scrollPosition);
            }, 0);
        }
    }
});

socket.on('userCount', (count) => {
    updateUserCounter(count);
});

// Show notification for live updates
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'alert alert-info alert-dismissible fade show position-fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Update user counter in UI
function updateUserCounter(count) {
    let counter = document.getElementById('userCounter');
    if (!counter) {
        counter = document.createElement('div');
        counter.id = 'userCounter';
        counter.className = 'badge bg-primary position-fixed';
        counter.style.top = '10px';
        counter.style.left = '10px';
        counter.style.zIndex = '9999';
        document.body.appendChild(counter);
    }
    counter.textContent = `👥 ${count} online`;
}

// Save tasks to server
async function saveTasks() {
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tasks)
        });
        if (!response.ok) {
            console.error('Failed to save tasks to server');
            // Fallback to localStorage
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
    } catch (error) {
        console.error('Error saving tasks:', error);
        // Fallback to localStorage
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

// Render task list
function renderTasks() {
    const tbody = document.querySelector('#taskList');
    tbody.innerHTML = '';

    let filteredTasks = tasks.filter(t => showCompleted || !t.completed);

    // Sort tasks
    filteredTasks.sort((a, b) => {
        let valA = a[currentSort.field].toLowerCase();
        let valB = b[currentSort.field].toLowerCase();
        if (valA < valB) return currentSort.asc ? -1 : 1;
        if (valA > valB) return currentSort.asc ? 1 : -1;
        return 0;
    });

    filteredTasks.forEach((task, index) => {
        const row = document.createElement('tr');
        row.classList.add('task-row');
        if (task.completed) {
            row.classList.add('completed');
        }

        // Store the original task index for toggling
        row.setAttribute('data-task-index', tasks.indexOf(task));

        // Check if we're on mobile (improved detection)
        const isMobile = window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Mobile layout - card-style
            row.innerHTML = `
                <td>
                    <div class="task-mobile-content">
                        <div class="task-main">${task.name}</div>
                        <div class="task-room">📍 ${task.room}</div>
                        <div class="task-category">🏷️ ${task.category}</div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-success" onclick="toggleComplete(${tasks.indexOf(task)}, this)">
                            ${task.completed ? '↩️ Undo' : '✅ Erledigt'}
                        </button>
                        <div class="btn-group" style="flex: 1;">
                            <button class="btn btn-warning" onclick="editTask(${tasks.indexOf(task)})" style="flex: 1;">
                                ✏️ Bearbeiten
                            </button>
                            <button class="btn btn-danger" onclick="deleteTask(${tasks.indexOf(task)})" style="flex: 0.5;">
                                🗑️
                            </button>
                        </div>
                    </div>
                </td>
            `;
        } else {
            // Desktop layout - table columns
            row.innerHTML = `
                <td>
                    <div class="task-main">${task.name}</div>
                    <div class="task-meta d-md-none">
                        <small class="text-muted">${task.room} • ${task.category}</small>
                    </div>
                </td>
                <td class="d-none d-md-table-cell">${task.room}</td>
                <td class="d-none d-lg-table-cell">${task.category}</td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="toggleComplete(${tasks.indexOf(task)}, this)">
                        ${task.completed ? 'Undo' : 'Erledigt'}
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editTask(${tasks.indexOf(task)})">
                        Bearbeiten
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTask(${tasks.indexOf(task)})">
                        Löschen
                    </button>
                </td>
            `;
        }

        tbody.appendChild(row);
    });    
}

// Toggle completed status
async function toggleComplete(index, buttonElement) {
    // Save scroll position before update (for mobile)
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    isUpdatingFromSocket = true; // Prevent double updates from our own actions
    try {
        const response = await fetch(`/api/tasks/${index}/toggle`, {
            method: 'PATCH'
        });
        if (response.ok) {
            const updatedTask = await response.json();
            tasks[index].completed = updatedTask.done;
            renderTasks();
        } else {
            console.error('Failed to toggle task');
        }
    } catch (error) {
        console.error('Error toggling task:', error);
        // Fallback to local toggle
        tasks[index].completed = !tasks[index].completed;
        await saveTasks();
        renderTasks();
    }
    
    // Restore scroll position on mobile
    if (window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        setTimeout(() => {
            window.scrollTo(0, scrollPosition);
        }, 0);
    }
    
    isUpdatingFromSocket = false;
}

// Edit task function
async function editTask(index) {
    const task = tasks[index];
    
    // Create a simple prompt-based editor
    const newName = prompt('Aufgabe bearbeiten:', task.name);
    if (newName === null) return; // User cancelled
    
    const newRoom = prompt('Raum bearbeiten:', task.room);
    if (newRoom === null) return; // User cancelled
    
    const newCategory = prompt('Kategorie bearbeiten:', task.category);
    if (newCategory === null) return; // User cancelled
    
    const updatedTask = {
        name: newName.trim(),
        room: newRoom.trim(),
        category: newCategory.trim()
    };
    
    // Validate input
    if (!updatedTask.name || !updatedTask.room || !updatedTask.category) {
        alert('Bitte alle Felder ausfüllen!');
        return;
    }
    
    // Save scroll position before update (for mobile)
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    isUpdatingFromSocket = true;
    try {
        const response = await fetch(`/api/tasks/${index}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedTask)
        });
        
        if (response.ok) {
            const savedTask = await response.json();
            savedTask.completed = savedTask.done;
            delete savedTask.done;
            tasks[index] = savedTask;
            renderTasks();
        } else {
            console.error('Failed to edit task');
        }
    } catch (error) {
        console.error('Error editing task:', error);
        // Fallback to local edit
        updatedTask.completed = task.completed;
        tasks[index] = updatedTask;
        await saveTasks();
        renderTasks();
    }
    
    // Restore scroll position on mobile
    if (window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        setTimeout(() => {
            window.scrollTo(0, scrollPosition);
        }, 0);
    }
    
    isUpdatingFromSocket = false;
}

// Delete task function
async function deleteTask(index) {
    if (!confirm('Aufgabe wirklich löschen?')) {
        return;
    }
    
    // Save scroll position before deletion (for mobile)
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    isUpdatingFromSocket = true;
    try {
        const response = await fetch(`/api/tasks/${index}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            tasks.splice(index, 1);
            renderTasks();
        } else {
            console.error('Failed to delete task');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        // Fallback to local deletion
        tasks.splice(index, 1);
        await saveTasks();
        renderTasks();
    }
    
    // Restore scroll position on mobile
    if (window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        setTimeout(() => {
            window.scrollTo(0, scrollPosition);
        }, 0);
    }
    
    isUpdatingFromSocket = false;
}

// Add new task
document.getElementById('taskForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const nameInput = document.getElementById('taskName');
    const roomInput = document.getElementById('taskRoom');
    const categoryInput = document.getElementById('taskCategory');

    // Save scroll position before adding task (for mobile)
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    const newTask = {
        name: nameInput.value.trim(),
        room: roomInput.value.trim(),
        category: categoryInput.value.trim()
    };

    isUpdatingFromSocket = true;
    try {
        const response = await fetch('/api/tasks/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTask)
        });
        
        if (response.ok) {
            const savedTask = await response.json();
            savedTask.completed = savedTask.done;
            delete savedTask.done;
            tasks.push(savedTask);
            renderTasks();
        } else {
            console.error('Failed to add task');
        }
    } catch (error) {
        console.error('Error adding task:', error);
        // Fallback to local add
        newTask.completed = false;
        tasks.push(newTask);
        await saveTasks();
        renderTasks();
    }

    lastRoom = newTask.room;
    lastCategory = newTask.category;

    nameInput.value = '';
    roomInput.value = lastRoom; // keep last room
    categoryInput.value = lastCategory; // keep last category
    
    // Restore scroll position on mobile
    if (window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        setTimeout(() => {
            window.scrollTo(0, scrollPosition);
        }, 0);
    }
    
    isUpdatingFromSocket = false;
});

// Show/hide completed
document.getElementById('toggleShowDone').addEventListener('click', function () {
    showCompleted = !showCompleted;
    renderTasks();
});

// Reset all tasks
document.getElementById('resetAll').addEventListener('click', async function () {
    if (confirm('Möchtest du wirklich alle Aufgaben zurücksetzen?')) {
        // Save scroll position before reset (for mobile)
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        isUpdatingFromSocket = true;
        try {
            const response = await fetch('/api/tasks/reset', {
                method: 'POST'
            });
            if (response.ok) {
                tasks.forEach(t => t.completed = false);
                renderTasks();
            } else {
                console.error('Failed to reset tasks');
            }
        } catch (error) {
            console.error('Error resetting tasks:', error);
            // Fallback to local reset
            tasks.forEach(t => t.completed = false);
            await saveTasks();
            renderTasks();
        }
        
        // Restore scroll position on mobile
        if (window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            setTimeout(() => {
                window.scrollTo(0, scrollPosition);
            }, 0);
        }
        
        isUpdatingFromSocket = false;
    }
});

// Sorting when clicking table header
document.querySelectorAll('#taskTable thead th.sortable').forEach(th => {
    th.addEventListener('click', () => {
        const field = th.dataset.field;
        if (currentSort.field === field) {
            currentSort.asc = !currentSort.asc;
        } else {
            currentSort.field = field;
            currentSort.asc = true;
        }
        renderTasks();
    });
});

// Initial load - Socket.IO will send initial tasks

// Re-render on window resize to switch between mobile/desktop layouts
window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
        renderTasks();
    }, 250);
});
