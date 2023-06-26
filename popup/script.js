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
});
