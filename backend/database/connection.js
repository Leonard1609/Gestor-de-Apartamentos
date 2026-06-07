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

    // 2. Tabla de Departamentos (Independiente)
    db.run(`CREATE TABLE IF NOT EXISTS departamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT UNIQUE NOT NULL
    )`);

    // 3. Tabla de Inquilinos
    db.run(`CREATE TABLE IF NOT EXISTS inquilinos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombres TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      genero TEXT,
      dni TEXT UNIQUE NOT NULL,
      telefono TEXT,
      departamento TEXT NOT NULL
    )`);

    // 4. Historial de Recibos Calculados por Mes (Ponderado por días)
    db.run(`CREATE TABLE IF NOT EXISTS recibos_mensuales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      departamento TEXT NOT NULL,
      mes TEXT NOT NULL,
      anio TEXT NOT NULL,
      dias_ocupados INTEGER NOT NULL,
      monto_luz REAL NOT NULL,
      monto_agua REAL NOT NULL,
      monto_total REAL NOT NULL,
      estado TEXT DEFAULT 'Pendiente'
    )`);
    
    console.log('Estructura de tablas verificada/creada correctamente.');
  });
}

module.exports = db;