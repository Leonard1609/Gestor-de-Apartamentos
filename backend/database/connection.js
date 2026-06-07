const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ubicación del archivo de la base de datos en la raíz del proyecto
const dbPath = path.join(__dirname, '../../rentas.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Conectado con éxito a la base de datos local.');
    crearTablas();
  }
});

function crearTablas() {
  db.serialize(() => {
    // 1. Tabla de Usuarios (Para el Login)
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )`);

    // 2. Tabla de Inquilinos (Área 1: Gestión)
    db.run(`CREATE TABLE IF NOT EXISTS inquilinos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombres TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      genero TEXT,
      dni TEXT UNIQUE,
      telefono TEXT,
      departamento TEXT NOT NULL
    )`);

    // 3. Tabla de Lecturas e Historial (Área 2 y 3: Cálculo y Registro)
    db.run(`CREATE TABLE IF NOT EXISTS registros_servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      departamento TEXT NOT NULL,
      mes TEXT NOT NULL,
      anio TEXT NOT NULL,
      luz_anterior REAL DEFAULT 0,
      luz_actual REAL NOT NULL,
      agua_anterior REAL DEFAULT 0,
      agua_actual REAL NOT NULL,
      monto_luz REAL DEFAULT 0,
      monto_agua REAL DEFAULT 0,
      total_pagar REAL DEFAULT 0,
      estado_pago TEXT DEFAULT 'Pendiente'
    )`);
    
    console.log('Estructura de tablas verificada/creada correctamente.');
  });
}

module.exports = db;