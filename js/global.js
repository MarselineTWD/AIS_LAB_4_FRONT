// Функция для определения текущей страницы
function isKabinetPage() {
    return window.location.pathname.endsWith('kabinet.html');
}

// Функция для обновления кнопки в header
function updateHeaderButton() {
    const token = localStorage.getItem('token');
    const authButton = document.getElementById('openModalBtn');

    if (authButton) {
        if (token) {
            if (isKabinetPage()) {
                // На странице kabinet.html показываем "Logout"
                authButton.removeAttribute('href');
                authButton.textContent = 'Разлогиниться';
                authButton.className = 'custom_test_button2 ';
                authButton.onclick = logout;
            } else {
                // На других страницах показываем "Личный кабинет"
                authButton.href = 'kabinet.html';
                authButton.textContent = 'Личный кабинет';
                authButton.className = 'custom_test_button';
                authButton.onclick = null;
            }
        } else {
            // Для неавторизованного пользователя
            authButton.href = 'login2.html';
            authButton.textContent = 'Авторизоваться';
            authButton.className = 'custom_test_button';
            authButton.onclick = null;
        }
    }
}

// Функция выхода из системы
function logout() {
    localStorage.removeItem('token');
    updateHeaderButton(); // Обновляем кнопку сразу после выхода
    window.location.reload(); // Перезагружаем страницу
}

// Загрузка header и обновление кнопки
function loadHeader() {
    fetch('/static/header.html', { cache: 'no-store' })
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-container').innerHTML = data;
            updateHeaderButton(); // Обновляем кнопку после загрузки header
        })
        .catch(error => console.error('Ошибка при загрузке header:', error));
}


// Выполняем загрузку header при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadHeader();
});

fetch('static/footer.html')
    .then(response => response.text())
    .then(data => {
            document.getElementById('footer-container').innerHTML = data;
        })
    .catch(error => console.error('Ошибка при загрузке футера:', error));
