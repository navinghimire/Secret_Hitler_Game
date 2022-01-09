const socket = io('http://10.0.0.138:3000');   
const frmHost = document.getElementById('frmHost');
const inputAliasHost = document.getElementById('inputAliasHost');
const inputAliasJoin = document.getElementById('inputAliasJoin');

const loginScreen = document.getElementById('loginScreen');
const gameScreen = document.querySelector('.gameScreen');

const allInputElem = document.querySelectorAll('input');
const frmLogin = document.querySelectorAll('.frmLogin');

let playerId, gameCode;
let secretRoles;
socket.on('init',(id) => playerId = id);
socket.on('gamecode', code => {
    gameCode = code;
    gameScreen.classList.toggle('hide');
    loginScreen.style.display = 'none';
    
});
socket.on('state', (state) => {
    state = JSON.parse(state);
    console.log(state);
    let playersElem = document.querySelector('.players');
    playersElem.innerHTML = '';
    state.activePlayers.forEach(player => {
        playersElem.innerHTML += `<div id=${player.id} class='player ${player.role?player.role:''} ${player.id === playerId?'player-self':''}'><h2>${player.name}</h2> </div>`;
    })
    state.inactivePlayers.forEach(player => {
        playersElem.innerHTML += `<div id=${player.id} class='player offline ${player.id === playerId?'player-self':''}'><h2>${player.name}</h2> </div>`;  
    })
    if(secretRoles) {
        console.log(secretRoles);
        Object.keys(secretRoles).forEach(playerId =>{
            let player = document.getElementById(playerId);

            if (player) {
                player.classList.add(secretRoles[playerId]);
            }
        })
    }

    for(let i = 0; i<11-(state.activePlayers.length+state.inactivePlayers.length); i++) {
        playersElem.innerHTML += `<div class=${i===0?'info-box':''}><h1>${i===0?gameCode:''}</h1></div>`;
    }
}) 
socket.on('secretRoles',roles => {
    secretRoles = JSON.parse(roles);


});


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