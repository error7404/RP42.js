
module.exports = {
	getLocation: getLocation,
	getCampus: getCampus,
	getLevel: getLevel,
	getCoalition: getCoalition,
	getProject: getProject,
  };

async function getLocation(api_client, user) {
	let ret = {location: "¯\\_(ツ)_/¯", startedAt: Date.now()};

	if (user.location) {
		ret.location = user.location;
		const locations = (await api_client.get(`/users/${user.id}/locations?filter[active]=true`)).data;
		if (locations.length > 0) {
			ret.startedAt = new Date(locations[0].begin_at);
		}
	}
	return (ret);
}

async function getCampus(api_client, user) {
	let campusName = "The World";

	const campuses = (await api_client.get(`/users/${user.id}/campus_users?filter[is_primary]=true`)).data;
	if (campuses.length > 0) {
		const campus = (await api_client.get(`/campus/${campuses[0].campus_id}`)).data;
		campusName = campus.name;
	}
	return (campusName);
}

async function getLevel(api_client, user) {
	let level = 0;

	const cursuses = (await api_client.get(`/users/${user.id}/cursus_users?filter[active]=true`)).data;
	if (cursuses.length > 0) {
		level = cursuses[0].level.toFixed(2);
	}
	return (level);
}

async function getCoalition(api_client, user) {
	let ret = {coalition_slug: "", coalition_name: ""};

	let coalitions = (await api_client.get(`/users/${user.id}/coalitions_users`)).data;
	if (coalitions.length > 0) {
		coalitions = coalitions.sort((a, b) => a.updated_at - b.updated_at);
		const coalition = (await api_client.get(`/coalitions/${coalitions[0].coalition_id}`)).data;
		ret.coalition_slug = coalition.slug;
		ret.coalition_name = coalition.name;
	}
	return (ret);
}

async function getProject(api_client, user) {
	let project = "Working on nothing";
	
	// FIXME: 42 API is bad with filter, and Making less requests is better
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
	return (project);
}
