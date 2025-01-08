document.addEventListener('DOMContentLoaded', () => {

    // get movie/series id and type(if its a movie or series)
    const dropdown = document.querySelector('.dropend');
    const mediaId = dropdown.dataset.mediaId;
    const mediaType = dropdown.dataset.mediaType;

    // Initialize toasts to show success/failure messages
    const toastOptions = {
        animation: true,
        autohide: true,
        delay: 5000
    };
    const successToast = new bootstrap.Toast(document.getElementById('successToast'), toastOptions);
    const errorToast = new bootstrap.Toast(document.getElementById('errorToast'), toastOptions);

    // make dropdown display watch status from database and remove underscores and capitalize first letter of each word
    document.querySelectorAll('.dropdown-item').forEach(item => {
        const status = item.dataset.status;
        const formattedText = status
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        item.textContent = formattedText;
    });

    // when a dropdown option (status)is clicked
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', async function(e) {
            e.preventDefault();
            const status = this.dataset.status;

            //send movie/series id and type along with the chosen status to server
            try {
                const response = await fetch('/watchlist/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        media_id: mediaId,
                        media_type: mediaType,
                        status: status
                    })
                });

                //if user is not logged in
                if (response.status === 401) {
                    // Show error toast and redirect
                    document.getElementById('errorToastBody').textContent = 'Please sign up or log in to add items to your watchlist! Taking you to sign in.';
                    errorToast.show();
                    setTimeout(() => {
                        window.location.href = '/sign-in';
                    }, 3000); // after 3 seconds
                } else if (response.ok) {
                    //if okay change button text to the chosen status formated
                    const formattedStatus = status
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    document.getElementById('dropdownMenuButton1').textContent = formattedStatus;
                    successToast.show();
                } else {
                    throw new Error('Failed to add to list');
                }
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('errorToastBody').textContent = 'Failed to add to list. Please try again.';
                errorToast.show();
            }
        });
    });
});