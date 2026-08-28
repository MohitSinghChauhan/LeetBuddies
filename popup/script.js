document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const themeBtn = document.getElementById('toggleTheme');
    const refreshBtn = document.getElementById('refreshBtn');
    const addBtn = document.getElementById('addBtn');
    const searchInput = document.getElementById('usernameInput');
    const sortSelect = document.getElementById('sortSelect');
    const friendsListContainer = document.getElementById('friendsList');
    const emptyState = document.getElementById('emptyState');
    
    const themeSelect = document.getElementById('themeSelect');
    const extSelect = document.getElementById('extSelect');

    const userCardTemplate = document.getElementById('userCardTemplate');
    
    let friendsData = [];

    // --- Initialization ---
    init();

    async function init() {
        chrome.storage.local.get(['theme', 'ext', 'friends', 'appTheme', 'sortBy'], (result) => {
            // App UI Theme
            const appTheme = result.appTheme || 'dark';
            document.body.setAttribute('data-theme', appTheme);
            updateThemeIcon(appTheme);

            // Options
            if (result.theme) themeSelect.value = result.theme;
            if (result.ext !== undefined) extSelect.value = result.ext;
            if (result.sortBy !== undefined) sortSelect.value = result.sortBy;

            friendsData = result.friends || [];
            
            // 1) Render cached data FIRST for a better user experience (no empty flashes).
            renderFriends();

            // 2) Automatic silent refresh on startup to get the latest data behind the scenes.
            refreshAll(true);
        });

        // Setup Event Listeners
        themeBtn.addEventListener('click', toggleAppTheme);
        refreshBtn.addEventListener('click', () => refreshAll(false)); 
        
        addBtn.addEventListener('click', handleAdd);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAdd();
        });

        sortSelect.addEventListener('change', () => {
            chrome.storage.local.set({ sortBy: sortSelect.value });
            sortFriends();
        });
        
        themeSelect.addEventListener('change', () => {
            savePrefs();
            // Re-render to update iframes if any are open
            renderFriends();
        });
        extSelect.addEventListener('change', () => {
            savePrefs();
            renderFriends();
        });
    }

    // --- Core Functions ---

    function toggleAppTheme() {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        updateThemeIcon(next);
        chrome.storage.local.set({ appTheme: next });
    }

    function updateThemeIcon(theme) {
        const icon = themeBtn.querySelector('i');
        icon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }

    function savePrefs() {
        chrome.storage.local.set({
            theme: themeSelect.value,
            ext: extSelect.value
        });
    }

    async function fetchUserData(username) {
        try {
            const res = await fetch(`https://leetcode-stats-api-qgnk.onrender.com/${username}`);
            const data = await res.json();
            return data;
        } catch (e) {
            console.error(e);
            return { status: "error", message: "Network Error" };
        }
    }

    async function handleAdd() {
        const username = searchInput.value.trim();
        if (!username) return;

        // Prevent duplicates
        if (friendsData.some(f => f.username.toLowerCase() === username.toLowerCase())) {
            iziToast.warning({ title: 'Already tracked', message: `${username} is already on your list.`});
            return;
        }

        addBtn.disabled = true;
        addBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        const data = await fetchUserData(username);
        
        addBtn.disabled = false;
        addBtn.innerHTML = 'Add';
        searchInput.value = '';

        if (data.status === 'success') {
            friendsData.push(mapUserStats(username, data));
            sortFriends();
            iziToast.success({ title: 'Added', message: `Successfully added ${username}!`});
        } else {
            iziToast.error({ title: 'Error', message: data.message || 'User not found.'});
        }
    }

    function mapUserStats(username, data) {
         return {
            username: username,
            easySolved: data.easySolved,
            mediumSolved: data.mediumSolved,
            hardSolved: data.hardSolved,
            totalSolved: data.totalSolved,
            totalEasy: data.totalEasy,
            totalMedium: data.totalMedium,
            totalHard: data.totalHard,
            totalQuestions: data.totalQuestions,
        };
    }

    function removeFriend(username) {
        friendsData = friendsData.filter(f => f.username !== username);
        saveDataAndRender();
    }

    function sortFriends() {
        const sortType = sortSelect.value;
        friendsData.sort((a, b) => {
            if (sortType === 'total') return b.totalSolved - a.totalSolved;
            if (sortType === 'easy') return b.easySolved - a.easySolved;
            if (sortType === 'medium') return b.mediumSolved - a.mediumSolved;
            if (sortType === 'hard') return b.hardSolved - a.hardSolved;
            return b.totalSolved - a.totalSolved;
        });
        saveDataAndRender();
    }

    async function refreshAll(silent = false) {
        if (friendsData.length === 0) {
            renderFriends(); // Render empty state
            return;
        }

        if (!silent) {
            refreshBtn.disabled = true;
            refreshBtn.querySelector('i').classList.add('fa-spin');
        }
        
        let allSuccess = true;
        let anyUpdated = false;

        for (let i = 0; i < friendsData.length; i++) {
            const data = await fetchUserData(friendsData[i].username);
            if (data.status === 'success') {
                friendsData[i] = mapUserStats(friendsData[i].username, data);
                anyUpdated = true;
            } else {
                allSuccess = false;
            }
        }

        if (!silent) {
            refreshBtn.disabled = false;
            refreshBtn.querySelector('i').classList.remove('fa-spin');
        }

        if (anyUpdated || !silent) {
            sortFriends();
        }

        if (!silent) {
            if (allSuccess) iziToast.success({ title: 'Refreshed', message: 'All stats updated!'});
            else iziToast.warning({ title: 'Partial Refresh', message: 'Some users failed to update.'});
        }
    }

    function saveDataAndRender() {
        chrome.storage.local.set({ friends: friendsData }, () => {
            renderFriends();
        });
    }

    // --- Rendering ---
    function renderFriends() {
        friendsListContainer.innerHTML = '';

        if (friendsData.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');

            friendsData.forEach((friend) => {
                const clone = userCardTemplate.content.cloneNode(true);
                const userCard = clone.querySelector('.user-card');
                
                const usernameEl = clone.querySelector('.username');
                usernameEl.textContent = friend.username;
                usernameEl.href = `https://leetcode.com/${friend.username}`;
                
                clone.querySelector('.easy-val').textContent = friend.easySolved;
                clone.querySelector('.medium-val').textContent = friend.mediumSolved;
                clone.querySelector('.hard-val').textContent = friend.hardSolved;
                clone.querySelector('.total-val').textContent = friend.totalSolved;

                // Handle Delete
                const delBtn = clone.querySelector('.delete-btn');
                delBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFriend(friend.username);
                });

                // Accordion click effect
                const toggleBtn = clone.querySelector('.toggle-stats-btn');
                const img = clone.querySelector('img.leetcard-img');

                toggleBtn.addEventListener('click', () => {
                    // Toggle expanded class
                    const isExpanded = userCard.classList.toggle('expanded');
                    
                    if (isExpanded) {
                        toggleBtn.title = 'Hide Rich Stats';
                        // Load img source if it's empty
                        if (!img.src || img.src === window.location.href) {
                            const lcExt = extSelect.value;
                            const lcTheme = themeSelect.value;
                            img.src = `https://leetcard.jacoblin.cool/${friend.username}?theme=${lcTheme}&font=Inter${lcExt ? '&ext=' + lcExt : ''}`;
                        }
                    } else {
                        toggleBtn.title = 'Show Rich Stats';
                    }
                });

                friendsListContainer.appendChild(clone);
            });
        }
    }
});
