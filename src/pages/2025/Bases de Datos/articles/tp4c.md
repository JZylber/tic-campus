
 


En esta ultima entrega del TP4, vamos a completar nuestro proyecto utilizando el ORM Sequelize.
El objetivo de este TP es que puedan conocer las ventajas de acceder a nuestra base de datos usando Sequelize vs el SQL tradicional.
Para realizar este TP vamos a partir desde el repo creado para el TP4-B y aplicar los siguientes cambios:


## Paso 1
Modificar el archivo dbconfig.js para que exporte la variable "sequelize" que nos permitira acceder a Postgres a traves de Sequelize

## Paso 2
Modificar la tabla Escucha. Eliminar el campo reproducciones y agregar el campo fechaEscucha. Si es necesario, cambiar la logica del controller al momento de insertar una nueva escucha no se debe incrementar el numero de reproducciones sino insertar un nuevo registro y guardar la fecha y hora de escucha

## Paso 3
Crear la carpeta models y adentro crear 3 archivos con los models para las 3 tablas

## Paso 4
Modificar el archivo index.js (o app.js) para que se declaren las relaciones entre los modelos de Sequelize y se ejecute el comando sync

## Paso 5
Modificar la capa de services para que TODOS los accesos a la base de datos se realicen a traves de Sequelize

## Paso 6
Crear el equipo en Github Classroom a traves de este link https://classroom.github.com/a/lQuKsp6f y registrar a todos sus integrantes

## Entrega
Probar todo, y una vez confirmado que todos los endpoints funcionan subir el repo al github classroom
