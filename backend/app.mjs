// backend/app.mjs
import express from 'express';
import bodyParser from 'body-parser';
import mysql from 'mysql';
import redis from 'redis';
import fetch from 'node-fetch';
import cors from 'cors'; // Import cors module

const app = express();
const port = process.env.PORT || 3001; // Use port 3001 for the backend

// MySQL Connection
const connection = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '',
    database: 'mydatabase'
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ', err.stack);
        process.exit(1); // Exit the application if unable to connect to MySQL
    }
    console.log('Connected to MySQL as ID: ', connection.threadId);
});

// Redis Client
const redisClient = redis.createClient();

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Use cors middleware

// API Endpoints
app.post('/submit', async (req, res) => {
    try {
        const { username, language, stdin, sourcecode } = req.body;
        const timestamp = new Date().toISOString();
        const sql = 'INSERT INTO code_snippets (username, language, stdin, sourcecode, timestamp) VALUES (?, ?, ?, ?, ?)';

        // Submit code to Judge0 API for execution
        const judge0Response = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&fields=*', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-RapidAPI-Key': '468d3c1b73msh30231e95448655ep19380ejsn32f7b12e3d62',
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            },
            body: JSON.stringify({
                source_code: sourcecode,
                language_id: language === 'JavaScript' ? 29 : 4,
                stdin: stdin
            })
        });

        const judge0Data = await judge0Response.json();
        const stdout = judge0Data.stdout;

        // Store input and output in Redis
        redisClient.hmset(username, {
            language: language,
            stdin: stdin,
            sourcecode: sourcecode,
            timestamp: timestamp,
            stdout: stdout
        });

        // Insert the code snippet into the database
        connection.query(sql, [username, language, stdin, sourcecode, timestamp], (err, result) => {
            if (err) {
                console.error('Error inserting code snippet: ', err.stack);
                res.status(500).json({ error: 'Error submitting code snippet' });
                return;
            }
            console.log('Code snippet submitted successfully');
            res.status(200).json({ message: 'Code snippet submitted successfully' });
        });
    } catch (error) {
        console.error('Error submitting code snippet: ', error);
        res.status(500).json({ error: 'Error submitting code snippet' });
    }
});

// Endpoint to retrieve code snippets
app.get('/snippets', (req, res) => {
    try {
        const username = req.query.username;

        // Check Redis cache first
        redisClient.hgetall(username, (err, data) => {
            if (err) {
                console.error('Error fetching data from Redis: ', err);
            }

            if (data) {
                // Data found in Redis cache
                console.log('Data retrieved from Redis cache');
                res.status(200).json([data]);
            } else {
                // Data not found in Redis, fetch from database
                const sql = 'SELECT * FROM code_snippets WHERE username = ?';
                connection.query(sql, [username], (err, results) => {
                    if (err) {
                        console.error('Error retrieving code snippets: ', err.stack);
                        res.status(500).json({ error: 'Error retrieving code snippets' });
                        return;
                    }
                    console.log('Data retrieved from MySQL');
                    res.status(200).json(results);
                });
            }
        });
    } catch (error) {
        console.error('Error fetching snippets: ', error);
        res.status(500).json({ error: 'Error fetching snippets' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
