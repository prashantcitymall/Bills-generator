document.addEventListener('DOMContentLoaded', function() {
    // Create logger for initialization
    const logger = {
        info: (message) => console.log(`AUTH-INIT: ${message}`),
        debug: (message) => console.log(`AUTH-INIT-DEBUG: ${message}`),
        error: (message) => console.error(`AUTH-INIT-ERROR: ${message}`)
    };
    
    // Clear initialAuthCheckDone flag on page load to force a fresh check
    sessionStorage.removeItem('initialAuthCheckDone');
    
    // Initialize authentication state
    window.authState = {
        isAuthenticated: false,
        lastUpdated: Date.now(),
        profile: null
    };
    
    // Get authentication elements
    const googleSignInButton = document.querySelector('.google-signin-button');
    const userProfile = document.querySelector('.user-profile');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const allSignInButtons = document.querySelectorAll('.google-signin-button, #googleSignInBtn, .auth-buttons .btn, .signin-btn, button[aria-label="Sign in"]');
    
    // Log which elements were found for debugging
    logger.debug(`Initial elements found: 
        googleSignInButton: ${!!googleSignInButton}
        googleSignInBtn: ${!!googleSignInBtn}
        allSignInButtons count: ${allSignInButtons ? allSignInButtons.length : 0}
        userProfile: ${!!userProfile}
    `);
    
    // Initially hide both until we know the auth state
    if (userProfile) userProfile.style.display = 'none';
    
    // Hide all sign-in buttons initially until we know auth state
    allSignInButtons.forEach(button => {
        if (button) button.style.display = 'none';
    });
    
    if (googleSignInButton) googleSignInButton.style.display = 'none';
    if (googleSignInBtn) googleSignInBtn.style.display = 'none';
    
    // Dropdown functionality
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');

    if (dropdownBtn && dropdownContent) {
        // Variables to track hover state
        let isHovering = false;
        let hideTimeout;
        
        // Show dropdown on hover
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) {
            dropdown.addEventListener('mouseenter', function() {
                isHovering = true;
                // Clear any pending hide timeout
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
                
                dropdownContent.style.opacity = '1';
                dropdownContent.style.visibility = 'visible';
                dropdownContent.style.transform = 'translateY(0)';
            });

            dropdown.addEventListener('mouseleave', function() {
                isHovering = false;
                
                // Use a timeout to delay hiding the dropdown
                hideTimeout = setTimeout(() => {
                    if (!isHovering) {
                        dropdownContent.style.opacity = '0';
                        dropdownContent.style.visibility = 'hidden';
                        dropdownContent.style.transform = 'translateY(10px)';
                    }
                }, 200); // 200ms delay
            });
            
            // Also add events to the dropdown content itself
            dropdownContent.addEventListener('mouseenter', function() {
                isHovering = true;
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
            });
            
            dropdownContent.addEventListener('mouseleave', function() {
                isHovering = false;
                hideTimeout = setTimeout(() => {
                    if (!isHovering) {
                        dropdownContent.style.opacity = '0';
                        dropdownContent.style.visibility = 'hidden';
                        dropdownContent.style.transform = 'translateY(10px)';
                    }
                }, 200); // 200ms delay
            });
        }
    }
    
    // Profile dropdown functionality - click-based toggle
    function setupProfileDropdown() {
        const userProfile = document.querySelector('.user-profile');
        const profileMenu = document.querySelector('.profile-menu');
        
        if (userProfile && profileMenu) {
            let isProfileMenuOpen = false;
            
            // Toggle dropdown on click
            userProfile.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event from bubbling to document
                
                // Toggle the dropdown visibility
                if (isProfileMenuOpen) {
                    profileMenu.classList.remove('active');
                    isProfileMenuOpen = false;
                } else {
                    profileMenu.classList.add('active');
                    isProfileMenuOpen = true;
                }
            });
            
            // Close dropdown when clicking elsewhere on the page
            document.addEventListener('click', function() {
                if (isProfileMenuOpen) {
                    profileMenu.classList.remove('active');
                    isProfileMenuOpen = false;
                }
            });
            
            // Prevent dropdown from closing when clicking inside it
            profileMenu.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event from bubbling to document
            });
        }
    }
    
    // Call the setup function after authentication is checked
    setTimeout(setupProfileDropdown, 1000); // Give time for auth check to complete
    
    logger.info('Initializing authentication state');
    
    // Force a fresh authentication check on every page load
    // This is critical for cross-domain authentication
    checkAuthStatus(true);
    
    // Set up periodic auth check every 2 minutes
    setInterval(() => checkAuthStatus(false), 2 * 60 * 1000);
});

