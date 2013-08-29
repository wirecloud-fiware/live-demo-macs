/*global window */

(function(){
 
    "use strict";
 
	//Constructor
    var Vcard = function Vcard(){
        this.eol = "\r\n";	// end of line
        this.linePattern = /^([a-zA-Z]+)(\;[a-zA-Z]+=[a-zA-Z0-9,"]+)*\:(.+)$/i;
        this.version = "3.0";
		this.vCardText = "";
		this.vCardJson = {};
//		example:
//			this.vCardJson = {
//				"BEGIN":  [{
//					properties: {},
//					value: "VCARD"
//				}],
//				"FN":  [{
//					properties: {},
//					value: "Jonh Smith"
//				}],
//				"TEL":  [{
//					properties: {
//						"TYPE": '"cell,text,voice"',
//						"VALUE": "uri"
//					},
//					value: "666666666"
//				}],
//				"END":  [{
//					properties: {},
//					value: "VCARD"
//				}]
//			}
    };

	/* parser: parse vCard string to my vCard object (example in the constructor). 
     *  - Parameters:
     *      - text: vCard v3.0 and v4.0 format 
     * */ 
    Vcard.prototype.parser = function (text){
		var n, m;
		var key;
		var line;
		var lines;
		var indexMidColon;
		var leftSide;
		var rightSide;
		var properties;
		var prop;
		var propKey;
		var propValue;
		var tempLine;
        
        if (this.vCardJson) {
            this.vCardJson = {};
        }
        
    // get all lines:
        lines = text.split(this.eol);
        
    // parse each line:
        for (n in lines) {
			line = lines[n];
			// pattern found:
			if (this.linePattern.test(line)) {
				var results = line.match(this.linePattern);
				indexMidColon = results[0].indexOf(":");
				
				// Split right and left sides
				leftSide = results[0].slice(0, indexMidColon);
				rightSide = results[0].slice(indexMidColon+1);
				
			// Set left side:
				// set key:
				properties = leftSide.split(";");
				key = properties[0];
				
			// Every key has an array with n lines:
				if (!this.vCardJson[key]){
					this.vCardJson[key] = [];
				}
				
				tempLine = {
					properties : {},
					value: ""
				};
				
				for(m = 1; m < properties.length; m++){
					prop = properties[m].split("=");
					propKey = prop[0];
					propValue = prop[1];
					tempLine.properties[propKey] = propValue;
				}
				
			// Set right side:
				// set value:
				tempLine.value = rightSide;

				this.vCardJson[key].push(tempLine);
			}
        }
		return this.vCardJson;
    };
	
	/* - writer: it transform json into text.
     * - Parameters:
     *      - json: example in Contructor.
     * */
	Vcard.prototype.writer = function (json){
		var key;
		var property;
		var propers = [];
        var n;
        
        if (this.vCardText) {
            this.vCardText = "";
        }

		for(key in json){
			for (n = 0; n < json[key].length; n++){
				this.vCardText += key;
				//write properties:
				if (json[key][n].properties) {
					for (property in json[key][n].properties) {
						propers.push(property + "=" + json[key][n].properties[property]);
					}
					if (propers.length !== 0){
						this.vCardText += ";" + propers.join(";");
						propers = [];
					}
				}
				// write value:
				this.vCardText += ":" + json[key][n].value + this.eol;
			}
		}
		return this.vCardText;
	};
	
    /* - getValue: get a value. We have an array of properties.
     * - Parameters:
     *      - name: vcard property name.
     *      - num: vcard property position.
     * */
	Vcard.prototype.getValue = function (name, num){
        if (this.vCardJson[name]) {
            if (!num && this.vCardJson[name].length == 1) {
                num = 0;
            }
            return this.vCardJson[name][num].value;
        }
        return undefined;
    };

	window.Vcard = Vcard;

})();
