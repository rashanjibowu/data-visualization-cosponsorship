$(document).ready(function() {
	console.log("We are ready");

	var data = getMockData();
	var links = convertDataToLinks(data);
	console.log(links);
});

/**
 * Converts the dataset into links in the formate required for a force-directed graph
 * @param  {array} data Full data set
 * @return {array}      Array of objects representing links in a graph
 */
function convertDataToLinks(data) {
	// data is an array of arrays
	// each row is a senator's sponsorship record

	// for each bill (inner array elements)
	// 		for each senator (outer array elements)
	// 			if (bill sponsor level is 1, 2, or 3) --> save the senator index
	// 		create links from indices and append to other links
	// return links

	var numBills = data[0].length;
	var links = [];

	for (var billIndex = 0; billIndex < numBills; billIndex++) {

		var senIndices = getCoocurredSenators(data, billIndex);

		// create links from senator indices
		links = links.concat(createLinks(senIndices));
	}

	return links;
}

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
 * Creates links for graph from array of indices
 * @param  {array} array Array of co-occurred indices
 * @return {array}       Array of objects each specifying target and source for a link
 */
function createLinks(array) {
	// array is a list of senator indices

	var links = [];

	for (var i = 0; i < array.length; i++) {
		for (var j = i; j < array.length; j++) {
			if (i == j) continue;

			links.push({
				source: array[i],
				target: array[j]
			});
		}
	}

	return links;
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