const express = require('express');
const fetch = require('node-fetch');
const axios = require('axios');


const User = require('../models/userData');
const Balance = require('../models/Balance');
const jwt = require('jsonwebtoken');

// JWT and Cookie expiry
const maxAge = 3*24*60*60;




module.exports.dashboard = async (req,res, next) => {

	if(res.locals.data.user.monoId){

		const url = `https://api.withmono.com/accounts/${res.locals.data.user.monoId}/identity`

		const response = await fetch(url, { 
			method: 'GET', 
			headers: {
				'Content-Type': 'application/json',
				'mono-sec-key': 'test_sk_0nSCQSDC3utWiU9Pp91U'
			}
		});

		const data = await response.json();
		res.locals.dashboard = data;
		next();
	}else{
		next();
	}

}




module.exports.dashboardPost = async (req,res, next) => {
	// Retrieve code and user id from front end
	const { code, id } = req.body;

	url = "https://api.withmono.com/account/auth";

    const headers = {
		headers: {
					'Content-Type': 'application/json',
					'mono-sec-key': 'test_sk_0nSCQSDC3utWiU9Pp91U'
				}
			}

	if(code){
		console.log("Hi, this is dashboardPosttwo");
		// Retrieve mono id from front end
		const response = await axios.post(url, JSON.stringify({code}), headers)
		.then(function (res_) {
		  	console.log(res_.data)
			const dispatch = {
				$set: {
					monoId: res_.data.id,
					monoCode: code,
					monoStatus: false
				}
			}


			// Update collection with mono id and code
			try {
				User.updateOne({_id: id}, dispatch, {new: true}, function(err, res) {})}
                catch (err) {
                    console.log(err);
                };
			// Create instance in our balance collection
			Balance({ monoId: res_.id }).save();
			
			res.status(200).json('done')
		})
		.catch(err => res.status(501).send("Error fetching id"));

		  
	}else{
		res.status(500).json({ error: "Error somewhere" })
	}


	
	// next();
}




// handle errors
const handleErrors = (err) => {
	let errors = { email: '', password: '' };

	// handle login errors
	if (err.message === 'incorrect email') {
		errors.email ="This email is not registered"
	}

	if (err.message === 'incorrect password') {
		errors.password ="Wrong password"
	}

	// duplicate error code
	if (err.code === 11000) {
		errors.email = "Email is already taken.";
		return errors;
	}

	// validation errors
	if (err.message.includes('user validation failed')) {
		Object.values(err.errors).forEach(({properties}) => {
			errors[properties.path] = properties.message;
		})
	}
	return errors;	
}

const createToken = (id) =>{
	return jwt.sign({ id }, 'tsekjw46e7sk390oe6js83jks73o4jw84lw8i3mwy8392uijw9843lks834lw83ojks983lw8wok027md7338q0ebn894iro', {
		expiresIn: maxAge
	});
}

module.exports.signup_get = (req,res) => {
	res.render('signup');
}

module.exports.login_get = (req,res) => {
	res.render('login');
}

module.exports.signup_post = async (req,res) => {
	const { email, password } = req.body;

	try{
		const user = await User.create({email, password});
		const token = createToken(user._id);
		res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
		// res.status(201).json(user);
		res.status(201).json({user: user._id});
	}
	catch(err){
		const errors = handleErrors(err);
		res.status(400).json({ errors });
	}
}

module.exports.login_post = async (req,res) => {
	const { email, password } = req.body;
	try{
		const user = await User.login(email,password);
		const token = createToken(user._id);
		res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
		res.status(200).json({ user: user._id })
		console.log(req.body)
	}
	catch (err){
		const errors = handleErrors(err);
		res.status(400).json({ errors });
	}
}

module.exports.logout_get = (req, res) => {
	res.cookie('jwt', '', { maxAge: 1 });
	res.redirect('/');
}

module.exports.reauthorise = async function(id){
		let url = `https://api.withmono.com/accounts/${id}/reauthorise`	

		const response = await fetch(url, { 
			method: 'POST', 
			headers: {
				'Content-Type': 'application/json',
				'mono-sec-key': 'test_sk_0nSCQSDC3utWiU9Pp91U'
			}
		});

		const data = await response.json();

		return data.token;
}



module.exports.balances = async (req,res, next) => {
	if(res.locals.data.user.monoId){
		const url = `https://api.withmono.com/accounts/${res.locals.data.user.monoId}`

		const response = await fetch(url, { 
			method: 'GET', 
			headers: {
				'Content-Type': 'application/json',
				'mono-sec-key': 'test_sk_0nSCQSDC3utWiU9Pp91U'
			}
		});

		const data = await response.json();
		res.locals.balances = data;
		next();
	}
	else{
		res.locals.balances = ""
		next();
	}
}

module.exports.alltransactions = async (req,res, next) => {
	
	if(res.locals.data.user.monoId){
		
		// Check if data is still processing
		if (await res.locals.data.user.monoId) {

			let url = `https://api.withmono.com/accounts/${res.locals.data.user.monoId}/transactions`	
			let page = req.query.page || 1
			let finalUrl = url + `?page=${page}`

			const response = await fetch(finalUrl, { 
				method: 'GET', 
				headers: {
					'Content-Type': 'application/json',
					'mono-sec-key': 'test_sk_0nSCQSDC3utWiU9Pp91U'
				}
			});

			const data = await response.json();
			res.locals.transactions = data;
				console.log(data)
			next();			
		}

		res.locals.transactions = "PROCESSING";
		next()

	}
	else{
		res.locals.transactions = null;
		next();
	}

}