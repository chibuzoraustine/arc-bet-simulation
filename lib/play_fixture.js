
import { writeFileSync } from "fs";
import { delayAfterOdds, matchDelay, maxTotalGoals, pointShares, totalSeasonGameweeks } from "../utils/config.js";
import { calcMatchPoint, convertMatchPointToOdd, getSeason } from "../utils/helpers.js";
import ora from 'ora';
import cliSpinners from "cli-spinners";
import chalk from "chalk";
chalk.level = 1;
const _spinner = ora()
const _spinnerF = ora()

export function playFixture() {

    // retrieve season store data
    const season = getSeason();
    const { fixtures, current_fixture, teams, results } = season;

    // check if season has ended
    if (current_fixture >= totalSeasonGameweeks && results.length >= totalSeasonGameweeks) {
        console.log('\n--------------------------------------------------------------------------------------------------------')
        console.error("Season ended");
        console.log('--------------------------------------------------------------------------------------------------------')
        console.log('\n Table:')
        console.table([...teams].sort((a, b) => (b.points - a.points) || (b.gd - a.gd)).map((e) => (
            {
                name: e.name,
                played: e.played,
                win: e.win,
                draw: e.draw,
                lose: e.lose,
                gf: e.gf,
                ga: e.ga,
                gd: e.gd,
                points: e.points,
            }
        )))
        process.exit(1);
    }

    // target current fixture
    const fixture = fixtures[current_fixture - 1];

    // remap fixture adding odd and matchpoint value
    const remappedFixture = fixture.map((e) => {
        const totalMatchPoint = calcMatchPoint(e.home, e.away, teams);
        const teamOdds = convertMatchPointToOdd(totalMatchPoint.home, totalMatchPoint.away)
        return {
            home: teams[e.home - 1],
            home_odd: teamOdds.home,
            home_match_point: totalMatchPoint.home,
            away: teams[e.away - 1],
            away_odd: teamOdds.away,
            away_match_point: totalMatchPoint.away,
        }
    })

    // display gameweek
    console.log('\n--------------------------------------------------------------------------------------------------------')
    console.log('%c' + 'Gameweek ' + current_fixture, 'font-family:Comic Sans MS; font-size:50px; font-weight:bold; background: linear-gradient(#f00, yellow); border-radius: 5px; padding: 20px')
    console.log('--------------------------------------------------------------------------------------------------------')

    // _spinner.start()

    // display odds before match begins
    console.log('\n Odds:')
    console.table(
        remappedFixture.map((e) => (
            {
                home: e.home.name,
                home_odd: parseFloat(e.home_odd),
                away_odd: parseFloat(e.away_odd),
                away: e.away.name,
            }
        ))
    );

    // match countdown
    console.log('')
    _spinner.start();
    _spinner.spinner = cliSpinners.arc
    _spinner.text = `Match will begin in ${chalk.bgYellow.black(delayAfterOdds + ' seconds \n')}`;
    let _spinnerMDelay = delayAfterOdds - 1;
    let _spinnerMInterval = setInterval(() => {
        if (_spinnerMDelay < 1) {
            _spinner.stop();
            clearInterval(_spinnerMInterval);
        } else {
            _spinner.text = `Match will begin in ${chalk.bgYellow.black(_spinnerMDelay-- + ' seconds \n')}`;
        }
    }, 1000)

    // timeout is used to delay the match after the odds are displayed
    setTimeout(() => {

        // create a copy of the current season progress as new_season_value
        const new_season_value = { ...season };

        // define an intial results for the current gameweek
        const _results = [];

        // loop through every game in that gameweek
        remappedFixture.forEach((e) => {

            // plays a match and returns the result
            const result = playMatch(e);

            // find the home team in the new_season_value object and update the home team table value with match result
            let _homeVal = new_season_value.teams[new_season_value.teams.findIndex((e) => e.id == result.home_result.id)];
            new_season_value.teams[new_season_value.teams.findIndex((e) => e.id == result.home_result.id)] = {
                ...new_season_value.teams[new_season_value.teams.findIndex((e) => e.id == result.home_result.id)],
                win: _homeVal.win + result.home_result.win,
                draw: _homeVal.draw + result.home_result.draw,
                lose: _homeVal.lose + result.home_result.lose,
                gf: _homeVal.gf + result.home_result.gf,
                ga: _homeVal.ga + result.home_result.ga,
                gd: _homeVal.gd + (result.home_result.gf - result.home_result.ga),
                points: _homeVal.points + result.home_result.points,
                played: _homeVal.played + result.home_result.played,
                lastfive: _homeVal.lastfive.length < 5 ? [..._homeVal.lastfive, result.home_result.status] : [..._homeVal.lastfive.slice(1), result.home_result.status]
            }

            // find the away team in the new_season_value object and update the away team table value with match result
            let _awayVal = new_season_value.teams[new_season_value.teams.findIndex((e) => e.id == result.away_result.id)];
            new_season_value.teams[new_season_value.teams.findIndex((e) => e.id == result.away_result.id)] = {
                ...new_season_value.teams[new_season_value.teams.findIndex((e) => e.id == result.away_result.id)],
                win: _awayVal.win + result.away_result.win,
                draw: _awayVal.draw + result.away_result.draw,
                lose: _awayVal.lose + result.away_result.lose,
                gf: _awayVal.gf + result.away_result.gf,
                ga: _awayVal.ga + result.away_result.ga,
                gd: _awayVal.gd + (result.away_result.gf - result.away_result.ga),
                points: _awayVal.points + result.away_result.points,
                played: _awayVal.played + result.away_result.played,
                lastfive: _awayVal.lastfive.length < 5 ? [..._awayVal.lastfive, result.away_result.status] : [..._awayVal.lastfive.slice(1), result.away_result.status]
            }

            // push the match result to the temporary _results array
            _results.push({
                home: {
                    id: result.home_result.id,
                    score: result.home_result.gf
                },
                away: {
                    id: result.away_result.id,
                    score: result.away_result.gf
                }
            })
        });

        // push the _results array value to the results array in the new_season_value object
        new_season_value.results.push({ fixture: new_season_value.current_fixture, data: _results });

        // update the current_fixture to next gameweek
        new_season_value.current_fixture = new_season_value.current_fixture + 1

        // update the season store with  new_season_value
        writeFileSync('db/season.json', JSON.stringify(new_season_value))

        // clear spinner
        _spinner.clear();

        // display match results in the console
        console.log('\n Result:')
        console.table(_results.map((e) => (
            {
                home: new_season_value.teams.filter(t => t.id == e.home.id)[0].name,
                home_score: e.home.score,
                away_score: e.away.score,
                away: new_season_value.teams.filter(t => t.id == e.away.id)[0].name,
            }
        )))

        // display league standings in the console
        console.log('\n Table:')
        console.table([...new_season_value.teams].sort((a, b) => (b.points - a.points) || (b.gd - a.gd)).map((e) => (
            {
                name: e.name,
                played: e.played,
                win: e.win,
                draw: e.draw,
                lose: e.lose,
                gf: e.gf,
                ga: e.ga,
                gd: e.gd,
                points: e.points,
            }
        )))

        // next fixture countdown 
        console.log(`\n ${chalk.bgGreen.black(`Gameweek ${current_fixture} concluded`)} \n`)
        _spinnerF.start()
        _spinnerF.spinner = cliSpinners.arc
        _spinnerF.text = `Next fixture begins in ${chalk.bgYellow.black(matchDelay + ' seconds \n')}`;
        let _spinnerFDelay = matchDelay - 1;
        let _spinnerFInterval = setInterval(() => {
            if (_spinnerFDelay < 1) {
                clearInterval(_spinnerFInterval);
            } else {
                _spinnerF.text = `Next fixture begins in ${chalk.bgYellow.black(_spinnerFDelay-- + ' seconds \n')}`;
            }
        }, 1000)

        // play next fixture
        setTimeout(() => {
            _spinnerF.stop()
            playFixture()
        }, matchDelay * 1000)

    }, delayAfterOdds * 1000)

}

