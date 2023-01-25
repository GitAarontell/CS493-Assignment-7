const express = require('express');
const app = express();

const json2html = require('json-to-html');

const {Datastore} = require('@google-cloud/datastore');

const bodyParser = require('body-parser');
const request = require('request');

const datastore = new Datastore();

const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const BOAT = "Boat";


const router = express.Router();
const login = express.Router();

const CLIENT_ID = 'XtyNRhQzvVQi4PCvhIB79zxG7czPOYng';
const CLIENT_SECRET = 'fMRxBgBY12vmncTke1ySRcJlPHru11oyNJAFIXvMdEbHXgzwRynbHZ5_U7ucANns';
const DOMAIN = '493-fall-22.us.auth0.com';

app.use(bodyParser.json());

function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}

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

/* ------------- Begin Boat Model Functions ------------- */
function post_boat(name, type, length, public, owner){
    var key = datastore.key(BOAT);
	const new_boat = {"name": name, "type": type, "length": length, "public": public, "owner":owner};
	return datastore.save({"key":key, "data":new_boat}).then(() => {return key});
}
// returns boats that match owner and are public only
function get_boats(owner){
	const q = datastore.createQuery(BOAT);
	return datastore.runQuery(q).then( (entities) => {
			return entities[0].map(fromDatastore).filter( (item) => {
                if (item.owner === owner && item.public){
                    return true;
                }else{
                    return false;
                }
            });
		});
}
// will return all boats that are public regardless of owner
function get_boats_unprotected(){
	const q = datastore.createQuery(BOAT);
	return datastore.runQuery(q).then( (entities) => {
			return entities[0].map(fromDatastore).filter( (item) => {
                if (item.public){
                    return true;
                }else{
                    return false;
                }
            });
		});
}

function get_boat(id, owner){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    return datastore.get(key).then( (data) => {
            return fromDatastore(data[0]);
        }
    );
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/', checkJwt, function(req, res){
    console.log(req)
    console.log('jwt' + req.user);
    console.log(JSON.stringify(req.user));
    get_boats(req.user.name).then( (boats) => {
        res.status(200).json(boats);
    });
});

router.get('/unsecure', function(req, res){
    get_boats_unprotected().then( (boats) => {
        res.status(200).json(boats);
    });
});

router.get('/:id', checkJwt, function(req, res){
    console.log('jwt' + req.user);
    get_boat(req.params.id).then( (boats) => {
        const accepts = req.accepts(['application/json', 'text/html']);
        if(boat.owner && boat.owner !== req.user.name){
            res.status(403).send('Forbidden');
        } else if(!accepts){
            res.status(406).send('Not Acceptable');
        } else if(accepts === 'application/json'){
            res.status(200).json(boat);
        } else if(accepts === 'text/html'){
            res.status(200).send(json2html(boat).slice(1,-1));
        } else { res.status(500).send('Content type got messed up!'); }
    });
});

router.post('/', checkJwt, function(req, res){
    if(req.get('content-type') !== 'application/json'){
        res.status(415).send('Server only accepts application/json data.')
    }
    post_boat(req.body.name, req.body.type, req.body.length, req.body.public, req.user.name)
    .then( key => {
        res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
        res.status(201).send({ "id": ' + key.id + ' })
    } );
});

login.post('/', function(req, res){
    const username = req.body.username;
    const password = req.body.password;
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

/* ------------- End Controller Functions ------------- */

app.use('/boats', router);
app.use('/login', login);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});