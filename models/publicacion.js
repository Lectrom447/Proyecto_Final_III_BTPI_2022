// Se importa los DataTypes desde sequelize
const {DataTypes} = require('sequelize');
// Se importa la configuración de Sequelize.
const sequelize = require("../tools/db");

// Se define un modelo de sequelize con nombre Publicacion y se guarda en una constante llamada Publicacion
 const Publicacion = sequelize.define('Publicacion',{
    // Se crea un campo llamado uuid
    uuid: {
        // Se establece el tipo de dato como UUID
        type: DataTypes.UUID,
        // Se establece el valor predeterminado como un UUIDV4
        defaultValue: DataTypes.UUIDV4,
        // Se establece que el campo será la llave primaria.
        primaryKey: true,
        // Se establece que el campo NO puede estar vacío.
        allowNull: false
    },
    nombre:{
        // Se establece el tipo de dato como STRING de tamaño 50
        type: DataTypes.STRING(50),
        // Se establece que el campo NO puede estar vacío.
        allowNull: false
    },
    email:{
        // Se establece el tipo de dato como STRING de tamaño 25
        type: DataTypes.STRING(25),
        // Se establece que el campo NO puede estar vacío.
        allowNull: false      
    },
    contenido: {
        // Se establece el tipo de dato como STRING de tamaño 1000
        type:DataTypes.STRING(1000),
        // Se establece que el campo NO puede estar vacío.
        allowNull: false
    }
 });

//  Se sincroniza el modelo con la base de datos.
 Publicacion.sync({alter:true});

//  Se exporta la constante Publicacion para que pueda ser importada desde otros modelos.
 module.exports = {Publicacion};