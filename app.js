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
// Route to handle other requests
app.get('/sign-in', (req, res) => {
    /* res.sendFile(path.join(__dirname, 'public', 'about.html')); */
    res.render('sign-in')
});
app.listen(5000, () => {
    console.log('server listening on port 5000')
})