# TP4-B
# Arquitectura

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

## Agregar una nueva tabla ROL con la siguiente estructura:
* PK - ID
* Tipo de Rol : Admin o Usuario



# Ejercicio 2

## Agregar el campo rol a la tabla usuarios y asociar todos los usuarios un rol


# Ejercicio 3

##   Reescribir el codigo para incorporar rutas como middleware y modificar la estructura del proyecto para separar la funcionalidad por capas:
* index
* routes
* controllers
* services


# Ejercicio 4
* Desarrollar los siguientes endpoints

### POST /cancion
Recibe:
id
nombre

### PUT /cancion
Recibe:
id
nombre

### DELETE /cancion
Recibe:
id

Solo pueden ejecutarlos los usuarios que tengan rol admin


## La entrega se hace tipo "demo" donde cada grupo debe mostrar que su backend funciona desde vercel
## Reutilizar el repo de tp4a 
