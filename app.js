
const express = require('express');
const mongoose = require('mongoose');
const controllers = require('./controllers/allController');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');






//ML Aspects with Brainjs
const brain = require('brain.js');
const data = require('./data.json');

const network = new brain.recurrent.LSTM();

const trainingData = data.map(item => ({
input: item.text,
output: item.percentage
}));

network.train(trainingData, {
iterations: 2000
});





const {checkUser, requireAuth, requireMonoReauthToken} = require('./middleware/authMiddleware');

const app = express();

require('dotenv').config();

 mongoose.set('useCreateIndex', true);
const dbURI = 'mongodb+srv://Salem:Vybranium@test.oepe0.mongodb.net/Vybe?retryWrites=true&w=majority';

mongoose.connect( dbURI,  { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => app.listen(process.env.PORT || 5000))
    .catch((err) => console.log(err));


app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());


app.get('*', checkUser);

app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', requireAuth, requireMonoReauthToken, controllers.dashboard, controllers.alltransactions,  (req, res) => {
	const output = network.run(transactions.data[i].balance);
	res.render('dashboard',{resultdata:output);
});

app.post('/dashboard', controllers.dashboardPost);
app.get('/balances', controllers.balances, (req, res) => res.render('balances'));
app.get('/transaction', requireAuth, requireMonoReauthToken, controllers.alltransactions, (req, res) => res.render('transaction'));
app.get('/budget', controllers.balances, (req, res) => res.render('budget'));

app.use(authRoutes);

