// constants
var ACTIVE_USER_CLASSNAME = 'active_user';
var HIDDEN_FONT_CLASSNAME = 'hidden_font';

// retrive document elements
var userList = document.getElementById('user_list');
var fontList = document.getElementById('font_list');
var loadMore = document.getElementById('load_more');
var showAllUsersItem = document.createElement('li');

if (loadMore) {
	loadMore.addEventListener('click', getMoreFiles);
}

// set the 'show all users' list item
showAllUsersItem.innerText = 'Show all users';
showAllUsersItem.id = 'show_all_users';
showAllUsersItem.className = 'list-group-item';
showAllUsersItem.classList.add(ACTIVE_USER_CLASSNAME);
showAllUsersItem.addEventListener('click', showUserFonts);

if (userList && fontList) {
	var fonts = fontList.getElementsByTagName('li');
	var users = userList.getElementsByTagName('li');

	// insert first 'show all user' item in list
	userList.insertBefore(showAllUsersItem, userList.firstChild);
	// set data-user attributes
	setDataUser(fonts);
	// set click event for user-filtering
	setClickEvent(users);
}

/**
* loop over fonts and set their data-user attribute
* @param {array} - array of elements which need attribute setting
*/
function setDataUser(elements) {
	for (var i=0; i<elements.length; i++) {
		// set data-user attribute with the part of the string before the first '_' (id of a user)
		elements[i].setAttribute('data-user', elements[i].innerText.substring(0,elements[i].innerText.indexOf('_')))
	}
}

/**
* loop over users to set their click event
* @param {array} - array of DOM elements comming from a ul>li list reprensenting unique users
*/
function setClickEvent(userElements) {
	for (var i=0; i<userElements.length; i++) {
		userElements[i].addEventListener('click',showUserFonts);
	}
}

/**
* Show the fonts relative to a specific user
* @param {object} - the event attached
*/
function showUserFonts(event) {
	if (event.target) {
		var userList = document.getElementById('user_list');
		var fontList = document.getElementById('font_list');
		// the user-id that was clicked
		var id = event.target.innerText;

		if (id !== '' && userList && fontList) {
			var fonts = fontList.getElementsByTagName('li');
			var users = userList.getElementsByTagName('li');
			// iterate over users to toggle their active class
			for (var i=0; i<users.length; i++) {
				if (users[i] === event.target) {
					users[i].classList.add(ACTIVE_USER_CLASSNAME);
				} else {
					users[i].classList.remove(ACTIVE_USER_CLASSNAME);
				}
			}
			// iterate over fonts to show or hide them
			for (var i=0; i<fonts.length; i++) {
				if (event.target.id === 'show_all_users') {
					fonts[i].classList.remove(HIDDEN_FONT_CLASSNAME);
				} else {
					if (fonts[i].getAttribute('data-user') === id) {
						fonts[i].classList.remove(HIDDEN_FONT_CLASSNAME);
					} else {
						fonts[i].classList.add(HIDDEN_FONT_CLASSNAME);
					}
				}
			}
		}
	}
}

/**
* get more files from the server
*/
function getMoreFiles() {
	var xhr = new XMLHttpRequest();
	// create a GET request for the 'display/' express route
	xhr.open('GET', '/display/more', true);
	xhr.addEventListener('readystatechange', function() {
		// if the request is completed
		if (xhr.readyState === 4) {
			// if the response status is OK
			if (xhr.status === 200) {
				updateDocument(JSON.parse(xhr.responseText));
			}
		}
	});
	xhr.send(null);
}

/**
* update the document w/ fetched data from the server
* @param {object} - text data retrieved from the server and JSON.parsed by the client
*/
function updateDocument(data) {
	var moreCount = document.getElementById('more_count');
	var remainingCount = document.getElementById('remaining_count');
	var userList = document.getElementById('user_list');
	var fontList = document.getElementById('font_list');

	if (remainingCount) {
		// if we can still load some more
		if (data.remaining) {
			moreCount.innerText = data.loadMore;
			remainingCount.innerText = data.remaining;
		} else {
			// disable the 'load more' button if there is no more fonts to load
			moreCount.parentNode.classList.add('disabled');
			moreCount.parentNode.removeEventListener('click',getMoreFiles);
			moreCount.parentNode.innerText = 'All fonts are displayed';
		}
	}

	if (data.fontFamilies) {
		if (data.fontFamilies.length > 0) {
			data.fontFamilies.forEach(function(font) {
				document.fonts.add(new FontFace(font.family, 'url(/output/' + font.file + ')'));
			});
		}
	}

	if (userList && fontList) {
		var fonts = fontList.getElementsByTagName('li');
		var addedFonts = data.files.slice(fonts.length);
		var fontsToAdd = [];
		var users = userList.getElementsByTagName('li');
		// substract 1 for the 'show all users' item
		var addedUsers = data.users.slice(users.length-1);
		var usersToAdd = [];
		var newLi;
		var currentFilter = false;

		for (var i=0; i<users.length; i++) {
			if (users[i].classList.contains(ACTIVE_USER_CLASSNAME)) {
				// if there is a filter currently applied, different from 'show all users' (index 0)
				if (i > 0) {
					currentFilter = users[i].innerText;
				}
			}
		}

		// create an element for each new font
		for (var i=0; i<addedFonts.length; i++) {
			newLi = document.createElement('li');
			newLi.innerText = addedFonts[i];
			newLi.style.fontFamily = addedFonts[i].substring(addedFonts[i].indexOf('_')+1).replace(/(\.[A-z]*)$/g,'');
			newLi.className = 'list-group-item';
			fontsToAdd.push(newLi);
		}

		// create an element for each new user
		for (var i=0; i<addedUsers.length; i++) {
			newLi = document.createElement('li');
			newLi.innerText = addedUsers[i];
			newLi.className = 'list-group-item';
			usersToAdd.push(newLi);
		}

		// loop over fonts and set their data-user attribute
		setDataUser(fontsToAdd);
		for (var i=0; i<fontsToAdd.length; i++){
			if (currentFilter) {
				if (fontsToAdd[i].getAttribute('data-user') !== currentFilter) {
					fontsToAdd[i].classList.add(HIDDEN_FONT_CLASSNAME);
				}
			}
			fontList.appendChild(fontsToAdd[i]);
		}

		// loop over users to set their click event
		setClickEvent(usersToAdd);
		for (var i=0; i<usersToAdd.length; i++){
			userList.appendChild(usersToAdd[i]);
		}
	}
}
