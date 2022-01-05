const POWER_EXAMINE_TOP_3 = 'examine_top_3';
const POWER_KILL = 'kill';
const POWER_KILL_VETO = 'kill_veto';
const POWER_PICK_PRESIDENT = 'pick_president';
const POWER_EXAMINE_MEMBERSHIP = 'examine_membership';

const LIBERAL = 'liberal';
const FASCIST = 'fascist';
const PRESIDENT = 'president';
const CHANCELLOR = 'chancellor';
const CHANCELLOR_ELECT = 'chancellor_elect';


const SESSION_INIT = 'init';
const SESSION_PRESIDENCY = 'presidency';
const SESSION_ELECTION_PRIMARY = 'election_primary';
const SESSION_ELECTION_GENERAL = 'election_general';
const SESSION_LEGISLATION_PRESIDENT = 'legislation_president';
const SESSION_LEGISLATION_CHANCELLOR = 'legislation_chancellor';
const SESSION_OVER = 'over';


const VOTE_YES = 'yes';
const VOTE_NO = 'no';

class Player {
    constructor(id, name, role) {
        this.id = id;
        this.name = name;
        this.role = role;
    } 
}

const MIN_PLAYERS = 5;
const MAX_PLAYERS = 10;

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
        this.totalFasPolicies = 5;
        this.totalLibPolicies = 6;
        this.fascists = [];
        this.liberals = [];
        this.drawPile = [];
        this.discardPile = [];
        this.totalFasArticles = 11;
        this.totalLibArticles = 6;
        this.drawn = [];
        this.votes = {};
        this.gameSession = SESSION_PRESIDENCY;
        this.numFailedElection = 0;
        this.round = 0;
        this.policyToPass = null;
        this.sessions = [
            SESSION_INIT,
            SESSION_PRESIDENCY, 
            SESSION_ELECTION_PRIMARY,
            SESSION_ELECTION_GENERAL,
            SESSION_LEGISLATION_PRESIDENT,
            SESSION_LEGISLATION_CHANCELLOR,
            SESSION_OVER,
            ];
        this.session = this.sessions[0];
    }

    get nextSession() {
        let currentSessionIndex = SESSION_INIT;
        if (this.session) {
            currentSessionIndex =this.sessions.indexOf(this.sessions);
            if (currentSessionIndex + 1 >= this.sessions.length) {
                return this.sessions[1]
            } else {
                return this.sessions[currentSessionIndex+1];
            }
        }
        return this.sessions[0];
    }
    addPlayer(player) {
        if (this.numActivePlayers < MAX_PLAYERS) {
            this.activePlayers.push(player);
            console.log(`Added player ${player.name}`);
            return true;
        }
        return false;
    }
    electChancellor(player) {
        if(this.isEligibleForChancellor(player)) {
            this.chancellorElect = player;
            this.chancellorElect.role = CHANCELLOR_ELECT;

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
        if (!this.chancellor) return;
        // 3 or more fascist policies passed and hitler elected chancellor
        if (this.fasPolicyCount >= 3 && this.hitler.id === this.chancellor.id) {
            console.log('Fascist won by passing 3 Fascist policies and electing hitler as chancellor');
        
            return FASCIST;
        }
        // all fascist policies passed
        if (this.fasPolicyCount === this.totalFasPolicies) {
            console.log('Fascist won by passing 5 fascist policies');
         
            return FASCIST;
            // all liberal policies passed
        } else if (this.libPolicyCount === this.totalLibPolicies) {
            console.log('Liberal won by passing 6 liberal policies');
           
            return LIBERAL;
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
                this.drawPile.push(FASCIST);
            } else {
                this.drawPile.push(LIBERAL);
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
        newPresident.role = PRESIDENT;
        this.president = newPresident;

        console.log(`${newPresident.name} elected as president`);
    }
    get state() {
        return this;
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
    endOfRoundHousekeeping() {
        this.pastCabinet.president = this.president;
        this.pastCabinet.chancellor = this.chancellor;
        if (this.president) {
            this.president.role = null;
        }
        if (this.chancellor) {
            this.chancellor.role = null
        }
        this.policyToPass = null;
        console.log(`Round ${this.round} done. LP ${this.libPolicyCount}, FP ${this.fasPolicyCount} `);
        console.log(``);
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
        
        playerIn.role = CHANCELLOR;
        this.chancellor = playerIn;
        this.votes = {};

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
    
    

    getElectionResult() {
        let yesVotesCounter = 0;
        for(let playerId of Object.keys(this.votes)) {
            if (this.votes.hasOwnProperty(playerId)) {
                if (this.votes[playerId] === VOTE_YES) yesVotesCounter++;
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
        switch(this.numActivePlayers) {
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
                3: POWER_EXAMINE_TOP_3,
                4: POWER_KILL,
                5: POWER_KILL_VETO,
            });
        } else if (this.numActivePlayers === 7 || this.numActivePlayers === 8) {
            return ({
                2: POWER_EXAMINE_MEMBERSHIP,
                3: POWER_PICK_PRESIDENT,
                4: POWER_KILL,
                5: POWER_KILL_VETO,
            });

        } else if (this.numActivePlayers === 9 || this.numActivePlayers === 10) {
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
    passPolicy(policy) {
        if (policy === FASCIST) {
            this.fasPolicyCount++;
        } else {
            this.libPolicyCount ++;
        }
        console.log(`${policy} policy passed`);
    }
    passTopPolicyAtRandom() {
        let top = game.drawPile.pop();
        game.discardPile.push(top);
        this.passPolicy(top);
        console.log(`${top} policy passed at random`);
    }
    
    init(){
        // add players Random Players
        for(let i = 0; i< 6; i++) {
            let player = new Player(i, `Player ${i}`, null);
            this.addPlayer(player);
        }

        // assign player roles
        this.assignRandomPartyMembership();

        // initialize drawPile;
        this.initDrawPile(this.totalFasArticles);
        this.holdPresidency();

    }
    holdPresidency() {
        this.makePresident(this.nextPresident);
        this.holdElectionPrimary();
    }
    holdElectionPrimary() {
        do {
            game.chancellorElect = game.activePlayers[Math.floor(Math.random() * game.numActivePlayers)];
        } while(!game.isEligibleForChancellor(game.chancellorElect));

        this.electChancellor(this.chancellorElect);
        this.holdElectionGeneral();
    }
    holdElectionGeneral() {
        if(this.chancellorElect) {
            for(let player of this.activePlayers) {
                this.castVote(player, (Math.random() > 0.5)?VOTE_YES:VOTE_NO);
            }
            let result = this.getElectionResult();
            if (result) {
                this.makeChancellor(this.chancellorElect);
                this.numFailedElection = 0;

                console.log('Election Passed');
                if (this.winner) {
                    console.log("HITLER");
                    return;
                }
                
                this.holdLegislationPresident();


            } else {
                this.numFailedElection++;
                this.chancellor = null;
    
            
                // this.chancellorElect.role = null;
                
                this.chancellorElect = null;
                console.log(`Election failed : ${this.numFailedElection} x times`);
                if(this.numFailedElection >= 3) {
                    console.log("Flection failed, passing policy at random");
                    
                   // TODO : Remove presidential power unlocked after passing this election

                   // Remove term limits:
                    this.pastCabinet.president = null;
                    this.pastCabinet.chancellor = null;

                    this.passTopPolicyAtRandom();
                    // reset failed election
                    this.numFailedElection = 0;

                }

                this.endOfRoundHousekeeping();
                this.holdPresidency();
                // continue;
            }
        }
    }
    holdLegislationPresident() {
        // legislation

        this.drawCards();
        // emit drawn cards to president

        //president discards a card;
        let randomCardToDiscard = this.drawn[Math.floor(Math.random() * this.drawn.length)];
        this.discardOne(this.drawn, randomCardToDiscard);
        this.holdLegislationChancellor();
        
    }
    handleGameOver() {
        console.log(`Game Over. ${this.winner} won!`);
    }
    holdLegislationChancellor() {
        let randomCardToDiscard = this.drawn[Math.floor(Math.random() * this.drawn.length)];
        game.discardOne(this.drawn, randomCardToDiscard);
        this.policyToPass = this.drawn.pop();
        this.passPolicy(this.policyToPass);
        if (this.winner) {
            return;
        }

        this.exercisePresidentialPower();
        this.endOfRoundHousekeeping();
        this.holdElectionPrimary();
    }
    // SESSION_INIT,
    // SESSION_PRESIDENCY, 
    // SESSION_ELECTION_PRIMARY,
    // SESSION_ELECTION_GENERAL,
    // SESSION_LEGISLATION_PRESIDENT,
    // SESSION_LEGISLATION_CHANCELLOR,
    // SESSION_OVER,

    handleSession() {
        switch(this.session) {
            case SESSION_INIT:
                this.init();
            case SESSION_PRESIDENCY:
                this.holdPresidency(); 
            case SESSION_ELECTION_PRIMARY:
                this.holdElectionPrimary();
            case SESSION_LEGISLATION_PRESIDENT:
                this.holdLegislationPresident();
            case SESSION_LEGISLATION_CHANCELLOR:
                this.holdLegislationChancellor();
            case SESSION_OVER:
                this.handleGameOver();
            
        }
    }

}


game = new Game();
game.init();
