
var constant = require('./constants');
class Player {
    constructor(id, name, role) {
        this.id = id;
        this.name = name;
        this.role = role;
    } 
}

class Game {
    
    constructor() {
        this.activePlayers = [];
        this.inactivePlayers = [];
        this.chancellor = null;
        this.president = null;
        this.pastCabinet = {president:null, chancellor:null};
        this.hitler = null;
        this.fasPolicyCount = 0;
        this.libPolicyCount = 0;
        this.totalFasPolicies = 6;
        this.totalLibPolicies = 5;
        this.fascists = [];
        this.liberals = [];
        this.drawPile = [];
        this.discardPile = [];
        this.totalFasArticles = 11;
        this.totalLibArticles = 6;
        this.drawn = [];
        this.host = null;
        this.votes = {};
        this.numFailedElection = 0;
        this.round = 0;
        this.vetoPresident = null;
        this.policyToPass = null;
        this.vetoPower = false;
        this.powers = null;
        
        this.sessions = [
            constant.SESSION_INIT,
            constant.SESSION_PRESIDENCY, 
            constant.SESSION_ELECTION_PRIMARY,
            constant.SESSION_ELECTION_GENERAL,
            constant.SESSION_LEGISLATION_PRESIDENT,
            constant.SESSION_LEGISLATION_CHANCELLOR,
            constant.SESSION_OVER,
            ];
        this.session = null;
    }

    get nextSession() {
        let currentSessionIndex;
        if (this.session) {
            currentSessionIndex =this.sessions.indexOf(this.session);
            if(this.session === constant.SESSION_OVER) {
                return constant.SESSION_OVER;
            }
            if (currentSessionIndex + 1 === this.sessions.length-1) {
                return this.sessions[1]
            } else {
                return this.sessions[currentSessionIndex+1];
            }
        }
        return null;
    }
    addPlayer(player) {
        if (this.numActivePlayers < constant.MAX_PLAYERS) {
            this.activePlayers.push(player);
            console.log(`Added player ${player.name}`);
            return true;
        }
        return false;
    }
    electChancellor(player) {
        if(this.isEligibleForChancellor(player)) {
            this.chancellorElect = player;
            this.chancellorElect.role = constant.CHANCELLOR_ELECT;

            console.log(`${player.name} is our new Chancellor elect`);
            return true;
        }
        return false;
    }

    isPresident(player) {
        if (this.president) {
            return this.president.id === player.id?true:false;
        }
    }

    removePlayer(playerIn) {
        if(!playerIn) return;
        this.inactivePlayers.push(playerIn);
        this.activePlayers.forEach((player,id,players) => {
            if(playerIn.id === player.id) {
                players.splice(id,1);

                console.log(`Removed player ${playerIn.name}`);
                return true;
            }
        });
        
        return false;
    }
    get winner() {
        let winner = {}
        if (!this.chancellor) return;
        // 3 or more fascist policies passed and hitler elected chancellor
        if (this.fasPolicyCount >= 3 && this.hitler.id === this.chancellor.id) {
            console.log('Fascist won by passing 3 Fascist policies and electing hitler as chancellor');
            winner['team'] = constant.FASCIST;
            winner['reason'] = 'hitler_chancellor';
            return winner;
        }
        // all fascist policies passed
        if (this.fasPolicyCount === this.totalFasPolicies) {
            console.log('Fascist won by passing 5 fascist policies');
            winner['team'] = constant.FASCIST;
            winner['reason'] = 'fascist_pol';
            return winner;
            // all liberal policies passed
        } else if (this.libPolicyCount === this.totalLibPolicies) {
            console.log('Liberal won by passing 6 liberal policies');         
            winner['team'] = constant.LIBERAL;
            winner['reason'] = 'liberal_pol';
            return winner;
            //hitler eleminated
        } else {
            if (this.inactivePlayers.length === 0) return;
            let activePlayer = this.inactivePlayers.filter(player => player.id === this.hitler.id);
            if (activePlayer.length > 0) {
                winner['team'] = constant.LIBERAL;
                winner['reason'] = 'hitler_eliminated';
                return winner;
            }
        }
        return false;
    }

