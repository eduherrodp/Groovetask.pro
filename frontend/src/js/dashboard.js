// dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
    // Check if code is in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    // Obtener el token y el ID del usuario del almacenamiento local
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_');

    if (token && userId) {
        console.log('Token and user ID found in localStorage: ', token, userId);
        try {
            // Enviar una solicitud al servidor para obtener la información del usuario
            const response = await fetch(`https://db.edhrrz.pro/user/info/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            if (response.ok) {
                const userData = await response.json();
                const username = userData.username;
                const email = userData.email;
                const googleCode = userData.googleCode;

                // Change the DOM, put username in all elements with class 'db-username'
                const usernameElements = document.querySelectorAll('.db-username');
                usernameElements.forEach(element => {
                    element.textContent = username;
                });

                document.getElementById('singout').addEventListener('click', async () => {
                    // End the session
                    localStorage.removeItem('token');
                    localStorage.removeItem('user_');
                    const response = await fetch('https://db.edhrrz.pro/user/logout', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                    }).catch(error => console.error('Error:', error.message));
                    if (response.ok) {
                        window.location.href = '/login';
                    } else {
                        const errorData = await response.json();
                        console.error('Error ending session:', errorData.error);
                    }
                });

                // We need to hide the linkGoogleAccountSection if the user already has a googleCode
                if (googleCode !== null && googleCode !== '') {
                    const linkGoogleAccountSection = document.getElementById('linkGoogleAccountSection-G');
                    linkGoogleAccountSection.classList.add('fade-out');
                    setTimeout(() => {
                        linkGoogleAccountSection.style.display = 'none';
                        const parentLinkGoogleAccountSection = document.getElementById('parent-linkGoogle');
                        document.getElementById('principal').classList.remove('ocultar');
                        parentLinkGoogleAccountSection.classList.remove('justify-content-center', 'align-items-center');
                    }, 300);

                    console.log('Send googleCode to the backend to exchange it for a token in server:', googleCode);

                    // Send googleCode to the backend to exchange it for a token in server
                    const response = await fetch('https://db.edhrrz.pro/user/getToken', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ code: googleCode }),
                    });

                    // CONCLUYO FETCH

                    if (response.ok) {
                        const data = await response.json();

                        console.log('Data:', data);

                        // Set lists
                        const cardBody = document.querySelector('#my-lists .card-body');
                        cardBody.innerHTML = '';
                        let totalTasks = 0;
                        let completedTasks = 0;
                        let nearestDueDateTask;

                        data.forEach(taskList => {
                            const cardText = document.createElement('p');
                            cardText.classList.add('card-text');
                            cardText.textContent = taskList.title;
                            cardBody.appendChild(cardText);

                            taskList.tasks.forEach(task => {
                                totalTasks++;
                                if (task.status === 'completed') {
                                    completedTasks++;
                                }
                                if (!nearestDueDateTask || (task.due && new Date(task.due) < new Date(nearestDueDateTask.due))) {
                                    nearestDueDateTask = task;
                                }
                            });
                        });
                        // Set the nearest due date task in the DOM
                        console.log(document.getElementById('nearestDueDateTask'));
                        document.getElementById('nearestDueDateTask').innerText = nearestDueDateTask ? nearestDueDateTask.title : 'No tasks found';

                        // Display total tasks and completed tasks
                        console.log('Total tasks:', totalTasks);
                        console.log('Completed tasks:', completedTasks);

                        // Display nearest due date task
                        console.log('Nearest due date task:', nearestDueDateTask);

                        // Set the total tasks and completed tasks in the DOM
                        console.log(document.getElementById('task-completed'));
                        console.log(document.getElementById('total-tasks'));
                        document.getElementById('task-completed').textContent = completedTasks;
                        document.getElementById('total-tasks').textContent = totalTasks;

                        // Crear grafico con chart.js para mostrar las tareas de cada lista (grafico de barras)
                        // Crear gráfico de pastel para mostrar la cantidad de tareas completadas y pendientes
                        const pieChartCanvas = document.getElementById('pieChart');
                        const pendingTasks = totalTasks - completedTasks;

                        const pieChart = new Chart(pieChartCanvas, {
                            type: 'pie',
                            data: {
                                labels: ['Completed Tasks', 'Pending Tasks'],
                                datasets: [{
                                    data: [completedTasks, pendingTasks],
                                    backgroundColor: ['#36a2eb', '#ff6384'],
                                    hoverBackgroundColor: ['#36a2eb', '#ff6384']
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        fontColor: '#333',
                                        fontSize: 12,
                                        boxWidth: 10
                                    }
                                }
                            }
                        });

                        // Save tokens in localStorage
                        localStorage.setItem('googleTokens', JSON.stringify(tokens));
                    }
                }

            } else {
                const errorData = await response.json();
                console.error('Error fetching user data:', errorData.error);
            }
        } catch (error) {
            console.error('Error fetching user data:', error.message);
        }
    } else {
        console.error('Token or user ID not found in localStorage');
        // User is not logged in, redirect to login page
        window.location.href = 'https://edhrrz.pro/pages/login.html';
    }


    const linkGoogleAccountButton = document.getElementById('linkGoogleAccount');
    if (linkGoogleAccountButton) {
        linkGoogleAccountButton.addEventListener('click', async () => {
            try {
                // Send request to API server to get authorization URL
                const response = await fetch('https://api.edhrrz.pro/getLink', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const authorizationLink = data.link;

                    window.location.href = authorizationLink;
                } else {
                    console.error('Error fetching authorization link:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching authorization link:', error.message);
            }
        });
    }

    // Event listener for linking Google account    
    if (code) {
        console.log('Code found in URL:', code);
        // Update the user's googleCode in the database
        const response = await fetch('https://db.edhrrz.pro/user/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid: userId, type: 'googleCode', data: code }),
        });


        if (response.ok) {
            console.log('Code saved in database');
        } else {
            console.error('Error saving code in database:', response.statusText);
        }

        // Remove the code from the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        // Then reload the page
        window.location.reload();
    }
});