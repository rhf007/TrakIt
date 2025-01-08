document.addEventListener('DOMContentLoaded', () => {
    //handle search input
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-submit');
    const handleSearch = (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        // Redirect to search results page with query parameter
        window.location.href = `/search?query=${encodeURIComponent(query)}`;
    };

    // when search buttton is clicked 
    searchButton.addEventListener('click', handleSearch);

    // when enter button is pressed
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    });

    // function to capitalize the first letter of every word
    function toTitleCase(str) {
    return str.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

    // Initialize toasts to show success/failure messages
    const toastOptions = {
        animation: true,
        autohide: true,
        delay: 5000
    };
    const successToast = new bootstrap.Toast(document.getElementById('successToast'), toastOptions);
    const errorToast = new bootstrap.Toast(document.getElementById('errorToast'), toastOptions);

    // make dropdown display watch status from database
    document.querySelectorAll('.dropdown-item').forEach(item => {
        // when a dropdown option (status)is clicked
        item.addEventListener('click', async function(e) {
            e.preventDefault();
            const mediaId = this.dataset.mediaId;
            const mediaType = this.dataset.mediaType;
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
                
                if (response.ok) {
                    const statusCell = this.closest('tr').querySelector('td:nth-child(4)');
                    // format status before setting it
                    statusCell.textContent = toTitleCase(status);
                    successToast.show();
                } else {
                    throw new Error('Failed to update status');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to update status. Please try again.');
            }
        });
    });
})