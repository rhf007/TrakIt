import express from 'express'
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
import {MovieDb} from 'moviedb-promise';
import bcrypt from 'bcrypt';
import pool from './db/connect.js';
import session from 'express-session';

const app = express()
const __dirname = path.resolve();
const moviedb = new MovieDb(process.env.TMDB_API_KEY)

app.use(express.static('./public'))

// Set custom views folder location
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'ejs')
//to avoid submission errors
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
    session({
        secret: 'process.env.SESSION_SECRET',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
    })
);

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
            top_rated_series: top_rated_series,
            user: req.session.user
        })} catch (error) {
            console.log(error)
            res.status(500).send('Internal Server Error')
        }
    })
    
    //TODO: FILTERS
    app.get('/sign-in', (req, res) => {
        res.render('sign-in', { errors: [] })
    });
    app.get('/register', (req, res) => {
        res.render('register', { errors: [] })
    });
    
    app.post('/validate', async (req, res) => {
        const { username, email, password, 'confirm-password': confirm_password } = req.body;
        const errors = [];
        
        const isRegistration = username && confirm_password;
        
        if (!email || !password) {
            errors.push('Email and password are required.');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            errors.push('Invalid email address.');
        }
        
        if (password && password.length < 8) {
            errors.push('Password must be at least 8 characters.');
        }
        
        if (isRegistration) {
            if (!username) {
                errors.push('Username is required.');
            }
            
            if (password !== confirm_password) {
                errors.push('Passwords do not match.');
            }
            
            try {
                const [existingUser] = await pool.query(
                    'SELECT * FROM users WHERE username = ? OR email = ?',
                    [username, email]
                );
                if (existingUser.length > 0) {
                    errors.push('Username or email already exists.');
                }
            } catch (error) {
                console.error('Database error during registration check:', error);
                return res.status(500).send('Internal Server Error.');
            }
        }
        
        if (errors.length > 0) {
            const view = isRegistration ? 'register' : 'sign-in';
            return res.status(400).render(view, { errors });
        }
        
        if (isRegistration) {
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                
                await pool.query(
                    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                    [username, email, hashedPassword]
                );
                
                req.session.user = { username, email };
                
                return res.redirect('/');
            } catch (error) {
                console.error('Error inserting user during registration:', error);
                return res.status(500).send('Internal Server Error.');
            }
        }
        
        try {
            const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            if (user.length === 0) {
                errors.push('Invalid email or password.');
                return res.status(400).render('sign-in', { errors });
            }
            
            const isPasswordValid = await bcrypt.compare(password, user[0].password);
            if (!isPasswordValid) {
                errors.push('Invalid email or password.');
                return res.status(400).render('sign-in', { errors });
            }
            
            req.session.user = { username: user[0].username, email: user[0].email };
            
            return res.redirect('/');
        } catch (error) {
            console.error('Database error during login:', error);
            return res.status(500).send('Internal Server Error.');
        }
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
        console.log('Movies category:', category); // Log the category
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
            // in the popular endpoint in tmdb,
            // the same number of totalpages in discover is returned
            //  so in case the popular endpoint is chosen the pages are limited to  500
            //  because any page beyond 500 returns status code 22
            // same with series
        let total_pages = category_results.total_pages;
        if (category === 'popular' && total_pages > 500) {
            total_pages = 500;
        }
            
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
    
    app.get('/series/:category', async (req, res) => {
        const category = req.params.category;
        let page = parseInt(req.query.page) || 1;
        
        try {
            let category_results;
            
            switch (category) {
                case 'airing_today':
                category_results = await moviedb.tvAiringToday({page})
                break;
                case 'on_the_air':
                category_results = await moviedb.tvOnTheAir({page})
                break;
                case 'popular':
                    category_results = await moviedb.tvPopular({ page });
                break;
                case 'top_rated':
                category_results = await moviedb.tvTopRated({page})
                break;
                default:
                return res.status(400).send('Invalid category');
            }
                const genreResponse = await moviedb.genreTvList();
                const genres = genreResponse.genres;
                const countries = await moviedb.countries();
                const tvs = category_results.results;
                
        let total_pages = category_results.total_pages;
        if (category === 'popular' && total_pages > 500) {
            total_pages = 500;
        }
                
                res.render('series', {
                    series: tvs,
                    category: category,
                    genres: genres,
                    countries: countries,
                    totalPages: total_pages,
                    currentPage: page
                });
            }
        catch (error) {
            console.error(`Error fetching data: ${error}`);
            res.status(500).send('Internal Server Error');
        }
    })
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