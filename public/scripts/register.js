document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    
    form.addEventListener('submit', (event) => {
        let is_valid = true;
        
        const username = document.getElementById('username');
        if (!username.value.trim()) {
            username.classList.add('is-invalid');
            is_valid = false;
        } else {
            username.classList.remove('is-invalid');
            username.classList.add('is-valid');
        }
        
        const email = document.getElementById('email');
        if (!email.value.trim() || !email.value.includes('@')) {
            email.classList.add('is-invalid');
            is_valid = false;
        } else {
            email.classList.remove('is-invalid');
            email.classList.add('is-valid');
        }
        
        const password = document.getElementById('password');
        if (password.value.length < 6) {
            password.classList.add('is-invalid');
            is_valid = false;
        } else {
            password.classList.remove('is-invalid');
            password.classList.add('is-valid');
        }
        
        const confirm_password = document.getElementById('confirm-password');
        if (password.value !== confirm_password.value || confirm_password.value.length === 0) {
            confirm_password.classList.add('is-invalid');
            is_valid = false;
        } else {
            confirm_password.classList.remove('is-invalid');
            confirm_password.classList.add('is-valid');
        }
        
        if (!is_valid) {
            event.preventDefault();
        }
    });
});
