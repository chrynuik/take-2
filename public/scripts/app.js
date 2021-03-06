const socket = io.connect('http://localhost:8080');

/*
 *Gets the data for the current user from the database
 *Emits the data to the server
 *Generates user stats table
 */

$.ajax({
  method: 'GET',
  url: 'api/user_data'
}).done((user) => {
  storeUserData(user);
});

/*
 *Gets the data for the leaderboard from the database
 *Emits the data to the server
 *Generates leaderboard table
 */
$.ajax({
  method: 'GET',
  url: 'api/leaderboard'
}).done((data) => {
  for(const user of data) {
    $('.leaderboard-list').append(`<div class='leaderboard-entry'><div>${user.name}</div><div> ${user.wins} wins</div></div>`);
  }
});

// Socket.io logic

/*
 * When the client recieves a start game notification from the server
 * loads the game with jQuery
 */
socket.on('start-game', function(data) {
  startGame(data);
});

/*
 * When the client recieves a notification that a user has finished
 * Checks if the winning player was the current user
 * if not, loads the dialog popup and tells the player they have lost.
 */
socket.on('game-ended', function(data) {
  gameOver(data);
});

/*
 * Sets game local variables when a game is joined
 */
socket.on('join-success', function(data) {
  joinGame(data);
});

/*
 * Notifies client to create the available games list
 */
socket.on('all-games', function(data) {
  createGameList(data);
});


/*
 * When a user goes offline, removes them from the online user list
 */
socket.on('user-gone-offline', function(data) {
  removeFromUserList(data);
});

/*
 * Creates the list of all online players
 */
socket.on('list-players', function(data) {
  createUserList(data);
});

/*
 * If a player has an open game when they reload the page
 * reconnects them to the game
 */
socket.on('existing-game', function() {
  displayButtonsJoinQueue();
});

/*
 * Should force a page refresh
 */
socket.on('refresh-page', function() {
  window.location.reload();
});

/*
 * Announces that user is going offline, so they can be removed from the
 * active player list and removes their active games if any
 */
$(window).on('unload', function(e) {
  // works on closing window, not refresh
  socket.emit('leaving-page', 'user leaving page');
});

// jQuery for button functionality

$('.shuffle-button').on('click', function() {
  shuffleTiles();
});

$('#make-game').on('click', function() {
  // If user already has a game open do nothing
  if (inQueue) {
    return;
  }
  socket.emit('make-game', {player: userData});
  inQueue = true;
  displayButtonsJoinQueue();

});

$('#join-queue').on('click', function() {
  // If user already has a game open do nothing
  if (inQueue) {
    return;
  }
  socket.emit('join-queue', {player: userData});
  inQueue = true;
  displayButtonsJoinQueue();

});

$('#leave-queue').on('click', function() {
  socket.emit('leave-queue', currentRoom.roomName);
  currentRoom.roomName = '';
  currentRoom.playerOne = '';
  currentRoom.playerOneId = '';
  inQueue = false;
  displayButtonsDefault();
});

$('#play-solo').on('click', function() {
  currentRoom.pictureId = Math.ceil(Math.random() * 41);
  socket.emit('playing-solo', userData);
  if ($(window).width() <= 500) {
    $('.tile').css('background-image', `url('public/images/puzzle-pics/picture-${currentRoom.pictureId}-small.jpg')`);
  }
  else {
    $('.tile').css('background-image', `url('public/images/puzzle-pics/picture-${currentRoom.pictureId}-big.jpg')`);
  }
  $('.game').toggleClass('visible');
  $('.non-game').toggleClass('hidden');
  randomLayout();
});


$('.close-dialog-button').on('click', function(){
  $('.dialog').addClass('is-waiting');
});

// When the window is resized this will set the puzzle to the correct picture
$(window).resize(setPicture(currentRoom));

