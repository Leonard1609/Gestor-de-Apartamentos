document.addEventListener('DOMContentLoaded', () => {
  // --- SELECTORES DE NAVEGACIÓN ---
  const menuButtons = document.querySelectorAll('.menu-btn');
  const sections = document.querySelectorAll('.content-section');
  const btnLogout = document.getElementById('btn-logout');

  // --- SELECTORES DEL CRUD DE INQUILINOS ---
  const inquilinoForm = document.getElementById('inquilinoForm');
  const tbodyInquilinos = document.getElementById('tbodyInquilinos');
  const formTitle = document.getElementById('form-title');
  const btnSubmitForm = document.getElementById('btn-submit-form');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const insId = document.getElementById('ins-id');

  let cacheInquilinos = []; 

  // --- SELECTORES DE LA PESTAÑA DE CÁLCULO (AJUSTADO) ---
  const btnGenerarDesglose = document.getElementById('btn-generar-desglose');
  const btnEjecutarMatematica = document.getElementById('btn-ejecutar-matematica');
  const btnGuardarMes = document.getElementById('btn-guardar-mes');
  const tbodyCalculos = document.getElementById('tbodyCalculos');
  
  let resultadosCalculoTemporal = []; 

  // --- 1. NAVEGACIÓN ENTRE PESTAÑAS (ESTILO DISCORD) ---
  menuButtons.forEach(button => {
    button.addEventListener('click', () => {
      menuButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      sections.forEach(sec => sec.classList.add('hidden'));
      
      const targetSection = button.getAttribute('data-section');
      const sectionElement = document.getElementById(`sec-${targetSection}`);
      if (sectionElement) {
        sectionElement.classList.remove('hidden');
      }
    });
  });

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }

  // --- 2. LÓGICA DEL CRUD DE INQUILINOS ---
  async function cargarTablaInquilinos() {
    if (!tbodyInquilinos) return;
    tbodyInquilinos.innerHTML = ''; 
    
    cacheInquilinos = await window.api.obtenerInquilinos();
    
    cacheInquilinos.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.departamento}</strong></td>
        <td>${item.nombres} ${item.apellidos}</td>
        <td>${item.genero === 'Masculino' ? '🧑 Masc' : '👩 Fem'}</td>
        <td>${item.dni}</td>
        <td>${item.telefono || '-'}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-edit" data-id="${item.id}">Editar</button>
            <button class="btn-delete" data-id="${item.id}">Eliminar</button>
          </div>
        </td>
      `;
      tbodyInquilinos.appendChild(tr);
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        if (confirm('¿Estás seguro de eliminar este inquilino?')) {
          const res = await window.api.eliminarInquilino(id);
          if (res.success) {
            resetearFormulario();
            cargarTablaInquilinos();
          }
        }
      });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        const inquilino = cacheInquilinos.find(item => item.id === id);
        
        if (inquilino) {
          insId.value = inquilino.id;
          document.getElementById('ins-nombres').value = inquilino.nombres;
          document.getElementById('ins-apellidos').value = inquilino.apellidos;
          document.getElementById('ins-genero').value = inquilino.genero || '';
          document.getElementById('ins-dni').value = inquilino.dni;
          document.getElementById('ins-telefono').value = inquilino.telefono || '';
          document.getElementById('ins-departamento').value = inquilino.departamento;

          if (formTitle) formTitle.textContent = '✏️ Editar Inquilino';
          if (btnSubmitForm) {
            btnSubmitForm.textContent = 'Actualizar Cambios';
            btnSubmitForm.style.background = '#5865f2'; 
          }
          if (btnCancelEdit) btnCancelEdit.classList.remove('hidden');
        }
      });
    });
  }

  function resetearFormulario() {
    if (inquilinoForm) inquilinoForm.reset();
    if (insId) insId.value = '';
    if (formTitle) formTitle.textContent = '📝 Registrar Inquilino';
    if (btnSubmitForm) {
      btnSubmitForm.textContent = 'Guardar Inquilino';
      btnSubmitForm.style.background = '#248046'; 
    }
    if (btnCancelEdit) btnCancelEdit.classList.add('hidden');
  }

  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', resetearFormulario);
  }

  if (inquilinoForm) {
    inquilinoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const idTarget = insId.value;
      const datos = {
        nombres: document.getElementById('ins-nombres').value,
        apellidos: document.getElementById('ins-apellidos').value,
        genero: document.getElementById('ins-genero').value,
        dni: document.getElementById('ins-dni').value,
        telefono: document.getElementById('ins-telefono').value,
        departamento: document.getElementById('ins-departamento').value
      };

      let respuesta;
      if (idTarget) {
        respuesta = await window.api.actualizarInquilino(idTarget, datos);
      } else {
        respuesta = await window.api.guardarInquilino(datos);
      }

      if (respuesta.success) {
        resetearFormulario();
        cargarTablaInquilinos();
      } else {
        alert(respuesta.message);
      }
    });
  }

  // --- 3. LÓGICA DE LA PESTAÑA DE CÁLCULO (POR DÍAS) ---
  if (btnGenerarDesglose) {
    btnGenerarDesglose.addEventListener('click', async () => {
      if (!tbodyCalculos) return;
      tbodyCalculos.innerHTML = '';
      if (btnGuardarMes) btnGuardarMes.disabled = true;
      if (btnEjecutarMatematica) btnEjecutarMatematica.style.display = 'none';

      const inquilinos = await window.api.obtenerInquilinos();
      if (inquilinos.length === 0) {
        alert('No hay inquilinos ni departamentos registrados actualmente.');
        return;
      }

      // Filtrar departamentos únicos que tienen un inquilino viviendo ahí
      const departamentosUnicos = [...new Set(inquilinos.map(item => item.departamento))];

      departamentosUnicos.forEach(dep => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${dep}</strong></td>
          <td>
            <input type="number" class="input-dias-dep" data-dep="${dep}" value="30" min="0" max="31" style="width: 65px; padding: 4px; background: #1e1f22; color: white; border: 1px solid #3f4147; border-radius: 4px; text-align: center;">
          </td>
          <td id="luz-${dep}">S/. 0.00</td>
          <td id="agua-${dep}">S/. 0.00</td>
          <td id="total-${dep}"><strong>S/. 0.00</strong></td>
        `;
        tbodyCalculos.appendChild(tr);
      });

      if (btnEjecutarMatematica) btnEjecutarMatematica.style.display = 'inline-block';
    });
  }

  if (btnEjecutarMatematica) {
    btnEjecutarMatematica.addEventListener('click', () => {
      const mesSeleccionado = document.getElementById('calc-mes').value;
      const totalLuz = parseFloat(document.getElementById('calc-luz').value) || 0;
      const totalAgua = parseFloat(document.getElementById('calc-agua').value) || 0;

      if (totalLuz <= 0 && totalAgua <= 0) {
        alert('Por favor, ingresa los montos de los recibos globales antes de calcular.');
        return;
      }

      const inputsDias = document.querySelectorAll('.input-dias-dep');
      let sumaTotalDiasEdificio = 0;
      const registrosPaso1 = [];

      inputsDias.forEach(input => {
        const dias = parseInt(input.value) || 0;
        const dep = input.getAttribute('data-dep');
        sumaTotalDiasEdificio += dias;
        registrationsPaso1.push({ dep, dias });
      });

      if (sumaTotalDiasEdificio === 0) {
        alert('La suma total de días no puede ser cero.');
        return;
      }

      resultadosCalculoTemporal = []; 

      registrationsPaso1.forEach(item => {
        // Regla de tres simple ponderada por los días ocupados
        const cuotaLuz = (totalLuz * item.dias) / sumaTotalDiasEdificio;
        const cuotaAgua = (totalAgua * item.dias) / sumaTotalDiasEdificio;
        const totalDep = cuotaLuz + cuotaAgua;

        document.getElementById(`luz-${item.dep}`).textContent = `S/. ${cuotaLuz.toFixed(2)}`;
        document.getElementById(`agua-${item.dep}`).textContent = `S/. ${cuotaAgua.toFixed(2)}`;
        document.getElementById(`total-${item.dep}`).innerHTML = `<strong>S/. ${totalDep.toFixed(2)}</strong>`;

        resultadosCalculoTemporal.push({
          departamento: item.dep,
          mes: mesSeleccionado,
          dias_ocupados: item.dias,
          monto_luz: cuotaLuz.toFixed(2),
          monto_agua: cuotaAgua.toFixed(2),
          monto_total: totalDep.toFixed(2)
        });
      });

      if (btnGuardarMes) btnGuardarMes.disabled = false;
    });
  }

  if (btnGuardarMes) {
    btnGuardarMes.addEventListener('click', async () => {
      if (resultadosCalculoTemporal.length === 0) return;

      const res = await window.api.guardarRecibosMes(resultadosCalculoTemporal);
      if (res.success) {
        alert('Distribución del mes guardada correctamente.');
        if (calculoForm) calculoForm.reset();
        if (tbodyCalculos) tbodyCalculos.innerHTML = '';
        btnGuardarMes.disabled = true;
        if (btnEjecutarMatematica) btnEjecutarMatematica.style.display = 'none';
        resultadosCalculoTemporal = [];
      } else {
        alert(res.message);
      }
    });
  }

  // --- 4. VALIDACIONES DE ENTRADA EN TIEMPO REAL ---
  ['ins-dni', 'ins-telefono'].forEach(id => {
  const inputElement = document.getElementById(id);
  if (inputElement) {
    inputElement.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
    });
  }
});

  cargarTablaInquilinos();
});