

const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();
const BOAT = "Boat";

/* ------------- Begin Boat Model Functions ------------- */
function post_boat(name, type, length, public, sub){
    var key = datastore.key(BOAT);
	const new_boat = {"name": name, "type": type, "length": length, "public": public, "owner": sub};
	return datastore.save({"key":key, "data":new_boat}).then(() => {return key});
}
// returns boats that match owner and are public only
function get_boats(owner){
	const q = datastore.createQuery(BOAT);
	return datastore.runQuery(q).then( (entities) => {
        console.log(entities[0])
        return entities[0].map(fromDatastore).filter( (item) => {
            if (item.owner === owner && item.public){
                return true;
            } else {
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

function get_boat(id) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            return entity;
        } else {
            return entity.map(fromDatastore);
        }
    });
}

function delete_boat(id) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    return datastore.delete(key);
}

function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}

/* ------------- End Model Functions ------------- */

module.exports = {post_boat, get_boats, get_boats_unprotected, get_boat, delete_boat}