document.addEventListener('DOMContentLoaded', function() {
    // Get authentication elements
    const googleSignInButton = document.querySelector('.google-signin-button');
    const userProfile = document.querySelector('.user-profile');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    
    // Initially hide both elements until we check status
    if (googleSignInButton) googleSignInButton.style.display = 'none';
    if (userProfile) userProfile.style.display = 'none';
    if (googleSignInBtn) googleSignInBtn.style.display = 'none'; // Hide sign-in button initially
    
    // Track authentication state globally with a timestamp to prevent race conditions
    window.authState = {
        isAuthenticated: false,
        lastUpdated: Date.now(),
        profile: null
    };
    
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
                console.log('Found stored auth state, showing authenticated UI');
                // Show authenticated UI immediately with stored data
                // This prevents flashing of login/signup during page reload
                window.authState = {
                    isAuthenticated: true,
                    lastUpdated: Date.now(),
                    profile: authData.profile
                };
                showAuthenticatedUI(authData.profile);
            } else {
                // If stored data doesn't indicate authentication, show unauthenticated UI
                showUnauthenticatedUI();
            }
        } catch (e) {
            console.error('Error parsing stored auth state:', e);
            // Clear invalid stored state
            localStorage.removeItem('authState');
            showUnauthenticatedUI();
        }
    } else {
        // No stored auth state, show unauthenticated UI initially
        showUnauthenticatedUI();
    }

    // Always check current auth status with server
    checkAuthStatus();
});

// Function to check authentication status
async function checkAuthStatus() {
    try {
        console.log('Checking authentication status...');
        
        // Fetch user profile data with proper credentials
        const response = await fetch('/api/user', {
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
                profile: data.user || data.profile,
                lastChecked: new Date().toISOString()
            }));
            
            window.authState = {
                isAuthenticated: true,
                lastUpdated: Date.now(),
                profile: data.user || data.profile
            };
            showAuthenticatedUI(data.user || data.profile);
            
            // If on signin or signup page, redirect to home
            const currentPath = window.location.pathname;
            if (currentPath.includes('signin.html') || currentPath.includes('signup.html')) {
                window.location.href = '/';
            }
        } else {
            // User is not authenticated
            console.log('User not authenticated, status:', response.status);
            
            // Clear any stored auth state
            localStorage.removeItem('authState');
            
            window.authState = {
                isAuthenticated: false,
                lastUpdated: Date.now(),
                profile: null
            };
            showUnauthenticatedUI();
        }
    } catch (error) {
        console.error('Error checking authentication status:', error);
        // Default to unauthenticated UI on error
        window.authState = {
            isAuthenticated: false,
            lastUpdated: Date.now(),
            profile: null
        };
        showUnauthenticatedUI();
    }
}

