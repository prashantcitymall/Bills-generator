document.addEventListener('DOMContentLoaded', function() {
    // Dropdown functionality
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');

    if (dropdownBtn && dropdownContent) {
        // Show dropdown on hover
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) {
            dropdown.addEventListener('mouseenter', function() {
                dropdownContent.style.opacity = '1';
                dropdownContent.style.visibility = 'visible';
                dropdownContent.style.transform = 'translateY(0)';
            });

            dropdown.addEventListener('mouseleave', function() {
                dropdownContent.style.opacity = '0';
                dropdownContent.style.visibility = 'hidden';
                dropdownContent.style.transform = 'translateY(10px)';
            });
        }
    }

    // Check if user is authenticated
    checkAuthStatus();
});

// Function to check authentication status
async function checkAuthStatus() {
    try {
        // Fetch user profile data
        const response = await fetch('/api/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Important for cookies/session
        });

        if (response.ok) {
            // User is authenticated
            const data = await response.json();
            showAuthenticatedUI(data.profile);
        } else {
            // User is not authenticated
            showUnauthenticatedUI();
        }
    } catch (error) {
        console.error('Error checking authentication status:', error);
        // Default to unauthenticated UI on error
        showUnauthenticatedUI();
    }
}

// Show UI for authenticated users
function showAuthenticatedUI(profile) {
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    const userName = document.querySelector('.user-name');

    if (authButtons) authButtons.style.display = 'none';
    if (userProfile) userProfile.style.display = 'flex';
    if (userName && profile && profile.display_name) {
        userName.textContent = profile.display_name;
    }

    // Setup profile dropdown
    const profileDropdownBtn = document.querySelector('.profile-dropdown-btn');
    const profileDropdownContent = document.querySelector('.profile-dropdown-content');

    if (profileDropdownBtn && profileDropdownContent) {
        const profileDropdown = profileDropdownBtn.parentElement;
        
        profileDropdown.addEventListener('mouseenter', function() {
            profileDropdownContent.style.opacity = '1';
            profileDropdownContent.style.visibility = 'visible';
            profileDropdownContent.style.transform = 'translateY(0)';
        });

        profileDropdown.addEventListener('mouseleave', function() {
            profileDropdownContent.style.opacity = '0';
            profileDropdownContent.style.visibility = 'hidden';
            profileDropdownContent.style.transform = 'translateY(10px)';
        });
    }

    // Setup logout functionality
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/auth/logout';
        });
    }
}

// Show UI for unauthenticated users
function showUnauthenticatedUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');

    if (authButtons) authButtons.style.display = 'flex';
    if (userProfile) userProfile.style.display = 'none';
}
