const express = require('express');
const os = require('os');
const fs = require('fs');
const app = express();

// Configuration
const PORT = 3000;
const API_KEY = 'super-secret-key-12345'; // Replace with your own secure API key

// Middleware for API key authentication
app.use((req, res, next) => {
  const apiKey = req.query.api_key;
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(403).json({ error: 'Unauthorized: Invalid API key' });
  }
  next();
});

// Endpoint to check CPU usage
app.get('/cpu', (req, res) => {
  const cpus = os.cpus();
  const cpuUsage = cpus.map((cpu, index) => {
    const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
    const idle = cpu.times.idle;
    return { core: index, usage: ((1 - idle / total) * 100).toFixed(2) + '%' };
  });
  res.json({ cpuUsage });
});

// Endpoint to check memory usage
app.get('/memory', (req, res) => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  res.json({
    totalMemory: (totalMemory / 1024 / 1024).toFixed(2) + ' MB',
    usedMemory: (usedMemory / 1024 / 1024).toFixed(2) + ' MB',
    memoryUsage: ((usedMemory / totalMemory) * 100).toFixed(2) + '%',
  });
});

// Endpoint to check disk usage
app.get('/disk', async (req, res) => {
  try {
    const diskStats = fs.statSync('/');
    res.json({
      diskSize: diskStats.blksize + ' bytes',
      diskUsed: diskStats.blocks + ' blocks used',
    });
  } catch (error) {
    res.status(500).json({ error: 'Unable to retrieve disk information' });
  }
});

// Endpoint to check bandwidth usage
app.get('/bandwidth', (req, res) => {
  try {
    const networkStats = fs.readFileSync('/proc/net/dev', 'utf8');
    const interfaces = networkStats
      .split('\n')
      .slice(2) // Skip headers
      .map((line) => line.trim())
      .filter((line) => line)
      .map((line) => {
        const [iface, rxBytes, , , , , , , txBytes] = line.split(/\s+/);
        return {
          interface: iface.replace(':', ''),
          received: (parseInt(rxBytes, 10) / 1024 / 1024).toFixed(2) + ' MB',
          transmitted: (parseInt(txBytes, 10) / 1024 / 1024).toFixed(2) + ' MB',
        };
      });
    res.json({ interfaces });
  } catch (error) {
    res.status(500).json({ error: 'Unable to retrieve network information' });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
