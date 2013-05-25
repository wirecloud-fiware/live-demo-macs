/*
 *     (C) Copyright 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the issue-list widget.
 *
 *     issue-list is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     issue-list is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with issue-list. If not, see <http://www.gnu.org/licenses/>.
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

/*jshint browser:true*/
/*global MashupPlatform StyledElements Vcard NGSI*/

(function () {
 
    "use strict";

    var IssueList = function IssueList () {
        /* Input endpoints */
        MashupPlatform.wiring.registerCallback("inputIssue", handlerSlotIssue.bind(this));
        MashupPlatform.wiring.registerCallback("inputVcard", handlerSlotVcard.bind(this));

        /* Context */
        MashupPlatform.widget.context.registerCallback(function (newValues) {
            if (this.layout && "heightInPixels" in newValues) {
                 this.layout.repaint();
            }
        }.bind(this));

        /* Layout */
        this.layout = null;
        this.table = null;

        /* Other */
        this.technicians = {};
        this.issues = null;
        this.issuesId = {};
        this.tempTechnicianById = {};
    };
 
    IssueList.prototype.init = function init () {
        var ngsi_server = 'http://130.206.82.140:1026/';
        var ngsi_proxy = 'http://wirecloud-demo.lab.fi-ware.eu:3000/';
        this.ngsi = new NGSI.Connection(ngsi_server, {
            ngsi_proxy_url: ngsi_proxy,
            requestFunction: MashupPlatform.http.makeRequest
        });

        // Create Layout:
        createLayout.call(this);
        createTable.call(this);
        createFilter.call(this);
        displayInitialMessage.call(this);
        this.layout.repaint();
        this.layout.repaint();  // second repaint to show the filter :S
    };

/**************************************************************************/
/****************************** AUXILIAR **********************************/
/**************************************************************************/

    var createLayout = function createLayout () {
        this.layout = new StyledElements.BorderLayout();
        this.layout.insertInto(document.body);
    };

    var createTable = function createTable () {
        var columns = [
            {field:"id", label:"#", width:"35px", sortable:true},
            {field:"severity", label:"Severity", width:"70px", 'class': "severity", sortable:true, contentBuilder: handlerSeverity.bind(this)},
            {field:"imageFile", label:"Photo", width:"50px", 'class': 'photo', sortable:true, contentBuilder: handlerImageFile.bind(this)},
            {field:"issueType", label:"Issue Type", width:"90px", sortable:true},
            {field:"description", label:"Description", sortable:true},
            {field:"vmId", label:"Vending Machine ID", width:"160px", sortable:true},
            {field:"technician", label:"Assigned Technician", width:"170px", 'class': "technician", sortable:true, contentBuilder: handlerSelect.bind(this)}
        ];
        this.table = new StyledElements.ModelTable(columns, {'id':'id'});
        this.table.addEventListener("click", handlerClickRow.bind(this), false);
        this.layout.getCenterContainer().appendChild(this.table);
        updateDataTable.call(this);
    };

    var createFilter = function createFilter () {
        var southLayoutOptions = {
            'class': 'input input-prepend input-append'
        };
        var southLayout = new StyledElements.HorizontalLayout(southLayoutOptions);

        this.layout.getSouthContainer().appendChild(southLayout);

        // Set search icon:
        var searchAddon = new StyledElements.Addon({'title':'Search'});
        var searchIcon = document.createElement('i');
        searchIcon.className = 'icon-search';
        searchAddon.appendChild(searchIcon);
        southLayout.getWestContainer().appendChild(searchAddon);

        // Set input field:
        var textInput = new StyledElements.StyledTextField({placeholder: 'Filter'});
        southLayout.getCenterContainer().appendChild(textInput);
        searchAddon.assignInput(textInput);

        // Set search button:
        var search_button = new StyledElements.StyledButton({
            text: 'Search'
        });
        search_button.addEventListener('click', function () {
            this.table.source.changeOptions({'keywords': textInput.getValue()});
        });
        southLayout.getEastContainer().appendChild(search_button);
    };

    var displayInitialMessage = function displayInitialMessage(){
        var messageContainer = document.createElement("div");
        var title = document.createElement("h4");
        var textContainer = document.createElement("p");
        var text = document.createElement("span");

        messageContainer.setAttribute("id", "messageContainer");
        messageContainer.setAttribute("class", "alert alert-block");
        title.setAttribute("class", "titleInfoBox");
        title.textContent = "This widget needs to be wired.";
        textContainer.setAttribute("class", "p1InfoBox");
        text.textContent = "Get real time issues from your vending machines and assign to your technician staff, please, wire this widget to a data source (i.e. pub/sub broker).";
        document.body.appendChild(messageContainer);
        messageContainer.appendChild(title);
        messageContainer.appendChild(textContainer);
        textContainer.appendChild(text);
    };

    var updateDataTable = function updateDataTable () {
        this.table.source.changeElements(this.issues);
    };

    var updateIssue = function updateIssue (issue) {
        if (issue.severity == "ok") {
            return;
        }
        if (!this.issuesId[issue.id]) {
            this.issues.push(issue);
        } else {
            var index = this.issues.indexOf(this.issuesId[issue.id]);
            this.issues[index] = issue;
            if (issue.id !== this.selectedIssueId) {
                this.table.select(issue.id);
                this.selectedIssueId = issue.id;
            }
        }
        this.issuesId[issue.id] = issue;
    };

/**************************************************************************/
/****************************** HANDLERS **********************************/
/**************************************************************************/

    var handlerSlotVcard = function handlerSlotVcard (vCardString) {
        var initialMessageContainer = document.getElementById("messageContainer");
        if(initialMessageContainer){
            document.body.removeChild(initialMessageContainer);
        }
        
        // Parse technician vCard:
        var vCard = new Vcard();
        vCard.parser(vCardString);

        // Add technician to list
        var idTechnician = vCard.getValue("X-NGSI-ID", 0);
        if (!(idTechnician in this.technicians)) {
            this.technicians[idTechnician] = vCard;
            updateDataTable.call(this);
        } else {
            this.technicians[idTechnician] = vCard;
        }
    };

    var handlerSlotIssue = function handlerSlotIssue (issueString) {
        /*  issue = {
         *      "id":"1",
         *      "severity":"high",
         *      "type":"Issue",
         *      "typeIssue":"Failed",
         *      "vmId":"VM1024-234",
         *      "technician":"John Smith",
         *      "description":"Status has changed to FAILED."
         *  }
         * */
        var initialMessageContainer = document.getElementById("messageContainer");
        if(initialMessageContainer){
            document.body.removeChild(initialMessageContainer);
        } 
        // Parse issue:
        var issue = JSON.parse(issueString);

        // Add issue to issues list:
        if (!this.issues) {
            this.issues = [];
        }

        // Update issue:
        updateIssue.call(this, issue);

        // Update Table:
        updateDataTable.call(this);
    };

    var handlerSelect = function handlerSelect (issue) {
        var layout = new StyledElements.HorizontalLayout();

        var initialEntries = [{'label': '----------------', 'value': ''}];
        for (var key in this.technicians) {
            initialEntries.push({'label': this.technicians[key].getValue('FN', 0), 'value': key});
        }

        var select = new StyledElements.StyledSelect({
            'initialValue': issue.id in this.tempTechnicianById ? this.tempTechnicianById[issue.id] : issue.technician,
            'initialEntries': initialEntries
        });
        layout.getCenterContainer().appendChild(select);

        var button = new StyledElements.StyledButton({
            'class': 'icon-ok',
            plain: true
        });
        button.disable();
        button.addEventListener('click', function (button) {
            var technician = select.getValue();
            this.tempTechnicianById[issue.id] = technician;

            assignTechnician.call(this, issue, technician);
            button.disable();
        }.bind(this));
        layout.getEastContainer().appendChild(button);

        select.addEventListener("change", function () {
            button.setDisabled(select.getValue() === issue.technician);
            var technician = select.getValue();
            if (technician !== '') {
                var vCard2Send = this.technicians[technician];
                MashupPlatform.wiring.pushEvent('outputTechnicianVCard', vCard2Send.getVcardText());
                createSendRoute.call(this, issue, technician);
            }
        }.bind(this));

        return layout;
    };

    var handlerImageFile = function handlerImageFile(issue) {

        if (!issue.imageFile) {
            return;
        }

        var button = new StyledElements.StyledButton({
            plain: true,
            'class': 'icon-camera'
        });
        button.addEventListener('click', function () {
            MashupPlatform.wiring.pushEvent('outputPhotoURL', JSON.stringify(issue));
        });

        return button;
    };

    var handlerSeverity = function handlerSeverity(issue) {
        var span = document.createElement('span');

        switch (issue.severity) {
            case "high":
                span.className = 'label label-important';
                break;
            case "warning":
                span.className = 'label label-warning';
                break;
            default:
                span.className = 'label label-success';
        }

        span.textContent = issue.severity;
        return span;
    };

    var assignTechnician = function assignTechnician(issue, technician) {
        issue.technician = technician;

        modifyIssue.call(this, issue);
    };

    var handlerClickRow = function handlerClickRow (issue) {
        var technician = issue.id in this.technicians ? this.tempTechnicianById[issue.id] : issue.technician;

        if (technician) {
            createSendRoute.call(this, issue, technician);
        } else {
            MashupPlatform.wiring.pushEvent('outputIssue', JSON.stringify(issue));
        }

        // select row.
        if (issue.id !== this.selectedIssueId) {
            this.table.select(issue.id);
            this.selectedIssueId = issue.id;
        }
    };

    var modifyIssue = function modifyIssue(issue) {
        /*  issue = {
         *      "id":"1",
         *      "severity":"high",
         *      "type":"Issue",
         *      "typeIssue":"Failed",
         *      "vmId":"VM1024-234",
         *      "technician":"John Smith",
         *      "description":"Status has changed to FAILED."
         *  }
         * */
        this.ngsi.updateAttributes([{
            entity: {
                id: issue.id,
                type: 'Issue'
            },
            attributes:[{
                name: 'technician',
                contextValue: issue.technician
            }]
        }], {
            onFailure: function () {
                // show error
            }
        });
    };
    
    var createSendRoute = function createSendRoute(issue, technician) {
            var route = "from: " + this.technicians[technician].getValue('GEO', 0).split(":")[1];
            route += " to: " + issue.coordinates;
            MashupPlatform.wiring.pushEvent('outputRoute', route);
    };

    window.IssueList = IssueList;

 })();

var issuesList = new IssueList();

window.addEventListener("DOMContentLoaded", issuesList.init.bind(issuesList), false);
