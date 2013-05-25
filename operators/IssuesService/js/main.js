/*
 *     (C) Copyright 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *     This file is part of the issue-service widget.
 *
 *     issue-service is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published
 *     by the Free Software Foundation, either version 3 of the License, or (at
 *     your option) any later version.
 *
 *     issue-service is distributed in the hope that it will be useful, but
 *     WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
 *     General Public License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with issue-service. If not, see <http://www.gnu.org/licenses/>.
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

// TODO: settings / platform context
var ngsi_server = 'http://130.206.82.140:1026/';
var ngsi_proxy = 'http://wirecloud-demo.lab.fi-ware.eu:3000/';
var connection = new NGSI.Connection(ngsi_server, {
    ngsi_proxy_url: ngsi_proxy,
    requestFunction: MashupPlatform.http.makeRequest
});

var buildIssue = function buildIssue (vendingMachine) {
    var issue = {};

    for (var element in vendingMachine) {
        if (vendingMachine[element] === 'emptycontent') {
            issue[element] = "";
        } else {
            issue[element] = vendingMachine[element];
        }
    }
    return issue;
};

var sendIssue = function sendIssue(vmList) {
    var issue = {};
    for (var vm in vmList) {
        issue = buildIssue(vmList[vm]);
        MashupPlatform.wiring.pushEvent('outputIssue', JSON.stringify(issue));
    }
};

connection.createSubscription([
        {
            type: 'Issue',
            id: '.*',
            isPattern: true
        }
    ],
    null,
    'PT24H',
    null,
    [{
		type:'ONCHANGE',
        condValues: ['technician', 'imageFile', 'severity', 'description', 'vmId', 'issueType', 'coordinates']
	}],
    {
        flat: true,
        onNotify: sendIssue
    }
);
