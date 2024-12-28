const express = require('express')
const path = require('path')
const app = express()
require('dotenv').config();
const { MovieDb } = require('moviedb-promise')
const moviedb = new MovieDb(process.env.TMDB_API_KEY)
const axios = require('axios')



app.use(express.static('./public'))

// Set custom views folder location
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'ejs')

app.get('/', async(req, res) => {
    let now_playing_movies = []
    let popular_movies = []
    let top_rated_movies = []
    let upcoming_movies =[]

    try {
        const now_playing_results = await moviedb.movieNowPlaying()
        now_playing_movies.push(...now_playing_results.results)
        const now_playing_slice = now_playing_movies.slice(0, 18)

        const popular_results = await moviedb.moviePopular()
        popular_movies.push(...popular_results.results)
        const popular_slice = popular_movies.slice(0, 18)

        const top_rated_results = await moviedb.movieTopRated()
        top_rated_movies.push(...top_rated_results.results)
        const top_rated_slice = top_rated_movies.slice(0, 18)

        const upcoming_results = await moviedb.upcomingMovies()
        upcoming_movies.push(...upcoming_results.results)
        const upcoming_slice = upcoming_movies.slice(0, 18)

        res.render('index', {
            now_playing_movies: now_playing_slice,
            popular_movies: popular_slice,
            top_rated_movies: top_rated_slice,
            upcoming_movies: upcoming_slice
        })} catch (error) {
            console.log(error)
            res.status(500).send('Internal Server Error')
        }
    })

    app.get('/sign-in', (req, res) => {
        res.render('sign-in')
    });
    
    app.get('/register', (req, res) => {
        res.render('register')
    });
    
    app.get('/movies', async(req, res) => {
        const Movies = []
        const TV = []
        let movie_slice = []
        let tv_slice = []
        const pages = 2
        
        try{
            for (let i = 1; i <= pages; i++) {
                const movie_results = await moviedb.discoverMovie({page: i})
                Movies.push(...movie_results.results)
            }
            
            movie_slice = Movies.slice(0, 30)
            
            const tv_results = await axios.get('https://api.tvmaze.com/shows')
            
            TV.push(...tv_results.data)
            tv_slice = TV.slice(0, 30)
            
            res.render('movies', {movies: movie_slice, tvs: tv_slice})
        } catch(error){
            console.error(`Error fetching movies: ${error}`);
            res.status(500).send('Internal Server Error');
        }
    })
    app.listen(5000, () => {
        console.log('server listening on port 5000')
    })