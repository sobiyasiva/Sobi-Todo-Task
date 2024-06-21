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
    const noteMessage = document.getElementById('noteMessage');
    let tasks = [];
    let isEditing = false;
    let editIndex = null;
    let taskToDelete = null;
    let taskToToggle = null;
    let activeTab = 'all';
    let checkboxOriginalState = null;
    let checkboxElement = null; 

        // Add task function
        function addTask() {
            let taskValue = taskInput.value.trim();
            // replace all the leading spaces with 1 whitespace and g is the global variable to set all the text to only 1 whitespace
            taskValue = taskValue.replace(/\s+/g, ' '); 
            // stores the original text,if while editing there is no change it returns the text with no changes or otherwise empty string
            const originalTaskText = taskInput.dataset.originalTaskText || ''; 
    
            if (!taskValue) {
                showToast('Task cannot be empty.', 'error');
                return;
            }
    
            if (isEditing) {
                // editIndex-helps to identify if there is any duplicates
                // index!==editIndex ensures that the index of the task and the editIndex task is not compared
                // converting the existing task and the input task to lowercase to check if the task already exists
                // task.text-existing task,taskValue-input task
                const isSameAsExisting = tasks.some((task, index) => index !== editIndex && task.text.toLowerCase() === taskValue.toLowerCase());
                if (isSameAsExisting) {
                    showToast('Task already exists.', 'error');
                    return;
                }
                // updates the task to new value
                tasks[editIndex].text = taskValue; 
                // removes the task from that position and adding the task to first position
                tasks.unshift(tasks.splice(editIndex, 1)[0]);
                isEditing = false;
                editIndex = null;
                addButton.textContent = 'Add';
                showToast('Task updated successfully', 'edit');
                const taskListContainer = document.querySelector('.task-list-container');
                taskListContainer.scrollTop = 0;
            } else {
                // checks while adding the new task if there is any already existing task in the array
                if (tasks.some(task => task.text.toLowerCase() === taskValue.toLowerCase())) {
                    showToast('Task already exists.', 'error');
                    return;
                }
                // to add the task to the incomplete tab
                tasks.unshift({
                    text: taskValue,
                    status: 'incomplete'
                });
                showToast('Task added successfully', 'add');
            }
            taskInput.value = '';
            renderTasks();
            saveTasks();
            switchTabs('all');
            const taskListContainer = document.querySelector('.task-list-container');
            taskListContainer.scrollTop = 0;
        }

    // Special characters and whitespace functions
    taskInput.addEventListener('input', function () {
        let value = taskInput.value;
// ^ denotes to be at the starting of the input text
        if (/[^a-zA-Z0-9\s]/.test(value)) {
            noteMessage.textContent = 'Special characters are not allowed.';
            value = value.replace(/[^a-zA-Z0-9\s]/g, '');
        } else if (/^\s+/.test(value)) {
            noteMessage.textContent = 'Whitespace at the beginning is not allowed.';
            value = value.trimLeft();
        } else {
            noteMessage.textContent = ''; 
        }

        taskInput.value = value;
    });

    // Render function
    function renderTasks() {
// initial task is empty
        allTasks.innerHTML = '';
        incompleteTasks.innerHTML = '';
        completedTasks.innerHTML = '';
// initial count is 0
        let allCountValue = 0;
        let incompleteCountValue = 0;
        let completedCountValue = 0;
// adds all the tasks to the all tab and increase the count
        tasks.forEach((task, index) => {
            const taskItem = createTaskItem(task, index);
            allTasks.appendChild(taskItem);
            allCountValue++;
// adds to incomplete tab if task status is incomplete and increase the count
            if (task.status === 'incomplete') {
                const incompleteTaskItem = createTaskItem(task, index);
                incompleteTasks.appendChild(incompleteTaskItem);
                incompleteCountValue++;
            } 
// adds to complete tab if task status is completed and increase the count
            else if (task.status === 'completed') {
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
            // add the completed class to the taskItem for css styling
            taskItem.classList.add('completed');
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        // checked is pre-defined and 3 equals is used for strictly defined
        checkbox.checked = task.status === 'completed';
        checkbox.addEventListener('change', () => {
            taskToToggle = { task, index };
            checkboxOriginalState = checkbox.checked;
            // used for reverting the changes
            checkboxElement = checkbox;

            const messageTop = document.createElement('div');
            const messageBottom = document.createElement('div');
            messageTop.textContent = task.status === 'completed' ? `Are you sure you want to mark the task as incomplete?` : `Are you sure you want to mark the task as completed?`;
            messageBottom.innerHTML = `Task: <strong>${task.text}</strong>`;
            confirmMessage.innerHTML = ''; 
            confirmMessage.appendChild(messageTop);
            confirmMessage.appendChild(messageBottom);
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
        editButton.className = 'edit';
        editButton.addEventListener('click', () => {
            taskInput.value = task.text.trim();
            taskInput.dataset.originalTaskText = task.text.trim();
            taskInput.focus();
            isEditing = true;
            editIndex = index;
            addButton.textContent = 'Save';
        });

        // Delete button function
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete';
        deleteButton.onclick = () => {
            taskToDelete = { task, index };
            checkboxOriginalState = checkbox.checked; 
            const deleteMessageTop = document.createElement('div');
            const deleteMessageBottom = document.createElement('div');
            deleteMessageTop.textContent = `Are you sure you want to delete the task?`;
            deleteMessageBottom.innerHTML = `Task: <strong>${task.text}</strong>`;
            confirmMessage.innerHTML = '';
            confirmMessage.appendChild(deleteMessageTop);
            confirmMessage.appendChild(deleteMessageBottom);
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
            // assigning each task and index to the taskToToggle
            const { task, index } = taskToToggle;
            task.status = task.status === 'completed' ? 'incomplete' : 'completed';
            // removes from the current position of the task
            tasks.splice(index, 1);
            tasks.unshift(task);
            // says in which tab the task to be added
            renderTasks();
            saveTasks();
            showToast(`Task marked as ${getStatusToastText(task.status)}`, 'status');
            // || or operator
            if (activeTab === 'incomplete' || activeTab === 'completed') {
                switchTabs(task.status === 'completed' ? 'completed' : 'incomplete');
            }

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
            showToast('Task deleted successfully', 'delete');
            if (isEditing && taskInput.value.trim() === task.text.trim()) {
                taskInput.value = '';
                addButton.textContent = 'Add';
                isEditing = false;
                editIndex = null;
            }
            taskToDelete = null;
        }
        confirmModal.style.display = 'none';
    }

    confirmNo.addEventListener('click', () => {
        if (checkboxElement) {
            checkboxElement.checked = !checkboxOriginalState; 
        }
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
                toastContainer.removeChild(toast);       1
            }, 300);
        }, 3000);
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
            // when clicking the button the tab is switched based on the data-tab name given to the attributes in html
            switchTabs(button.getAttribute('data-tab'));
        });
    });

    function switchTabs(tab) {
        // getting the css class here and removing the active class from the classList
        document.querySelector('.tab-button.active').classList.remove('active');
        // getting the attribute from html and adding active class here and the tab value is get from the data-tab value as already setted in html code
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        // analyzing and hide the list
        document.querySelectorAll('.task-list').forEach(list => list.classList.add('hidden'));
        // getting the tab and the task and remove hide
        document.getElementById(tab + 'Tasks').classList.remove('hidden');
        activeTab = tab;
    }

    loadTasks();
    renderTasks();
});
