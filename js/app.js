$(document).ready(function() {
	console.log("We are ready");

	var dimensions = {
		outerHeight: 600,
		outerWidth: 700,
		margins: {
			top: 20,
			bottom: 20,
			left: 20,
			right: 20
		}
	};

	dimensions.innerHeight = dimensions.outerHeight - dimensions.margins.top - dimensions.margins.bottom;
	dimensions.innerWidth = dimensions.outerWidth - dimensions.margins.left - dimensions.margins.right;

	var svg = d3.select("#visualization")
				.append("svg")
				.attr({
					width: dimensions.outerWidth,
					height: dimensions.outerHeight,
				});

	var canvas = svg.append("g")
					.attr({
						width: dimensions.innerWidth,
						height: dimensions.innerHeight,
						transform: "translate(" + dimensions.margins.left + "," + dimensions.margins.top + ")"
					});

	var color = d3.scale.category20();

	d3.csv("./analysis/data/plotdata.csv", function(error, data) {

		if (error) throw error;

		var threshold = 200;

		var graph = new Graph(data, threshold);
		console.log(graph);

		var force = d3.layout.force()
			.nodes(graph.nodes)
			.links(graph.links)
			.size([dimensions.innerWidth - 100, dimensions.innerHeight - 100])
			.linkStrength(function(link, index) {
				//return link.value / 3000;
				return 0.4;
			})
			.friction(0.3)
			.linkDistance(200)
			.charge(-200)
			//.gravity(0)
			//.theta(0)
			//.alpha(0)
			.start();

		var link = canvas.selectAll(".link")
			.data(graph.links)
			.enter()
			.append("line")
			.attr("class", "link")
			//.style("stroke-width", function(d) { return Math.sqrt(d.value); });
			.style("stroke-width", function(d) { return Math.sqrt(1); });

		var node = canvas.selectAll(".node")
			.data(graph.nodes)
			.enter()
			.append("circle")
			.attr("class", "node")
			.attr("r", function(d) {
				//return Math.sqrt(d.weight);
				return 8;
			})
			.style("fill", function(d) { return color(d[0].party); })
			.call(force.drag);

		node.append("title")
			.text(function(d) {
				var label = d[0].name + " (" + d[0].party + ")";
				return label;
			});

		force.on("tick", function() {
			link
				.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

			node
				.attr("cx", function(d) { return d.x = Math.max(15, Math.min(dimensions.innerWidth - 15, d.x)); })
    			.attr("cy", function(d) { return d.y = Math.max(15, Math.min(dimensions.innerHeight - 15, d.y)); });
		});
	});
});

/**
 * Object containing all of the links
 */
function Graph(data, threshold) {

	// reference to the links and nodes
	this.links = {};
	this.nodes = {};

	this.transformed = {
		nodes: [],
		links: []
	};

	// minimum number of edges to be displayed on the graph
	this.threshold = (threshold) ? threshold : 200;

	this.transform(data);
	this.convertDataToLinks(this.transformed.links);
}

/**
 * Add a link to the Graph object ensuring that there are no duplicates
 * @param {object} link Link object to be added
 * @return {void}
 */
Graph.prototype.addLink = function(link) {
	// create string representation
	var hash = this.hashLink(link);

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
Graph.prototype.hashLink = function(linkObject) {

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
 * Returns all links meeting the threshold
 * @return {array} All links
 */
Graph.prototype.getLinks = function() {

	var array = [];

	for (var key in this.links) {
		if (this.links.hasOwnProperty(key)) {
			if (this.links[key].value >= this.threshold)
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
Graph.prototype.generateLinks = function(array) {
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
Graph.prototype.convertDataToLinks = function(data) {
	// data is an array of arrays
	// each row is a senator's sponsorship record

	// for each bill (inner array elements)
	// 		for each senator (outer array elements)
	// 			if (bill sponsor level is 1, 2, or 3) --> save the senator index
	// 		create links from indices and append to other links
	// return links

	var numBills = data[0].length;
	console.info("Number of bills: %d", numBills);
	for (var billIndex = 0; billIndex < numBills; billIndex++) {

		var senIndices = getCooccurredSenators(data, billIndex);

		// create links from senator indices
		this.generateLinks(senIndices);
	}
};

Graph.prototype.getNodes = function() {
	return this.nodes;
};

/**
 * Converts loaded data into a format that can used for visualization
 * @param  {array} data Array of objects
 * @return {array}      Array of better formed objects
 */
Graph.prototype.transform = function(inputData) {

	// input data comes in as an array of 102 objects, one for each senator
	// each object contains keys representing the senator's name as well as
	// the sponsorship level for a bill

	inputData.forEach(function(senatorRecord, index, thisArray) {
		var output = this.parseRow(senatorRecord);
		this.transformed.nodes.push(output.senator);
		this.transformed.links.push(output.sponsorshipRecord);
	}, this);
};

/**
 * Converts an object into an array
 * @param  {object} obj Input object
 * @return {array}     Output array
 */
Graph.prototype.parseRow = function(obj) {
	var output = {};
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			if (key === "") {
				output.senator = {
					name: obj[key],
					party: (Math.random() > 0.5) ? "Democrat" : "Republican"
				};
			} else {
				output.sponsorshipRecord = [];
				output.sponsorshipRecord.push({
					bill: key,
					sponsorship: +obj[key]
				});
			}
		}
	}
	return output;
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
		if (sponsorshipObject.sponsorship >= 1 && sponsorshipObject.sponsorship <= 3) {
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
			senatorSponsorhip[i].push({
				bill: "Some bill name",
				sponsorship: Math.round(Math.random() * 3)
			});
		}
	}

	return senatorSponsorhip;
}