    // creates a random draw pile; using totalLib and totalFas articles
    initDrawPile(totalFas) {
        let s = new Set();
        while (s.size < totalFas) {
            let randI = Math.floor(Math.random() * (this.totalLibArticles + totalFas));
            s.add(randI);

        }
        for(let i=0; i<(totalFas + this.totalLibArticles); i++) {
            if (s.has(i)) {
                this.drawPile.push(constant.FASCIST);
            } else {
                this.drawPile.push(constant.LIBERAL);
            }
        }

        console.log(`Draw Pile generated ${this.drawPile}`);
    }
    drawCards() {
        //draw pile has 3 or more cards -> pop 3 from drawPile -> add it to 
        if (this.numDrawPile >=3) {
            for(let i = 0; i< 3;i++) {
                    let top = this.drawPile.pop();
                    this.drawn.push(top);
            }
            console.log(`3 cards drawn ${this.drawn}`);
            return;
        } else {

            let newDrawPile = this.discardPile;
            // shuffle the discard pile
            this.discardPile = this.discardPile.sort((a,b) => 0.5-Math.random());

            while(this.numDrawPile) {
                newDrawPile.push(this.drawPile.pop());
            }
            this.drawPile = newDrawPile;

      
            this.discardPile = [];
            return this.drawCards();
        }

    }

    discardOne(articles, articleToDiscard) {
        // if (!articles) return;
        let ind = articles.indexOf(articleToDiscard);
        if (ind >= 0 ) {
            articles.splice(ind,1);
            this.discardPile.push(articleToDiscard);
            console.log(`${articleToDiscard} discarded, ${articles} in hand`);
            console.log(`Draw Pile ${this.drawPile}`);
            console.log(`Discard Pile ${this.discardPile}`);

            return articles;
        }
        return;
    }


    makePresident(newPresident) {
        // set the role of existing president to null
        // if (this.president) {
        //     // (this.president);
        //     this.president.role = null;
        //     // this.pastCabinet.president = this.president;
        // }
        newPresident.role =  constant.PRESIDENT;
        this.president = newPresident;
        
        console.log(`${newPresident.name} elected as president`);
    }
    get state() {
        return {
            activePlayers : this.activePlayers,
            inactivePlayers : this.inactivePlayers,
            chancellor : this.chancellor,
            president : this.president,
            chancellorElect: this.chancellorElect,
            pastCabinet : this.pastCabinet,
            // hitler : null,
            fasPolicyCount : this.fasPolicyCount,
            libPolicyCount : this.libPolicyCount,
            totalFasPolicies : this.totalFasPolicies,
            totalLibPolicies : this.totalLibPolicies,
            // fascists : [],
            // liberals : [],

            // drawPile : [],
            // discardPile : [],
            numDrawPile: this.numDrawPile,
            numDiscardPile: this.numDiscardPile,
            
            totalFasArticles : this.totalFasArticles,
            totalLibArticles : this.totalLibArticles,
            // drawn : [],
            host : this.host,
            votes : this.votes,
            numFailedElection : this.numFailedElection,
            round : this.round,
            session: this.session,
            vetoPresident : this.vetoPresident,
            policyToPass : this.vetoPresident,
            vetoPower : this.vetoPower,
            powers : this.powers,
        };
    }
    nextRound() {
        this.round++;
        return this.round;
    }
    get nextPresident() {
        if (!this.president) {
            const randomIndex = Math.floor(Math.random() * this.numActivePlayers);
            return this.activePlayers[randomIndex];
        } else {
            let curPresId = this.getPlayerIndex(this.president);
            if (curPresId + 1 >= this.numActivePlayers) {
                return this.activePlayers[0];
            } else {
                return this.activePlayers[curPresId+1];
            }
        }
    }

    getPlayerIndex(playerIn) {
        for(let i = 0; i< this.numActivePlayers; i++) {
            if(playerIn.id === this.activePlayers[i].id) {
                return i;
            }
        }
    }
    getPlayerById(id) {
        for(let player of this.activePlayers) {
            if (player.id === id) {
                return player;
            }
        }
    }

    endOfRoundHousekeeping() {
        if (this.president) {
            this.president.role = null;
        }
        if (this.chancellor) {
            this.chancellor.role = null
        }
        this.policyToPass = null;
        this.drawn = [];

        this.chancellor = null;
        if(this.chancellorElect) {
            this.chancellorElect.role = null;
        }
        this.chancellorElect = null;

        console.log(`Round ${this.round} done. LP ${this.libPolicyCount}, FP ${this.fasPolicyCount} `);
        console.log(``);
        this.votes = {};
        this.nextRound();

    }

