document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded, initializing header...');
    
    // Initialize header elements after a short delay to ensure they're loaded
    setTimeout(initializeHeader, 100);
});

// Initialize header elements and set up event listeners
function initializeHeader() {
    console.log('Initializing header elements...');
    
    // Initially hide both auth elements until we check status
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userProfile) userProfile.style.display = 'none';
    if (googleSignInBtn) googleSignInBtn.style.display = 'none'; // Hide sign-in button initially
    
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
                showAuthenticatedUI(authData.profile);
            } else {
                console.log('Stored auth state invalid or user not authenticated');
                showUnauthenticatedUI();
            }
        } catch (e) {
            console.error('Error parsing stored auth state:', e);
            // Clear invalid stored state
            localStorage.removeItem('authState');
            showUnauthenticatedUI();
        }
    } else {
        console.log('No stored auth state found');
    }

    // Always check current auth status with server
    checkAuthStatus();
}

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
            
            // Explicitly hide the Google sign-in button and show the user profile
            const googleSignInBtn = document.getElementById('googleSignInBtn');
            if (googleSignInBtn) {
                googleSignInBtn.style.display = 'none';
                console.log('Google sign-in button hidden (authenticated)');
            } else {
                console.log('Google sign-in button not found in DOM');
            }
            
            showAuthenticatedUI(data.profile);
            
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
            
            // Explicitly show the Google sign-in button
            const googleSignInBtn = document.getElementById('googleSignInBtn');
            if (googleSignInBtn) {
                googleSignInBtn.style.display = 'flex';
                console.log('Google sign-in button shown (unauthenticated)');
            } else {
                console.log('Google sign-in button not found in DOM');
            }
            
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
    
    // Try to find elements multiple times with increasing delay if not found
    // This helps when elements are loaded dynamically
    findElementsWithRetry(function() {
        const authButtons = document.querySelector('.auth-buttons');
        const userProfile = document.querySelector('.user-profile');
        const userName = document.querySelector('.user-name');
        const profileDropdownBtn = document.querySelector('.profile-dropdown-btn');
        const googleSignInBtn = document.getElementById('googleSignInBtn');
        
        console.log('Elements found:', { 
            authButtons: !!authButtons, 
            userProfile: !!userProfile, 
            userName: !!userName, 
            profileDropdownBtn: !!profileDropdownBtn,
            googleSignInBtn: !!googleSignInBtn
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
            return false; // Return false to continue retrying
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
        
        return true; // Elements found and updated
    });

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
    console.log('Showing unauthenticated UI');
    
    // Try to find elements multiple times with increasing delay if not found
    findElementsWithRetry(function() {
        const authButtons = document.querySelector('.auth-buttons');
        const userProfile = document.querySelector('.user-profile');
        const googleSignInBtn = document.getElementById('googleSignInBtn');
        
        console.log('Elements found for unauthenticated UI:', { 
            authButtons: !!authButtons, 
            userProfile: !!userProfile, 
            googleSignInBtn: !!googleSignInBtn 
        });
        
        // IMPORTANT: First show the Google sign-in button
        if (googleSignInBtn) {
            googleSignInBtn.style.display = 'flex';
            console.log('Google sign-in button shown');
        } else {
            console.warn('Google sign-in button not found by ID');
            // Try to find it by class if ID is not found
            const signInByClass = document.querySelector('.google-signin-button');
            if (signInByClass) {
                signInByClass.style.display = 'flex';
                console.log('Google sign-in button shown by class selector');
            }
        }
        
        if (authButtons) {
            authButtons.style.display = 'flex';
            console.log('Auth buttons shown');
        }
        
        if (userProfile) {
            userProfile.style.display = 'none';
            console.log('User profile hidden');
        }
        
        return true; // Elements found and updated
    });
}

// Helper function to find elements with retry
function findElementsWithRetry(callback, maxRetries = 5, delay = 100) {
    let retries = 0;
    
    function attempt() {
        if (retries >= maxRetries) {
            console.error('Max retries reached, could not find all elements');
            return;
        }
        
        const result = callback();
        if (result === false) {
            retries++;
            console.log(`Retry attempt ${retries}/${maxRetries} after ${delay}ms`);
            setTimeout(attempt, delay);
            // Increase delay for next retry
            delay *= 1.5;
        }
    }
    
    attempt();
}
