
### Arquitectura 3

## Arquitectura 2

# Arquitectura 1

Tenemos una base de datos con 3 tablas

# USUARIO
* PK - ID
* Nombre
* Password

# CANCION
* PK - ID
* Nombre


# ESCUCHA
* PK - ID
* FK - UsuarioID
* FK - CancionID
* Reproducciones


# Ejercicio 1

### Agregar un nuevo campo a la tabla USUARIO
* Rol : Admin o Usuario


# Ejercicio 2

### Asociar a todos los usuarios a un rol


# Ejercicio 3

###  Desarrollar los middlewares verifyToken y verifyAdmin
* verifyToken: Chequea que el Header del req contenga un token y si esta correcto asigna el contenido del mismo a un nuevo atributo (user) de la clase req y continua (next). Si no viene el token (o es invalido) devolver error
* verifyAdmin: Chequea que el user del req tenga asociado el rol admin. Si es admin continuar (next), sino dar error

  
# Ejercicio 4

###  Refactorizar el codigo para utilizar rutas como middleware y modificar la estructura del proyecto para separar la funcionalidad por capas:
* index.js
* /routes
* /controllers
* /services
* /middlewares


# Ejercicio 5

## Desarrollar los siguientes endpoints

### 1) POST /cancion
Recibe:
id
nombre

### 2) PUT /cancion
Recibe:
id
nombre

### 3)DELETE /cancion
Recibe:
id

*** IMPORTANTE: Estos 3 métodos solo pueden ser ejecutados por los usuarios que tengan rol admin ***

### 4) POST /escucho
Recibe: 
id (cancion)
-> Graba el registro en la tabla "escucha" asociando el id del usuario (que viene en el token) al id de la cancion recibida



## La entrega se hace tipo "demo" donde cada grupo debe mostrar que su backend funciona desde vercel
## Reutilizar el repo de tp4a 
