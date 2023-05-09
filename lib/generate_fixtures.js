// import { writeFileSync } from 'fs'
import { totalSeasonGameweeks, allTeams } from "../utils/config.js";

const teams = { ...allTeams };
const fixtures = [];

// helper function to get a random team id that has not yet been used in this round
function getRandomTeamId(round) {
    let teamIds = Object.keys(teams);
    // exclude team ids that have already been used in this round
    for (let fixture of round) {
        teamIds = teamIds.filter(id => id !== fixture.home && id !== fixture.away);
    }
    // return a random team id from the remaining options
    return teamIds[Math.floor(Math.random() * teamIds.length)];
}

// helper function to check if a team id has already been used in this round
function isTeamUsed(round, teamId) {
    for (let fixture of round) {
        if (fixture.home === teamId || fixture.away === teamId) {
            return true;
        }
    }
    return false;
}

export function generateFixtures() {
    // create 38 rounds of fixtures
    for (let i = 1; i <= totalSeasonGameweeks; i++) {
        let round = [];

        // create 10 fixtures for each round
        for (let j = 1; j <= 10; j++) {
            let homeTeamId = getRandomTeamId(round);
            let awayTeamId = getRandomTeamId(round);

            // ensure home and away id are different and both have not already appeared in this round
            while (homeTeamId === awayTeamId || isTeamUsed(round, homeTeamId) || isTeamUsed(round, awayTeamId)) {
                homeTeamId = getRandomTeamId(round);
                awayTeamId = getRandomTeamId(round);
            }

            round.push({ home: homeTeamId, away: awayTeamId });

        }

        fixtures.push(round);
    }

    // writeFileSync("db/fixtures.json", JSON.stringify(fixtures))
    console.log('\nFixtures generated.')
    
    return fixtures;
}