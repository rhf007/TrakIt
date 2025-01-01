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

app.get('/', async(req, res) => {
    let now_playing_movies = []
    let popular_movies = []
    let top_rated_movies = []
    let upcoming_movies =[]
    let airing_today_series = []
    let popular_series = []
    let on_the_air_series = []
    let top_rated_series = []
    
    try {
        const now_playing_results = await moviedb.movieNowPlaying()
        now_playing_movies.push(...now_playing_results.results)
        
        const popular_results = await moviedb.moviePopular()
        popular_movies.push(...popular_results.results)
        
        const top_rated_results = await moviedb.movieTopRated()
        top_rated_movies.push(...top_rated_results.results)
        
        const upcoming_results = await moviedb.upcomingMovies()
        upcoming_movies.push(...upcoming_results.results)
        
        const airing_today_results = await moviedb.tvAiringToday()
        airing_today_series.push(...airing_today_results.results)
        
        const popular_series_results = await moviedb.tvPopular()
        popular_series.push(...popular_series_results.results)
        
        const on_the_air_results = await moviedb.tvOnTheAir()
        on_the_air_series.push(...on_the_air_results.results)
        
        const top_rated_series_results = await moviedb.tvTopRated()
        top_rated_series.push(...top_rated_series_results.results)
        
        res.render('index', {
            now_playing_movies: now_playing_movies,
            popular_movies: popular_movies,
            top_rated_movies: top_rated_movies,
            upcoming_movies: upcoming_movies,
            airing_today_series: airing_today_series,
            popular_series: popular_series,
            on_the_air_series: on_the_air_series,
            top_rated_series: top_rated_series
        })} catch (error) {
            console.log(error)
            res.status(500).send('Internal Server Error')
        }
    })
    
    //TODO: CREATE DATABSE, HANDLE FORM VALIDATION, FILTERS ETC
app.get('/sign-in', (req, res) => {
    res.render('sign-in')
});
app.get('/register', (req, res) => {
    res.render('register')
});    

app.get('/movies', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    let Movies = [];
    try {
        
        const movieResults = await moviedb.discoverMovie({ page });
        Movies = movieResults.results;

        const genreResponse = await moviedb.genreMovieList();
        const genres = genreResponse.genres;
        const countries = await moviedb.countries();

        const totalPages = movieResults.total_pages;
        const currentPage = movieResults.page;

        res.render('movies', {
            movies: Movies,
            genres,
            countries,
            currentPage,
            totalPages,
        });
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/movies/:category', async (req, res) => {
    const category = req.params.category;
    let page = parseInt(req.query.page) || 1;

    try {
        let category_results;
        
        switch(category) {
            case 'now_playing':
                category_results = await moviedb.movieNowPlaying({ page });
                break;
            case 'popular':
                category_results = await moviedb.moviePopular({ page });
                break;
            case 'top_rated':
                category_results = await moviedb.movieTopRated({ page });
                break;
            case 'upcoming':
                category_results = await moviedb.upcomingMovies({ page });
                break;
            default:
                return res.status(400).send('Invalid category');
        }

        const genreResponse = await moviedb.genreMovieList();
        const genres = genreResponse.genres;
        const countries = await moviedb.countries();
        const movies = category_results.results;
        const total_pages = category_results.total_pages;

        // Send the data to the view
        res.render('movies', {
            movies: movies,
            category: category,
            genres: genres,
            countries: countries,
            totalPages: total_pages,
            currentPage: page
        });
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/series', async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    let tv = [];
    try {
        
        const tvResults = await moviedb.discoverTv({ page });
        tv = tvResults.results;

        const genreResponse = await moviedb.genreTvList();
        const genres = genreResponse.genres;
        const countries = await moviedb.countries();

        const totalPages = tvResults.total_pages;
        const currentPage = tvResults.page;

        res.render('series', {
            series: tv,
            genres,
            countries,
            currentPage,
            totalPages,
        });
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
        res.status(500).send('Internal Server Error');
    }
})

//TODO: MAKE CATEGORIES FOR SERIES

app.get('/details/:id', async (req, res) => {
    const { id } = req.params;
    //TODO: DO THE SAME FOR SERIES
    try {
        const movieDetails = await moviedb.movieInfo({ id }); 
        res.render('details', { details: movieDetails });
    } catch (error) {
        console.error('Error fetching details:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(5000, () => {
    console.log('server listening on port 5000')
})