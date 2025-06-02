const express = require('express');
const app = express();
const port = 3131;

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('hi')
})

app.listen(port, (err) => {
    if(err) return console.log(err);
    console.log(`listening at http://localhost:${port}`)
})