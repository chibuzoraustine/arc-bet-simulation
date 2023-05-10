import { readFileSync } from "fs"
import { allTeams, pointShares, totalAvailableOdd } from "./config.js";

export function getSeason() {
    let season;
    try {
        season = JSON.parse(readFileSync('db/season.json'))
        // console.log('played', fixture)
    } catch (error) {
        console.log('Error: failed to load season')
        process.exit(1)
    }
    return season;
}

export function calcMatchPoint(home_id, away_id, teams) {

    let lastfive = getLastFiveMatchPoint(home_id, away_id, teams);
    let positionMatchPoint = getPositionMatchPoint(home_id, away_id, teams);
    let tablePointMatchPoint = getTablePointMatchPoint(home_id, away_id, teams);

    let luck = Math.floor(Math.random() * 2);

    let _homematchpoint = lastfive.home + positionMatchPoint.home + tablePointMatchPoint.home + (luck == 0 ? pointShares.luck : 0) + pointShares.homeadvantage;
    let _awaymatchpoint = lastfive.away + positionMatchPoint.away + tablePointMatchPoint.away + (luck == 1 ? pointShares.luck : 0);

    return {
        home: _homematchpoint,
        away: _awaymatchpoint
    }

}

export function convertMatchPointToOdd(home_point, away_point) {
    let home_odd = (((totalAvailableOdd - 2) - ((home_point / pointShares.total) * (totalAvailableOdd - 2))) + 1).toFixed(2);
    let away_odd = (((totalAvailableOdd - 2) - ((away_point / pointShares.total) * (totalAvailableOdd - 2))) + 1).toFixed(2);

    return {
        home: home_odd,
        away: away_odd
    }
}

export function convertOddToMatchPoint(home_odd, away_odd) {
    let home_point = (((totalAvailableOdd - 2) - (home_odd - 1)) / (totalAvailableOdd - 2)) * pointShares.total
    let away_point = (((totalAvailableOdd - 2) - (away_odd - 1)) / (totalAvailableOdd - 2)) * pointShares.total

    return {
        home: home_point,
        away: away_point
    }
}


function getLastFiveMatchPoint(home_id, away_id, teams) {

    let _home = teams.find((e) => e.id == home_id);
    let _away = teams.find((e) => e.id == away_id);
    let _homepoint = 0;
    let _awaypoint = 0;

    if (_home.lastfive.length > 0) {
        _home.lastfive.forEach(e => {
            if (e == 'w') {
                _homepoint += 3;
            } else if (e == 'd') {
                _homepoint += 1;
            } else {
                _homepoint += 0
            }
        });
    }

    if (_away.lastfive.length > 0) {
        _away.lastfive.forEach(e => {
            if (e == 'w') {
                _awaypoint += 3;
            } else if (e == 'd') {
                _awaypoint += 1;
            } else {
                _awaypoint += 0
            }
        });
    }

    let dn = (_homepoint + _awaypoint) > 0 ? _homepoint + _awaypoint : 1;
    let _homematchpoint = (_homepoint / dn) * pointShares.lastfive
    let _awaymatchpoint = (_awaypoint / dn) * pointShares.lastfive

    if (_awaymatchpoint == 0 && _homematchpoint == 0) {
        return {
            home: pointShares.lastfive / 2,
            away: pointShares.lastfive / 2
        }
    } else {
        return {
            home: _homematchpoint,
            away: _awaymatchpoint
        }
    }
}

function getPositionMatchPoint(home_id, away_id, teams) {
    // In this function each team is given a point by their standing in the season table
    // points ranges from 1 to 20 (length of total teams in the league)
    // the team at the top of the table gets 20 points, the last gets 1 point
    // the match point is derives with this point values

    // retrieve season current fixture (gameweek)
    let { current_fixture } = getSeason();

    // return equal (default) point in first fixture of the season
    if (current_fixture == 1) {
        return {
            home: pointShares.tableposition / 2,
            away: pointShares.tableposition / 2
        }
    }

    // sort each teams by season points from highest to lowest (i.e plot the season table)
    let teamSortByPoint = [...teams].sort((a, b) => b.points - a.points);

    // get home and away position in table
    let _home = teamSortByPoint.findIndex((e) => e.id == home_id);
    let _away = teamSortByPoint.findIndex((e) => e.id == away_id);

    // points are derived by subtrating maximum point by team index in table
    let _homepoint = Object.keys(allTeams).length - _home;
    let _awaypoint = Object.keys(allTeams).length - _away;

    // define denominator
    let dn = _homepoint + _awaypoint;

    // getting match point
    let _homematchpoint = (_homepoint / dn) * pointShares.tableposition
    let _awaymatchpoint = (_awaypoint / dn) * pointShares.tableposition

    // return match point
    return {
        home: _homematchpoint,
        away: _awaymatchpoint
    }
}

function getTablePointMatchPoint(home_id, away_id, teams) {
    //
    let _home = teams.find((e) => e.id == home_id);
    let _away = teams.find((e) => e.id == away_id);
    let _homepoint = _home.points;
    let _awaypoint = _away.points;
    let dn = (_homepoint + _awaypoint) > 0 ? _homepoint + _awaypoint : 1;
    let _homematchpoint = (_homepoint / dn) * pointShares.tablepoint
    let _awaymatchpoint = (_awaypoint / dn) * pointShares.tablepoint

    if (_awaymatchpoint == 0 && _homematchpoint == 0) {
        return {
            home: pointShares.tablepoint / 2,
            away: pointShares.tablepoint / 2
        }
    } else {
        return {
            home: _homematchpoint,
            away: _awaymatchpoint
        }
    }
}