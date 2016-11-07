This node.js module provides a single function allowing to grab the definition of a word from the [Wiktionary](https://en.wiktionary.org) and return it in an object.

For instance the definition of "ride":

```javascript
{
	"word": "ride",
	"category": "verb",
	"definition": "To transport oneself by sitting on and directing a horse, later also a bicycle etc."
}
```
It supports three languages: **english**, **french** and **german**.

It retrieves only the **topmost definition**, for instance in the example above it returns the (first) definition of the verb *"to ride"* and not of the noun *"ride"* (because the definition of the verb comes first in the related [Wiktionary document](https://en.wiktionary.org/wiki/ride)).

It is lightweight and basic because I've written it for a [multiplayer word game](http://fundox.free.fr), not for an encyclopedia. A typical use would be: I click on an unknown word in a web page, and a short definition is quickly displayed in a tooltip.

## Installation

with npm:

```
npm install word-definition
```

## Usage

```javascript
var wd = require("word-definition");

wd.getDef(word, language, options, callback);
```

## Example

```javascript
var wd = require("word-definition");

wd.getDef("keyboard", "en", null, function(definition) {
	console.log(definition);
});
```

**Output:**

```javascript
{"word":"keyboard","category":"noun","definition":"A set of keys used to operate a typewriter, computer etc."}
```

See demo.js for further examples.

## Arguments

`word` : the word that you want to define

`language`: "en" (english), "fr" (french) or "de" (german) - required

`options` : null or object - see below

`callback` : callback function (see below)

## Options

There are 3 options:

#####`exact` :

Indicates if the search should be "accent-sensitive". For instance, the word "événement" has two accented characters in french. If `exact = false` and you search for the definition of "evenement" without accents, it will work and return the definition of "événement". If `exact = true`, it returns a "not found" error.

`true` by default.

#####`hyperlinks` :

Indicates how to handle the hyperlinks to Wiktionary pages in the definition.

Possible values are:

- `"html"`: the hyperlinks are preserved and converted into standard HTML hyperlinks (`<a href=...`).
- `"brackets"`: they are preserved in their original (wikimedia) format, like for instance [[typewriter]].
- `"none"`: (by default), all hyperlinks are stripped from the definition.

#####`formatted` :

If this option is set, the text formats (bold or italic) of the original definition are preserved and converted into CSS syles (for instance `<span style='font-weight:bold'>some text</span>`). Not set by default.

##Callback function

This function is called when the definition is ready (it is of course asynchronous and can in some case require more than 2 or 3 calls to the Wiktionary API).

The definition is passed in the argument. It is an object containing the defined `word`, its `category` (verb, noun, adjective...) and the `definition` itself.

If no definition has been found or for any other error, the object contains only the the `word` field and the error message in an `err` field.

##Definitions of inflected words and synonyms

If you request an **inflected form** of a word, say for instance the plural of a noun like "HOUSES" or the past participle of a verb like "BROKEN", the module returns the definition of the **root dictionary entry**, ie of the singular "HOUSE" or of the infinitive "BREAK".

For instance, it won't return *"Plural of house"* (like the search result of "HOUSES" in the Wiktionary) -which would be perfectly true but totally useless- but *"A structure built or serving as an abode of human beings"*.

It's the same for **synonyms**. For instance, if you request the definition of "GRANDPA", it won't return *"Grandpa: grandfather"* (like the search result in the Wiktionary) but directly *"Grandfather: a father of someone's parent"*.

##Notes

. I've used many regular expressions in order to isolate and "clean up" the definitions, and also to search for root dictionary entries. There may be errors. Please report them to me and I'll try to refine the code.

. If you use contents of the Wiktionary, you should indicate the source.

. The Wiktionary API is described [here](https://en.wiktionary.org/w/api.php).
