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
fetch('static/header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-container').innerHTML = data;
        })
    .catch(error => console.error('Ошибка при загрузке футера:', error));
    
fetch('static/footer.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('footer-container').innerHTML = data;
    })
    .catch(error => console.error('Ошибка при загрузке футера:', error));
