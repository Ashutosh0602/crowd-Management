if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const path = require('path');
const app = express();
const User = require('./models/user');
const Event = require('./models/event');
const Token = require('./models/token');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local');
const countapi = require('countapi-js');
const { findById } = require('./models/user');
const multer = require('multer');
const { storage } = require('./cloudinary/index'); //Node automatically searches for index files hence we do not have to mention it specifically.
const upload = multer({ storage });

mongoose.connect('mongodb://localhost:27017/eventsApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then((res) => {
        console.log('CONNECTED');
    })
    .catch(err => console.log('ERROR', err));


const db = mongoose.connection;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const sessionConfig = {
    secret: 'thisshouldbeasecret',
    resave: false,
    saveUninitialised: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    next();
})

const isLoggedIn = (req, res, next) => {
    if (!req.user) {
        req.flash('error', 'Must be logged in to view this page');
        return res.redirect('/login');
    }
    next();
}

app.get('/', (req, res) => {
    res.redirect('/home');
})
app.get('/home', (req, res) => {

    res.render('users/home');
})



app.post('/profile/:id', isLoggedIn, async (req, res) => {
    const user = await User.findById(req.user._id);
    user.desc = req.body.desc;
    await user.save();
    res.redirect(`/profile/${req.user._id}`)
})

app.get('/profile/:id', isLoggedIn, async (req, res) => {
    const user = await User.findById(req.params.id);
    console.log(user);
    (await user.populate('registeredEvents')).populate('hostedEvents');
    await user.save();
    const hostedEvents = user.hostedEvents;
    const registeredEvents = user.registeredEvents;
    res.render('users/profile', { hostedEvents, registeredEvents, user });
})

app.get('/events', async (req, res) => {
    const events = await Event.find({});
    res.render('users/events', { events });
})

app.post('/events/:id/registerEvent', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
        return res.redirect('/events');
    }
    const user = await User.findById(req.user._id);
    user.registeredEvents.push(event._id);
    await user.save();
    const { tl_name, tl_mail, pl_name, pl_mail } = req.body;
    const token = new Token({
        leaderName: tl_name,
        leaderMail: tl_mail,
        playerName: pl_name,
        playerMail: pl_mail
    })
    token.event = event;
    await token.save();

    res.redirect(`/events/${id}`);
})

app.get('/events/:id/registerEvent', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const event = await Event.findById(id);
    res.render('users/registerEvent', { event });
})

app.get('/events/:id', async (req, res) => {

    const { id } = req.params;
    const event = await Event.findById(id);
    countapi.get('events', event.name).then((result) => { console.log(result) });
    res.render('users/eventDetails', { event });
})

app.get('/createEvent', (req, res) => {
    res.render('users/createEvent');
})


app.post('/createEvent', isLoggedIn, upload.single('image'), async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    const event = req.body.event;
    const add = req.body.add;
    const registeredEvent = new Event(event);
    const user = await User.findById(req.user._id);
    user.hostedEvents.push(registeredEvent);
    await user.save();
    countapi.set('events', event.name, 0).then((result) => { console.log(result.value) });
    registeredEvent.add = add;
    registeredEvent.author = req.user;
    const { path, filename } = req.file;
    registeredEvent.image = { path, filename };
    await registeredEvent.save();
    res.render('users/eventDetails', { event });
})

app.get('/login', (req, res) => {
    res.render('users/login');
})

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {

    req.flash('success', 'Welcome back');
    res.redirect(`/profile/${req.user._id}`);

})

app.get('/logout', isLoggedIn, (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err) };
        req.flash('success', "Goodbye!");
        res.redirect('/login');
    });
})

app.get('/register', (req, res) => {
    res.render('users/register');
})

app.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        console.log(user);
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            res.redirect(`/profile/${user._id}`);
        })
    } catch (e) {
        res.redirect('register');
    }
})

app.get('/register2', (req, res) => {
    res.render('/register2');
})



app.listen('3000', () => {
    console.log('LISTENING ON PORT 3000');
})