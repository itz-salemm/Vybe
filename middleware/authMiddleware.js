const jwt = require('jsonwebtoken');
const User = require('../models/userData');
const Balance = require('../models/Balance');
const {reauthorise} = require('../controllers/allController');


const requireAuth = ( req, res, next) => {
	const token = req.cookies.jwt;

	// check if jwt exists & is verified
	if (token) {
		jwt.verify(token, 'tsekjw46e7sk390oe6js83jks73o4jw84lw8i3mwy8392uijw9843lks834lw83ojks983lw8wok027md7338q0ebn894iro', (err, decodedToken) => {
			if (err) {
				console.log(err.message);
				res.redirect('/login');
			}else{
				// console.log(decodedToken);
				next();
			}
		});
	}else{
		res.redirect('/login');
	}
}


const checkUser = (req, res, next) => {
	const token = req.cookies.jwt;

	if (token) {
		jwt.verify(token, 'tsekjw46e7sk390oe6js83jks73o4jw84lw8i3mwy8392uijw9843lks834lw83ojks983lw8wok027md7338q0ebn894iro', async (err, decodedToken) => {
			if (err) {
				console.log(err.message);
				res.locals.data = null;
				res.locals.reauth = null;
				next();
			}else{
				let monoBalance = ""
				let user = await User.findById(decodedToken.id)
				
				if (user && user['monoId']){
					monoBalance = await Balance.findOne({ monoId:user.monoId })
				}

				res.locals.reauth = null;				
				res.locals.data = {
					user,
					monoBalance,
					publicKey: MONO_PUBLIC_KEY='test_pk_FvmsDmo8DP8Sbujy874g',
					secretKey: 'test_sk_0nSCQSDC3utWiU9Pp91U'
				}
				
				next();
			}
		});
	}else{
		res.locals.data = null;
		res.locals.reauth = null;
		next();
	}
}


const requireMonoReauthToken = async ( req, res, next) => {
	if (res.locals.data.user.monoStatus) {
		const reauthoriseToken = await reauthorise(res.locals.data.user.monoId)
		const query = {
			monoId: res.locals.data.user.monoId
		};
	
		const result = {
			$set: {
				monoReauthToken: reauthoriseToken,
			}
		}
	
		await User.updateOne(query, result, {new: true}, function(err, res) {});

		// res.locals.reauth = reauthoriseToken
		res.redirect('/monoReauth');
	}else{
		next();
	}
}

module.exports = { checkUser, requireAuth, requireMonoReauthToken };