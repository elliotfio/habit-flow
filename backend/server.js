const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'habitflow',
    password: process.env.DB_PASSWORD || 'habitflow123',
    database: process.env.DB_NAME || 'habitflow'
});

async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS habits (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                frequency VARCHAR(50) DEFAULT 'daily',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS habit_logs (
                id SERIAL PRIMARY KEY,
                habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
                completed_at DATE DEFAULT CURRENT_DATE,
                notes TEXT
            )
        `);
        console.log('tables ok');
    } catch (err) {
        console.error('erreur init db', err.message);
    }
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/habits', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM habits ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/habits', async (req, res) => {
    const { name, description, frequency } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'nom requis' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO habits (name, description, frequency) VALUES ($1, $2, $3) RETURNING *',
            [name, description || '', frequency || 'daily']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/habits/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM habits WHERE id = $1', [req.params.id]);
        res.json({ message: 'ok' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/habits/:id/log', async (req, res) => {
    const { notes } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO habit_logs (habit_id, notes) VALUES ($1, $2) RETURNING *',
            [req.params.id, notes || '']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/habits/:id/logs', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM habit_logs WHERE habit_id = $1 ORDER BY completed_at DESC LIMIT 30',
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const habitsCount = await pool.query('SELECT COUNT(*) FROM habits');
        const logsToday = await pool.query(
            'SELECT COUNT(*) FROM habit_logs WHERE completed_at = CURRENT_DATE'
        );
        const logsTotal = await pool.query('SELECT COUNT(*) FROM habit_logs');
        res.json({
            totalHabits: parseInt(habitsCount.rows[0].count),
            completedToday: parseInt(logsToday.rows[0].count),
            totalLogs: parseInt(logsTotal.rows[0].count)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;

pool.connect()
    .then(() => {
        console.log('connecte a postgres');
        return initDB();
    })
    .then(() => {
        app.listen(PORT, () => {
            console.log('api ok sur le port ' + PORT);
        });
    })
    .catch(err => {
        console.error('erreur connexion db', err.message);
        setTimeout(() => process.exit(1), 5000);
    });
