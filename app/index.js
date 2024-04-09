const fs = require('fs');
const createClient = require('discord-rich-presence');
require('dotenv').config();
const Client = require('42.js').Client
const getAttr = require('./getAttr.js');

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function updatePresence(client, login, lvl, largeImageText, state, campus, coalition_logo_key, coalition_name, startedAt) {
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
	client.updatePresence(params);
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
 * Get the discord client from the campus name in campusRP.json
 * @param {String} campus: the campus name
 * @returns: the discord client
 */
function getClient(campus) {
	let campusRP = {};

	try {
		campusRP = JSON.parse(fs.readFileSync(__dirname + "/campusRP.json", "utf8"));
		if (campusRP[campus])
			return createClient(campusRP[campus]);
		else
		{
			console.error(`Unsupported campus RP: ${campus} (please create a discord application and add it to campusRP.json)`);
			return createClient(campusRP["Default"]);
		}
	}
	catch (error) {
		if (error.code === "ENOENT")
			console.error("No campusRP.json file found");
		return createClient("1075433460275101696");
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
	let login = process.env.LOGIN;
	if (!login)
		login = process.env.USER;
	if (!login || login === "" || login === "your_login") {
		console.error("Please set LOGIN environment variable in .env file");
		process.exit(1);
	}

	const user = await api_client.users.get(login);
	if (!user) {
		console.error(`User: ${login} not found, please check your .env file, add LOGIN variable and try again.`);
		process.exit(1);
	}

	let location = getAttr.getLocation(api_client, user);
	let coalition = getAttr.getCoalition(api_client, user);
	let campusName = getAttr.getCampus(user);
	let level = getAttr.getLevel(user);
	let project = getAttr.getProject(user);

	// await here for parallel execution
	location = await location;
	coalition = await coalition;
	location.location = `${location.location} in ${campusName}`;
	console.log(`Logged in as ${login} | Lvl ${level}% | ${location.location} | ${coalition.coalition_name} | ${project}`);
	const client = getClient(campusName);
	while (!0) {
		updatePresence(client, login, level, location.location, project, campusName,
				coalition.coalition_slug, coalition.coalition_name,
				location.startedAt);
		await sleep(30000);
		updatePresence(client, login, level, project, location.location, campusName,
				coalition.coalition_slug, coalition.coalition_name,
				location.startedAt);
		await sleep(30000);
	}
})();
