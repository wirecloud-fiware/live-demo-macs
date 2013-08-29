/** This library is based on {@link http://tools.ietf.org/html/rfc6350|RFC 6350} vCard v4.0 standard
 *  @author Santiago Blanco Ventas
 *  @version 1.0
 *  @namespace Vcard
 * */
(function () {
 
    "use strict";
 
    /**
     * @lends Vcard
     * */
    var Vcard = function Vcard() {
        // end of line:
        this.eol = "\r\n";

        this.linePattern = /^([a-zA-Z\-]+)(\;[a-zA-Z]+=[a-zA-Z0-9,"]+)*\:(.+)$/i;
        this.foldingPattern = /^\s\w*/i;
        this.version = "4.0";

        /** @type {String} */
        this.vCardText = "";
        /** @type {JSON} */
        this.vCardJson = {};
        // see ../test//vCard_spec_data.js
    };

    /** Parse vCard string to my vCard object (example in the constructor).
     *  @param {string} text The vCard in v4.0 format.
     *  @returns vCard in JSON format.
     * */
    Vcard.prototype.parse = function parse(text) {
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
        var folding = 0;

        this.vCardJson = {};

    // get all lines:
        lines = text.split(this.eol);

    // parse each line:
        for (n = 0; n < lines.length; n++) {
            line = lines[n];
            if (this.foldingPattern.test(line)) {
                folding++;
                var concatLine = "";
                for (var i = 0; i <= folding; i++) {
                    // If there is any space before CRLF character in the previous line, it is omited.
                    concatLine = lines[n - i].trimRight().concat(concatLine);
                }
                line = concatLine;
            } else {
                folding = 0;
            }
            // pattern found:
            if (this.linePattern.test(line)) {
                var results = line.match(this.linePattern);
                indexMidColon = results[0].indexOf(":");

                // Split right and left sides
                leftSide = results[0].slice(0, indexMidColon);
                rightSide = results[0].slice(indexMidColon + 1);

            // Set left side:
                // set key:
                properties = leftSide.split(";");
                key = properties[0];

            // Every key has an array with n lines:
                if (!this.vCardJson[key]) {
                    this.vCardJson[key] = [];
                }

                tempLine = {
                    properties : {},
                    value: ""
                };

                for (m = 1; m < properties.length; m++) {
                    prop = properties[m].split("=");
                    propKey = prop[0];
                    propValue = prop[1];
                    tempLine.properties[propKey] = propValue;
                }

            // Set right side:
                // set value:
                tempLine.value = rightSide;

                if (folding > 0) {
                    this.vCardJson[key].pop();
                }
                this.vCardJson[key].push(tempLine);
            } else {
                if (line !== "") {
                    throw {
                        name: "BadFormatException",
                        message: "vCard format is wrong."
                    };
                }
            }
        }

        var beginNotPresent = !this.vCardJson.BEGIN;
        var fnNotPresent = !this.vCardJson.FN;
        var versionNotPresent = !this.vCardJson.VERSION;
        var endNotPresent = !this.vCardJson.END;
        var wrong = beginNotPresent || fnNotPresent || versionNotPresent || endNotPresent;
        if (wrong) {
            this.vCardText = "";
            this.vCardJson = {};
            throw {
                name: "BadFormatException",
                message: "vCard format is wrong."
            };
        }
        this.vCardText = text;

        return this.vCardJson;
    };

    /** See vCard.parse
     *  @deprecated
     *  @param {string} text The vCard in v4.0 format.
     *  @returns vCard in JSON format.
     * */
    Vcard.prototype.parser = Vcard.prototype.parse;

    /** It transforms a vCard object into a strig containing a vCard in the version 4.0 of the format.
     * @param {value} the value to convert to a vCard string.
     * @returns vCard in string format.
     * */
    Vcard.prototype.stringify = function stringify(value) {
        var properties = [];
        var property_value;
        var lines = [];

        if (this.vCardText) {
            this.vCardText = "";
        }

        var j = 0;
        for (var key in value) {
            lines[j] = [];
            for (var n = 0; n < value[key].length; n++) {
                lines[j] = key;
                //write properties:
                if (value[key][n].properties) {
                    for (var property in value[key][n].properties) {
                        property_value = value[key][n].properties[property];
                        properties.push(property + "=" + property_value);
                    }
                    if (properties.length > 0) {
                        lines[j] += ";" + properties.join(";");
                        properties = [];
                    }
                }
                // write value:
                lines[j] += ":" + value[key][n].value;
                j++;
            }
        }
        this.vCardText += lines.join(this.eol);
        return this.vCardText;
    };

    /** See vCard.stringify
     * @param {json} json own JSON format.
     * @returns vCard in string format.
     * */
    Vcard.prototype.writer = Vcard.prototype.stringify;

    /** It returns a value from vCard.
     *  @param {String} name Name of vCard property.
     *  @param {Number} num Position inside of vCard property, when the property is repeted several times.
     *      It should be an integer.
     *      Optional.
     * */
    Vcard.prototype.getValue = function getValue(name, num) {
        if (this.vCardJson[name]) {
            if (!num && this.vCardJson[name].length === 1) {
                num = 0;
            }
            return this.vCardJson[name][num].value;
        }
        return undefined;
    };

    /** It returns a property from a field of vCard.
     *  @param {String} field Field name.
     *  @param {String} property Property name.
     * */
    Vcard.prototype.getProperty = function getProperty(name, index, property) {
        if (name && this.vCardJson[name] && this.vCardJson[name][index].properties) {
            return this.vCardJson[name][index].properties[property];
        }
        return null;
    };

    /** It returns the vCard in string format.
     *  @returns vCard in string format.
     */
    Vcard.prototype.getVcardText = function getVcardText() {
        return this.vCardText;
    };

    window.Vcard = Vcard;

})();