// Show UI for authenticated users
function showAuthenticatedUI(profile) {
    console.log('Showing authenticated UI for profile:', profile);
    
    // Set global authentication state
    window.authState = {
        isAuthenticated: true,
        lastUpdated: Date.now(),
        profile: profile
    };
    
    const googleSignInButton = document.querySelector('.google-signin-button');
    const userProfile = document.querySelector('.user-profile');
    const userName = document.querySelector('.user-name');
    const profileDropdownBtn = document.querySelector('.profile-dropdown-btn');

    // Always hide sign-in button when authenticated
    if (googleSignInButton) {
        googleSignInButton.style.display = 'none';
        console.log('Sign-in button hidden');
    }
    
    if (userProfile) {
        userProfile.style.display = 'flex';
        console.log('User profile shown');
    } else {
        // If the user-profile element doesn't exist, we need to create it
        createUserProfileElement(profile);
        return; // After creating the element, return as we'll rerun this function
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
        
        // IMPORTANT: First hide the Google sign-in button
        if (googleSignInBtn) {
            googleSignInBtn.style.display = 'none';
            console.log('Google sign-in button hidden');
        } else {
            console.warn('Google sign-in button not found');
            // Try to find it by class if ID is not found
            const signInByClass = document.querySelector('.google-signin-button');
            if (signInByClass) {
                signInByClass.style.display = 'none';
                console.log('Google sign-in button hidden by class selector');
            }
        }
        
        // Find auth buttons container
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons) {
            authButtons.style.display = 'none';
            console.log('Auth buttons hidden');
        }
        
        if (userProfile) {
            userProfile.style.display = 'flex';
            console.log('User profile shown');
        } else {
            // If the user-profile element doesn't exist, we need to create it
            createUserProfileElement(profile);
            return; // Exit after creating the element
        }
    }

    // Add profile picture if available
    if (profile && profile.profile_picture) {
        // Check if profile picture element already exists
        let profilePic = profileDropdownBtn.querySelector('.profile-pic');
        
        // If it doesn't exist, create it
        if (!profilePic) {
            profilePic = document.createElement('img');
            profilePic.className = 'profile-pic';
            profilePic.src = profile.profile_picture;
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
                const dropdownContent = newProfileDropdown.querySelector('.profile-dropdown-content');
                if (dropdownContent) {
                    dropdownContent.style.opacity = '1';
                    dropdownContent.style.visibility = 'visible';
                    dropdownContent.style.transform = 'translateY(0)';
                }
            });

            newProfileDropdown.addEventListener('mouseleave', function() {
                const dropdownContent = newProfileDropdown.querySelector('.profile-dropdown-content');
                if (dropdownContent) {
                    dropdownContent.style.opacity = '0';
                    dropdownContent.style.visibility = 'hidden';
                    dropdownContent.style.transform = 'translateY(10px)';
                }
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

// Create user profile element if it doesn't exist
function createUserProfileElement(profile) {
    console.log('Creating user profile element for:', profile.display_name);
    
    const navRight = document.querySelector('.nav-right');
    if (!navRight) {
        console.error('Nav right element not found');
        return;
    }
    
    // Create user profile element
    const userProfile = document.createElement('div');
    userProfile.className = 'user-profile';
    userProfile.style.display = 'flex';
    
    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';
    
    // Create dropdown button
    const dropdownBtn = document.createElement('button');
    dropdownBtn.className = 'profile-dropdown-btn';
    
    // Create profile picture if available
    if (profile.profile_picture) {
        const profilePic = document.createElement('img');
        profilePic.className = 'profile-pic';
        profilePic.src = profile.profile_picture;
        profilePic.alt = 'Profile';
        dropdownBtn.appendChild(profilePic);
    } else {
        // If no profile picture, use a user icon
        const userIcon = document.createElement('i');
        userIcon.className = 'fas fa-user-circle';
        dropdownBtn.appendChild(userIcon);
    }
    
    // Create greeting span
    const greeting = document.createElement('span');
    greeting.className = 'user-greeting';
    greeting.innerHTML = `Hi, <span class="user-name">${profile.display_name}</span> <i class="fas fa-chevron-down"></i>`;
    dropdownBtn.appendChild(greeting);
    
    // Create dropdown content
    const dropdownContent = document.createElement('div');
    dropdownContent.className = 'profile-dropdown-content';
    dropdownContent.setAttribute('role', 'menu');
    dropdownContent.setAttribute('aria-label', 'User Menu');
    
    // Add menu items
    dropdownContent.innerHTML = `
        <a href="/profile.html" role="menuitem"><i class="fas fa-user"></i>My Profile</a>
        <a href="/my-bills.html" role="menuitem"><i class="fas fa-file-invoice"></i>My Bills</a>
        <a href="#" class="logout-link" role="menuitem"><i class="fas fa-sign-out-alt"></i>Logout</a>
    `;
    
    // Assemble the elements
    dropdown.appendChild(dropdownBtn);
    dropdown.appendChild(dropdownContent);
    userProfile.appendChild(dropdown);
    
    // Find the auth buttons element and replace it
    const authButtons = navRight.querySelector('.auth-buttons');
    if (authButtons) {
        navRight.replaceChild(userProfile, authButtons);
    } else {
        navRight.appendChild(userProfile);
    }
    
    // Add event listener for logout link
    const logoutLink = dropdownContent.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Clear stored auth state before logout
            localStorage.removeItem('authState');
            window.location.href = '/auth/logout';
        });
    }
    
    // Now that we've created the element, call showAuthenticatedUI again
    showAuthenticatedUI(profile);
}

// Show UI for unauthenticated users
function showUnauthenticatedUI() {
    console.log('Showing unauthenticated UI, isAuthenticated:', window.authState.isAuthenticated);
    
    const googleSignInButton = document.querySelector('.google-signin-button');
    const userProfile = document.querySelector('.user-profile');

    // If user is authenticated, don't show sign-in button regardless of UI state
    if (window.authState.isAuthenticated) {
        console.log('User is authenticated, not showing sign-in button');
        if (googleSignInButton) {
            googleSignInButton.style.display = 'none';
        }
        return;
    }
    
    // First check if user profile is visible - if it is, don't show sign-in button
    if (userProfile && userProfile.style.display === 'flex') {
        console.log('User profile is visible, not showing sign-in button');
        if (googleSignInButton) {
            googleSignInButton.style.display = 'none';
        }
        return;
    }
    
    // Only show sign-in button if user is not authenticated and profile is not visible
    if (googleSignInButton) {
        googleSignInButton.style.display = 'inline-flex';
        console.log('Sign-in button shown');
    }
    
    // Hide user profile if it exists
    if (userProfile) {
        userProfile.style.display = 'none';
        console.log('User profile hidden');
    }
}