// Function to check authentication status
async function checkAuthStatus(forceCheck = false) {
    try {
        // Create logger for this function
        const logger = {
            info: (message) => console.log(`AUTH-CLIENT: ${message}`),
            debug: (message) => console.log(`AUTH-CLIENT-DEBUG: ${message}`),
            error: (message) => console.error(`AUTH-CLIENT-ERROR: ${message}`)
        };
        
        logger.info(`Checking authentication status${forceCheck ? ' (forced)' : ''}`);
        
        // Skip cache check if force check is requested
        if (!forceCheck) {
            // Check if we've already checked auth status recently (within last 30 seconds)
            // This prevents redundant API calls during page load
            const lastChecked = sessionStorage.getItem('authLastChecked');
            if (lastChecked) {
                const timeSinceLastCheck = Date.now() - parseInt(lastChecked);
                if (timeSinceLastCheck < 30000) { // 30 seconds
                    logger.debug(`Auth check skipped - last checked ${timeSinceLastCheck}ms ago`);
                    
                    // If we have a cached auth state, use it
                    const cachedAuthState = sessionStorage.getItem('authState');
                    if (cachedAuthState) {
                        try {
                            const authState = JSON.parse(cachedAuthState);
                            if (authState.isAuthenticated && authState.profile) {
                                logger.debug('Using cached authenticated state');
                                window.authState = {
                                    isAuthenticated: true,
                                    lastUpdated: Date.now(),
                                    profile: authState.profile
                                };
                                showAuthenticatedUI(authState.profile);
                                return;
                            } else {
                                logger.debug('Using cached unauthenticated state');
                                handleUnauthenticatedState();
                                return;
                            }
                        } catch (e) {
                            logger.error(`Error parsing cached auth state: ${e.message}`);
                            // Continue with fresh check
                        }
                    }
                    return; // Skip check if we checked recently
                }
            }
        } else {
            logger.debug('Forced check - bypassing cache');
        }
        
        // Update last checked timestamp
        sessionStorage.setItem('authLastChecked', Date.now().toString());
        sessionStorage.setItem('initialAuthCheckDone', 'true');
        
        // Fetch user profile data with proper credentials
        const response = await fetch('/api/user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Critical for sending cookies with the request
            cache: 'no-store' // Prevent caching of authentication status
        });

        logger.debug(`Auth status response: ${response.status}`);
        
        if (response.ok) {
            try {
                // User is authenticated
                const data = await response.json();
                logger.debug(`Profile data received: ${JSON.stringify(data)}`);
                
                if (!data || !data.user) {
                    logger.info('No user data in response, treating as unauthenticated');
                    handleUnauthenticatedState();
                    return;
                }
                
                logger.info(`User authenticated: ${data.user.display_name || data.user.email || data.user.id}`);
                
                // Store authentication state in sessionStorage (not localStorage to avoid cross-tab issues)
                sessionStorage.setItem('authState', JSON.stringify({
                    isAuthenticated: true,
                    profile: data.user,
                    lastChecked: new Date().toISOString()
                }));
                
                window.authState = {
                    isAuthenticated: true,
                    lastUpdated: Date.now(),
                    profile: data.user
                };
                
                // Show authenticated UI immediately
                showAuthenticatedUI(data.user);
                
                // If on signin or signup page, redirect to home
                const currentPath = window.location.pathname;
                if (currentPath.includes('signin.html') || currentPath.includes('signup.html')) {
                    window.location.href = '/';
                }
            } catch (parseError) {
                logger.error(`Error parsing JSON response: ${parseError.message}`);
                handleUnauthenticatedState();
            }
        } else {
            // User is not authenticated
            logger.info(`User not authenticated, status: ${response.status}`);
            handleUnauthenticatedState();
        }
    } catch (error) {
        console.error(`AUTH-CLIENT-ERROR: Error checking authentication status: ${error.message}`);
        // Default to unauthenticated UI on error
        handleUnauthenticatedState();
    }
}

