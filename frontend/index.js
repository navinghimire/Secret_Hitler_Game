let canvas, ctx;
let liberalStack = document.getElementById('liberal_cards');
let fascistStack = document.getElementById('fascist_cards');
let playersSlot = document.getElementById('players_slot');
let failedPresidencyDisplay = document.getElementById('failed_presidency');
let newGameBtn = document.getElementById('newGameBtn');
let joinGameBtn = document.getElementById('joinGameBtn');
let menuScreen = document.getElementById('menuScreen');
let gameScreen = document.getElementById('gameScreen');
let playerScreen = document.getElementById('playerScreen');

let gameCodeDisplay = document.getElementById('gameCode');
let hostPlayerAlias = document.getElementById('hostPlayerAlias');
let joinGameCodeElem = document.getElementById('joinGameCode');
let joinGameAliasElem = document.getElementById('joinGameAlias');
let startGameBtn = document.getElementById('startGameBtn');
let alertDiv = document.getElementById('alertDiv');
let numPlayersElem = document.getElementById('numPlayersDisplay');
let drawPile = document.getElementById('drawPile');
let discardPile = document.getElementById('discardPile');

let numLibPolDisplay = document.getElementById('numLibPolicies');
let numFasPolDisplay = document.getElementById('numFasPolicies');
let voteDisplay = document.getElementById('voteD');

newGameBtn.addEventListener('click', handleNewGameBtn); 
joinGameBtn.addEventListener('click',handleJoinGameBtn);
startGameBtn.addEventListener('click', startGame);

const socket = io('http://localhost:3000');   
const MIN_PLAYERS = 5;
const MAX_PLAYERS = 10;
const POWER_EXAMINE_TOP_3 = 'examine_top_3';
const POWER_KILL = 'kill';
const POWER_KILL_VETO = 'kill_veto';
const POWER_PICK_PRESIDENT = 'pick_president';
const POWER_EXAMINE_MEMBERSHIP = 'examine_membership';

// let player = {
//     name: null,
//     id: null,
//     role: null,
// }
let playerRoles;
let playerId;
let gameState;
let countdown = 0;
let selectedPlayer = null;
// gameScreen.style.display = 'none';
playerScreen.style.display = 'none';

// listen and hadle events from server
socket.on('init',handleInit);
socket.on('gamecode', handleGameCode);
socket.on('gamestate', handleGameState);
socket.on('unknownroom', handleUnknowGame);
socket.on('noalias', handleNoAlias);
socket.on('newplayerjoined', playerName => {createAlert(playerName + ' has joined the game','bg-success')});
socket.on('clientdisconnect', handleClientDisconnect);
socket.on('canstartgame', handleCanStartGame);
socket.on('notenoughplayers', minPlayers => createAlert('Not enough players. Need ' + minPlayers, 'bg-info'));
socket.on('notallowed', () => createAlert('You are not allwed to do this', 'bg-danger')) ;
socket.on('gamestarted', handleGameStarted);
socket.on('playerrolesassigned',handlePlayerRoles);
socket.on('playerid', pid => playerId = pid);
socket.on('inprogress', () => createAlert('Game already in progress', 'bg-danger'));
socket.on('presidentpicked', president => createAlert(JSON.parse(president).alias + ' is the president now.'));
socket.on('pickchancellor', handlePickChancellor);
socket.on('someonevoted', handleSomeOneVoted);
socket.on('countdown', time => {
    document.getElementById('timerText').innerText = time;
});
socket.on('votechancellor', handleVoteChancellor);
socket.on('everyonevoted',() => createAlert('Everyone has voted'));
socket.on('failedpresidency', () => { createAlert('Presidency failed, electing next president.')})
socket.on('chancellorelected', chancellor => {
    chancellor = JSON.parse(chancellor);
    createAlert(chancellor.alias + ' is our new chancellor');
});  
socket.on('chancellorpicked', chancellorElect => {
    chancellorElect = JSON.parse(chancellorElect);
    createAlert(chancellorElect.alias + ' was choosen as chancellor candidate');
});  

function handleSomeOneVoted(votes) {
    votes = JSON.parse(votes);

    // let newElement = document.getElementById(votes);
    // let newDiv = document.createElement('p');
    // newDiv.innerHTML = votes[vote];
    // newElement.appendChild(newDiv);
}


var toastLiveExample = document.getElementById('liveToast')

