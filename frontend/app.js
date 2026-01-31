const API_URL = '/api';

document.addEventListener('DOMContentLoaded', function() {
    loadHabits();
    loadStats();
    
    document.getElementById('habitForm').addEventListener('submit', addHabit);
});

async function loadStats() {
    try {
        const response = await fetch(API_URL + '/stats');
        const stats = await response.json();
        
        document.getElementById('totalHabits').textContent = stats.totalHabits;
        document.getElementById('completedToday').textContent = stats.completedToday;
        document.getElementById('totalLogs').textContent = stats.totalLogs;
    } catch (err) {
        console.error('erreur stats', err);
    }
}

async function loadHabits() {
    const container = document.getElementById('habitsList');
    
    try {
        const response = await fetch(API_URL + '/habits');
        const habits = await response.json();
        
        if (habits.length === 0) {
            container.innerHTML = '<p class="empty-state">aucune habitude pour le moment</p>';
            return;
        }
        
        container.innerHTML = habits.map(habit => `
            <div class="habit-card" data-id="${habit.id}">
                <div class="habit-info">
                    <h3>${escapeHtml(habit.name)}</h3>
                    <p>${escapeHtml(habit.description || '')}</p>
                    <span class="frequency">${formatFrequency(habit.frequency)}</span>
                </div>
                <div class="habit-actions">
                    <button class="btn-complete" onclick="completeHabit(${habit.id})">Fait !</button>
                    <button class="btn-delete" onclick="deleteHabit(${habit.id})">Supprimer</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<p class="empty-state">erreur de chargement</p>';
        console.error('erreur', err);
    }
}

async function addHabit(e) {
    e.preventDefault();
    
    const name = document.getElementById('habitName').value;
    const description = document.getElementById('habitDesc').value;
    const frequency = document.getElementById('habitFreq').value;
    
    try {
        const response = await fetch(API_URL + '/habits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, frequency })
        });
        
        if (response.ok) {
            document.getElementById('habitForm').reset();
            loadHabits();
            loadStats();
        }
    } catch (err) {
        alert('erreur ajout');
        console.error(err);
    }
}

async function completeHabit(id) {
    try {
        const response = await fetch(API_URL + '/habits/' + id + '/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        if (response.ok) {
            loadStats();
            const card = document.querySelector(`[data-id="${id}"]`);
            if (card) {
                card.style.borderLeftColor = '#27ae60';
                setTimeout(() => {
                    card.style.borderLeftColor = '#3498db';
                }, 1500);
            }
        }
    } catch (err) {
        console.error('erreur', err);
    }
}

async function deleteHabit(id) {
    if (!confirm('Supprimer cette habitude ?')) return;
    
    try {
        const response = await fetch(API_URL + '/habits/' + id, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadHabits();
            loadStats();
        }
    } catch (err) {
        console.error('erreur', err);
    }
}

function formatFrequency(freq) {
    const labels = {
        'daily': 'Quotidien',
        'weekly': 'Hebdomadaire',
        'monthly': 'Mensuel'
    };
    return labels[freq] || freq;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
