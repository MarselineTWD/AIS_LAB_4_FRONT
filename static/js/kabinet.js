document.addEventListener('DOMContentLoaded', async function() {
    await loadTeachers();
    
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const userData = await fetchUserData(token);
            updateUIforLoggedInUser(userData);
            await loadRoleSpecificData(userData.role, token);
        } catch (error) {
            console.error('Error loading user data:', error);
            if (error.status === 401) {
                localStorage.removeItem('token');
                updateUIforGuest();
            }
        }
    } else {
        updateUIforGuest();
    }
});

// Функции загрузки и отображения учителей остаются без изменений
async function loadTeachers() {
    try {
        const response = await fetch('/api/teachers/public');
        const teachers = await response.json();
        displayTeachers(teachers);
    } catch (error) {
        console.error('Error loading teachers:', error);
        document.getElementById('teachersList').innerHTML = 
            '<div class="text-red-500">Failed to load teachers list. Please try again later.</div>';
    }
}

function displayTeachers(teachers) {
    const teachersList = document.getElementById('teachersList');
    if (teachers.length === 0) {
        teachersList.innerHTML = '<div class="teacherlist-text">Нет доступных преподавателей в данный момент.</div>';
        return;
    }
    
    teachersList.innerHTML = teachers.map(teacher => `
        <div class="teacherlist-show">
            <div class="teacherlist-show-p">${teacher.first_name} ${teacher.last_name}</div>
            <div class="teacherlist-show-p">Qualification: ${teacher.qualification || 'Not specified'}</div>
            <div class="teacherlist-show-p">${teacher.email}</div>
        </div>
    `).join('');
}

// Обновление UI для гостя
function updateUIforGuest() {
    const loginPrompt = document.getElementById('loginPrompt');
    if (loginPrompt) loginPrompt.classList.remove('hidden');
    
    document.getElementById('studentDashboard')?.classList.add('hidden');
    document.getElementById('teacherDashboard')?.classList.add('hidden');
    document.getElementById('managerDashboard')?.classList.add('hidden');
}

// Обновление UI для авторизованного пользователя
function updateUIforLoggedInUser(userData) {
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.textContent = 
            `С возвращением, ${userData.additional_info.first_name || userData.email}! Вы вошли как ${userData.role}.`;
    }
    
    const loginPrompt = document.getElementById('loginPrompt');
    if (loginPrompt) loginPrompt.classList.add('hidden');
    
    if (userData.role === 'student') {
        document.getElementById('studentDashboard')?.classList.remove('hidden');
    } else if (userData.role === 'teacher') {
        document.getElementById('teacherDashboard')?.classList.remove('hidden');
    } else if (userData.role === 'manager') {
        document.getElementById('managerDashboard')?.classList.remove('hidden');
    }
}

// Остальные функции (fetchUserData, loadRoleSpecificData) остаются без изменений
async function fetchUserData(token) {
    const response = await fetch('/api/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        const error = new Error('Failed to load user data');
        error.status = response.status;
        throw error;
    }
    
    return await response.json();
}

async function loadRoleSpecificData(role, token) {
    try {
        if (role === 'student') {
            const studentData = document.getElementById('studentData');
            studentData.innerHTML = '<div class="text-center">Loading your data...</div>';
            studentData.innerHTML = `
                <div class="bg-gray-50 p-6 rounded-lg">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Your Progress</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div class="text-sm text-gray-600">Current Level</div>
                            <div class="text-2xl font-bold text-indigo-600">B1</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600">Vocabulary Size</div>
                            <div class="text-2xl font-bold text-indigo-600">1200 words</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (role === 'teacher') {
            const teacherData = document.getElementById('teacherData');
            teacherData.innerHTML = '<div class="text-center">Loading your students...</div>';
            const response = await fetch('/api/students/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load students data');
            const students = await response.json();
            teacherData.innerHTML = students.length === 0 ? 
                '<div class="text-center">You don\'t have any students yet.</div>' :
                `
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">Your Students</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${students.map(s => `
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <div class="font-semibold">${s.first_name} ${s.last_name}</div>
                                <div class="text-sm text-gray-600">Level: ${s.level}</div>
                                <div class="text-sm text-gray-600">Vocabulary: ${s.vocabulary} words</div>
                            </div>
                        `).join('')}
                    </div>
                `;
        } else if (role === 'manager') {
            const managerData = document.getElementById('managerData');
            managerData.innerHTML = '<div class="text-center">Загрузка данных...</div>';
            const [teachersRes, studentsRes] = await Promise.all([
                fetch('/api/teachers/', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
                fetch('/api/students/', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json())
            ]);
            managerData.innerHTML = `
                <div class="manager-admin">
                    <div class="manager-teacher">
                        <h3>Управление преподавателями</h3>
                        <p class="mb-3">Всего учителей: ${teachersRes.length} </p>
                        <button class="teacher-add-button">
                            Добавить нового учителя
                        </button>
                    </div>
                    <div class="manager-student">
                        <h3>Управление студентами</h3>
                        <p class="mb-3">Всего студентов: ${studentsRes.length} </p>
                        <button class="student-add-button">
                            Добавить нового студента
                        </button>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error(`Error loading ${role} data:`, error);
        const dataContainer = document.getElementById(`${role}Data`);
        if (dataContainer) {
            dataContainer.innerHTML = '<div class="text-red-500">Error loading your data. Please try again later.</div>';
        }
    }
}