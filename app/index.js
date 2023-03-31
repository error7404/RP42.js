const fs = require('fs');
const client = require('discord-rich-presence');
require('dotenv').config();
const Client = require('42.js').Client
const getAttr = require('./getAttr.js');

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function updatePresence(login, lvl, largeImageText, state, campus, coalition_logo_key, coalition_name, startedAt) {
	if (state.length > 128){
		state = state.slice(0, 125);
		state += "...";
	}
	if (largeImageText.length > 128){
		largeImageText = largeImageText.slice(0, 125);
		largeImageText += "...";
	}
	let params = {
		largeImageKey: "rp42-icon",
		largeImageText: largeImageText,
		details: `${login} | Lvl ${lvl}%`,
		state: state,
		startTimestamp: startedAt,
		instance: true,
	}
	params = await setCampusImage(params, campus);
	params = await setCoalitionImage(params, coalition_logo_key, coalition_name);
	setPresenceName(params, campus);
}

/**
 * Search for the campus image on github and set it as largeImageKey
 * @param params the presence params
 * @param campus the campus name
 * @returns the presence params with the largeImageKey set
 */
async function setCampusImage(params, campus) {
	let r;

	r = await fetch("https://github.com/error7404/RP42.js/raw/main/assets/" + campus + ".png")
	if (r.ok)
		params.largeImageKey = "https://github.com/error7404/RP42.js/raw/main/assets/" + campus + ".png";
	else
		console.error(`Unsupported campus image: ${campus} (please make a pull request to add it)`);
	return params;
}

/**
 * Search for the coalition image on github and set it as smallImageKey
 * @param params the presence params
 * @param coalition_logo_key the coalition logo key
 * @param coalition_name the coalition name
 * @returns the presence params with the smallImageKey set
 */
async function setCoalitionImage(params, coalition_logo_key, coalition_name) {
	let r;

	r = await fetch("https://github.com/error7404/RP42.js/raw/main/assets/" + coalition_logo_key + ".png");
	if (r.ok)
	{
		params.smallImageKey = "https://github.com/error7404/RP42.js/raw/main/assets/" + coalition_logo_key + ".png";
		params.smallImageText = coalition_name;
	}
	else
		console.error(`Unsupported coalition: ${coalition_logo_key} (please make a pull request to add it)`);
	return params;
}

/**
 * Set the presence name to the one of the campus by reading campusRP.json
 * @param params the presence params
 * @param campus the campus name
 */
function setPresenceName(params, campus) {
	let campusRP = {};

	try {
		campusRP = JSON.parse(fs.readFileSync(__dirname + "/campusRP.json", "utf8"));
		if (campusRP[campus])
			client(campusRP[campus]).updatePresence(params);
		else
		{
			console.error(`Unsupported campus RP: ${campus} (please create a discord application and add it to campusRP.json)`);
			client(campusRP["Default"]).updatePresence(params);
		}
	} catch (error) {
		if (error.code === "ENOENT")
			console.error("No campusRP.json file found");
		client("1075433460275101696").updatePresence(params);
	}
}

process.title = "RP42";

(async () => {
	const api_client = new Client(
		process.env.CLIENT_ID,
		process.env.CLIENT_SECRET,
		{
			activeDebug: false,
		}
	);
	const login = process.env.USER;
	if (!login) {
		console.error("Please set USER environment variable in .env file");
		process.exit(1);
	}

	const user = await api_client.users.get(login);
	if (!user) {
		console.error("User not found, please check your .env file");
		process.exit(1);
	}

	let location = getAttr.getLocation(api_client, user);
	let campusName = getAttr.getCampus(api_client, user);
	let level = getAttr.getLevel(api_client, user);
	let coalition = getAttr.getCoalition(api_client, user);
	let project = getAttr.getProject(api_client, user);

	location = await location;
	coalition = await coalition;
	level = await level;
	campusName = await campusName;
	project = await project;
	location.location = `${location.location} in ${campusName}`;
	console.log(`Logged in as ${login} | Lvl ${level}% | ${location.location} | ${coalition.coalition_name} | ${project}`);
	while (!0) {
		updatePresence(login, level, location.location, project, campusName,
				coalition.coalition_slug, coalition.coalition_name,
				location.startedAt);
		await sleep(30000);
		updatePresence(login, level, project, location.location, campusName,
				coalition.coalition_slug, coalition.coalition_name,
				location.startedAt);
		await sleep(30000);
	}
})();
