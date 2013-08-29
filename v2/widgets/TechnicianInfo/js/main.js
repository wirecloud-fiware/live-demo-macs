/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the technician-info widget.
 *
 *     technician-info is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     technician-info is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with technician-info. If not, see <http://www.gnu.org/licenses/>.
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

/*global MashupPlatform, Vcard, StyledElements */

(function () {

    "use strict";

/******************************************************************************/
/********************************* PUBLIC *************************************/
/******************************************************************************/

    var TechnicianInfo = function TechnicianInfo() {
        /* Constants */
        this.IMG_PATH = "./images/";
        this.DEFAULT_IMG = this.IMG_PATH + "defaultPhotoMan.png";
        this.NOT_ASSIGNED_ISSUES = "Not assigned Issues.";
        this.DEFAULT_MESSAGE = "---------";

        /* Inputs */
        MashupPlatform.wiring.registerCallback("inputProfile", handlerInputProfile.bind(this));
        
        /* Context */
        MashupPlatform.widget.context.registerCallback(function (new_values) {
            if ('heightInPixels' in new_values) {
                this.tabs.repaint();
            }
        }.bind(this));
        this.tabs = {};
        this.profile = {};
    };

    TechnicianInfo.prototype.init = function init() {
        this.tabs = new StyledElements.StyledNotebook();
        this.tabs.insertInto(document.body);
        this.mainTab = this.tabs.createTab({name: "Main Info", closable: false});
        this.aditionalInfoTab = this.tabs.createTab({name: "Assigned Issues", closable: false});

        this.mainTab.appendChild(this.createContainer("div", "personalInfoContainer"));
        this.mainTab.appendChild(this.createContainer("div", "contactContainer"));
        this.aditionalInfoTab.appendChild(this.createContainer("div", "aditionalInfoContainer"));
        
        this.profile = new Vcard();
        this.fillPersonalInformation();
    };

    TechnicianInfo.prototype.createContainer = function createContainer(containerType, idName) {
        var container = document.createElement(containerType);
        container.setAttribute("id", idName);
        return container;
    };

    TechnicianInfo.prototype.fillPersonalInformation = function fillPersonalInformation() {
        var infoContainer = document.getElementById("personalInfoContainer");
        var contactContainer = document.getElementById("contactContainer");

        var infoData = {
            "name": {
                "title": "Name",
                "value": clearData.call(this, this.profile.getValue('FN', 0))
            },
            "function": {
                "title": "Function",
                "value": clearData.call(this, this.profile.getValue('TITLE', 0))
            },
            "location": {
                "title": "Current Location",
                "value": clearData.call(this, this.profile.getValue('ADR', 0))
            },
            "mobile": {
                "title": "Mobile",
                "value": clearData.call(this, this.profile.getValue('TEL', 0))
            },
            "email": {
                "title": "Email Address",
                "value": clearData.call(this, this.profile.getValue('EMAIL', 0))
            }
        };
        infoData.twitter = {};
        infoData.twitter.title = "Twitter Account";
        if (this.profile.getValue('IMPP', 0)) {
            infoData.twitter.value = clearData.call(this, this.profile.getValue('IMPP', 0).split(":")[1]);
        }
        infoData.nextTarget = {};
        infoData.nextTarget.title = "nextTarget";
        infoData.nextTarget.value = clearData.call(this, this.DEFAULT_MESSAGE);

        var photoData = {
            "image": {
                "title": this.profile.getValue('PHOTO', 0),
                "value": null
            }
        };

        var comunicationData = {
            "sendSms": {
                "title": this.IMG_PATH + "message.png",
                "value": "send sms"
            },
            "sendEmail": {
                "title": this.IMG_PATH + "message.png",
                "value": "send email"
            },
            "sendPersTweet": {
                "title": this.IMG_PATH + "twitter.png",
                "value": "send tweet"
            }
        };

        var contactData = {};
        buildContactData.call(this, infoData, contactData, "info", infoContainer);
        buildContactData.call(this, photoData, contactData, "photo", contactContainer);
        buildContactData.call(this, comunicationData, contactData, "comunication", contactContainer);

        createItem.call(this, contactData);
        createAditionalInfo.call(this, this.profile.getValue('X-ISSUE-LIST', 0));
    };

/******************************************************************************/
/******************************** PRIVATE *************************************/
/******************************************************************************/

    var buildContactData = function buildContactData(dataSource, dataResult, type, parentNode) {
        for (var info in dataSource) {
            dataSource[info].type = type;
            dataSource[info].parentNode = parentNode;
            dataResult[info] = dataSource[info];
        }
    };

    var createItem = function createItem(contactData) {
        var fun = {
            info: createInfoItem,
            photo: createContactPhoto,
            comunication: createContactComunicationOptions
        };

        for (var contact in contactData) {
            var element = contactData[contact];
            fun[element.type].call(this, element.parentNode, contact, element.title, element.value);
        }
    };

    var createInfoItem = function createInfoItem(parentNode, fieldName, displayTitle, fieldValue) {
        var title, field;
        var element = document.getElementById(fieldName + "Title");
        if (!element) {
            title = this.createContainer("div", fieldName + "Title");
            field = this.createContainer("div", fieldName);
        } else {
            title = document.getElementById(fieldName + "Title");
            field = document.getElementById(fieldName);
        }
        title.textContent = displayTitle;
        
        if (!fieldValue) {
            field.textContent = this.DEFAULT_MESSAGE;
        } else {
            field.textContent = fieldValue;
        }

        title.setAttribute("class", "personalInfoTitle");
        field.setAttribute("class", "personalInfo");

        parentNode.appendChild(title);
        title.appendChild(field);
    };

    var createContactPhoto = function createContactPhoto(parentNode, fieldName, photoLocation) {
        var container, photo;
        var element = document.getElementById(fieldName + "Container");
        if (!element) {
            container = this.createContainer("div", fieldName + "Container");
            photo = this.createContainer("img", fieldName + "Contact");
        } else {
            container = document.getElementById(fieldName + "Container");
            photo = document.getElementById(fieldName + "Contact");
        }

        if (photoLocation != null) {
            photo.setAttribute("src", photoLocation);
            photo.addEventListener("error", setDefaultImg.bind(this, photo), false);
        } else {
            setDefaultImg.call(this, photo);
        }

        parentNode.appendChild(container);
        container.appendChild(photo);
    };

    var createContactComunicationOptions = function createContactComunicationOptions(parentNode, fieldName, photoLocation, description) {
        var container, photo, action;
        var element = document.getElementById(fieldName + "Container");
        if (!element) {
            container = this.createContainer("div", fieldName + "Container");
            photo = this.createContainer("img", fieldName + "Icon");
            action = this.createContainer("div", fieldName + "Description");
        } else {
            container = document.getElementById(fieldName + "Container");
            photo = document.getElementById(fieldName + "Icon");
            action = document.getElementById(fieldName + "Description");
        }

        photo.setAttribute("src", photoLocation);
        photo.setAttribute("class", "comIcon");
        action.setAttribute("class", "comDescription");
        action.textContent = description;

        parentNode.appendChild(container);
        container.appendChild(photo);
        container.appendChild(action);
    };

    var createAditionalInfo = function createAditionalInfo(pendingIssuesString) {
        var container, note;
        container = document.getElementById("noteContainer");
        if (!container) {
            container = this.createContainer("div", "noteContainer");
            note = this.createContainer("div", "note");
        } else {
            note = document.getElementById("note");
        }

        note.textContent = this.DEFAULT_MESSAGE;
        if (pendingIssuesString) {
            var issues = JSON.parse(pendingIssuesString);
            note.textContent = buildIssues(issues);
        }

        var parentNode = document.getElementById("aditionalInfoContainer");
        parentNode.appendChild(container);
        container.appendChild(note);
    };

    var buildIssues = function buildIssues(issues) {
        if (!issues) {
            return this.NOT_ASSIGNED_ISSUES;
        }
        return Object.keys(issues).join(', ');
    };

    var setDefaultImg = function setDefaultImg(img) {
        img.src = this.DEFAULT_IMG;
    };

    var clearData = function clearData(dataIn) {
        var dataOut = dataIn;
        if (dataIn === "undefined") {
            dataOut = this.DEFAULT_MESSAGE;
        }

        return dataOut;
    };

/******************************* HANDLERS *************************************/

    var handlerInputProfile = function handlerInputProfile(profile) {
        this.profile.parser(profile);
        this.fillPersonalInformation();
    };

    var technicianInfo = new TechnicianInfo();

    document.addEventListener("DOMContentLoaded", technicianInfo.init.bind(technicianInfo), false);

})();
