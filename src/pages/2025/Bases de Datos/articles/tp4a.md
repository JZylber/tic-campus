# TP4-A
# Autenticacion

Tenemos una base de datos con 3 tablas

### USUARIO
* PK - ID
* Nombre
* Password

### CANCION
* PK - ID
* Nombre


### ESCUCHA
* PK - ID
* FK - UsuarioID
* FK - CancionID
* Reproducciones



# Ejercicio 1

* Crear la base de datos en Neon


# Ejercicio 2
## Desarrollar los siguientes endpoints

### /crearusuario
Recibe:
userid
nombre
password

* Crea un registro en la tabla usuario, con el password hasheado usando bcrypt

### /login
Recibe:
userid
password

* Si no existe el usuario da un error
* Si no coincide el password da un error
* Si coincide usuario y password, devuelve un token JWT

### /escucho
Recibe:
Token

* Devuelve las canciones escuchadas por el usuario logueado y la cantidad de reproducciones

# Ejercicio 3

Deployar el backend en Vercel

* El db.js puede usar las variables de ambiente de vercel en caso que el project de vercel este conectado a la base de datos desde "Storage"
* Sino tambien esta permitido crear por separado la base de datos en Neon y hardcodear en el db.js las credenciales de acceso a la bd neon


## La entrega se hace tipo "demo" donde cada grupo debe mostrar que su backend funciona como pide la consigna