// this functions plays a match and
// it contains the algorithm for how the match is played
function playMatch(match) {

    // define the match result object
    const result = {
        home: {
            id: match.home.id,
            score: 0
        },
        away: {
            id: match.away.id,
            score: 0
        }
    }

    // we use this random to get the total goals that will be scored in the match
    let total_goals = Math.floor(Math.random() * (maxTotalGoals + 1));

    if (total_goals > 0) {
        // if total_goals is greater than 0 we iterate with the length of total_goals
        for (let g = 0; g < total_goals; g++) {
            // get a random of 100 (i.e pointshares.total)
            let ranNumb = Math.floor(Math.random() * (pointShares.total + 1))
            // if the random result is less than or equal to the home points, add one goal for home
            // else add one goal for away
            if (ranNumb <= match.home_match_point) {
                result.home.score = result.home.score + 1
            } else {
                result.away.score = result.away.score + 1
            }
        }
    }

    // we re-format the result with handleResult function
    let homeResult = handleResult(result, match.home.id);
    let awayResult = handleResult(result, match.away.id);

    // return formatted result
    return {
        home_result: homeResult,
        away_result: awayResult
    }
}

// this function re-formats the match result for home and away team
function handleResult(result, team_id) {

    // defaine the default return value
    let defaultReturnValue = {
        id: team_id,
        win: 0,
        draw: 0,
        lose: 0,
        gf: 0,
        ga: 0,
        points: 0,
        played: 1,
    }

    // check if the team_id passed down is home or away
    if (result.home.id == team_id) {

        // check if match is a draw
        if (result.home.score === result.away.score) {
            return {
                ...defaultReturnValue,
                draw: 1,
                gf: result.home.score,
                ga: result.away.score,
                points: 1,
                status: 'd',
            }
        }

        // check if home wins
        if (result.home.score > result.away.score) {
            return {
                ...defaultReturnValue,
                win: 1,
                gf: result.home.score,
                ga: result.away.score,
                points: 3,
                status: 'w',
            }
        } else {
            // home lost
            return {
                ...defaultReturnValue,
                lose: 1,
                gf: result.home.score,
                ga: result.away.score,
                status: 'l',
            }
        }
    } else if (result.away.id == team_id) {

        // check if match is a draw for away team
        if (result.away.score === result.home.score) {
            return {
                ...defaultReturnValue,
                draw: 1,
                gf: result.away.score,
                ga: result.home.score,
                points: 1,
                status: 'd',
            }
        }

        // check if away wins
        if (result.away.score > result.home.score) {
            return {
                ...defaultReturnValue,
                win: 1,
                gf: result.away.score,
                ga: result.home.score,
                points: 3,
                status: 'w',
            }
        } else {
            // away lost
            return {
                ...defaultReturnValue,
                lose: 1,
                gf: result.away.score,
                ga: result.home.score,
                status: 'l',
            }
        }
    } else {
        // this is unlikely to be returned
        // it was added just as a default return value when the `if` and `else if` statement was not met
        return { ...defaultReturnValue, status: 'l' }
    }
}