// Helper function to handle unauthenticated state
function handleUnauthenticatedState() {
    // Clear any stored auth state
    sessionStorage.removeItem('authState');
    
    window.authState = {
        isAuthenticated: false,
        lastUpdated: Date.now(),
        profile: null
    };
    showUnauthenticatedUI();
}

// Show UI for authenticated users
function showAuthenticatedUI(profile) {
    // Create logger for this function
    const logger = {
        info: (message) => console.log(`AUTH-UI: ${message}`),
        debug: (message) => console.log(`AUTH-UI-DEBUG: ${message}`),
        error: (message) => console.error(`AUTH-UI-ERROR: ${message}`)
    };
    
    logger.info(`Showing authenticated UI for ${profile?.display_name || profile?.email || 'user'}`);
    
    // Set global authentication state
    window.authState = {
        isAuthenticated: true,
        lastUpdated: Date.now(),
        profile: profile
    };
    
    // Find all possible sign-in button elements using multiple selectors
    const googleSignInButton = document.querySelector('.google-signin-button');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const allSignInButtons = document.querySelectorAll('.google-signin-button, #googleSignInBtn, .auth-buttons .btn, .signin-btn, button[aria-label="Sign in"]');
    const userProfile = document.querySelector('.user-profile');
    const userName = document.querySelector('.user-name');
    const profileDropdownBtn = document.querySelector('.profile-btn');
    
    // Log which elements were found for debugging
    logger.debug(`Found elements: 
        googleSignInButton: ${!!googleSignInButton}
        googleSignInBtn: ${!!googleSignInBtn}
        allSignInButtons count: ${allSignInButtons ? allSignInButtons.length : 0}
        userProfile: ${!!userProfile}
        userName: ${!!userName}
        profileDropdownBtn: ${!!profileDropdownBtn}
    `);
    
    // Hide all sign-in buttons
    allSignInButtons.forEach(button => {
        if (button) {
            button.style.display = 'none';
            logger.debug(`Hidden sign-in button: ${button.id || button.className}`);
        }
    });
    
    // Also try specific buttons
    if (googleSignInButton) {
        googleSignInButton.style.display = 'none';
        logger.debug('Sign-in button hidden by class');
    }
    
    if (googleSignInBtn) {
        googleSignInBtn.style.display = 'none';
        logger.debug('Google sign-in button hidden by ID');
    }
    
    // Find auth buttons container and hide it
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.style.display = 'none';
        logger.debug('Auth buttons container hidden');
    }
    
    // Hide any elements with the sign-in class
    const signInElements = document.querySelectorAll('.signin-btn, .sign-in, .login-btn, .google-signin');
    signInElements.forEach(el => {
        el.style.display = 'none';
        logger.debug(`Hidden additional sign-in element: ${el.className}`);
    });
    
    // Show user profile
    if (userProfile) {
        userProfile.style.display = 'flex';
        logger.debug('User profile shown');
    } else {
        // If the user-profile element doesn't exist, we need to create it
        logger.debug('User profile element not found, creating it');
        createUserProfileElement(profile);
        return; // After creating the element, return as we'll rerun this function
    }
    
    if (userName && profile && (profile.display_name || profile.email)) {
        userName.textContent = profile.display_name || profile.email;
        logger.debug(`Username set to: ${profile.display_name || profile.email}`);
    } else {
        logger.debug('Could not set username', { 
            userNameExists: !!userName, 
            profileExists: !!profile, 
            displayNameExists: profile ? !!(profile.display_name || profile.email) : false 
        });
    }

    // Add profile picture if available
    if (profile && profile.profile_picture && profileDropdownBtn) {
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
        logger.debug('Profile picture set:', profile.profile_picture);
    }

    // Setup profile dropdown
    const profileDropdownContent = document.querySelector('.profile-dropdown-content');

    if (profileDropdownBtn && profileDropdownContent) {
        const profileDropdown = profileDropdownBtn.closest('.dropdown');
        
        if (profileDropdown) {
            // Remove any existing event listeners by cloning and replacing
            const newProfileDropdown = profileDropdown.cloneNode(true);
            profileDropdown.parentNode.replaceChild(newProfileDropdown, profileDropdown);
            
            // Add a variable to track if we're hovering over the dropdown
            let isHovering = false;
            let hideTimeout;
            
            // Add event listeners to the new element
            newProfileDropdown.addEventListener('mouseenter', function() {
                isHovering = true;
                // Clear any pending hide timeout
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
                
                const dropdownContent = newProfileDropdown.querySelector('.profile-dropdown-content');
                if (dropdownContent) {
                    dropdownContent.style.opacity = '1';
                    dropdownContent.style.visibility = 'visible';
                    dropdownContent.style.transform = 'translateY(0)';
                    
                    // Also add mouseenter/mouseleave to the dropdown content itself
                    dropdownContent.addEventListener('mouseenter', function() {
                        isHovering = true;
                        if (hideTimeout) {
                            clearTimeout(hideTimeout);
                            hideTimeout = null;
                        }
                    });
                    
                    dropdownContent.addEventListener('mouseleave', function() {
                        isHovering = false;
                        hideTimeout = setTimeout(() => {
                            if (!isHovering) {
                                dropdownContent.style.opacity = '0';
                                dropdownContent.style.visibility = 'hidden';
                                dropdownContent.style.transform = 'translateY(10px)';
                            }
                        }, 200); // 200ms delay before hiding
                    });
                }
            });

            newProfileDropdown.addEventListener('mouseleave', function() {
                isHovering = false;
                
                // Use a timeout to delay hiding the dropdown
                // This gives time for the mouse to enter the dropdown content
                hideTimeout = setTimeout(() => {
                    if (!isHovering) {
                        const dropdownContent = newProfileDropdown.querySelector('.profile-dropdown-content');
                        if (dropdownContent) {
                            dropdownContent.style.opacity = '0';
                            dropdownContent.style.visibility = 'hidden';
                            dropdownContent.style.transform = 'translateY(10px)';
                        }
                    }
                }, 200); // 200ms delay before hiding
            });
            
            // Re-add click event to logout link
            const logoutLink = newProfileDropdown.querySelector('.logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    // Clear stored auth state before logout
                    sessionStorage.removeItem('authState');
                    window.location.href = '/auth/logout';
                });
                logger.debug('Logout link event listener added');
            } else {
                logger.debug('Logout link not found');
            }
        }
    }
}