function handleVoteChancellor(player) {
    let chancellorElect = JSON.parse(player);
    voteDisplay.classList.remove('d-none');
    voteDisplay.classList.add('d-block');
    document.getElementById('chancellorElect').innerText = chancellorElect.alias;
    
}
function handleVote(res) {
    alert(res);
    voteDisplay.classList.remove('d-block');
    voteDisplay.classList.add('d-none');
    socket.emit('voted', JSON.stringify(res));

}
function handlePickChancellor() {
    createAlert('Pick a chancellor');
    

    
}
function handlePlayerRoles(msg) {

    playerRoles = JSON.parse(msg);
    
}


function createAlert(text, type, time=2000) {
    
    var toast = new bootstrap.Toast(toastLiveExample)
    let body = document.getElementById('toast-text');
    body.innerText = text;
    
    
    // let div = document.createElement('div');
    // div.classList.add('alert');
    // div.innerText = text;
    // if(type === 'positive') {
    //     div.classList.add('alert-success');

    // } else if (type==='neutral'){
    //     div.classList.add('alert-info');

    // } else if (type==='negative'){
    //     div.classList.add('alert-danger');
    // } else {
    //     div.classList.add('alert-secondary');
    // }
    // alertDiv.appendChild(div);


    // requestAnimationFrame( () => {
    //     div.classList.remove('faded-out');
    // });
   
    // const timeout = setTimeout(()=> {

    // }, time);
}

function handleGameStarted() {

    gameScreen.style.display='block';
}

function handleClientDisconnect(id) {

    createAlert('Player left the room.', 'negtaive');
}



function handleCanStartGame() {
    // socket.emit('startgame');
    createAlert('We now have enough players. You can start the game.','positive');
    startGameBtn.classList.remove('d-none');
    startGameBtn.classList.add('d-flex');
    
    // alert("I now can start game");
}
function handleNoAlias() {
    createAlert("Need an alias name",'negative');
}
function handleUnknowGame() {
    createAlert("Game Room not available",'negative');
}



function handleGameCode(gameCode) {
    gameCode = JSON.parse(gameCode);
    gameCodeDisplay.innerHTML = gameCode;
    createAlert('Have your friends join the game using the code ' + gameCode, 'positive');
    menuScreen.style.display = 'none';
}

function handleGameState(state){
    state = JSON.parse(state);
    gameState = state;
    // menuScreen.style.opacity = 0;
    // gameScreen.style.opacity = 1;
    // playerScreen.style.display = 'block';
    playerScreen.style.display = 'block';
    
    renderState(state);
}

function handleInit(state) {
    
}


// render game state
function renderState(state) {
    
    const numPlayers = state.players.length
    
    resetElements();
    
    // create and add players elements
    for (let player of state.players) {
        createPlayerElement(player);
    }
    
    // // create and add fascist card elements
    // for (let i = 0; i<state.num_fas_pol_passed; i++) {
    //     createCardElement('fascist',i+1);
    // }
    
    // // create and add liberal card elements
    // for (let i = 0; i<state.num_lib_pol_passed; i++) {
    //     createCardElement('liberal',i+1);
    // }


    createPolicyPlaceholder();
    failedPresidencyDisplay.innerText= state.failed_presidency;
    
    if (state.players.length >= MIN_PLAYERS) {
        numPlayersElem.classList.add('bg-success');
        numPlayersElem.classList.remove('bg-danger');
        
    } else {
        numPlayersElem.classList.add('bg-danger');
        numPlayersElem.classList.remove('bg-success');
    }
    numLibPolDisplay.innerText = gameState.num_lib_pol_passed;
    numFasPolDisplay.innerText = gameState.num_fas_pol_passed;


    drawPile.innerText = gameState.drawPileCardCount;
    discardPile.innerText = gameState.discardPileCardCount;

    numPlayersElem.innerText = gameState.numPlayers;

}
function createPolicyPlaceholder() {
    for (let i = 0; i<gameState.num_fas_pol_to_win; i++) {
        createCardElement('fascist',i+1);
    }
    
    for (let i = 0; i<gameState.num_lib_pol_to_win; i++) {
        createCardElement('liberal',i+1);
    }

}

