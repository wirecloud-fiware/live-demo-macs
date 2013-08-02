/*
 *     (C) Copyright 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the issue-reporter widget.
 *
 *     issue-reporter is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     issue-reporter is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with issue-reporter. If not, see <http://www.gnu.org/licenses/>.
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
/*global MashupPlatform StyledElements*/

(function () {
 
    "use strict";

    var url = 'http://130.206.80.195:1026';
    var options = {
        requestFunction: MashupPlatform.http.makeRequest
    };
    var connection = new NGSI.Connection(url, options);

/******************************************************************************/
/********************************* PUBLIC *************************************/
/******************************************************************************/

    var IssueReporter = function IssueReporter () {
        this.wirecloudAuth ={};

        /*Wirecloud Authentication credentials and repo info.*/
        this.wirecloudAuth.PROJECT = "WIRECLOUD";
        this.wirecloudAuth.USER = "wirecloud";
        this.wirecloudAuth.PASS = "welcome19";
        this.wirecloudAuth.TENANT_ID = "86ca53b6d21b4cfe98a4e0c49e2931af";
        this.wirecloudAuth.IMAGE_REPO = "vendingMachinesImages";
        this.wirecloudAuth.IMAGE_REPOSITORY_URL = "http://130.206.80.102:8080/v1/AUTH_" + this.wirecloudAuth.TENANT_ID + "/" + this.wirecloudAuth.IMAGE_REPO + "/";
        this.TOKEN_REQUEST_URL = "http://130.206.80.100:5000/v2.0/tokens";
        this.authToken = "";
        //this.imageFileName = "";
        //this.issue = {};

    };
 
    IssueReporter.prototype.init = function init() {
        var fields = {
            "issue": {
                label: 'Issue',
                type: 'text',
                required: true
            },
            "file" : {
                label: 'Image',
                type: 'file',
                required: true
            }
        };
        var options = {};
        this.formUploadFile = new StyledElements.Form(fields, options);
        this.formUploadFile.addEventListener("submit", handlerUploadFile.bind(this));
        this.formUploadFile.insertInto(document.body);
    };

/******************************************************************************/
/******************************** PRIVATE *************************************/
/******************************************************************************/

    var update_issue = function update_issue(issue, file) {
        connection.updateAttributes([{
            entity: {
                id: issue,
                type: 'Issue'
            },
            attributes:[{
                name: 'imageFile',
                contextValue: file
            }]
        }]);
    };

    var handlerUploadFile = function (form, data) {

        var uploadFile = function uploadFile() {
            MashupPlatform.http.makeRequest(this.wirecloudAuth.IMAGE_REPOSITORY_URL + data.file.name, {
                method: 'PUT',
                contentType: 'image/jpeg',
                requestHeaders: {'X-Auth-Token': this.authToken},
                postBody: data.file,
                onSuccess: update_issue.bind(null, data.issue, data.file.name)
            });
        };

        getAuthToken.call(this, {onSuccess: uploadFile.bind(this)});
    };

    var getAuthToken = function getAuthToken(options) {
        if (options == null) {
            options = {};
        }

        var tokenRequest = {};
        
        var wirecloudPostBody = {"auth": {
            "project": this.wirecloudAuth.PROJECT,
            "passwordCredentials": {
                "username": this.wirecloudAuth.USER,
                "password": this.wirecloudAuth.PASS
            },
            "tenantId":this.wirecloudAuth.TENANT_ID
        }};

        var postBody = wirecloudPostBody;
        var requestHeaders = {"Accept":"application/json"}; 
        var tokenRequestParms = {
            "contentType":"application/json",
            "postBody": JSON.stringify(postBody),
            "requestHeaders": requestHeaders, 
            "onSuccess": successfulyRequestedAuthToken.bind(this, options.onSuccess)
        };
        tokenRequest = MashupPlatform.http.makeRequest(this.TOKEN_REQUEST_URL, tokenRequestParms);
    };
   
    
    var successfulyRequestedAuthToken = function successfulyRequestedAuthToken(onSuccess, response) {
        var JSONResponse = {};
        JSONResponse = JSON.parse(response.responseText);
        this.authToken = JSONResponse.access.token.id;

        if (typeof onSuccess === 'function') {
            onSuccess();
        }
    };

    window.IssueReporter= IssueReporter;

})();

var issueReporter= new IssueReporter();

window.addEventListener("DOMContentLoaded", issueReporter.init.bind(issueReporter), false);
