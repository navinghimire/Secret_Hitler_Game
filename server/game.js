class Game {
    constructor(numPlayers,hostId) {
        this.numPlayers = numPlayers;
        this.players = []
        this.hostId = hostId;
        this.num_fas_pol_passed = 0;
        this.num_lib_pol_passed = 0;
        this.draw_pile = this.getRandomPolicyDeck(9,6);
        this.discard_pile = [];
        this.president = null;
        this.chancellor = null;
    } 
    addPlayer(player) {
        this.players.push(player);
        this.numPlayers += 1;
    }
    removePlayer(player) {
        this.numPlayers -=1;
    }

    drawFromPile(numCards) {
        let temp = [];
        for (let i = 0; i< numCards; i++) {
            let tempC = this.draw_pile.pop();
            temp.push(tempC);
        }
        return temp;
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

}

class Player {
    constructor(alias, role, id) {
        this.alias = alias;
        this.role = role;
        this.id = id;
    }

}

module.exports.Game = Game;
module.exports.Player = Player;