const express = require('express');
const app = express();
const path = require('path');

const json2html = require('json-to-html');

const bodyParser = require('body-parser');
const request = require('request');


const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const { auth } = require('express-openid-connect');

const bf = require('./boatFunc');


const router = express.Router();
const login = express.Router();
const owners = express.Router();

const CLIENT_ID = 'XtyNRhQzvVQi4PCvhIB79zxG7czPOYng';
const CLIENT_SECRET = 'fMRxBgBY12vmncTke1ySRcJlPHru11oyNJAFIXvMdEbHXgzwRynbHZ5_U7ucANns';
const DOMAIN = '493-fall-22.us.auth0.com';

// 'https://hw7-bertella.wn.r.appspot.com'
// 'https://8080-cs-1005895697844-default.cs-us-west1-ijlt.cloudshell.dev'
const config = {
    authRequired: false,
    auth0Logout: true,
    baseURL: 'https://8080-cs-1005895697844-default.cs-us-west1-ijlt.cloudshell.dev',
    clientID: CLIENT_ID,
    issuerBaseURL: 'https://493-fall-22.us.auth0.com',
    secret: 'LONG_RANDOM_STRING'
};


app.use(bodyParser.json());
// https://493-fall-22.us.auth0.com/.well-known/jwks.json
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${DOMAIN}/.well-known/jwks.json`
    }),
  
    // Validate the audience and the issuer.
    issuer: `https://${DOMAIN}/`,
    algorithms: ['RS256']
});

/* ------------- Begin Controller Functions ------------- */
router.get('/', checkJwt, function(err, req, res, next){
    if (err){
        console.log(err);
        bf.get_boats_unprotected().then( (boats) => {
            res.status(200).json(boats);
        });
    } else {
        next('route');
    }
});

router.get('/', checkJwt, function(req, res){
    console.log(req);
    //console.log(req.auth);
    //console.log(err)
    
    console.log(JSON.stringify(req.auth));
    bf.get_boats(req.auth.sub).then( (boats) => {
        res.status(200).json(boats);
    });
    

});

router.get('/unsecure', function(req, res){
    bf.get_boats_unprotected().then( (boats) => {
        res.status(200).json(boats);
    });
});

owners.get('/:owners_id/boats', checkJwt, function(err, req, res, next){
    if (err){
        console.log(err);
        next('route');
    } else {
        next('route');
    }
});

owners.get('/:owners_id/boats', checkJwt, function(req, res){
    let id = req.params.owners_id;

    //res.send({'id': id, 'owner': req.auth});
    bf.get_boats(id).then((boats) => {
        res.status(200).json(boats);
    });
});

router.post('/', checkJwt, function(req, res){
    if(req.get('content-type') !== 'application/json'){
        res.status(415).send('Server only accepts application/json data.')
    }
    bf.post_boat(req.body.name, req.body.type, req.body.length, req.body.public, req.auth.sub)
    .then( key => {
        res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
        res.status(201).send({ "id": key.id });
    } );
});

router.delete('/:boat_id', checkJwt, function(err, req, res, next){
    if (err){
        console.log(err);
        res.status(401).send({"Error": "Missing or invalid JWT"});
    } else {
        next('route');
    }
});

router.delete('/:boat_id', (req, res) => {
    bf.get_boat(req.params.boat_id).then((boat) => {
        console.log(boat);
        console.log(req.auth);
        if (boat[0] === undefined || boat[0] === null) {
            res.status(403).send({'Error':'No boat with this boat_id exists'});
        } else {
            if (boat[0].owner === req.auth.sub){
                bf.delete_boat(req.params.boat_id).then(
                    res.status(204).end()   
                );
            } else {
                res.status(403).send({'Error':'Boat owned by someone else.'})
            }
        }
    });
});

login.post('/', function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    console.log(req.body);

    var options = { method: 'POST',
            url: `https://${DOMAIN}/oauth/token`,
            headers: { 'content-type': 'application/json' },
            body:
             { grant_type: 'password',
               username: username,
               password: password,
               client_id: CLIENT_ID,
               client_secret: CLIENT_SECRET },
            json: true };
    request(options, (error, response, body) => {
        if (error){
            res.status(500).send(error);
        } else {
            res.send(body);
        }
    });

});

//app.get('/login', (req, res) => res.oidc.login({ returnTo: '/profile' }));

/* ------------- End Controller Functions ------------- */

app.use('/boats', router);
app.use('/login', login);
app.use('/owners', owners);
app.use(express.static('./public'));
app.use(auth(config));

app.get('/auth0', (req, res) => {
    if (req.oidc.isAuthenticated() === 'Logged out'){
        res.oidc.login({ returnTo: '/callback'})
    } else {
        res.redirect('/callback');
    }
})

app.get('/callback', (req, res) => {
    console.log('ran')
    let token = req.rawHeaders[15].slice(11, token.length)
    //console.log(token)
    res.send({"JWT": token})
});



// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});