const {IN_PROGRESS, 
    WAITING,
    POWER_KILL,
    POWER_KILL_VETO,
    POWER_EXAMINE_MEMBERSHIP,
    POWER_EXAMINE_TOP_3,
    POWER_PICK_PRESIDENT,
    SESSION_ELECTION_PRESIDENT,
    SESSION_ELECTION_CHANCELLOR,
    SESSION_ELECTION_VOTING, } = require('./constants') ;

class Game {
    constructor(roomName,hostId) {
        this.numPlayers = 0;
        this.roomName = roomName;
        this.players = []
        this.hostId = hostId;
        this.num_fas_pol_passed = 0;
        this.num_lib_pol_passed = 0;
        this.draw_pile = this.getRandomPolicyDeck(6,11);
        this.discard_pile = [];
        this.president = null;
        this.chancellor = null;
        this.liberals = [];
        this.fascists = [];
        this.hitler = null;
        this.failed_presidency = 0;
        this.game_state = WAITING;
        this.num_lib_pol_to_win = 5;
        this.num_fas_pol_to_win = 6;
        this.pastPresidents = [];
        this.pastChancellors = [];
        this.chancellor_elect = null;
        this.votes = {};
    } 
    addPlayer(player) {
        this.players.push(player);
        this.numPlayers += 1;
    }
    removePlayer(playerIndex) {
        // find the player in that state
        let removeIndex = null;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id === playerIndex) {
                removeIndex = i;
            }
        }
        if (removeIndex) {
            this.players.splice(removeIndex,1);
            // console.log('player removed!',this.players,removeIndex)
        }
        this.numPlayers -= 1;
    }
    getPlayerFromId(id) {
        for(let player of this.players ) {
            console.log(player, player.id, id);
            if (player.id === id) {
                return player;
            }
        }
        return null;
    }
    getPlayerId(player) {
        for(let i = 0; i < this.numPlayers; i++) {
            if (this.players[i].id === player.id) {
                return i;
            }
        }
        return null;
    }
    electChancellor(player) {
        if (this.chancellor) {
            this.chancellor.role = null;
        }
        player.role = 'chancellor';
        this.chancellor = player;
        this.pastChancellors.push(player);
    }
    electPresident(player) {
        if (this.president) {
            this.president.role = null;
        }
        player.role = 'president';
        this.president = player
        this.pastPresidents.push(player);
        console.log('Current President index', this.getPlayerId(this.president));
    }

    drawFromPile(numCards) {
        let temp = [];
        for (let i = 0; i< numCards; i++) {
            let tempC = this.draw_pile.pop();
            temp.push(tempC);
        }
        return temp;
    }
    setRandomPresident() {
        if (this.players.length === 0) return;
        
        const pIndex = Math.floor(Math.random() * this.numPlayers);
        // console.log(pIndex);
        // console.log(this.players);
        this.electPresident(this.players[pIndex]);

    }
    hasEveryOneVoted() {
        console.log(Object.keys(this.votes).length, this.numPlayers);
        if (Object.keys(this.votes).length === this.numPlayers) {
            return true;
        }
        return false;
    }
    isChancellorElected() {
        console.log(this.votes);
        let yesCount = 0;
        for(let id in this.votes) {
            console.log(id);
            if (this.votes[id] === 'yes') {
                yesCount += 1;
            }
        }
        let verdict = (yesCount/this.numPlayers >= 0.5)?true:false;
        console.log(verdict, yesCount/this.numPlayers);
        return verdict;
    }
    assignPlayerRoles() {

        // assign random player as hitler
        let randomIndex = Math.floor(Math.random() * this.numPlayers);
        this.fascists.push(this.players[randomIndex]);
        this.hitler = this.players[randomIndex];


        let s = new Set();
        while(s.size < this.fascistCount-1) {
            let newIndex = Math.floor(Math.random() * this.numPlayers);
            if (newIndex === randomIndex) continue;
            s.add(newIndex);
        }
        for (let i = 0; i < this.numPlayers; i++) {
            if (s.has(i)) {
                this.fascists.push(this.players[i]);
            } else if (i === randomIndex) {
                continue;
            } else {
                this.liberals.push(this.players[i]);
            }
        }

        // console.log(this.liberals, this.fascists, this.hitler)

        // get liberals and fascists counts depending on the number of players

        // assign liberals

        // assign fascists
    }

    getRandomPolicyDeck(libCount, fasCount) {
        let s = new Set();
        while(s.size <= libCount) {
            let newNum = Math.floor(Math.random()*(libCount+fasCount));
            s.add(newNum);
        }
        let returnArray = [];
        for(let i=0;i<(libCount+fasCount);i++) {
            if(s.has(i)) {
                returnArray.push('liberal');
            } else {
                returnArray.push('fascist');
            }
        }
        return returnArray;
    }

     

    get nextPresident() {
        let currentIndex = this.getPlayerId(this.president);
        if (currentIndex >= this.numPlayers -1) {
            return this.players[0];
        } 
        return this.players[currentIndex+1];
    }
    get gameState() {
        console.log(this.fascistPresidentialPower);
        return {
            numPlayers: this.numPlayers,
            players: this.players,
            num_lib_pol_passed: this.num_lib_pol_passed,
            num_fas_pol_passed: this.num_fas_pol_passed,
            failed_presidency: this.failed_presidency,
            drawPileCardCount: this.drawPileCardCount,
            discardPileCardCount: this.discardPileCardCount,
            num_lib_pol_to_win: this.num_lib_pol_to_win,
            num_fas_pol_to_win: this.num_fas_pol_to_win,
            power: this.fascistPresidentialPower,
            previousPresidents: this.previousPresidents,
            previousChnacellors: this.previousChnacellors,
        };
    }
    get drawPileCardCount() {
        return this.draw_pile.length;
    }
    get discardPileCardCount() {
        return this.discard_pile.length;
    }
    get fascistPresidentialPower(){
        if (this.numPlayers === 5 || this.numPlayers === 6) {
            return ({
                3: POWER_EXAMINE_TOP_3,
                4: POWER_KILL,
                5: POWER_KILL_VETO,
            });
        } else if (this.numPlayers === 7 || this.numPlayers === 8) {
            return ({
                2: POWER_EXAMINE_MEMBERSHIP,
                3: POWER_PICK_PRESIDENT,
                4: POWER_KILL,
                5: POWER_KILL_VETO,
            });

        } else if (this.numPlayers === 9 || this.numPlayers === 10) {
            return({
                1: POWER_EXAMINE_MEMBERSHIP,
                2: POWER_EXAMINE_MEMBERSHIP,
                3: POWER_PICK_PRESIDENT,
                4: POWER_KILL,
                5: POWER_KILL_VETO,
            });
        } else {
            return ({});
        }
    }
    get fascistCount() {
        switch(this.numPlayers) {
            case 5:
                return 2;
            case 6:
                return 2;
            case 7:
                return 3;
            case 8:
                return 3;
            case 9:
                return 4;
            case 10: 
                return 4;
            default:
                return null;
        }
    } 

}

class Player {
    constructor(alias, role, id) {
        this.id = id;
        this.alias = alias;
        this.role = role;
    }

}

module.exports.Game = Game;
module.exports.Player = Player;