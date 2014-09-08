/*
 *     Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global ObjectStorageAPI, MashupPlatform, StyledElements, NGSI*/

(function () {
 
    "use strict";

/******************************************************************************/
/********************************* PUBLIC *************************************/
/******************************************************************************/

    var create_ngsi_connection = function create_ngsi_connection() {
        this.ngsi = new NGSI.Connection(MashupPlatform.prefs.get('ngsi_server'));
    };

    var create_objectstorage_connection = function create_objectstorage_connection() {
        this.os_connection = new ObjectStorageAPI(MashupPlatform.prefs.get('objectstorage_server'), {
            token: MashupPlatform.prefs.get('objectstorage_token')
        });
    };

    var IssueReporter = function IssueReporter() {

        /* Preferences */
        create_ngsi_connection.call(this);
        create_objectstorage_connection.call(this);
        MashupPlatform.prefs.registerCallback(function (new_values) {
            if ('ngsi_server' in new_values) {
                create_ngsi_connection.call(this);
            }

            if ('objectstorage_server' in new_values || 'objectstorage_token' in new_values) {
                create_objectstorage_connection.call(this);
            }
        }.bind(this));

        /* Context */
        MashupPlatform.widget.context.registerCallback(function (newValues) {
            if (this.formUploadFile && "widthInPixels" in newValues) {
                this.formUploadFile.repaint();
            }
        }.bind(this));
    };
 
    IssueReporter.prototype.init = function init() {
        var fields = {
            "entity": {
                label: 'Entity',
                type: 'select',
                required: true
            },
            "file": {
                label: 'Image',
                type: 'file',
                required: true
            },
            "description": {
                label: 'Description',
                type: 'longtext',
                required: true
            }
        };
        var options = {
            cancelButton: false
        };
        this.formUploadFile = new StyledElements.Form(fields, options);
        this.formUploadFile.addEventListener("submit", handlerUploadFile.bind(this));

        // TODO
        this.loadingIcon = document.createElement('i');
        this.loadingIcon.className = 'icon-refresh icon-spin';
        this.formUploadFile.acceptButton.buttonElement.insertBefore(this.loadingIcon, this.formUploadFile.acceptButton.buttonElement.childNodes[0]);
        // TODO

        this.formUploadFile.insertInto(document.body);

        this.updateAvailableEntities();
    };

    IssueReporter.prototype.updateAvailableEntities = function updateAvailableEntities() {
        this.ngsi.query([{
                type: 'Node',
                isPattern: true,
                id: 'OUTSMART\\..*'
            }, {
                type: 'AMMS',
                isPattern: true,
                id: 'OUTSMART\\..*'
            }, {
                type: 'Regulator',
                isPattern: true,
                id: 'OUTSMART\\..*'
            }],
            null,
            {
                flat: true,
                onSuccess: update_id_select.bind(this)
            }
        );
    };

/******************************************************************************/
/******************************** PRIVATE *************************************/
/******************************************************************************/

    var update_id_select = function update_id_select(issues) {
        var key, entries = [];

        for (key in issues) {
            entries.push({label: key, value: key});
        }

        /* TODO */
        this.formUploadFile.fieldInterfaces.entity.inputElement.clear();
        this.formUploadFile.fieldInterfaces.entity.inputElement.addEntries(entries);
    };

    var create_msg = function create_msg(msg, success) {
        var element = document.createElement('div');
        element.className = 'alert alert-block';
        if (success) {
            element.classList.add('alert-success');
        }
        element.textContent = msg;
        document.body.appendChild(element);
        setTimeout(function () {
            document.body.removeChild(element);
        }, 3000);
    };

    var update_issue = function update_issue(id, file, description, position) {
        var attributes = [{
            type: 'string',
            name: 'imageFile',
            contextValue: file
        }];

        if (position) {
            attributes.push({
                type: 'string',
                name: 'coordinates',
                contextValue: position.coords.longitude + ', ' + position.coords.latitude
            });
        }

        this.ngsi.updateAttributes([{
                entity: {
                    id: id,
                    type: 'Issue'
                },
                attributes: attributes
            }], {
                onSuccess: function () {
                    create_msg('Issue reported successfuly', true);
                }.bind(this),
                onFailure: function () {
                    create_msg('Error reporting the issue');
                },
                onComplete: function () {
                    this.formUploadFile.enable();
                }.bind(this)
            }
        );
    };

    var create_issue = function create_issue(entity, file, description, position) {
        var url = MashupPlatform.prefs.get('event2issue_server');
        if (url[url.length - 1] !== '/') {
            url += '/';
        }
        url += '/new_issue/' + entity + '/CitizenReport/Warning';

        if (position != null && !('coords' in position)) {
            position = null;
        }

        MashupPlatform.http.makeRequest(url, {
                onSuccess: function (transport) {
                    var id = transport.responseText;
                    update_issue.call(this, id, file, description, position);
                }.bind(this),
                onFailure: function () {
                    create_msg('Error reporting the issue');
                },
                onComplete: function () {
                    this.formUploadFile.enable();
                }.bind(this)
            }
        );
    };

    var handlerUploadFile = function handlerUploadFile(form, data) {

        form.disable();

        var callback = create_issue.bind(this, data.entity, data.file.name, data.description);
        var wrapper;
        if (navigator.geolocation) {
            wrapper = function () {
                navigator.geolocation.getCurrentPosition(callback, callback);
            };
        } else {
            wrapper = callback;
        }

        this.os_connection.uploadFile(MashupPlatform.prefs.get('objectstorage_container'), data.file, {
            onSuccess: wrapper,
            onFailure: function () {
                create_msg('Error uploading image file');
                this.formUploadFile.enable();
            }.bind(this)
        });
    };

    var issueReporter = new IssueReporter();

    window.addEventListener("DOMContentLoaded", issueReporter.init.bind(issueReporter), false);
})();
