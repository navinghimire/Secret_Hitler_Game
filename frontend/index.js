
const socket = io('http://10.0.0.138:3000');   
const frmHost = document.getElementById('frmHost');
const inputAliasHost = document.getElementById('inputAliasHost');
const inputAliasJoin = document.getElementById('inputAliasJoin');

const loginScreen = document.getElementById('loginScreen');
const gameScreen = document.querySelector('.gameScreen');

const allInputElem = document.querySelectorAll('input');
const frmLogin = document.querySelectorAll('.frmLogin');

// this is where we render players 
let playersElem = document.querySelector('.players');
// const constant = import('./utils');

let playerId, gameCode;
let secretRoles;
let gameState;
let choosenPlayer;
let gameCountdownElem = document.querySelector('.gameCountdown')
socket.on('init',(id) => playerId = id);
socket.on('gamecode', code => {
    gameCode = code;
    gameScreen.classList.toggle('hide');
    loginScreen.style.display = 'none';

});
socket.on('once', (code) => {
    test(4,code)
})
socket.on('gamecountdown', () => {
    let count = 5;
    gameCountdownElem.style.display = 'flex';
    let timeElem = document.querySelector('.gameCountdown>h1');
    let interval = setInterval(() =>{
        timeElem.textContent = count;
        count--;
        if (count < -10) {
            clearInterval(interval);
        }
    },100);
    let timeout = setTimeout(() => {
        gameCountdownElem.style.display= 'none';
        clearTimeout(timeout);
    },600);
})

socket.on('state', (state) => {

    // console.log(state);
    gameState = JSON.parse(state);
    renderPlayerElements();
    // renderSecretRoles();

    if (!gameState.session) {
        renderGameCode(gameState);
    }
    if(gameState.activePlayers.length >= 5 && !gameState.session && playerId != gameState.host) {
        displayInfo('Waiting for the host to start the game');
    } 
    if(gameState.session === 'presidency') {
        displayInfo(`${gameState.president.name} is our president`);
    } else if (gameState.session === '')



    if(gameState.drawPile != undefined) {
        let drawCount = document.querySelector('#drawCount')
        drawCount.textContent = gameState.drawPile.length;
    }
    
    if(gameState.drawPile != undefined) {
        let discardCount = document.querySelector('#discardCount');
        discardCount.textContent = gameState.discardPile.length;
    }
    let totalLibElem = document.querySelector('.policy>.liberal>h1 span');
    if(totalLibElem) {
        totalLibElem.textContent = `${gameState.libPolicyCount}/${gameState.totalLibPolicies}`;
    }
    let totalFasElem = document.querySelector('.policy>.fascist>h1 span');
    if(totalFasElem) {
        totalFasElem.textContent = `${gameState.fasPolicyCount}/${gameState.totalFasPolicies}`;
    }
    let fasSlot = document.querySelectorAll('.fascist>.policies>h1'); 
    fasSlot.forEach((elem,id) => {
        if (id < gameState.fasPolicyCount) {
            elem.classList.add('passed');
        } 
    })
    let libSlot = document.querySelectorAll('.liberal>.policies>h1'); 
    libSlot.forEach((elem,id) => {
        if (id < gameState.libPolicyCount) {
            elem.classList.add('passed');
        } 
    })
//    alert(choosenPlayer);
    let playerElems = document.querySelectorAll('.player');

    playerElems.forEach(player => {
        player.addEventListener('click', handleChoose);
    });

}) 
socket.on('canstart', () => {libPolicyCount
    canStart = true;
})

function initialize() {
    
}


function renderGameCode(state) {
    let canStart = (playerId === state.host) && (state.activePlayers.length>=5 && state.activePlayers.length<=10);
    if(gameCode) {
        playersElem.innerHTML += `<div class='info ${canStart?'can-start':''}'>
        <div class='info-code'>
        <p>Game code. Pass along!</p>
        <h1>${gameCode}</h1>
        </div>${canStart?
        `<button onclick='startGame()'><svg width="23" height="26" viewBox="0 0 23 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.5 10.4019C23.5 11.5566 23.5 14.4434 21.5 15.5981L5 25.1244C3 26.2791 0.499999 24.8357 0.499999 22.5263L0.5 3.47372C0.5 1.16431 3 -0.279058 5 0.875643L21.5 10.4019Z" fill="#FEFAFA"/>
        </svg></button>`:''}
        </div>`;

    }
}
function displayInfo(message) {
    let infoElem = document.querySelector('.info');
    if (!infoElem) {
        infoElem = document.createElement('div');
        infoElem.classList.add('info')
    }
    let messageElem = document.createElement('p');
    infoElem.innerHTML = '';
    messageElem.textContent = message;
    messageElem.classList.add('message');
    infoElem.appendChild(messageElem);
    playersElem.appendChild(infoElem);
       

}

function startGame() {
    socket.emit('startgame');
}
function handleChoose(e) {
    // console.log(e);
    if(gameState.session != 'election_primary') return;
    console.log(e.target);
    if(e.target.id) {
        choosenPlayer = e.target.id;
        gameState.activePlayers.forEach(player => {
            let elem = document.getElementById(player.id);
            if(e.target.id === player.id) {
                elem.classList.toggle('choosen');
            } else {
                elem.classList.remove('choosen');
            }
        });

    }
}

