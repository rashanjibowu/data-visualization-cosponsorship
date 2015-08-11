$(document).ready(function() {

	// load in data
	d3.csv("./analysis/data/plotdata.csv", function(error, data) {

		if (error) throw error;

		console.log('Data loaded');
		console.log(data);

		// create Graph object
		var graph = new Graph(data);

		// plot data
		console.log("plotting data...");

	});

});

/**
 * Creates a Graph
 * Holds the data for the graph visualization
 * @param {array} data Array of objects.
 *                     Data is an array of objects. Each element in the array represents 1 senator
 *                     The senator object contains 1 key (an empty string), which contains the senator's name
 *                     The senator object also contains keys, 1 for each bill and the sponsorship level
 */
function Graph(data) {

	// references to nodes and links
	this.nodes = [];
	this.links = [];

	if (data) {
		console.log("we got data!");
	} else  {
		console.error("No data was found!");
	}

	// transform this data into a usable format
	// store the nodes
	data.forEach(function(row, index, thisArray) {

		var sponsorshipRecord = [];
		var nameKey = "";

		for (var key in row) {
			// convert the non-namekey portion of object into an array
			if (key !== nameKey) {
				if (row.hasOwnProperty(key)) {
					sponsorshipRecord.push({
						bill: key,
						sponsorship: +row[key],
						senator: row[nameKey]
					});
				}
			}

			this.addNode({
				name: row[nameKey],
				party: (Math.random() < 0.5) ? "Democrat" : "Republican"
			});
		}
	}, this);

	// store the links
	// links are a cross section - need a vertical slicing of the data
	for (var billIndex = 0; billIndex < data[0].length; billIndex++) {
		// find co-occurrences of sponsorship
		var cooccurredIndices = getCooccurredSenators(data, billIndex);
		console.log(cooccurredIndices);
	}
}

/**
 * For a given vertical slice of the matrix (a bill), find all of the senators who cosponsored that bill
 * @param  {array} data      Full data set
 * @param  {integer} billIndex Column index
 * @return {array}           Array of senator (indices) who cosponsored the bill
 */
function getCooccurredSenators(data, billIndex) {
	var senIndices = [];
	for (var senatorIndex = 0; senatorIndex < data.length; senatorIndex++) {
		var sponsorshipObject = data[senatorIndex][billIndex];
		if (sponsorshipObject.sponsorship >= 1 && sponsorshipObject.sponsorship <= 3) {
			senIndices.push(senatorIndex);
		}
	}

	return senIndices;
}

Graph.prototype.getNodes = function() {
	return this.nodes;
};

Graph.prototype.addNode = function(node) {
	this.nodes.push(node);
};