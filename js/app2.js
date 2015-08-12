$(document).ready(function() {

	// load in data
	d3.csv("./analysis/data/plotdata.csv", function(error, data) {

		if (error) throw error;

		// create Graph object
		var graph = new Graph(data);
		var nodes = graph.getNodes();
		var links = graph.getLinks();

		// plot data
		console.log("Plotting data... %d nodes and %d links", nodes.length, links.length);
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

	// reference to array version of data
	this.dataAsArray = [];

	// transform this data into a usable format
	this.parseNodes(data);

	// store the links
	this.parseLinks(data);
}

/**
 * ---------------------- Nodes-related methods--------------------------
 */

Graph.prototype.getNodes = function() {
	return this.nodes;
};

Graph.prototype.addNode = function(node) {
	this.nodes.push(node);
};

Graph.prototype.parseNodes = function(data) {
	// store the nodes
	data.forEach(function(row, index, thisArray) {

		var nameKey = "";

		this.addNode(
			{
				name: row[nameKey],
				party: (Math.random() < 0.5) ? "Democrat" : "Republican"
			}
		);

	}, this);
};


/**
 * ----------------------- Links-related methods --------------------------
 */

Graph.prototype.getLinks = function() {
	return this.links;
};

Graph.prototype.addLink = function(link) {
	// TODO: hash to prevent duplicates
};

Graph.prototype.parseLinks = function(data) {

	// convert each row into an array
	for (var rowIndex = 0; rowIndex < data.length; rowIndex++) {

		var row = [];
		for (var key in data[rowIndex]) {
			if (data[rowIndex].hasOwnProperty(key) && key !== "") {
				row.push({
					bill: key,
					sponsorshipLevel: +data[rowIndex][key]
				});
			}
		}

		this.dataAsArray.push(row);
	}

	// links are a cross section - need a vertical slicing of the data
	for (var billIndex = 0; billIndex < this.dataAsArray[0].length; billIndex++) {
		// find co-occurrences of sponsorship
		var cooccurredIndices = getCooccurredSenators(this.dataAsArray, billIndex);

		// create links from the co-occurred indices
		for (var i = 0; i < cooccurredIndices.length; i++) {
			for (var j = i; j < cooccurredIndices.length; j++) {

				if (i == j) continue;

				this.links.push({
					source: cooccurredIndices[i],
					target: cooccurredIndices[j],
					value: 9
				});
			}
		}
	}
};

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
		if (sponsorshipObject.sponsorshipLevel >= 1 && sponsorshipObject.sponsorshipLevel <= 3) {
			senIndices.push(senatorIndex);
		}
	}

	return senIndices;
}