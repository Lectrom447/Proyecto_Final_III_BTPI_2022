const path = require('path');
const fs = require('fs');

const ruta = path.join(__dirname,'../db.json');



const syncDB = (data) => {
    const obj = {publicaciones:data};

    const jsonData = JSON.stringify(obj);

    fs.writeFileSync(ruta,jsonData);

};

const getData = () => {
    const jsonData = fs.readFileSync(ruta,{encoding:"utf-8"});

    const obj = JSON.parse(jsonData);

    return obj;
};



module.exports = {syncDB, getData};