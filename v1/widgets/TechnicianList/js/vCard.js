/*
 *     (C) Copyright 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the technician-list widget.
 *
 *     technician-list is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     technician-list is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with technician-list. If not, see <http://www.gnu.org/licenses/>.
 *
 *     Linking this library statically or dynamically with other modules is
 *     making a combined work based on this library.  Thus, the terms and
 *     conditions of the GNU Affero General Public License cover the whole
 *     combination.
 *
 *     As a special exception, the copyright holders of this library give you
 *     permission to link this library with independent modules to produce an
 *     executable, regardless of the license terms of these independent
 *     modules, and to copy and distribute the resulting executable under
 *     terms of your choice, provided that you also meet, for each linked
 *     independent module, the terms and conditions of the license of that
 *     module.  An independent module is a module which is not derived from
 *     or based on this library.  If you modify this library, you may extend
 *     this exception to your version of the library, but you are not
 *     obligated to do so.  If you do not wish to do so, delete this
 *     exception statement from your version.
 *
 */

/*global window */

(function(){
 
    "use strict";
 
	//Constructor
    var Vcard = function Vcard(){
        this.eol = "\r\n";	// end of line
        this.linePattern = /^([a-zA-Z]+)(\;[a-zA-Z]+=[a-zA-Z0-9,"]+)*\:(.+)$/i;
        this.version = "4.0";
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
     *      - text: vCard v4.0 format 
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

    Vcard.prototype.getVcardText = function getVcardText() {
        return this.vCardText;
    };

	window.Vcard = Vcard;

})();
