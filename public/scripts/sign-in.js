document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('sign-in-form');
    
    form.addEventListener('submit', (event) => {
        let is_valid = true;
        
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
        
        if (!is_valid) {
            event.preventDefault();
        }
    });
});
