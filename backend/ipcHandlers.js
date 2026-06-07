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

// --- PROCESOS CRUD DE INQUILINOS ---

// 1. Guardar nuevo inquilino (Modificado para incluir genero)
ipcMain.handle('inquilinos:crear', async (event, datos) => {
  const { nombres, apellidos, dni, telefono, departamento, genero } = datos;
  return new Promise((resolve) => {
    const query = `INSERT INTO inquilinos (nombres, apellidos, dni, telefono, departamento, genero) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [nombres, apellidos, dni, telefono, departamento, genero], function (err) {
      if (err) {
        resolve({ success: false, message: 'El DNI ya se encuentra registrado.' });
      } else {
        resolve({ success: true });
      }
    });
  });
});

// 2. Actualizar inquilino existente (Nuevo)
ipcMain.handle('inquilinos:actualizar', async (event, datos) => {
  const { id, nombres, apellidos, dni, telefono, departamento, genero } = datos;
  return new Promise((resolve) => {
    const query = `UPDATE inquilinos SET nombres = ?, apellidos = ?, dni = ?, telefono = ?, departamento = ?, genero = ? WHERE id = ?`;
    db.run(query, [nombres, apellidos, dni, telefono, departamento, genero, id], function (err) {
      if (err) {
        resolve({ success: false, message: 'Error al actualizar. Verifique que el DNI no esté duplicado.' });
      } else {
        resolve({ success: true });
      }
    });
  });
});

// 3. Obtener lista completa ordenada por departamento
ipcMain.handle('inquilinos:listar', async () => {
  return new Promise((resolve) => {
    db.all(`SELECT * FROM inquilinos ORDER BY departamento ASC`, [], (err, rows) => {
      if (err) resolve([]);
      else resolve(rows);
    });
  });
});

// 4. Eliminar inquilino por ID
ipcMain.handle('inquilinos:borrar', async (event, id) => {
  return new Promise((resolve) => {
    db.run(`DELETE FROM inquilinos WHERE id = ?`, [id], (err) => {
      if (err) resolve({ success: false });
      else resolve({ success: true });
    });
  });
});

ipcMain.handle('recibos:guardar-mes', async (event, listaRecibos) => {
  return new Promise((resolve) => {
    // Iniciamos una transacción para insertar en lote de manera segura
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      
      const query = `INSERT INTO recibos_mensuales (departamento, mes, anio, monto_luz, monto_agua, monto_total) VALUES (?, ?, ?, ?, ?, ?)`;
      const stmt = db.prepare(query);
      
      let errorOcurrido = false;
      const anioActual = new Date().getFullYear().toString();

      listaRecibos.forEach(r => {
        stmt.run([r.departamento, r.mes, anioActual, r.monto_luz, r.monto_agua, r.monto_total], (err) => {
          if (err) errorOcurrido = true;
        });
      });

      stmt.finalize();

      if (errorOcurrido) {
        db.run("ROLLBACK");
        resolve({ success: false, message: 'Error interno al guardar los recibos.' });
      } else {
        db.run("COMMIT");
        resolve({ success: true });
      }
    });
  });
});