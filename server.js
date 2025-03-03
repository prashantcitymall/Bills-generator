const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Handle specific routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/internet-bill', (req, res) => {
    res.sendFile(path.join(__dirname, 'internet-bill.html'));
});

app.get('/fuel-bill', (req, res) => {
    res.sendFile(path.join(__dirname, 'fuel-bill.html'));
});

app.get('/rent-receipt', (req, res) => {
    res.sendFile(path.join(__dirname, 'rent-receipt.html'));
});

app.get('/book-invoice', (req, res) => {
    res.sendFile(path.join(__dirname, 'book-invoice.html'));
});

app.get('/driver-salary', (req, res) => {
    res.sendFile(path.join(__dirname, 'driver-salary.html'));
});

app.get('/restaurant-bill', (req, res) => {
    res.sendFile(path.join(__dirname, 'restaurant-bill.html'));
});

app.get('/hotel-bill', (req, res) => {
    res.sendFile(path.join(__dirname, 'hotel-bill.html'));
});

// Fallback route
app.get('*', (req, res) => {
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
