const express = require('express');
const app = express();

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Node app listening on ${port}`));

module.exports = app;
