document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("registrationForm").addEventListener("submit", async function (e) {
        e.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const age = parseInt(document.getElementById("age").value);
        const gender = document.getElementById("gender").value;
        const email = document.getElementById("email").value.trim();
        const englishLevel = document.getElementById("englishLevel").value;
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();

        // Проверка совпадения паролей
        if (password !== confirmPassword) {
            alert("Пароли не совпадают!");
            return;
        }

        // Формируем объект данных для отправки
        const data = {
            first_name: firstName,
            last_name: lastName,
            age: age,
            sex: gender === "male" ? "M" : gender === "female" ? "F" : "O",
            email: email,
            level: englishLevel,
            password: password,
            teacher_id: 1, // Фиксированный ID преподавателя
            vocabulary: 0   // Начальный словарный запас
        };

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert("Регистрация прошла успешно!");
                window.location.href = "login2.html"; // Перенаправление на авторизацию
            } else {
                const errorData = await response.json();
                alert(`Ошибка регистрации: ${errorData.detail}`);
            }
        } catch (error) {
            console.error("Ошибка:", error);
            alert("Не удалось выполнить регистрацию. Попробуйте снова.");
        }
    });
});
