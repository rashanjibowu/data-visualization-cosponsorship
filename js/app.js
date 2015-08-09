$(document).ready(function() {
	console.log("We are ready");

	var data = getMockData();

	var nodes = new Nodes();
	var links = new Links();
	console.log(links.getLinksAsArray());

	links.convertDataToLinks(data);
	console.log(links.getLinksAsArray());
});

/**
 * Object containing all of the links
 */
function Links() {

	// reference to the links
	this.links = {};
}

/**
 * Add a link to the Links object ensuring that there are no duplicates
 * @param {object} link Link object to be added
 * @return {void}
 */
Links.prototype.addLink = function(link) {
	// create string representation
	var hash = this.hash(link);

	// if hash already exists, increment the value
	if (this.links[hash]) {
		this.links[hash].value++;
	} else {
		// if hash does not exist, create with a value of 1
		link.value = 1;
		this.links[hash] = link;
	}
};

/**
 * Create a hash "property representation" of a link
 * This is used to prevent duplicate links
 * @param  {object} linkObject A link object (with a source and target)
 * @return {string}            Representation of a link
 */
Links.prototype.hash = function(linkObject) {

	// normalize the property to prevent duplicates
	// S9T5 is the same as S5T9
	if (linkObject.source < linkObject.target) {
		smaller = linkObject.source;
		larger = linkObject.target;
	} else {
		smaller = linkObject.target;
		larger = linkObject.source;
	}

	return "S" + smaller + "T" + larger;
};

/**
 * Returns all links as an object
 * @return {object} All links in a single object
 */
Links.prototype.getLinksAsObject = function() {
	return this.links;
};

/**
 * Returns all links as an array
 * @return {array} All links as an array
 */
Links.prototype.getLinksAsArray = function() {

	var array = [];

	for (var key in this.links) {
		if (this.links.hasOwnProperty(key)) {
			array.push(this.links[key]);
		}
	}

	return array;
};

/**
 * Creates links for graph from array of indices
 * @param  {array} array Array of co-occurred indices
 * @return {array}       Array of objects each specifying target and source for a link
 */
Links.prototype.generateLinks = function(array) {
	// array is a list of senator indices
	for (var i = 0; i < array.length; i++) {
		for (var j = i; j < array.length; j++) {
			if (i == j) continue;

			this.addLink({
				source: array[i],
				target: array[j]
			});
		}
	}
};

/**
 * Converts the dataset into links in the format required for a force-directed graph
 * @param  {array} data Full data set
 * @return {array}      Array of objects representing links in a graph
 */
Links.prototype.convertDataToLinks = function(data) {
	// data is an array of arrays
	// each row is a senator's sponsorship record

	// for each bill (inner array elements)
	// 		for each senator (outer array elements)
	// 			if (bill sponsor level is 1, 2, or 3) --> save the senator index
	// 		create links from indices and append to other links
	// return links

	var numBills = data[0].length;

	for (var billIndex = 0; billIndex < numBills; billIndex++) {

		var senIndices = getCoocurredSenators(data, billIndex);

		// create links from senator indices
		this.generateLinks(senIndices);
	}
};

function Nodes() {
	this.nodes = [
		{ name: "Huey", party: "Democrat" },
		{ name: "Louie", party: "Republican" },
		{ name: "Donald", party: "Democrat" },
		{ name: "Michael", party: "Democrat" },
		{ name: "Marissa", party: "Republican" }
	];
}

Nodes.prototype.getNodes = function() {
	return this.nodes;
};

/**
 * For a given vertical slice of the matrix (a bill), find all of the senators who cosponsored that bill
 * @param  {array} data      Full data set
 * @param  {integer} billIndex Column index
 * @return {array}           Array of senator (indices) who cosponsored the bill
 */
function getCoocurredSenators(data, billIndex) {
	var senIndices = [];
	for (var senatorIndex = 0; senatorIndex < data.length; senatorIndex++) {
		var sponsorshipLevel = data[senatorIndex][billIndex];
		if (sponsorshipLevel >= 1 && sponsorshipLevel <= 3) {
			senIndices.push(senatorIndex);
		}
	}

	return senIndices;
}

/**
 * Generates mock data
 * @return {array} Array of arrays of senator cosponsorship
 */
function getMockData() {
	// data will come in the form of an array of senators' sponsorship levels for ~5700 bills
	// 0 means no connection
	// 1 means the sponsor
	// 2 means co-sponsor
	// 3 means co-sponsor after previously withdrawing
	// 5 means former co-sponsor

	var senatorNames = ["Huey", "Louie", "Donald", "Michael", "Marissa"];

	var senatorSponsorhip = [];

	var BILLCOUNT = 100;

	// for each senator, generate an array of sponsorship levels for 100 bills
	for (var i = 0; i < senatorNames.length; i++) {
		senatorSponsorhip[i] = [];
		for (var billIndex = 0; billIndex < BILLCOUNT; billIndex++) {
			senatorSponsorhip[i].push(Math.round(Math.random() * 3));
		}
	}

	return senatorSponsorhip;
}