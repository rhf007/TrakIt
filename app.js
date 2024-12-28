const express = require('express')
const path = require('path')
const app = express()
require('dotenv').config();
const { MovieDb } = require('moviedb-promise')
const moviedb = new MovieDb(process.env.TMDB_API_KEY)



app.use(express.static('./public'))

// Set custom views folder location
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    moviedb.discoverMovie()
        .then((results) => {
            const movies = results.results;
            res.render('index', { movies });
        })
        .catch((error) => {
            console.error('Error fetching movies:', error);
            res.status(500).send('Internal Server Error');
        });
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