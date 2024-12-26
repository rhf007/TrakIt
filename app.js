const express = require('express')
const path = require('path')

const app = express()

app.use(express.static('./public'))

// Set custom views folder location
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/sign-in', (req, res) => {
    res.render('sign-in')
});

app.get('/register', (req, res) => {
    res.render('register')
});

app.get('/movies', (req, res) => {
    res.render('movies')
})
app.listen(5000, () => {
    console.log('server listening on port 5000')
})