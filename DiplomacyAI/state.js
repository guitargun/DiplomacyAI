﻿const CookieAccess = require('cookiejar').CookieAccessInfo;
const puppeteer = require('puppeteer');

let agent;
let cheerio;
let url;
let site;

module.exports = {

    init(init) {
        url = init.url;
        agent = init.agent;
        cheerio = init.cheerio;
    },

    updateSite(s) {
        site = s;
    },

    stateParser(smallId, bigId, index) {
        turl = `${url}/cache/games/${smallId}/${bigId}/${index}-json.map`;
        agent.get(turl).then(function (response) {
            const $ = cheerio.load(response.text);
            let units = JSON.parse(response.text.split(' ')[4].split('(')[1].split(')')[0]);
            let terrs = JSON.parse(response.text.split(' ')[6].split(';')[0]);

            //making custom object map
            let unitMap = new Map();
            for (let u in units) {
                let unit = {};
                unit.countryID = units[u].countryID;
                unit.type = units[u].type;
                unit.terrID = units[u].terrID;
                unitMap.set(u, unit);
            }

            let terrMap = new Map();
            for (let t in terrs) {
                t = terrs[t];
                let terr = {};
                terr.standoff = t.standoff;
                terr.occupiedFromTerrID = t.occupiedFromTerrID;
                terr.unitID = t.unitID;
                terr.ownerCountryID = t.ownerCountryID;
                terrMap.set(t.id, terr);
            }

            info = { unitMap, terrMap };
            console.log(unitMapS);

        });
    },


    gameFinder() {
        //site is set to the profile page
        let $ = cheerio.load(site);
        let games = [];
        return new Promise(resolve => {
            let links = 0;
            let total = $('td[class="homeGamesStats"] div div[class*="bar homeGameLinks"] a').length + $('td[class="homeGamesStats"] div div[class*="bar homeGameLinks"] form[name="gameInvite"]').length;
            //going to loop over every game you are in
            $('td[class="homeGamesStats"] div div[class*="bar homeGameLinks"] a').each(function () {
                let game = {};
                //gets the main id needed from each game from the open link
                game.bigId = $(this).attr('href').split('=')[1].split('#')[0];
                //quick navigation to that game
                agent.get(`${url}board.php?gameID=${game.bigId}`).then(function (r) {
                    const $2 = cheerio.load(r.text); //just loads that game page into cheerio
                    game.smallId = $2('#mapImage').attr('src').split('/')[2]; //get the small id from the image src
                    games.push(game);//adding to the list
                    links++;
                    if (links === total) {
                        resolve(games);
                    }
                });
            });
            //going over the invites.. 
            // TODO: accept the invite
            $('td[class="homeGamesStats"] div div[class*="bar homeGameLinks"] form[name="gameInvite"]').each( function(index, value) {
                let objects = $(value).childeren('name=["gameInvitation"]').value();
                let game = {};
                game.bigId = parseInt(objects.gameID);

                //quick navigation to that game
                agent.get(`${url}board.php?gameID=${game.bigId}`).then(function (r) {
                    const $2 = cheerio.load(r.text); //just loads that game page into cheerio
                    game.smallId = $2('#mapImage').attr('src').split('/')[2]; //get the small id from the image src
                    games.push(game);//adding to the list
                    links++;
                    if (links === total) {
                        resolve(games);
                    }
                });
            });

        });
    },

    async peek(gameId) {
        const access = CookieAccess(
            url.hostname,
            url.pathname,
            'https:' === url.protocol
        );


        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        for (let cookies in agent.jar.getCookies(access)) {
            cookies = agent.jar.getCookies(access)[cookies];
            if (cookies !== undefined && cookies.value !== undefined) {
                cookies.url = url;
                await page.setCookie(cookies);
            }
        }
        await page.goto(`${url}board.php?gameID=${gameId}`, { "waitUntil": "load" });
    }
};