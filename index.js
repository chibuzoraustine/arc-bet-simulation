import { readFileSync } from "fs";
import { generateFixtures } from "./lib/generate_fixtures.js";
import { initializeSeson } from "./lib/initialize_season.js";
import { playFixture } from "./lib/play_fixture.js";

let season;
try {
    season = JSON.parse(readFileSync('db/season.json'));
    console.log('\nSeason progress loaded')
} catch (error) {
    const _fixtures = generateFixtures();
    season = initializeSeson(_fixtures)
    console.log('\nNew season initialized');
}

playFixture();

