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
	// set click event for user-filtering
	setClickEvent(users);
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
			var fonts = fontList.querySelectorAll('div.file');
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
	var sampleText = document.querySelectorAll('.panel-body')[0].innerText;

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
				document.fonts.add(new FontFace(font.family, 'url(/output/'+ font.file.file + ')'));
			});
		}
	}

	if (userList && fontList) {
		var fonts = document.querySelectorAll('.font_span');
		var addedFonts = data.files.slice(fonts.length);
		var fontsToAdd = [];
		var users = document.querySelectorAll('.user');
		var addedUsers;
		var usersToAdd = [];
		var newElement;
		var currentFilter = false;

		// filter user that are not already displayed
		var i = 0;
		addedUsers = data.users.filter(function(user) {
			for(i=0; i<users.length; i++){
				if (users[i].innerText === user) {
					return false;
				}
			}
			return true;
		});
		addedFonts = data.files.filter(function(font) {
			//filter here
		});

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
			newElement = document.createElement('div');
			newElement.className = 'file col-md-4';
			newElement.setAttribute('data-user',addedFonts[i].user);

			newSubelement = document.createElement('div');
			newSubelement.className = 'panel panel-default';
			newSubelement.style.fontFamily = addedFonts[i].file.substring(addedFonts[i].file.indexOf('_')+1).replace(/(\.[A-z]*)$/g,'');

			newContentEditable = document.createElement('div');
			newContentEditable.setAttribute('style','font-size:2.4vw');
			newContentEditable.setAttribute('contenteditable','true');
			newContentEditable.className = 'panel-body';
			newContentEditable.innerText = sampleText;

			newFontnameElement = document.createElement('div');
			newFontnameElement.setAttribute('style','font-family:sans-serif');
			newFontnameElement.className = 'panel-footer container-fluid';
			newFontnameElement.innerText = addedFonts[i].file;

			newDownloadElement = document.createElement('div');
			newDownloadElement.className = 'download_font';
			newDownloadElement.innerHTML = '<a href="output/'+ addedFonts[i].file +'" class="glyphicon"></a>';

			newElement.appendChild(newSubelement);
			newSubelement.appendChild(newContentEditable);
			newSubelement.appendChild(newFontnameElement);
			newFontnameElement.appendChild(newDownloadElement);

			fontsToAdd.push(newElement);
		}

		// create an element for each new user
		for (var i=0; i<addedUsers.length; i++) {
			newElement = document.createElement('li');
			newElement.innerText = addedUsers[i];
			newElement.className = 'user list-group-item';
			usersToAdd.push(newElement);
		}

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
