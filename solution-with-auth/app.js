/**
 * NOTE: This solution expects Google Auth to be enabled on your Firebase
 * Application
 */

(function() {
  'use strict';

  /*******
   * Firebase Setup
   ******/
  let firebaseAppName = "<APP-NAME-HERE>";
  let firebaseKey = "<APP-KEY-HERE>";
  let firebaseAuthProvider = new firebase.auth.GoogleAuthProvider();

  let config = {
    apiKey: firebaseKey,
    authDomain: `${firebaseAppName}.firebaseapp.com`,
    databaseURL: `https://${firebaseAppName}.firebaseio.com`,
    storageBucket: `${firebaseAppName}.appspot.com`,
  };
  firebase.initializeApp(config);


  /*******
   * Global app variables
   ******/
  let containerElement = document.querySelector('#container');
  let state;


  /*******
   * Listen for Authentication
   ******/
  firebase.auth().onAuthStateChanged(function (user) {

    if (user) {

      // Logged in? Store the user's ID
      state.loggedInAs = user;

      // We're waiting for the list of items to come back to us
      state.loading = true;

      renderLoggedIn(containerElement, state);

      // Start listening for list changes
      listenForListChanges(user.uid)
    } else {
      // Not logged in? Reset the state.
      initializeState();

      renderLoggedOut(containerElement, state);
    }

  });


  /*******
   * Logged Out Specifics
   ******/
  // Logging in
  delegate('#container', 'click', '#login', (event) => {
    firebase.auth().signInWithPopup(firebaseAuthProvider).catch((error) => {
      throw error;
    });
  });

  function renderLoggedOut(into) {

    into.innerHTML = `
      <p>You must be logged in to view your TODO List</p>
      <p><button id="login">Login</button></p>
    `;

  }


  /*******
   * Logged In Specifics
   ******/
  // Clicking to add a new item
  delegate('#container', 'click', '#add-button', (event) => {

    // Get the user input
    let value = document.querySelector('#new-item').value;

    // Remove whitespace from start and end of input
    value = value.trim();

    // Nothing entered, return early from this function
    if (!value) {
      return;
    }

    firebase.database().ref(`users/${state.loggedInAs.uid}/tasks/`).push({
      title: value,
      done: false  // Default all tasks to not-done
    });

    // Reset the input value ready for a new item
    document.querySelector('#new-item').value = '';

  });

  // Logging out
  delegate('#container', 'click', '#logout', (event) => {

    firebase.auth().signOut().catch((error) => {
      throw error;
    });

  });

  // Clicking to delete an item
  delegate('#container', 'click', '.delete', (event) => {

    let key = getKeyFromClosestElement(event.delegateTarget);

    // Remove that particular key
    firebase.database().ref(`users/${state.loggedInAs.uid}/tasks/${key}/`).remove();
  });

  // Clicking to do / undo an item
  delegate('#container', 'change', '.done-it', (event) => {

    let key = getKeyFromClosestElement(event.delegateTarget);

    // Update the `done` value of that particular key to be the `checked` state of
    // the `<input>` checkbox.
    firebase.database().ref(`users/${state.loggedInAs.uid}/tasks/${key}/`).update({
      done: event.delegateTarget.checked
    });
  });

  function listenForListChanges(uid) {
    // Whenever a new value is received from Firebase (once at initial page load,
    // then every time something changes)
    firebase.database().ref(`users/${uid}/tasks/`).on('value', function(snapshot) {

      state.loading = false;

      // Pull the list value from firebase
      state.list = snapshot.val();

      renderLoggedIn(containerElement, state);
    });
  }

  function renderLoggedIn(into, data) {

    into.innerHTML = `
      <p><button id="logout">Logout</button></p>
      <input type="text" id="new-item" />
      <button id="add-button">Add</button>

      <div class="todo-list">
        ${data.loading ? "Loading..." : renderList(data)}
      </div>
    `;

  }

  function renderList(state) {

    if (!state.list) {
      // When there's no items
      return 'No Items to display';
    }

    // Iterate over each element in the object
    return `<ul>${Object.keys(state.list).map((key) => {
      return `
        <li data-id="${key}" ${state.list[key].done ? "style='text-decoration: line-through'" : ""}>
          <input class="done-it" type="checkbox" ${state.list[key].done ? "checked" : ""} />
          ${state.list[key].title}
          <button class="delete">[Delete]</button>
        </li>
      `;
    }).join('')}</ul>`;
  }


  /*******
   * Utility Functions
   ******/
  function initializeState() {
    state = {
      loggedInAs: null,
      list: {}
    };
  }

  // We added the `data-id` attribute when we rendered the items
  function getKeyFromClosestElement(element) {

    // Search for the closest parent that has an attribute `data-id`
    let closestItemWithId = closest(event.delegateTarget, '[data-id]')

    if (!closestItemWithId) {
      throw new Error('Unable to find element with expected data key');
    }

    // Extract and return that attribute
    return closestItemWithId.getAttribute('data-id');
  }


  /*******
   * Start The App
   ******/
  // Setup the initial state for the app
  initializeState();

  // Start logged out
  renderLoggedOut(containerElement);

})();
