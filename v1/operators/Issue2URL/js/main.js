/*
 *     (C) Copyright 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the issue2url widget.
 *
 *     issue2url is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     issue2url is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with issue2url. If not, see <http://www.gnu.org/licenses/>.
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
/*global MashupPlatform*/

(function(){

var Issue2URL = function Issue2URL(){
    this.wirecloudAuth ={};
    this.envirofiAuth = {};

    /*Wirecloud Authentication credentials and repo info.*/
    this.wirecloudAuth.PROJECT = "WIRECLOUD";
    this.wirecloudAuth.USER = "wirecloud";
    this.wirecloudAuth.PASS = "welcome19";
    this.wirecloudAuth.TENANT_ID = "86ca53b6d21b4cfe98a4e0c49e2931af";
    this.wirecloudAuth.IMAGE_REPO = "vendingMachinesImages";
    this.wirecloudAuth.IMAGE_REPOSITORY_URL = "http://130.206.80.102:8080/v1/AUTH_" + this.wirecloudAuth.TENANT_ID + "/" + this.wirecloudAuth.IMAGE_REPO + "/";

    /* Envirofi Authentication credentials and repo info */
    this.envirofiAuth.PROJECT = "ENVIROFI";
    this.envirofiAuth.USER = "envirofi_ait";
    this.envirofiAuth.PASS = "welcome10";
    this.envirofiAuth.TENANT_ID = "35e92f2be42b48778c0456f51ba71be6";
    this.envirofiAuth.IMAGE_REPO = "EnvirofiImg";
    this.envirofiAuth.IMAGE_REPOSITORY_URL = "http://130.206.80.102:8080/v1/AUTH_" + this.envirofiAuth.TENANT_ID + "/" + this.envirofiAuth.IMAGE_REPO + "/";
   

    this.TOKEN_REQUEST_URL = "http://130.206.80.100:5000/v2.0/tokens";
    this.authToken="";
    this.imageFileName = "";
    this.issue = {};
    MashupPlatform.wiring.registerCallback("issueInput", this.receiveIssue.bind(this));
};

Issue2URL.prototype.init = function init(){};

Issue2URL.prototype.receiveIssue = function receiveIssue(issue){
    this.issue = JSON.parse(issue);
    this.getAuthToken.call(this);
};

Issue2URL.prototype.successfulyRequestedAuthToken = function successfulyRequestedAuthToken(response){
    var JSONResponse = {};
    JSONResponse = JSON.parse(response.responseText);
    this.authToken = JSONResponse.access.token.id;
    this.getRequestedPhoto.call(this);
};

Issue2URL.prototype.getAuthToken = function getAuthToken(){
    var tokenRequest = {};
    
    // Use wirecloudTestingPostBody only for debugging porpouse //
    var wirecloudPostBody = {"auth": {"project":this.wirecloudAuth.PROJECT, "passwordCredentials":{"username":this.wirecloudAuth.USER,"password":this.wirecloudAuth.PASS},"tenantId":this.wirecloudAuth.TENANT_ID}};

    // postBody for requesting access token using wirecloud user and  pass for envirofi tenant. This would be great, but doesn't work yet.
    var envirofiPostBody =  {"auth": {"project":this.wirecloudAuth.PROJECT, "passwordCredentials":{"username":this.wirecloudAuth.USER,"password":this.wirecloudAuth.PASS},"tenantId":this.envirofiAuth.TENANT_ID}}; 

    // postBody for access envirofi image repo. It should be temp. //
    var envirofiMariaDataPostBody = {"auth": {"project":this.envirofiAuth.PROJECT, "passwordCredentials":{"username":this.envirofiAuth.USER,"password":this.envirofiAuth.PASS},"tenantId":this.envirofiAuth.TENANT_ID}}; 

    var postBody = wirecloudPostBody;
    var requestHeaders = {"Accept":"application/json"}; 
    var tokenRequestParms = {
        "contentType":"application/json",
        "postBody": JSON.stringify(postBody),
        "requestHeaders": requestHeaders, 
        "onSuccess": this.successfulyRequestedAuthToken.bind(this)
    };
    tokenRequest = MashupPlatform.http.makeRequest(this.TOKEN_REQUEST_URL, tokenRequestParms);
};

Issue2URL.prototype.getRequestedPhoto = function getRequestedPhoto(){
    var imageRequest = {};
    var urlToRequestImage = "";
    this.imageFileName = this.issue.imageFile;
    urlToRequestImage = this.wirecloudAuth.IMAGE_REPOSITORY_URL + this.imageFileName;
    //urlToRequestImage = this.envirofiAuth.IMAGE_REPOSITORY_URL + this.imageFileName;

    var requestHeaders = {"X-Auth-Token":this.authToken};
    var imageRequestParms = {
        "method":"GET",
        "requestHeaders": requestHeaders,
        "responseType":"blob", 
        "onSuccess": this.successfulyImageRequest.bind(this)
    };
    imageRequest = MashupPlatform.http.makeRequest(urlToRequestImage, imageRequestParms);
};

Issue2URL.prototype.successfulyImageRequest = function successfulyImageRequest(response){
    var photoURL = URL.createObjectURL(response.response);
    this.issue.imageURL = photoURL;
    MashupPlatform.wiring.pushEvent("photoOutput", photoURL);
};

window.Issue2URL =  Issue2URL;

})();

var issue2Url= new Issue2URL();
document.addEventListener("DOMContentLoaded", issue2Url.init.bind(issue2Url), false);
