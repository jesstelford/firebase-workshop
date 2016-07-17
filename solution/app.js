(function() {
  'use strict';

  // Initialize Firebase
  let firebaseAppName = "<APP-NAME-HERE>";
  let firebaseKey = "<KEY-HERE>";

  var config = {
    apiKey: firebaseKey,
    authDomain: `${firebaseAppName}.firebaseapp.com`,
    databaseURL: `https://${firebaseAppName}.firebaseio.com`,
    storageBucket: `${firebaseAppName}.appspot.com`,
  };
  firebase.initializeApp(config);

  let listContainer = document.querySelector('.todo-list');
  let state = {};

  // Whenever a new value is received from Firebase (once at initial page load,
  // then every time something changes)
  firebase.database().ref('tasks/').on('value', function(snapshot) {

    // Pull the list value from firebase
    state.list = snapshot.val();

    renderList(listContainer, state)
  });

  // Clicking to add a new item
  document.querySelector('#add-button').addEventListener('click', (event) => {

    // Get the user input
    let value = document.querySelector('#new-item').value;

    // Remove whitespace from start and end of input
    value = value.trim();

    // Nothing entered, return early from this function
    if (!value) {
      return;
    }

    firebase.database().ref('tasks/').push({
      title: value,
      done: false  // Default all tasks to not-done
    });

    // Reset the input value ready for a new item
    document.querySelector('#new-item').value = '';

  });

  // Clicking to delete an item
  delegate('.todo-list', 'click', '.delete', (event) => {

    let key = getKeyFromClosestElement(event.delegateTarget);

    // Remove that particular key
    firebase.database().ref(`tasks/${key}/`).remove();
  });

  // Clicking to do / undo an item
  delegate('.todo-list', 'click', '.done-it', (event) => {

    let key = getKeyFromClosestElement(event.delegateTarget);

    // Update the `done` value of that particular key to be the `checked` state of
    // the `<input>` checkbox.
    firebase.database().ref(`tasks/${key}/`).update({
      done: event.delegateTarget.checked
    });
  });

  function renderList(into, state) {
    // Iterate over each element in the object
    into.innerHTML = Object.keys(state.list).map((key) => {
      return `
        <li data-id="${key}" ${state.list[key].done ? "style='text-decoration: line-through'" : ""}>
          <input class="done-it" type="checkbox" ${state.list[key].done ? "checked" : ""} />
          ${state.list[key].title}
          <button class="delete">[Delete]</button>
        </li>
      `;
    }).join('');
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
})();
