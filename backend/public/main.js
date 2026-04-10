function mostrarSenha() {
    var inputPass= document.getElementById('senha');
    var lockIcon = document.getElementById('lock-icon');

    if (inputPass.type === 'password') {
        inputPass.setAttribute('type', 'text');
        lockIcon.classList.replace('bi-eye-fill', 'bi-eye-slash-fill');  
    }else {
        inputPass.setAttribute('type', 'password');
        lockIcon.classList.replace('bi-eye-slash-fill', 'bi-eye-fill');  
    }
}