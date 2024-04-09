
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

function getCampus(user) {
	return user.campus[0] ? user.campus[0].name : "The World";
}

function getLevel(user) {
	return (user.cursus_users[user.cursus_users.length - 1] ? user.cursus_users[user.cursus_users.length - 1].level.toFixed(2) : 0);
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

function filterProjects(user) {
	let projects = user.projects_users;
	
	const finished = projects.filter(project => project.status === "finished");
	const in_progress = projects.filter(project => project.status === "in_progress");
	const waiting_for_correction = projects.filter(project => project.status === "waiting_for_correction");
	const searching_a_group = projects.filter(project => project.status === "searching_a_group");
	const creating_group = projects.filter(project => project.status === "creating_group");

	return ({
		finished: finished,
		in_progress: in_progress,
		waiting_for_correction: waiting_for_correction,
		searching_a_group: searching_a_group,
		creating_group: creating_group,
		projects: projects,
	});
}

function getProject(user) {
	let project = "Working on nothing";
	
	let filterd_projects = filterProjects(user);
	if (filterd_projects.waiting_for_correction.length > 0) {
		project = "Waiting for correction: ";
		project += filterd_projects.waiting_for_correction.map(project => project.project.name).join(", ");
		return (project);
	} else if (filterd_projects.in_progress.length > 0) {
		project = "Working on: ";
		project += filterd_projects.in_progress.map(project => project.project.name).join(", ");
		return (project);
	}
	else if (filterd_projects.searching_a_group.length > 0 || filterd_projects.creating_group.length > 0) {
		project = "Looking for a group: ";
		project += filterd_projects.searching_a_group.concat(filterd_projects.creating_group).map(project => project.project.name).join(", ");
		return (project);
	}
	else if (filterd_projects.finished.length > 0) {
		if (filterd_projects.finished[0].project.name.toLowerCase().includes("exam")) {
			project = "Just passed: ";
		} else {
			project = "Just pushed: ";
		}
		project += filterd_projects.finished[0].project.name;
		return project;
	}
	else if (filterd_projects.projects.length > 0){
		project = "Just pushed: ";
		project += filterd_projects.projects[0].project.name;
		return (project);
	}
	return (project);
}
