const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')({
    client: 'pg',
    connection: {
        host : '127.0.0.1',
        user : 'postgres',
        password : '2001Gohar0817',
        database : 'smart-brain'
    }
});

const app = express();
app.use(bodyParser.json());
app.use (cors());


app.get('/', (req, res) => {
    res.send('Success');
})

app.post('/SignIn', (req, res) => {
    const {email , password} = req.body;
    if (!email || !password) {
        return res.status(400).json('Incorrect Form Submission');
    }
    knex.select('email' , 'hash').from('login')
        .where('email','=',email)
        .then (data => {
            const isValid = bcrypt.compareSync(password, data[0].hash);
            if (isValid)
            {
                knex.select('*').from('users')
                .where('email','=',email)
                .then(user => {
                    res.json(user[0]);
                })
                .catch(err => res.status(400).json('Unable to LogIn'));
            }
            else {
                res.status(400).json('Wrong Credentials');
            }
        })
        .catch(err => res.status(400).json('Wrong Credentials'));
})

app.post('/Register', (req, res) => {
    const { email,name,password} = req.body;
    if (!email || !name || !password) {
        return res.status(400).json('Incorrect Form Submission');
    }
    const hash = bcrypt.hashSync(password);
        knex.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email
            })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                .returning('*')
                .insert({
                    email: email,
                    name: name,
                    joined : new Date()
                })
                .then(user => {
                    res.json(user[0]);
                })
            })
            .then(trx.commit)
            .catch(trx.rollback)
        })    
        .catch(err => res.status(400).json('Unable to Register'));
    
})

app.get('/profile/:id', (req, res) => {
    const {id} = req.params;
    let found = false;
    knex.select('*').from('users').where({id})
        .then(users => {
            if (users.length){
                res.json(users[0]);
            }else {
                res.status(400).json('Not Found')
            }
        })
        .catch(err => res.status(400).json('Error Getting User'));
})

app.put('/image',(req, res) => {
    const {id} = req.body;
    knex('users').where('id','=',id)
    .increment('entries' , 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0]);
    })
    .catch(err => res.status(400).json('Unable To Get Entries'));
})

app.listen(3000, () =>{
    console.log('App is Running on port 3000');
})