    wasInLastCabinet(player) {

        if (this.pastCabinet.president) {
            if (player.id === this.pastCabinet.president.id) {
                return true;
            }
        }
        if (this.pastCabinet.chancellor) {
            if (player.id === this.pastCabinet.chancellor.id) {
                return true;
            }
        }
        return false;
    }

    makeChancellor(playerIn) {
        // if (this.chancellor) {
        //     this.chancellor.role = null;
        // }
        this.numFailedElection = 0;
        // this.chancellorElect.role = null;
        this.chancellorElect = null;
        
        playerIn.role = constant.CHANCELLOR;
        this.chancellor = playerIn;


        console.log(`${playerIn.name} is our new chancellor`);

    }
    isEligibleForChancellor(player) {
        // president cannot be chancellor
        return (!this.isPresident(player) && !this.wasInLastCabinet(player))?true:false;
    }

    assignRandomPartyMembership() {

        // assign random player as hitler
        let randomIndex = Math.floor(Math.random() * this.numActivePlayers);
        this.fascists.push(this.activePlayers[randomIndex]);   
        this.hitler = this.activePlayers[randomIndex];
        console.log(`${this.hitler.name} is the hitler`);
        let s = new Set();
        while(s.size < this.fascistCount-1) {
            let newIndex = Math.floor(Math.random() * this.numActivePlayers);
            if (newIndex === randomIndex) continue; //this is hitler so skip
            s.add(newIndex);
        }
        s.add(randomIndex);
        for (let i = 0; i < this.numActivePlayers; i++) {
            if (s.has(i)) {
                this.fascists.push(this.activePlayers[i]);
                console.log(`${this.activePlayers[i].name} is a fascist`);
            } else {
                this.liberals.push(this.activePlayers[i]);
                console.log(`${this.activePlayers[i].name} is a liberal`);
            }
        }

        
    }
    castVote(player, vote) {
        
        this.votes[player.id] = vote;
    }
    get hasEveryOneVoted() {
        if (this.votes) {
            return Object.keys(this.votes).length === this.numActivePlayers?true:false;
        }
        return false;
    }

     getElectionResult() {
        let yesVotesCounter = 0;
        for(let playerId of Object.keys(this.votes)) {
            if (this.votes.hasOwnProperty(playerId)) {
                if (this.votes[playerId] === constant.VOTE_YES) yesVotesCounter++;
            }
        }
        return (yesVotesCounter/this.numActivePlayers >= 0.5)?true:false;
    }

    get numDrawPile() {
        return this.drawPile.length;
    }
    get numDiscardPile() {
        return this.discardPile.length;
    }

    get numActivePlayers() {
        return this.activePlayers.length;
    }
    get numInactivePlayers() {
        return this.inactivePlayers.length;
    }
    get fascistCount() {
        if (this.numActivePlayers <=6 ) return 2;
        else if (this.numActivePlayers <=8) return 3;
        else if (this.numActivePlayers <=10) return 4;
    } 
    examineTop3() {

    }
    killPlayer() {

    }
    killPlayerWithVeto() {

    }
    examineMembership() {

    }
    pickPresident() {

    }

    exercisePresidentialPower() {
        let powers = this.fascistPresidentialPower;
        if(this.fasPolicyCount in powers) {
            console.log("WE HAVE POWER ++++++++++++++++++++++++++++++++");
            console.log(powers[this.fasPolicyCount], this.fasPolicyCount);
        }

    }

