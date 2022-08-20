// Se importan todos los módulos de NODE necesarios para el proyecto.

// Se importa Express
const express = require('express');
// Se importa el logger Morgan
const morgan = require('morgan');
// Se importa BodyParser(Paquete encargado de leer la información que llega en el cuerpo de la petición HTTP)
const bodyParser = require('body-parser');
// Se importa Handlebars (El procesador de Templates o encargado de procesar los archivos .hbs)
const { engine } = require('express-handlebars');
// Se importa el paquete CookieParser(Encargado de leer la información de las cookies de las peticiones HTTP)
const cookieParser = require('cookie-parser');

// Se importan los modelos de la base de datos(Los modelos son representaciones de como debe verse o que características debe tener un elemento de la base de datos).
const { Publicacion } = require('./models/publicacion');
const { User } = require('./models/user');

// Se importa la configuración de Sequelize.
const sequelize = require('./tools/db');


// Por medio de sequelize se comprueba si es posible establecer conexión con la base de datos.(Este método retorna una promesa, por lo tanto se debe tratar como tal.)
sequelize.authenticate()
    // En caso de que la promesa se resuelva satisfactoriamente(Si se pudo establecer conexión con la base de datos), se ejecuta el callback.
    .then(() => {
        // Se imprime por consola un mensaje que indique que se estableció la conexión a la base de datos
        console.log("Conexión con la Base de Datos establecida satisfactoriamente");

        // Se crea una constante llamada port donde se almacena el numero de puerto que usara el servidor Express.
        const port = 3000;

        // Se crea una constante llamada app que tendrá como valor el modulo Express.
        const app = express();

        // Se establece la configuración que usara handlebars
        app.engine('.hbs', engine({ extname: '.hbs' }));
        app.set('view engine', '.hbs');
        app.set('views', './views');

        // Se configura el middleware morgan, que se usa para imprimir por consola información de todas las peticiones que ingresan al servidor.
        app.use(morgan('dev'));
        // Se configura el middleware Bodyparser.
        app.use(bodyParser.urlencoded({ extended: true }));
        // Se configura el middleware Cookieparser.
        app.use(cookieParser());

        // Se crea un middleware personalizado para cargar los datos del usuario en la request (Los middlewares siempre reciben los argumentos req, res, next )
        app.use((req, res, next) => {
            // En caso de que existan los datos de la sesión en la cookie: 
            if (req.cookies.session) {
                // Se crea una constante llamada user que tiene como valor un objeto de JS que es creado por el JSON.parse a partir de una cadena de texto.
                const user = JSON.parse(req.cookies.session);
                // Se establece una propiedad en la request que tiene como valor la constante user.
                req.user = user;
                // Se crea una variable global de express que posteriormente usara handlebars llamada user y que su valor sera la constante user.
                app.locals.user = user;

            // En caso de que NO existan los datos de la sesión en la cookie
            } else {
                // Se eliminara la variable global user.
                app.locals.user = undefined;
            }
            // Se le indica a express que debe continuar con el siguiente proceso.
            next();
        });

        // Se establece el método GET para la url "/"
        app.get('/', async (req, res) => {
            // Se realiza una consulta en la tabla Publicacion
            // Esta consulta buscara TODAS las publicaciones registradas
            // El resultada de la consulta se guarda en una constante llamada data.
            // Las consultas de sequelize son asíncronas por lo que se usa la estructura async/await
            const data = await Publicacion.findAll({ raw: true });

            // Se renderiza el archivo home.hbs por medio del método res.render pasándola como primer argumento el nombre del archivo, 
            // y como un segundo argumento un objeto con el contexto que estará disponible para handlebars 
            res.render('home', {
                titulo: "Publicaciones",
                messages: data
            });
        });

        // Se establece el método GET para la url "/login"
        app.get('/login', (req, res) => {
            // Se renderiza el archivo auth/login.hbs por medio del método res.render pasándola como primer argumento el nombre del archivo, 
            // y como un segundo argumento un objeto con el contexto que estará disponible para handlebars 
            res.render('auth/login');
        });

        // Se establece el método POST para la url "/login"
        app.post('/login', async (req, res) => {
            // Se desestructura el username y password del req.body
            const { username, password } = req.body;
            // Se realiza una consulta en la tabla User
            // Esta consulta buscara UN USUARIO que coincida con el username ingresado por el usuario
            // El resultada de la consulta se guarda en una constante llamada user.
            // Las consultas de sequelize son asíncronas por lo que se usa la estructura async/await
            const user = await User.findOne({ where: { username: username }, raw: true });
            // Se imprime el valor cuerpo de la solicitud.
            console.log(req.body);
            // Si el usuario existe:
            if (user) {
                // Se compara si la contraseña guardada en la base de datos coincide con la contraseña ingresada 
                // y el resultado de la comparación se guarda en una constante llamada is_valid_pass.
                const is_valid_pass = user.password === password;
                // Si la comparación da como resultado false (La contraseña no coincide)
                if (!is_valid_pass) {
                    // Se renderiza nuevamente el archivo auth/login.hbs
                    res.render('auth/login');
                // Caso contrario: (La contraseña si coincide)
                } else {
                    // Se crea un objeto con la información del usuario y se guarda en una constante llamada data.
                    const data = {
                        nombre: user.firstName + ' ' + user.lastName,
                        correo: user.email
                    };
                    // Se crea una cookie llamada session con el valor de la constante data 
                    res.cookie('session', JSON.stringify(data), { maxAge: 900000 });
                    // Se redirige al usuario a la url "/"  
                    res.redirect('/');
                }
            // Caso contrario: (Si el usuario no existe)
            } else {
                // Se renderiza nuevamente el archivo auth/login.hbs
                res.render('auth/login');
            }
        });

        // Se establece el método GET para la url "/registro"
        app.get("/registro", (req, res) => {
            // Se renderiza nuevamente el archivo auth/signup.hbs
            res.render("auth/signup");
        });

        // Se establece el método POST para la url "/registro"
        app.post("/registro", async (req, res) => {
            // Se desestructura el password1, password2 y resp(Que contiene el resto del body de la petición)  del req.body
            const { password1, password2, ...resp } = req.body;
            // Se crea una lista vacía en una constante llamada errors.
            const errors = [];

            // Si ambas contraseñas NO coinciden 
            if (password1 != password2) {
                // Se le agrega un elemento a la lista errors con un mensaje de error
                errors.push("Las contraseñas deben ser iguales");
            }

            // Se realiza una consulta en la tabla User
            // Esta consulta buscara UN USUARIO que coincida con el username ingresado por el usuario.
            // Las consultas de sequelize son asíncronas por lo que se usa la estructura async/await
            // Si el usuario ya existe en la base de datos
            if (await User.findOne({ where: { username: resp.username } })) {
                // Se le agrega un elemento a la lista errors con un mensaje de error
                errors.push("El username ya esta ocupado");
            }

            // Si la lista de errores tiene algún elemento: (existen errores)
            if (errors.length > 0) {
                // Se renderiza el archivo auth/signup.hbs por medio del método res.render pasándola como primer argumento el nombre del archivo, 
                // y como un segundo argumento un objeto con el contexto que estará disponible para handlebars 
                // Donde estarán los errores encontrados y los datos para llenar el formulario.
                res.render("auth/signup", { data: resp, errors: errors });

            // Caso contrario: (NO existen errores)
            } else {
                // Se crea el usuario en la base de datos con los datos ingresados por el usuario
                // Las consultas de sequelize son asíncronas por lo que se usa la estructura async/await
                const user = await User.create({ password: password1, ...resp });
                // Se imprime por consola el usuario creado.
                console.log(user);
                // Se redirige al usuario a la url "/"
                res.redirect('/');
            }
        });

        // Se establece el método GET para la url "/contacto"
        app.get('/contacto', (req, res) => {
            // Se renderiza el archivo contacto.hbs
            res.render('contacto');
        });

        // Se establece el método POST para la url "/contacto"
        app.post('/contacto', async (req, res) => {
            // Se desestructura el contenido del req.body
            const { contenido } = req.body;
            // Se crea el usuario en la base de datos con los datos ingresados por el usuario
            // Las consultas de sequelize son asíncronas por lo que se usa la estructura async/await
            await Publicacion.create({
                contenido: contenido,
                nombre: req.user.nombre,
                email: req.user.correo
            });
            // Se redirige al usuario a la url "/contacto"
            res.redirect('/contacto');
        });

        // Se establece el método GET para todos las urls que no estén registradas (404)
        app.get('/*', (req, res) => {
            // Se renderiza el archivo 404.hbs
            res.render('404');
        });

        // Se activa Express para que escuche peticiones a traves del puerto establecido anteriormente en la constante port.
        app.listen(port, () => {
            // Se imprime por consola un mensaje que indique que el servidor está listo para escuchar peticiones.
            console.log(`Server ready on port ${port}`);
        });
    })
    // En caso de que la promesa falle (No se puede establecer conexión con la base de datos )
    .catch((error) => {
        // Se imprime por consola un mensaje que indique que no se pudo establecer conexión con la base de datos.
        console.log("No se pudo conectar con la base de datos:", error);
    });
