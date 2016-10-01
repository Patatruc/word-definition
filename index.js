
var parser = require("./parser.js");

function getDef(word, lng, options, callback) {

	if(typeof callback != "function") throw "word-definition error: no callback specified (getDef function).";
	if(typeof options != "object") throw "word-definition error: options should be an object or null (getDef function).";

	if(!word || /[\W\d_]/.test(parser.stripAccents(word))) callback({ word: word, err: "invalid characters" });
	else if(!parsers[lng]) callback({ word: word, err: "unsupported language" });
	else new parsers[lng](word, options, callback).getTitles();

}

var languages = [

	{

		lng: "en",

		cats: "(Verb)|(Noun)|(Adjective)|(Adverb)|(Conjunction)|(Preposition)|" +
			"(Determiner)|(Article)|(Pronoun)|(Interjection)",

		variants: [
			/^({{[^}]+}}\s*)*\[\[([^\]#|]+)[^\]]*\]\]\.*$/i,
			/\s*{{[^|]+ of\|([^}|]+)/
		],

		searchDef: function(page) {

			var def = "";

			var match = new RegExp("===(" + (this.cat || this.cats) + ")===[^]+").exec(page);

			if(match) {
				var match2 = /\n{{((en-)|(head\|en)).*\n(\[\[[^\]]*\]\])*\n#(.+)(\n##(.+)){0,1}/.exec(match[0]);
				if(match2) {
					def = match2[5].trim();
					this.cat = match[1];
					if (match[6] && def.replace(/{{[^}]*}}/g, "").trim() == "") def = match2[6].trim();
				}
			}
			return def;
		}
	},

	{

		lng: "fr",

		cats: "(nom)|(verbe)|(adjectif)|(adverbe)|(conjonction[^|]*)|" +
			"(article[^|]*)|(pronom[^|]*)(interjection)|(préposition)|(onomatopée)",

		variants: [
			/{{variante [^|]*\|([^|}]+)/i,
			/{{cf\|([^}]+)/i,
			/((Variante)|(Autre)) [^\[]+\[\[([^\]#|]+)/i,
			/^({{[^}]+}}\s*)*\[\[([^\]#|]+)[^\]]*\]\]\.*$/i
		],
		
		searchDef: function(page) {

			var def = "";
			
			var match = new RegExp("{{S\\|(" + (this.cat || this.cats) +
				")\\|fr(\\|flexion)*.+(\\n[^#].+)*\\n#(.+)(\\n##(.+)){0,1}").exec(page);

			if(match) {
				var nMatches = match.length;
				def = match[nMatches - 3].trim();
				if (match[nMatches - 1] && def.replace(/{{[^}]*}}/g, "").trim() == "") def = match[nMatches - 1].trim();
				if (def) {
					this.cat = match[1];
					if (match[nMatches - 5]) {
						var redirect = /[^\[]*\[\[([^#\-|\]]+)/.exec(def);
						if (redirect) {
							this.titles[0] = redirect[1];
							// console.log(this.word + " : inflection ==> " + redirect[1]);
							this.word = redirect[1];
							this.getPage();
							def = true;
						}
					}
				}
			}
			return def;
		}
	}
]

var parsers = {};

languages.forEach(function(props) {

	var p = parsers[props.lng] = function(word, options, callback) {
		this.base = parser.parser; 
		this.base(word, props.lng, options, callback); 
	}

	p.prototype = new parser.parser;

	var proto = p.prototype;
	proto.cats = props.cats;
	proto.variants = props.variants;
	proto.searchDef = props.searchDef;

});

module.exports.getDef = getDef;
