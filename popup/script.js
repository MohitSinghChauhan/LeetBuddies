document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('searchInput');
  const friendsList = document.getElementById('friendsList');
  const sortButton = document.getElementById('sortButton');

  // Function to show an error toast notification
  function showErrorToast(message) {
    iziToast.error({
      title: 'Error',
      message: message,
      position: 'topRight',
      timeout: 3000,
    });
  }

  // Function to show a success toast notification
  function showSuccessToast(message) {
    iziToast.success({
      title: 'Success',
      message: message,
      position: 'topRight',
      timeout: 3000,
    });
  }

  // Function to fetch user data from the API
  async function fetchUserData(username) {
    const apiUrl = `https://leetcode-stats-api.herokuapp.com/${username}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      return data;
    } catch (error) {
      showErrorToast(error);
    }
  }

  // Function to render friend's data on the popup page
  function renderFriendData(friend, index) {
    const friendItem = document.createElement('div');
    friendItem.classList.add(
      'friend',
      'flex',
      'items-center',
      'justify-between',
      'bg-white',
      'rounded',
      'p-2',
      'mb-2'
    );

    const friendName = document.createElement('a');
    friendName.textContent = friend.username;
    friendName.href = `https://leetcode.com/${friend.username}`;
    friendName.target = '_blank';
    friendName.classList.add('text-blue-500', 'font-medium');
    friendItem.appendChild(friendName);

    const hoverModal = document.createElement('div');
    hoverModal.classList.add('box');

    const iframe = document.createElement('iframe');
    iframe.src = `https://leetcard.jacoblin.cool/${friend.username}?theme=unicorn&font=Fira%20Code&ext=heatmap`;
    iframe.width = '400px';
    iframe.height = '100%';
    iframe.style.border = 'none';
    hoverModal.appendChild(iframe);

    friendItem.appendChild(hoverModal);

    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('flex', 'gap-4');

    const easyCount = document.createElement('span');
    easyCount.textContent = `Easy: ${friend.easySolved}/${friend.totalEasy}`;
    easyCount.classList.add('text-green-500', 'font-medium');
    detailsContainer.appendChild(easyCount);

    const mediumCount = document.createElement('span');
    mediumCount.textContent = `Medium: ${friend.mediumSolved}/${friend.totalMedium}`;
    mediumCount.classList.add('text-yellow-500', 'font-medium');
    detailsContainer.appendChild(mediumCount);

    const hardCount = document.createElement('span');
    hardCount.textContent = `Hard: ${friend.hardSolved}/${friend.totalHard}`;
    hardCount.classList.add('text-red-500', 'font-medium');
    detailsContainer.appendChild(hardCount);

    const totalCount = document.createElement('span');
    totalCount.textContent = `Total: ${friend.totalSolved}/${friend.totalQuestions}`;
    totalCount.classList.add('text-blue-500', 'font-medium');
    detailsContainer.appendChild(totalCount);

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>'; // FontAwesome trash icon
    detailsContainer.appendChild(deleteButton);

    // Event listener for delete button
    deleteButton.addEventListener('click', function () {
      const friends = JSON.parse(localStorage.getItem('friends')) || [];
      friends.splice(index, 1);
      localStorage.setItem('friends', JSON.stringify(friends));
      renderFriendsList(friends);
    });

    friendItem.appendChild(detailsContainer);

    return friendItem;
  }

  // Function to render friends list
  function renderFriendsList(friends) {
    friendsList.innerHTML = '';

    friends.forEach((friend, index) => {
      const friendItem = renderFriendData(friend, index);
      friendsList.appendChild(friendItem);
    });
  }

  // Event listener for sort button
  sortButton.addEventListener('click', function () {
    const friends = JSON.parse(localStorage.getItem('friends')) || [];
    const sortedFriends = sortFriendsByTotalProblems(friends);
    renderFriendsList(sortedFriends);

    // Update the local storage with the sorted data
    localStorage.setItem('friends', JSON.stringify(sortedFriends));
  });

  // Function to sort friends by total problems solved
  function sortFriendsByTotalProblems(friends) {
    return friends.sort((a, b) => b.totalSolved - a.totalSolved);
  }

  // Event listener for search input
  searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      const username = searchInput.value.trim();
      if (username !== '') {
        fetchUserData(username)
          .then((data) => {
            if (data.status === 'success') {
              const friend = {
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

              const friends = JSON.parse(localStorage.getItem('friends')) || [];
              friends.push(friend);
              localStorage.setItem('friends', JSON.stringify(friends));

              renderFriendsList(friends);
              showSuccessToast('User successfully added!');
            } else {
              showErrorToast(data.message);
            }
          })
          .catch((error) => {
            showErrorToast('An error occurred while fetching user data.');
            console.error(error);
          });
      }
      searchInput.value = '';
    }
  });

  // Initial rendering of friends list from local storage
  const friends = JSON.parse(localStorage.getItem('friends')) || [];
  renderFriendsList(friends);
});
