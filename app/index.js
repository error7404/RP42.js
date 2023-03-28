const fs = require('fs');
const client = require('discord-rich-presence');
require('dotenv').config();
const Client = require('42.js').Client
const getAttr = require('./getAttr.js');

async function updatePresence(login, lvl, location, campus, coalition_logo_key, coalition_name, startedAt, project) {
	console.log(`Logged in as ${login} | Lvl ${lvl}% | ${location} in ${campus} since ${startedAt} | ${coalition_name} | ${project}`);
	if (project.length > 128){
		project = project.slice(0, 125);
		project += "...";
	}
	let params = {
		largeImageKey: "rp42-icon",
		largeImageText: `${location} in ${campus}`,
		details: `${login} | Lvl ${lvl}%`,
		state: project,
		startTimestamp: startedAt,
		instance: true,
	}
	params = await setCampusImage(params, campus);
	params = await setCoalitionImage(params, coalition_logo_key, coalition_name);
	setPresenceName(params);
}

async function setCampusImage(params, campus) {
	let r;

	r = await fetch("https://github.com/error7404/RP42.js/raw/main/assets/" + campus + ".png")
	if (r.ok)
		params.largeImageKey = "https://github.com/error7404/RP42.js/raw/main/assets/" + campus + ".png";
	else
		console.log(`Unsupported campus image: ${campus} (please make a pull request to add it)`);
	return params;
}

async function setCoalitionImage(params, coalition_logo_key, coalition_name) {
	let r;

	r = await fetch("https://github.com/error7404/RP42.js/raw/main/assets/" + coalition_logo_key + ".png");
	if (r.ok)
	{
		params.smallImageKey = "https://github.com/error7404/RP42.js/raw/main/assets/" + coalition_logo_key + ".png";
		params.smallImageText = coalition_name;
	}
	else
		console.log(`Unsupported coalition: ${coalition_logo_key} (please make a pull request to add it)`);
	return params;
}

function setPresenceName(params) {
	let campusRP = {};

	try {
		campusRP = JSON.parse(fs.readFileSync(__dirname + "/campusRP.json", "utf8"));
		if (campusRP[campus])
			client(campusRP[campus]).updatePresence(params);
		else
		{
			console.log(`Unsupported campus RP: ${campus} (please create a discord application and add it to campusRP.json)`);
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
	await updatePresence(login, await level, location.location, await campusName, coalition.coalition_slug, coalition.coalition_name, location.startedAt, await project);
	process.exit(0);
})();