function renderPlayerElements() {
    active = gameState.activePlayers;
    inactive = gameState.inactivePlayers;

    active.forEach(player => {
        let playerElem = document.getElementById(player.id);
        if (!playerElem) {
            playerElem = document.querySelector('.players>div:not(.player)')
            if (!playerElem) {
                playerElem = document.createElement('div');
                playerElem.classList.add('player');
                playerElem.id = player.id;
                playerElem.appendChild(document.createElement('h2'));
            }
            playerElem.id = player.id;
            playerElem.classList.add('player');
        }   
        // make it large   
        if(player.id === playerId) {

            playerElem.classList.add('player-self');
        }
        // update role
        if(player.role) {
            playerElem.classList.add(player.role);
            
        }
        // update name
        let nameElem = playerElem.querySelector('h2');
        if(nameElem) {
            playerElem.innerHTML = player.name;
        }
        playersElem.prepend(playerElem);
    }) 
    

    
    inactive.forEach(player => {
        let inactiveElem = document.getElementById(player.id);
        if (inactiveElem) {
            inactiveElem.classList.add('offline');
        }
    })
    let playerElemsLen = document.querySelectorAll('.players>div').length;
    for(let i = 0; i < (10 - playerElemsLen);i++) {
        let newElem = document.createElement('div');
        let h2Elem = document.createElement('h2');
        newElem.appendChild(h2Elem);
        playersElem.appendChild(newElem);
    }

}

function renderSecretRoles() {
    if(secretRoles) {
        // console.log(secretRoles);
        // Object.keys(secretRoles).forEach(playerId =>{
        //     let player = document.getElementById(playerId);

        //     if (player) {
        //             player.classList.add(secretRoles[playerId]);
        //     }
        // })
        let roles = Object.keys(secretRoles);
        let n = roles.length;
        let inv = setInterval(()=>{
            let player = document.getElementById(roles[n-1]);
            if (player) {
                    player.classList.add(secretRoles[roles[n-1]]);
            }
            n--;
            if (n < 0) {
                clearInterval(inv);
            }
        },1000);
    }
}


socket.on('secretRoles',roles => {
    secretRoles = JSON.parse(roles);
    renderSecretRoles();

});

let openWindows = [];
let players = ['Aditya', 'Sonali','Ujjar','Sunada','Dhwani','Prasanna','Prakash','Shyam','Florian']
function test(num,gameCode) {
    for (let i = 0; i < num; i++) {
        addOne(players.pop(),gameCode)
    }
}


function closeAll() {
    openWindows.forEach(window => {
        window.close();
    });
}
function addOne(player = players.pop()) {
    players.unshift(player);
    if (!player) {
        return;
    }
    let w = window.open('http://10.0.0.138:8080',);
    w.addEventListener('DOMContentLoaded', () => {
        w.handleJoinGame(player,gameCode);
    }, false);
    openWindows.push(w);
    window.focus();
}
function removeOne() {
    let window = openWindows.pop();
    window.close();
}







frmLogin.forEach(elem => {
    elem.addEventListener('submit', (e) => {
        e.preventDefault();
        let alias;
        let elemId = elem.id;
        
        let inputField = document.querySelector(`#${elemId}>.alias`);
        let messageElem = document.querySelector(`#${elemId}>.validationMessage`);
        alias = inputField.value;
        // validate alias
        if(alias.length < 3 || alias.length > 10) {
            messageElem.textContent = "You must have a better name! (3-10 chars)";
            messageElem.classList.add('d-block','center');
            
            inputField.value = '';
            return;
        }
        // validate code 
        let code = '';
        let codeInputs = document.querySelectorAll('.codeInput');
        codeInputs.forEach(elem => {
            code+=elem.value;
        })
        if (elemId === 'frmJoin') {
            if(code.length < 4) {
                messageElem.textContent = 'Game code invalid';
                return
            }
        }
        if(elemId==='frmHost') {

            handleHostGame(alias);
        } else if (elemId === 'frmJoin') {
            handleJoinGame(alias, code);
        }

    })
})
allInputElem.forEach(elem => {
    elem.addEventListener('focusin', (e) => {
        elem.select();
    });


});

function handleHostGame(alias) {
  
    socket.emit('hostGame', JSON.stringify(alias));
}
function handleJoinGame(alias, code) {
    let gameConfig = {
        alias: alias,
        code: code,
    }
    socket.emit('joinGame', JSON.stringify(gameConfig));
    
}
moveOnMax = function(field, nextFieldId) {
    if (!field) return;
    field.value = field.value.toUpperCase();
    if(field.value.length===1) {
        const elemToFocus = document.getElementById(nextFieldId);
        if (elemToFocus) {
            elemToFocus.focus();
            elemToFocus.select();
        }
    } else {
        // alert(nextFieldId);
        if(isNaN(nextFieldId)) {
            document.getElementById(3).focus();
            document.getElementById(3).select();
        }
        const elemToFocus = document.getElementById(nextFieldId-2);
        if (elemToFocus) {
            elemToFocus.focus();
            elemToFocus.select(); 
        }
    }
}
function nextSession() {
    socket.emit('nextSession');
}