// Create user profile element if it doesn't exist
function createUserProfileElement(profile) {
    // Create logger for this function
    const logger = {
        info: (message) => console.log(`AUTH-UI: ${message}`),
        debug: (message) => console.log(`AUTH-UI-DEBUG: ${message}`),
        error: (message) => console.error(`AUTH-UI-ERROR: ${message}`)
    };
    
    logger.debug(`Creating user profile element for: ${profile.display_name}`);
    
    const navRight = document.querySelector('.nav-right');
    if (!navRight) {
        logger.error('Nav right element not found');
        return;
    }
    
    // Create user profile element
    const userProfile = document.createElement('div');
    userProfile.className = 'user-profile';
    userProfile.style.display = 'flex';
    
    // Create profile button
    const profileBtn = document.createElement('button');
    profileBtn.className = 'profile-btn';
    
    // Create profile picture if available
    if (profile.profile_picture) {
        const profilePic = document.createElement('img');
        profilePic.className = 'profile-pic';
        profilePic.src = profile.profile_picture;
        profilePic.alt = 'Profile';
        profileBtn.appendChild(profilePic);
    } else {
        // If no profile picture, use a user icon
        const userIcon = document.createElement('i');
        userIcon.className = 'fas fa-user-circle';
        profileBtn.appendChild(userIcon);
    }
    
    // Create greeting span
    const greeting = document.createElement('span');
    greeting.className = 'user-greeting';
    greeting.innerHTML = `Hi, <span class="user-name">${profile.display_name}</span> <i class="fas fa-chevron-down"></i>`;
    profileBtn.appendChild(greeting);
    
    // Create profile menu
    const profileMenu = document.createElement('div');
    profileMenu.className = 'profile-menu';
    profileMenu.setAttribute('role', 'menu');
    profileMenu.setAttribute('aria-label', 'User Menu');
    
    // Add menu items
    profileMenu.innerHTML = `
        <a href="/profile.html" role="menuitem"><i class="fas fa-user"></i>My Profile</a>
        <a href="/my-bills.html" role="menuitem"><i class="fas fa-file-invoice"></i>My Bills</a>
        <a href="#" class="logout-link" role="menuitem"><i class="fas fa-sign-out-alt"></i>Logout</a>
    `;
    
    // Assemble the elements
    userProfile.appendChild(profileBtn);
    userProfile.appendChild(profileMenu);
    
    // Find the auth buttons element and replace it
    const authButtons = navRight.querySelector('.auth-buttons');
    if (authButtons) {
        navRight.replaceChild(userProfile, authButtons);
    } else {
        navRight.appendChild(userProfile);
    }
    
    // Add event listener for logout link
    const logoutLink = profileMenu.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Clear stored auth state before logout
            sessionStorage.removeItem('authState');
            window.location.href = '/auth/logout';
        });
    }
    
    // Now that we've created the element, call showAuthenticatedUI again
    showAuthenticatedUI(profile);
}

