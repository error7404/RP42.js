const fs = require('fs');
const client = require('discord-rich-presence');
require('dotenv').config();
const Client = require('42.js').Client

async function updatePresence(login, lvl, location, campus, coalition_logo_key, coalition_name, startedAt, project) {
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

	let location = "";
	let startedAt = Date.now();
	if (user.location) {
		location = user.location;
		const locations = (await api_client.get(`/users/${user.id}/locations?filter[active]=true`)).data;
		if (locations.length > 0) {
			startedAt = new Date(locations[0].begin_at);
		}
	}
	else {
		location = "¯\\_(ツ)_/¯";
	}

	let campusName = "The World";
	const campuses = (await api_client.get(`/users/${user.id}/campus_users?filter[is_primary]=true`)).data;
	if (campuses.length > 0) {
		const campus = (await api_client.get(`/campus/${campuses[0].campus_id}`)).data;
		campusName = campus.name;
	}

	let level = 0;
	const cursuses = (await api_client.get(`/users/${user.id}/cursus_users?filter[active]=true`)).data;
	if (cursuses.length > 0) {
		level = cursuses[0].level.toFixed(2);
	}

	let coalition_slug = "";
	let coalition_name = "";
	let coalitions = (await api_client.get(`/users/${user.id}/coalitions_users`)).data;
	if (coalitions.length > 0) {
		coalitions = coalitions.sort((a, b) => a.updated_at - b.updated_at);
		const coalition = (await api_client.get(`/coalitions/${coalitions[0].coalition_id}`)).data;
		coalition_slug = coalition.slug;
		coalition_name = coalition.name;
	}

	// FIXME: 42 API is bad with filter, and Making less requests is better
	let project = "Working on nothing";
	let projects = (await api_client.get(`/users/${user.id}/projects_users?filter[status]=waiting_for_correction`)).data;
	if (projects.length > 0)
		project = "Waiting for correction: ";
	else if ((projects = (await api_client.get(`/users/${user.id}/projects_users?filter[status]=in_progress`)).data).length > 0)
		project = "Working on: ";
	else if ((projects = (await api_client.get(`/users/${user.id}/projects_users?filter[status]=searching_a_group,creating_group`)).data).length > 0)
		project = "Looking for a group: ";
	if (projects.length > 0) {
		let name = [];
		for (let i = 0; i < projects.length; i++)
			name.push(projects[i].project.name);
		project += name.join(", ");
	}
	
	console.log(`Logged in as ${login} | Lvl ${level}% | ${location} in ${campusName} | ${coalition_name} | ${project}`);
	updatePresence(login, level, location, campusName, coalition_slug, coalition_name, startedAt, project);
})();
