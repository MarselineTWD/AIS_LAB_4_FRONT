// function returnToHome() {
//     // Скрываем секцию тестов и очищаем вопросы
//     const testContainer = document.getElementById('test-container');
//     testContainer.style.display = 'none';
//     document.getElementById('questions').innerHTML = '';

//     // Скрываем секцию результатов
//     document.getElementById('results').style.display = 'none';

//     // Показываем секцию выбора уровня
//     const levelSelection = document.getElementById('level-selection');
//     levelSelection.style.display = 'flex';
// }


// const buttons = document.querySelectorAll('#level-selection button');
// buttons.forEach(button => {
//     button.style.margin = '0 auto'; // Центрируем кнопки
//     button.style.display = 'block'; // Убеждаемся, что кнопки ведут себя как блочные элементы
// });


// document.getElementById('return-home-btn').addEventListener('click', returnToHome);


document.addEventListener('DOMContentLoaded', () => {
    const questionBlocks = document.querySelectorAll('.question-block');
    const submitButton = document.getElementById('submit-test');
    const answers = new Array(questionBlocks.length).fill(null);

    questionBlocks.forEach(block => {
        const optionButtons = block.querySelectorAll('.option-btn');
        const questionIndex = block.dataset.questionIndex;

        optionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Deselect other buttons in this question block
                optionButtons.forEach(otherBtn => otherBtn.classList.remove('selected'));
                
                // Select current button
                btn.classList.add('selected');
                
                // Store the selected answer
                answers[questionIndex] = btn.dataset.option;
            });
        });
    });

    submitButton.addEventListener('click', async () => {
        // Check if all questions are answered
        if (answers.some(answer => answer === null)) {
            alert('Please answer all questions before submitting.');
            return;
        }

        try {
            const response = await fetch('/submit-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ answers })
            });

            const result = await response.json();

            if (response.ok) {
                // Redirect or show result
                alert(`Your score: ${result.score}/10\nNew Level: ${result.new_level}`);
                window.location.href = '/dashboard';
            } else {
                alert('Test submission failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while submitting the test');
        }
    });
});