// Show UI for unauthenticated users
function showUnauthenticatedUI() {
    // Create logger for this function
    const logger = {
        info: (message) => console.log(`AUTH-UI: ${message}`),
        debug: (message) => console.log(`AUTH-UI-DEBUG: ${message}`),
        error: (message) => console.error(`AUTH-UI-ERROR: ${message}`)
    };
    
    logger.info('Showing unauthenticated UI');
    
    // Find all elements
    const googleSignInButton = document.querySelector('.google-signin-button');
    const userProfile = document.querySelector('.user-profile');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const authButtons = document.querySelector('.auth-buttons');
    const allSignInButtons = document.querySelectorAll('.google-signin-button, #googleSignInBtn, .auth-buttons .btn, .signin-btn, button[aria-label="Sign in"]');

    // Log which elements were found for debugging
    logger.debug(`Found elements for unauthenticated UI: 
        googleSignInButton: ${!!googleSignInButton}
        googleSignInBtn: ${!!googleSignInBtn}
        allSignInButtons count: ${allSignInButtons ? allSignInButtons.length : 0}
        userProfile: ${!!userProfile}
        authButtons: ${!!authButtons}
    `);

    // Always hide user profile when not authenticated
    if (userProfile) {
        userProfile.style.display = 'none';
        logger.debug('User profile hidden');
    }

    // Show all sign-in buttons
    allSignInButtons.forEach(button => {
        if (button) {
            button.style.display = 'inline-flex';
            logger.debug(`Shown sign-in button: ${button.id || button.className}`);
        }
    });

    // Show sign-in button when not authenticated
    if (googleSignInButton) {
        googleSignInButton.style.display = 'inline-flex';
        logger.debug('Sign-in button shown by class');
    }
    
    if (googleSignInBtn) {
        googleSignInBtn.style.display = 'inline-flex';
        logger.debug('Google sign-in button shown by ID');
    }
    
    // Show auth buttons container if it exists
    if (authButtons) {
        authButtons.style.display = 'flex';
        logger.debug('Auth buttons container shown');
    }
}
