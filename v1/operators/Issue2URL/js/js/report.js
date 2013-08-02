/*
 *     (C) Copyright 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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
/*global MashupPlatform StyledElements*/

(function(){

    "use strict";

    /******************************************************************************/
    /********************************* PUBLIC *************************************/
    /******************************************************************************/

    var Report = function Report (id) {
        if (!id) {
             throw "Report fails. Invalid observation id.";
        }
        this.id = id;
        this.time = "";
        this.provider = "";
        this.imgType = "";
        this.imgQuality = "";
        this.comment = "";
        this.treeStatus = "";
        this.barkBeetle = "";
        this.damage = "";

        this.report = {};
    };

    Report.prototype.setTime = function setTime (dateTime) {
        this.time = dateTime;
    };

    Report.prototype.setProvider = function setProvider (provider) {
        this.provider = provider;
    };

    Report.prototype.setImgType = function setImgType (type) {
        this.imgType = type;
    };

    Report.prototype.setImgQuality = function setImgQuality (quality) {
        this.imgQuality = quality;
    };

    Report.prototype.setComment = function setComment (comment) {
        this.comment = comment;
    };

    Report.prototype.setTreeStatus = function setTreeStatus (treeStatus) {
        this.treeStatus = treeStatus;
    };

    Report.prototype.setBarkBeetle = function setBarkBeetle (barkBeetle) {
        this.barkBeetle = barkBeetle;
    };

    Report.prototype.setDamage = function setDamage(damage) {
        this.damage = damage;
    };

    Report.prototype.setReport = function setReport (report) {
        for (var field in report) {
            this.report[field] = report[field];
        }
    };

    Report.prototype.getReport = function getReport () {
        buildReport.call(this);
        if (!validReport) {
            throw "Report: Bad format.";
        }
        return this.report;
    };

    /******************************************************************************/
    /********************************* PRIVATE ************************************/
    /******************************************************************************/

    var buildReport = function buildReport () {
        this.report = {
            'entity': {
                'id': this.id,
                'type':'ImageObservation'
            },
            'attributes' : {
                'reportTime': this.time,
                'reportProvider': this.provider,
                'reportImageType': this.imgType,
                'reportImageQuality': this.imgQuality,
                'reportComment': this.comment,
                'reportTreeStatus': this.treeStatus,
                'reportBarkbeetle': this.barkBeetle,
                'reportDamage': this.damage
            }
        };
    };

    var validReport = function validReport () {
        for (var element in this.report) {
            if (!this.report.attributes[element].value) {
                return false;
            }
        }

        return true;
    };

    window.Report = Report;

 })();
