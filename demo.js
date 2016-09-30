

var wd = require("word-definition");

demo1();

function demo1() {
	wd.getDef("thing", "en", null, function(result) {
		print(result, "Definition of 'THING', english, no hyperlink");
		demo2();
	});
}

function demo2() {
	wd.getDef("thing", "en", { hyperlinks: "html" }, function(result) {
		print(result, "Definition of 'THING', english, HTML hyperlinks");
		demo3();
	});
}

function demo3() {
	wd.getDef("fonctionnent", "fr", null, function(result) {
		print(result, "Definition of 'FONCTIONNER' (verb) from the inflected form 'FONCTIONNENT', french, no hyperlink");
		demo4();
	});
}

function demo4() {
	wd.getDef("garçon", "fr", { hyperlinks: "html", formatted: true }, function(result) {
		print(result, "Definition of 'GARCON', french, with HTML hyperlinks and text formatting");
	});
}

function print(definition, title) {
	console.log();
	console.log("******** " + title + " ********");
	console.log();
	console.log(definition);
	console.log();
	console.log("****************************************************************");
	console.log("");
}
