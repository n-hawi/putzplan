// Simple household cleaning plan server
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');
const EXAMPLE_FILE = path.join(__dirname, 'tasks.example.json');

// Load tasks from file
function loadTasks() {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(DATA_FILE)) {
        // If tasks.json doesn't exist, try to copy from example file
        if (fs.existsSync(EXAMPLE_FILE)) {
            console.log('tasks.json not found, copying from tasks.example.json');
            fs.copyFileSync(EXAMPLE_FILE, DATA_FILE);
        } else {
            console.log('Neither tasks.json nor tasks.example.json found, starting with empty array');
            return [];
        }
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Save tasks to file
function saveTasks(tasks) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

let tasks = loadTasks();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Parse JSON bodies

// API endpoint to get tasks
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

// API endpoint to save tasks
app.post('/api/tasks', (req, res) => {
    tasks = req.body;
    saveTasks(tasks);
    res.json({ success: true });
});

// API endpoint to toggle task completion
app.patch('/api/tasks/:index/toggle', (req, res) => {
    const index = parseInt(req.params.index);
    if (index >= 0 && index < tasks.length) {
        tasks[index].done = !tasks[index].done;
        saveTasks(tasks);
        // Broadcast update to all connected clients
        io.emit('taskUpdated', { index, task: tasks[index] });
        res.json(tasks[index]);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

// API endpoint to delete task
app.delete('/api/tasks/:index', (req, res) => {
    const index = parseInt(req.params.index);
    if (index >= 0 && index < tasks.length) {
        const deletedTask = tasks.splice(index, 1)[0];
        saveTasks(tasks);
        // Broadcast update to all connected clients
        io.emit('taskDeleted', { index, deletedTask });
        res.json(deletedTask);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

// API endpoint to add task
app.post('/api/tasks/add', (req, res) => {
    const newTask = req.body;
    newTask.done = false;
    tasks.push(newTask);
    saveTasks(tasks);
    // Broadcast update to all connected clients
    io.emit('taskAdded', { task: newTask, index: tasks.length - 1 });
    res.json(newTask);
});

// API endpoint to edit task
app.put('/api/tasks/:index', (req, res) => {
    const index = parseInt(req.params.index);
    if (index >= 0 && index < tasks.length) {
        const updatedTask = req.body;
        // Keep the original done status
        updatedTask.done = tasks[index].done;
        tasks[index] = updatedTask;
        saveTasks(tasks);
        // Broadcast update to all connected clients
        io.emit('taskEdited', { index, task: updatedTask });
        res.json(updatedTask);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

// API endpoint to reset all tasks
app.post('/api/tasks/reset', (req, res) => {
    tasks.forEach(t => t.done = false);
    saveTasks(tasks);
    // Broadcast update to all connected clients
    io.emit('tasksReset');
    res.json({ success: true });
});

io.on('connection', (socket) => {
    console.log('A user connected');
    
    // Send current tasks to new client
    socket.emit('initialTasks', tasks);
    
    // Broadcast user count to all clients
    io.emit('userCount', io.engine.clientsCount);

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        // Broadcast updated user count
        io.emit('userCount', io.engine.clientsCount);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Access from other devices: http://[YOUR_IP]:${PORT}`);
    
    // Try to get and display the local IP address
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    
    console.log('\nAvailable network addresses:');
    Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(interface => {
            if (interface.family === 'IPv4' && !interface.internal) {
                console.log(`  http://${interface.address}:${PORT}`);
            }
        });
    });
});
