const { ipcMain } = require('electron');
const db = require('./database/connection');
const bcrypt = require('bcryptjs');

// Auto-crear un usuario de prueba si la tabla está vacía
function verificarUsuarioBase() {
  db.get("SELECT COUNT(*) as count FROM usuarios", [], (err, row) => {
    if (!err && row.count === 0) {
      const usuarioPorDefecto = 'admin';
      const clavePlana = 'admin123';
      
      // Encriptamos la contraseña por seguridad
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(clavePlana, salt);

      db.run("INSERT INTO usuarios (usuario, password) VALUES (?, ?)", [usuarioPorDefecto, hash], (err) => {
        if (!err) {
          console.log("✨ Usuario de prueba generado -> Info para loguear: admin | admin123");
        }
      });
    }
  });
}

verificarUsuarioBase();

// Escuchamos la petición de login que viene desde el frontend
ipcMain.handle('auth:login', async (event, datos) => {
  const { usuario, password } = datos;

  return new Promise((resolve) => {
    db.get("SELECT * FROM usuarios WHERE usuario = ?", [usuario], (err, row) => {
      if (err) {
        resolve({ success: false, message: 'Error interno en la base de datos.' });
      } else if (!row) {
        resolve({ success: false, message: 'El usuario ingresado no existe.' });
      } else {
        // Comparamos la clave ingresada con el hash encriptado de la BD
        const loginValido = bcrypt.compareSync(password, row.password);
        if (loginValido) {
          resolve({ success: true });
        } else {
          resolve({ success: false, message: 'Contraseña incorrecta. Inténtalo de nuevo.' });
        }
      }
    });
  });
});