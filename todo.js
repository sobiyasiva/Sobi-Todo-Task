document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addButton = document.getElementById('addButton');
    const allTasks = document.getElementById('allTasks');
    const incompleteTasks = document.getElementById('incompleteTasks');
    const completedTasks = document.getElementById('completedTasks');
    const tabButtons = document.querySelectorAll('.tab-button');

    const allCount = document.getElementById('allCount');
    const incompleteCount = document.getElementById('incompleteCount');
    const completedCount = document.getElementById('completedCount');

    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    let tasks = [];
    let isEditing = false;
    let editIndex = null;
    let taskToDelete = null;
    let taskToToggle = null;
    let activeTab = 'all'; 

// Toast function 

    function showToast(message, type = 'default') {
        const toastContainer = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            });
        }, 3000);
    }

// Special characters and whitespace functions

    taskInput.addEventListener('input', function () {
        let value = taskInput.value;

        if (/[^a-zA-Z0-9\s]/.test(value)) {
            showToast('Special characters are not allowed.', 'error');
            value = value.replace(/[^a-zA-Z0-9\s]/g, '');
            
        }
        if (/^\s+/.test(value)) {
            showToast('Whitespace at the beginning is not allowed.', 'error');
            value = value.trimLeft();
        }

        taskInput.value = value;
    });

    // Render function

    function renderTasks() {
        allTasks.innerHTML = '';
        incompleteTasks.innerHTML = '';
        completedTasks.innerHTML = '';

        let allCountValue = 0;
        let incompleteCountValue = 0;
        let completedCountValue = 0;

        tasks.forEach((task, index) => {
            const taskItem = createTaskItem(task, index);
            allTasks.appendChild(taskItem);
            allCountValue++;

            if (task.status === 'incomplete') {
                const incompleteTaskItem = createTaskItem(task, index);
                incompleteTasks.appendChild(incompleteTaskItem);
                incompleteCountValue++;
            } else if (task.status === 'completed') {
                const completedTaskItem = createTaskItem(task, index);
                completedTasks.appendChild(completedTaskItem);
                completedCountValue++;
            }
        });

// Tab Count values

        allCount.textContent = allCountValue;
        incompleteCount.textContent = incompleteCountValue;
        completedCount.textContent = completedCountValue;

        if (allCountValue === 0) {
            allTasks.innerHTML = '<li class="task-empty">Task list is empty.</li>';
        }
        if (incompleteCountValue === 0) {
            incompleteTasks.innerHTML = '<li class="task-empty">Task list is empty.</li>';
        }
        if (completedCountValue === 0) {
            completedTasks.innerHTML = '<li class="task-empty">Task list is empty.</li>';
        }
        switchTabs(activeTab);


    }

// Pop-up message for checkbox events

    function createTaskItem(task, index) {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        if (task.status === 'completed') {
            taskItem.classList.add('completed');
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.status === 'completed';
        checkbox.addEventListener('change', () => {
            taskToToggle = { task, index };
            if (task.status === 'completed') {
                confirmMessage.textContent = `Are you sure you want to mark the task "${task.text}" as incomplete?`;
            } else {
                confirmMessage.textContent = `Are you sure you want to mark the task "${task.text}" as completed?`;
            }
            confirmYes.onclick = confirmToggleTaskStatus;
            confirmModal.style.display = 'flex';
        });

        const taskContent = document.createElement('span');
        taskContent.textContent = task.text;

        const actions = document.createElement('div');
        actions.className = 'actions';

        // Edit button function

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            taskInput.value = task.text;
            taskInput.focus(); 
            isEditing = true;
            editIndex = index;
            addButton.textContent = 'Save';
            renderTasks();
        });

        // Delete button function

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete';
        deleteButton.onclick = () => {
            taskToDelete = { task, index };
            confirmMessage.textContent = `Are you sure you want to delete the task? "${task.text}"`;
            confirmYes.onclick = confirmDeleteTask;
            confirmModal.style.display = 'flex';
        };

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);
        taskItem.appendChild(checkbox);
        taskItem.appendChild(taskContent);
        taskItem.appendChild(actions);

        return taskItem;
    }

// when clicking yes the toggle function will be as follows

    function confirmToggleTaskStatus() {
        if (taskToToggle !== null) {
            const { task, index } = taskToToggle;
            task.status = task.status === 'completed' ? 'incomplete' : 'completed';
            tasks.splice(index, 1);
            tasks.unshift(task);
            renderTasks();
            saveTasks();
            showToast(`Task "${task.text}" marked as ${getStatusToastText(task.status)}`, 'status');
            switchTabs(task.status === 'completed' ? 'completed' : 'incomplete');
            taskToToggle = null;
        }
        confirmModal.style.display = 'none';
    }
    

    // Delete pop-up

    function confirmDeleteTask() {
        if (taskToDelete !== null) {
            const { task, index } = taskToDelete;
            tasks.splice(index, 1);
            renderTasks();
            saveTasks();
            showToast(`Task "${task.text}" deleted successfully`, 'delete');
            switchTabs(activeTab); 
            taskToDelete = null;
        }
        confirmModal.style.display = 'none';
    }

    confirmNo.addEventListener('click', () => {
        taskToDelete = null;
        taskToToggle = null;
        confirmModal.style.display = 'none';
    });

    function getStatusToastText(status) {
        switch (status) {
            case 'incomplete':
                return 'Incomplete';
            case 'completed':
                return 'Complete';
        }
    }

    // Add task function

    function addTask() {
        const taskValue = taskInput.value.trim().toLowerCase();
        if (!taskValue) {
            showToast('Task cannot be empty.', 'error');
            return;
        }

        if (isEditing) {
            tasks[editIndex].text = taskValue;
            tasks.unshift(tasks.splice(editIndex, 1)[0]);
            isEditing = false;
            editIndex = null;
            addButton.textContent = 'Add';
            showToast(`Task "${taskValue}" updated successfully`, 'edit');
        } else {
            if (tasks.some(task => task.text.toLowerCase() === taskValue)) {
                showToast('Task already exists.', 'error');
                return;
            }
            tasks.unshift({
                text: taskValue,
                status: 'incomplete'
            });
            showToast(`Task "${taskValue}" added successfully`, 'add');
        }
        taskInput.value = '';
        renderTasks();
        saveTasks();
        switchTabs('all');
    }

// Keypress for enter key

    addButton.addEventListener('click', addTask);

    taskInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            addTask();
        }
    });
    // Local storage

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }
    }

// Tabs switching function

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchTabs(button.getAttribute('data-tab'));
        });
    });

    function switchTabs(tab) {
        document.querySelector('.tab-button.active').classList.remove('active');
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.querySelectorAll('.task-list').forEach(list => list.classList.add('hidden'));
        document.getElementById(tab + 'Tasks').classList.remove('hidden');
        activeTab = tab;
    }

    loadTasks();
    renderTasks();
});
