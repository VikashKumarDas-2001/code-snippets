// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Import CSS file

function App() {
  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState('');
  const [stdin, setStdin] = useState('');
  const [sourcecode, setSourcecode] = useState('');
  const [snippets, setSnippets] = useState([]);

  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = () => {
    axios.get('http://localhost:3001/snippets') // Use port 3001 for backend
      .then(response => {
        setSnippets(response.data);
      })
      .catch(error => {
        console.error('Error fetching snippets: ', error);
      });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    axios.post('http://localhost:3001/submit', { // Use port 3001 for backend
      username,
      language,
      stdin,
      sourcecode
    })
      .then(response => {
        alert('Code snippet submitted successfully');
        setUsername('');
        setLanguage('');
        setStdin('');
        setSourcecode('');
        fetchSnippets();
      })
      .catch(error => {
        console.error('Error submitting code snippet: ', error);
        alert('Error submitting code snippet');
      });
  };

  return (
    <div>
      <h1>Submit Your Code Snippet</h1>
      <form onSubmit={handleSubmit}>
        <label>Username:</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required /><br />

        <label>Preferred Code Language:</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} required>
          <option value="">Select a language</option>
          <option value="C++">C++</option>
          <option value="Java">Java</option>
          <option value="JavaScript">JavaScript</option>
          <option value="Python">Python</option>
        </select><br />

        <label>Standard Input (stdin):</label>
        <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows="4" cols="50"></textarea><br />

        <label>Source Code:</label>
        <textarea value={sourcecode} onChange={(e) => setSourcecode(e.target.value)} rows="10" cols="50" required></textarea><br />

        <input type="submit" value="Submit" />
      </form>

      <h2>Submitted Snippets</h2>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Language</th>
            <th>Stdin</th>
            <th>Timestamp</th>
            <th>Source Code (Preview)</th>
          </tr>
        </thead>
        <tbody>
          {snippets.map((snippet, index) => (
            <tr key={index}>
              <td>{snippet.username}</td>
              <td>{snippet.language}</td>
              <td>{snippet.stdin}</td>
              <td>{snippet.timestamp}</td>
              <td>{snippet.sourcecode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
