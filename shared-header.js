document.addEventListener('DOMContentLoaded', function() {
    // Initially hide both auth elements until we check status
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userProfile) userProfile.style.display = 'none';
    
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

    // Check if we have a stored auth state first
    const storedAuthState = localStorage.getItem('authState');
    if (storedAuthState) {
        try {
            const authData = JSON.parse(storedAuthState);
            if (authData && authData.isAuthenticated && authData.profile) {
                // Show authenticated UI immediately with stored data
                // This prevents flashing of login/signup during page reload
                showAuthenticatedUI(authData.profile);
            }
        } catch (e) {
            console.error('Error parsing stored auth state:', e);
            // Clear invalid stored state
            localStorage.removeItem('authState');
        }
    }

    // Always check current auth status with server
    checkAuthStatus();
});

// Function to check authentication status
async function checkAuthStatus() {
    try {
        console.log('Checking authentication status...');
        
        // Fetch user profile data with proper credentials
        const response = await fetch('/api/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Critical for sending cookies with the request
        });

        console.log('Auth status response:', response.status);
        
        if (response.ok) {
            // User is authenticated
            const data = await response.json();
            console.log('Profile data received:', data);
            
            // Store authentication state in localStorage
            localStorage.setItem('authState', JSON.stringify({
                isAuthenticated: true,
                profile: data.profile,
                lastChecked: new Date().toISOString()
            }));
            
            showAuthenticatedUI(data.profile);
        } else {
            // User is not authenticated
            console.log('User not authenticated, status:', response.status);
            
            // Clear any stored auth state
            localStorage.removeItem('authState');
            
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
    console.log('Showing authenticated UI for profile:', profile);
    
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    const userName = document.querySelector('.user-name');

    if (authButtons) {
        authButtons.style.display = 'none';
        console.log('Auth buttons hidden');
    }
    
    if (userProfile) {
        userProfile.style.display = 'flex';
        console.log('User profile shown');
    }
    
    if (userName && profile && profile.display_name) {
        userName.textContent = profile.display_name;
        console.log('Username set to:', profile.display_name);
    } else {
        console.log('Could not set username', { 
            userNameExists: !!userName, 
            profileExists: !!profile, 
            displayNameExists: profile ? !!profile.display_name : false 
        });
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
            // Clear stored auth state before logout
            localStorage.removeItem('authState');
            window.location.href = '/auth/logout';
        });
    }
}

// Show UI for unauthenticated users
function showUnauthenticatedUI() {
    console.log('Showing unauthenticated UI');
    
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');

    if (authButtons) {
        authButtons.style.display = 'flex';
        console.log('Auth buttons shown');
    }
    
    if (userProfile) {
        userProfile.style.display = 'none';
        console.log('User profile hidden');
    }
}
