import { writeFileSync } from "fs";
import { allTeams } from "../utils/config.js";

const teams = Object.values(allTeams)

export function initializeSeson(_fixtures) {

    // define initial season store value
    const season = {
        // current_fixture is initialized as 1 ( first gameweek of the season )
        current_fixture: 1,
        // this maps every team in the league with an intial season table value
        teams: teams.map((e) => (
            {
                id: e.id,
                name: e.name,
                played: 0,
                win: 0,
                draw: 0,
                lose: 0,
                gf: 0,
                ga: 0,
                gd: 0,
                points: 0,
                lastfive: [],
            }
        )),
        // fixtures is initialized with the generated fixture passed in as an argument above
        fixtures: _fixtures,
        results: [],
    }

    // save season object in db folder as `season.json` file
    writeFileSync("db/season.json", JSON.stringify(season))

    console.log('Season initialized. `db/season.json` file generated')

    return season;
}
