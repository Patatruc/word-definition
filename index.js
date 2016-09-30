
var https = require("https");

var titlesURL = ".wiktionary.org/w/api.php?action=query&list=search&format=json&utf8&srprop=&srsearch=";
var pagesURL = ".wiktionary.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=";

function getDef(word, lng, options, callback) {

	if(typeof callback != "function") throw "word-definition error: no callback specified (getDef function).";
	if(typeof options != "object") throw "word-definition error: options should be an object or null (getDef function).";

	word = stripAccents(word.toLowerCase());
	if(!word || /[^a-z]/.test(word)) callback({ word: word, err: "invalid characters" });
	else {
		if(parseArticle[lng] == null) callback({ word: word, err: "unsupported language" });
		else {
			var obj = { word: word, lng: lng, options: options || {}, srwhat: "nearmatch", callback: callback };
			getTitles(obj);
		}
	}

}

function getTitles(obj) {

	var req = https.get("https://" + obj.lng + titlesURL + obj.word + "&srwhat=" + obj.srwhat, function(result) {

		var cont = "";

		result.on("data", function(chunk) { cont += chunk; })
		.on("end", function() { 
			var articles = JSON.parse(cont).query.search;
			if(articles.length) {
				var exclude = obj.titles ? obj.titles[0] : "";
				obj.titles = [];
				articles.forEach(function(article) {
					var title = article.title;
					if (title != exclude && stripAccents(title.toLowerCase()) == obj.word) obj.titles.push(title);
				});
				if (obj.titles.length) getArticle(obj);
				else obj.callback({ word: obj.word, err: "not found" });
			}
			else {
				if(obj.srwhat == "nearmatch") {
					obj.srwhat = "text";
					getTitles(obj);
				}
				else  obj.callback({ word: obj.word, err: "not found" });
			}
		});

	});

	req.on("error", function() { obj.callback({ word: obj.word, err: "a request has failed" }); });

}

function getArticle(obj) {

	var req = https.get("https://" + obj.lng + pagesURL + encodeURIComponent(obj.titles[0]), function(result) {

		var cont = "";
		result.on("data", function(chunk) { cont += chunk;	})
		.on("end", function() {
			var pages = JSON.parse(cont).query.pages;
			var page = pages[Object.keys(pages)[0]].revisions[0]["*"];
			parseArticle[obj.lng](page, obj);
		});
	});
	req.on("error", function() { obj.callback({ word: obj.word, err: "a request has failed" }); });

}

var parseArticle = {

	en: function (page, obj) {

		// ************ ANGLAIS *********************
		
		var cats = "(Verb)|(Noun)|(Adjective)|(Adverb)|(Conjunction)|(Preposition)|(Determiner)|(Article)|(Pronoun)|(Interjection)";
		var def = "";

		var match = new RegExp("===(" + (obj.cat || cats) + ")===[^]+").exec(page);

		if(match) {
			var match2 = /\n{{((en-)|(head\|en)).*\n\n#(.+)(\n##(.+)){0,1}/.exec(match[0]);
			if(match2) {
				def = match2[4];
				if (match[6] && def.replace(/{{[^}]*}}/g, "").trim() == "") def = match2[6].trim();
				if (def) {
					obj.cat = match[1];
					var redirect = /\s*{{[^|]+ of\|([^}|]+)/.exec(def);
					if (redirect) {
						obj.titles[0] = redirect[1];
						getArticle(obj);
						return;
					}
				}			
			}
		}

		if (def) cleanup(obj, obj.titles[0].replace(/#.*/, ""), obj.cat.toLowerCase(), def );

		else {
			delete obj.cat;
			if (obj.srwhat == "nearmatch") {
				obj.srwhat = "text";
				getTitles(obj);
			}
			else {
				obj.titles.shift();
				if(obj.titles.length) getArticle(obj);
				else obj.callback({ word: obj.word, err: "not found" });
			}
		}
	},

	fr: function (page, obj) {

		// ************ FRANCAIS *********************
		
		var def = "";
		
		var match = new RegExp("{{S\\|(" + (obj.cat || "[\\w\\s]+") +
			")\\|fr(\\|flexion)*.+(\\n[^#].+)*\\n#(.+)(\\n##(.+)){0,1}").exec(page);

		if(match) {
			def = match[4].trim();
			if (match[6] && def.replace(/{{[^}]*}}/g, "").trim() == "") def = match[6].trim();
			if (def) {
				obj.cat = match[1];
				if (match[2]) {
					var redirect = /[^\[]*\[\[([^\|\]]+)/.exec(def);
					if (redirect) {
						obj.titles[0] = redirect[1];
						getArticle(obj);
						return;
					}
				}
			}
		}

		if (def) {
			var variante = /{{variante[^|]*\|([^|}]+)/i.exec(def);
			if (!variante) variante = /{{cf\|([^}]+)/i.exec(def);
			if(variante) {
				obj.titles[0] = variante[1];
				getArticle(obj);
				return;
			}
			def = def.replace(/{{lien\|([^\|]+)\|conv}}/g, "$1");
			cleanup(obj, obj.titles[0].replace(/#.*/, ""), obj.cat, def );
		}
		else {
			delete obj.cat;
			if (obj.srwhat == "nearmatch") {
				obj.srwhat = "text";
				getTitles(obj);
			}
			else {
				obj.titles.shift();
				if(obj.titles.length) getArticle(obj);
				else obj.callback({ word: obj.word, err: "not found" });
			}
		}
	}

}

function cleanup(obj, word, cat, def) {

	def = def.replace(/{{[^}]*}}/g, "");

	def = def.replace(/'''([^']+)'''/g, obj.options.formatted ? "<span style='bold'>$1</span>" : "$1");
	def = def.replace(/''([^']+)''/g, obj.options.formatted ? "<span style='italic'>$1</span>" : "$1");

	switch(obj.options.hyperlinks) {
		case "brackets":
			break;
		case "html":
			var url = "https://" + obj.lng + ".wiktionary.org/wiki/";
			def = def.replace(/\[\[([^\]|]+)(\|)([^\]]+)\]\]/g,	"<a href='" + url + "$1' target='_blank'>$3</a>");
			def = def.replace(/\[\[([^\]]+)\]\]/g,	"<a href='" + url + "$1' target='_blank'>$1</a>");
			break;
		case "none":
		default:
			def = def.replace(/\[\[([^\]|]+\|)*([^\]]+)\]\]/g, "$2");
	}

	obj.callback({ "word": word, "category": cat, "definition": def.trim() });
}

function stripAccents(text) {

	var replace = {
		à: "a", á: "a", â: "a", ã: "a", ä: "a",
		ç: "c",
		è: "e", é: "e", ê: "e", ë: "e",
		ì: "i", í: "i", î: "i", ï: "i",
		ñ: "n",
		ò: "o", ó: "o", ô: "o", õ: "o", ö: "o",
		ù: "u", ú: "u", û: "u", ü: "u",
		ý: "y", ÿ: "y"
	}

	for (var i = 0, len = text.length, res = ""; i < len; i++) res += replace[text[i]] || text[i];
	return res;

}

module.exports.getDef = getDef;