    get fascistPresidentialPower(){
        if (this.numActivePlayers === 5 || this.numActivePlayers === 6) {
            return ({
                // 3: constant.POWER_EXAMINE_TOP_3,
                3: constant.POWER_EXAMINE_TOP_3,
                4: constant.POWER_KILL,
                5: constant.POWER_KILL_VETO,
            });
        } else if (this.numActivePlayers === 7 || this.numActivePlayers === 8) {
            return ({
                2: constant.POWER_EXAMINE_MEMBERSHIP,
                3: constant.POWER_PICK_PRESIDENT,
                4: constant.POWER_KILL,
                5: constant.POWER_KILL_VETO,
            });

        } else if (this.numActivePlayers === 9 || this.numActivePlayers === 10) {
            return({
                1: constant.POWER_EXAMINE_MEMBERSHIP,
                2: constant.POWER_EXAMINE_MEMBERSHIP,
                3: constant.POWER_PICK_PRESIDENT,
                4: constant.POWER_KILL,
                5: constant.POWER_KILL_VETO,
            });
        } else {
            return ({});
        }

    }
    passPolicy(policy) {
        if (policy === constant.FASCIST) {
            this.fasPolicyCount++;
        } else {
            this.libPolicyCount ++;
        }
        console.log(`${policy} policy passed`);
    }
    passTopPolicyAtRandom() {
        let top =this.drawPile.pop();
        // this.discardPile.push(top);
        this.passPolicy(top);
        console.log(`${top} policy passed at random`);
    }
    
    init(){
        // add players Random Players
        // for(let i = 0; i< 6; i++) {
        //     let player = new Player(i, `Player ${i}`, null);
        //     this.addPlayer(player);
        // }
        this.powers = this.fascistPresidentialPower;
        this.session = constant.SESSION_INIT;
        // assign player roles
        this.assignRandomPartyMembership();

        // initialize drawPile;
        this.initDrawPile(this.totalFasArticles);
        // this.holdPresidency();

    }
    holdPresidency() {
        console.log(this.vetoPresident);
        if (this.vetoPresident && this.vetoPresident['player']) {
            this.vetoPresident['next'] = this.nextPresident;
            this.makePresident(this.vetoPresident['player']);
            this.vetoPresident['player'] = null;
        } else if (this.vetoPresident && this.vetoPresident['next']) {
            this.makePresident(this.vetoPresident['next']);
            this.vetoPresident = null;
        } else {
            this.makePresident(this.nextPresident);
        }
        // this.holdElectionPrimary();
    }
    holdElectionPrimary() {
        
        this.electChancellor(this.chancellorElect);
        // this.holdElectionGeneral();
    }
    holdElectionGeneral() {
        if(this.chancellorElect) {
            // for(let player of this.activePlayers) {
            //     this.castVote(player, (Math.random() > 0.5)?constant.VOTE_YES:constant.VOTE_NO);
            // }
            let result = this.getElectionResult();
            if (result) {
                this.makeChancellor(this.chancellorElect);
                this.numFailedElection = 0;

                console.log('Election Passed');

                this.pastCabinet.president = this.president;
                this.pastCabinet.chancellor = this.chancellor;

                
                if (this.winner) {
                    this.session = constant.SESSION_OVER;
                    console.log("HITLER");
                    return true;
                }
                
                // this.holdLegislationPresident();

            } else {
                this.numFailedElection++;
                return false;
            }
            return true;
        }
    }
    holdLegislationPresident(cardToDiscard) {
        // legislation

        // this.drawCards();
        // emit drawn cards to president

        //president discards a card;
        this.discardOne(this.drawn, cardToDiscard);
        // this.holdLegislationChancellor();
        
    }
    handleGameOver() {
        for(let player in this.activePlayers) {
            player.role = null;
        }
        console.log(`Game Over. ${this.winner} won!`);
    }
    holdLegislationChancellor(cardToDiscard) {
        // let randomCardToDiscard = this.drawn[Math.floor(Math.random() * this.drawn.length)];
        this.discardOne(this.drawn, cardToDiscard);
        this.policyToPass = this.drawn.pop();
        this.passPolicy(this.policyToPass);
        if (this.winner) {
            this.session = constant.SESSION_OVER;
            return;
        }

        this.exercisePresidentialPower();
        // this.endOfRoundHousekeeping();
        // this.holdElectionPrimary();
    }
    get canStart(){
        if(this.numActivePlayers >= constant.MIN_PLAYERS && this.numActivePlayers<= constant.MAX_PLAYERS) {
            return true;
        }
        return false;
    }
    // constant.SESSION_INIT,
    // constant.SESSION_PRESIDENCY, 
    // constant.SESSION_ELECTION_PRIMARY,
    // constant.SESSION_ELECTION_GENERAL,
    // constant.SESSION_LEGISLATION_ constant.PRESIDENT,
    // constant.SESSION_LEGISLATION_CHANCELLOR,
    // constant.SESSION_OVER,

   


}

module.exports = {Game, Player};