// prepare dom for new gamestate
function resetElements() {
    playersSlot.innerHTML = '';
    fascistStack.innerHTML = '';
    liberalStack.innerHTML = '';
    failedPresidencyDisplay.innerText = '0';
    startGameBtn.classList.add('d-none');
    startGameBtn.classList.remove('d-block');
}
function testFunction() {
    
}


function createPlayerElement(p){

    let playerDiv = document.createElement('div');
    let playerName = document.createElement('h5');
    // playerDiv.style.height = '200px';
    // playerDiv.style.width ='150px';
    
    playerDiv.classList.add('border','m-1','player', 'd-flex','align-items-center', 'justify-content-center','flex-row');
    playerDiv.id = p.id;
    // if (p.role) {
    //     playerDiv.classList.add(p.role);
    //     let roleTag = document.createElement('p');
    //     roleTag.innerText = p.role;
    //     playerDiv.appendChild(roleTag);
    // }
    playerDiv.appendChild(playerName);

    // if (p.id === player.id){
    //     if (player.role) {
    //         if (player.role === 'liberal') {
    //             playerDiv.classList.add('bg-success','text-white');
    //         } else if (player.role === 'fascist') {
    //             playerDiv.classList.add('bg-warning','text-white');
    //         } else if (player.role === 'hitler') {
    //             playerDiv.classList.add('bg-danger', 'text-white');
    //         }
    //     }
    // }
    // if(p.id === player.id) {
    //     playerDiv.classList.add('border-dark','border-5');
    // }
    if (playerRoles && (p.id in playerRoles)){
        if (playerRoles[p.id] === 'liberal') {
            playerDiv.classList.add('bg-success','text-white');
        } else if (playerRoles[p.id] === 'fascist') {
            playerDiv.classList.add('bg-warning','text-white');
        } else if (playerRoles[p.id] === 'hitler') {
            playerDiv.classList.add('bg-danger', 'text-white');
        }
    }

    // add border to the currentl player
    if (playerId && (playerId === p.id)) {
        playerDiv.classList.add('border-dark','border-4');
    } 

    if(p.role) {
        let roleElement = document.createElement('p');
        roleElement.classList.add(p.role,'roles');
        
        playerDiv.append(roleElement);
    }

    console.log(playerId, p.id);

    playerName.innerHTML=p.alias;
    playerDiv.addEventListener('click', handlePlayerClick);
    playersSlot.appendChild(playerDiv);
    
    
}
function handlePlayerClick(e) {
    selectedPlayer = e.target;

    if(selectedPlayer.id) {
        socket.emit('chancellorselected', selectedPlayer.id);
    }
}
function removePlayerElement(id) {
    let playerElem = document.getElementById(id);
    playerElem.remove();
}

// function createCardElement(type) {
//     let cardDiv = document.createElement('div');

//     let cardTypeElement = document.createElement('h5');
//     cardDiv.classList.add('card');
//     if (type === 'fascist') {
//         cardTypeElement.innerHTML='Fascist Article';
//     } else if (type === 'liberal') {
//         cardTypeElement.innerHTML='Liberal Article';
//     }
//     cardDiv.appendChild(cardTypeElement);
    
//     if (type === 'fascist') {
//         fascistStack.appendChild(cardDiv);
        
//     } else if (type === 'liberal') {
//         liberalStack.appendChild(cardDiv);
//     }
// }
function createCardElement(type, pos) {
    let cardDiv = document.createElement('div');
    cardDiv.id = type + pos;
    cardDiv.classList.add('card-placeholder');
    let cardTypeElement = document.createElement('p');
    if (pos in gameState.power && type==='fascist') {
        cardDiv.classList.add(gameState.power[pos]);
        cardTypeElement.innerText = gameState.power[pos];
    }
    cardDiv.appendChild(cardTypeElement);
    
    if (type === 'fascist') {
        fascistStack.appendChild(cardDiv);
        
    } else if (type === 'liberal') {
        liberalStack.appendChild(cardDiv);
    }

}






// event handers
function handleNewGameBtn(e) {
    
    let hostName = hostPlayerAlias.value;
    
    socket.emit('newgame',hostName);
}
function handleJoinGameBtn() {
    const gameCode = joinGameCodeElem.value;
    const alias = joinGameAliasElem.value;
    msg = {
        gameCode: gameCode,
        alias: alias,
    }
    // player.name = alias;
    socket.emit('joingame', JSON.stringify(msg));
}
function startGame(){
    socket.emit('startgame');
}

