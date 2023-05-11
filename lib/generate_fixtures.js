import { allTeams } from "../utils/config.js";

function shuffleArr(arr) {
    return arr
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
}

export function generateFixtures() {

    var clubs = [...(Object.values(allTeams))];

    const numberOfTeams = clubs.length;

    const games = numberOfTeams - 1;

    const matchesPerGameweek = numberOfTeams / 2;

    const initialLeg = [];


    for (let i = 0; i < games; i++) {

        const gameweek = [];



        for (let match = 0; match < matchesPerGameweek; match++) {

            var home = (i + match) % (numberOfTeams - 1);
            var away = match == 0 ? numberOfTeams - 1 : ((numberOfTeams - 1) - match + i) % (numberOfTeams - 1);

            gameweek.push({ home: clubs[home].id, away: clubs[away].id });

        }

        initialLeg.push(gameweek);

    }

    //create and Shuffle the First Leg Matches
    let firstLeg = [...initialLeg].map((gameweek) =>
    (
        shuffleArr(gameweek).map(g =>
        (
            {
                home: g.home,
                away: g.away
            }
        ))
    )
    )

    //Create Second Leg Shuffle and Reverse the fixtures
    let secondLeg = [...firstLeg].map((gameweek) => (shuffleArr(gameweek).map(g => (
        {
            home: g.away,
            away: g.home
        }
    )))

    )

    let allFixtures = [...shuffleArr(firstLeg), ...shuffleArr(secondLeg)];
    return allFixtures;

}