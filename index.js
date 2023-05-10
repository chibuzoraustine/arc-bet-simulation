import { readFileSync, unlinkSync } from "fs";
import { generateFixtures } from "./lib/generate_fixtures.js";
import { initializeSeson } from "./lib/initialize_season.js";
import { playFixture } from "./lib/play_fixture.js";
import chalk from "chalk";

let season;

if (process.argv[2] == 'clear') {
    try {
        unlinkSync('db/season.json')
        console.log(`${chalk.bgGreen.white("Season progress has been cleared successfully")}`)
    } catch (error) {
        console.log(`${chalk.bgRed.white("Season has not been initialized yet")}`)
    }
}else if (process.argv[2] == 'refresh') {
    const _fixtures = generateFixtures();
    initializeSeson(_fixtures)
    console.log(`${chalk.bgGreen.white("Season progress has been refreshed")}`)
}else {
    try {
        season = JSON.parse(readFileSync('db/season.json'));
        console.log('\nSeason progress loaded')
    } catch (error) {
        const _fixtures = generateFixtures();
        season = initializeSeson(_fixtures)
        console.log('\nNew season initialized');
    }    
    playFixture();
}