const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página intente recargarse

    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;

    // Llamamos a la API expuesta en preload.js
    const respuesta = await window.api.enviarLogin({ usuario, password });

    if (respuesta.success) {
      // Si las credenciales son correctas, nos movemos al Dashboard
      window.location.href = 'dashboard.html';
    } else {
      // Si falla, disparamos una alerta con el mensaje del backend
      alert(respuesta.message);
    }
  });
}