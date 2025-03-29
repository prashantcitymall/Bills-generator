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
    const profileDropdownBtn = document.querySelector('.profile-dropdown-btn');

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

    // Add profile picture if available
    if (profile && profile.profile_picture) {
        // Check if profile picture element already exists
        let profilePic = profileDropdownBtn.querySelector('.profile-pic');
        
        // If it doesn't exist, create it
        if (!profilePic) {
            profilePic = document.createElement('img');
            profilePic.className = 'profile-pic';
            profilePic.style.width = '24px';
            profilePic.style.height = '24px';
            profilePic.style.borderRadius = '50%';
            profilePic.style.marginRight = '8px';
            profilePic.alt = 'Profile';
            
            // Insert before the greeting span
            const greeting = profileDropdownBtn.querySelector('.user-greeting');
            if (greeting) {
                profileDropdownBtn.insertBefore(profilePic, greeting);
            } else {
                profileDropdownBtn.prepend(profilePic);
            }
        }
        
        // Set or update the profile picture src
        profilePic.src = profile.profile_picture;
        console.log('Profile picture set:', profile.profile_picture);
    }

    // Setup profile dropdown
    const profileDropdownContent = document.querySelector('.profile-dropdown-content');

    if (profileDropdownBtn && profileDropdownContent) {
        const profileDropdown = profileDropdownBtn.closest('.dropdown');
        
        if (profileDropdown) {
            // Remove any existing event listeners by cloning and replacing
            const newProfileDropdown = profileDropdown.cloneNode(true);
            profileDropdown.parentNode.replaceChild(newProfileDropdown, profileDropdown);
            
            // Add event listeners to the new element
            newProfileDropdown.addEventListener('mouseenter', function() {
                profileDropdownContent.style.opacity = '1';
                profileDropdownContent.style.visibility = 'visible';
                profileDropdownContent.style.transform = 'translateY(0)';
            });

            newProfileDropdown.addEventListener('mouseleave', function() {
                profileDropdownContent.style.opacity = '0';
                profileDropdownContent.style.visibility = 'hidden';
                profileDropdownContent.style.transform = 'translateY(10px)';
            });
            
            // Re-add click event to logout link
            const logoutLink = newProfileDropdown.querySelector('.logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    // Clear stored auth state before logout
                    localStorage.removeItem('authState');
                    window.location.href = '/auth/logout';
                });
                console.log('Logout link event listener added');
            } else {
                console.log('Logout link not found');
            }
        }
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
