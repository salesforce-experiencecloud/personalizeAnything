/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { LightningElement, api, wire } from 'lwc';
import dataRequest from '@salesforce/apex/PersonalizeHtmlController.dataRequest';

export default class personalizeHtml extends LightningElement {
    @api 
    get htmlMarkup() {
        return this._htmlMarkup;
    }
    set htmlMarkup(value) {
        this._htmlMarkup = value;
        this.setDataRequestFields(value);
    }
    dataRequestFields = [];
    shouldRender = false

    @wire(dataRequest, { params: '$dataRequestFields' })
    wiredRecord({ error, data }) {
        if (error) {
            console.log(error);
        } else if (data) { 
            for (let index = 0; index < this.dataRequestFields.length; index++) {
                let fieldName = this.dataRequestFields[index];
                let fieldNameResponse = fieldName.toLowerCase();
                if (data.hasOwnProperty(fieldNameResponse)) {
                    this.htmlMarkup = this.htmlMarkup.replaceAll('@' + fieldName + ';', data[fieldNameResponse]);
                }
            }
            this.shouldRender = true;
        }
    }

    setDataRequestFields(html) {
        for (let index = 0; index < html.length; index++) {
            if (html[index] === '@') {
                let endIndex = html.indexOf(';', index);
                this.dataRequestFields.push(html.substring(index + 1, endIndex));
            }
        }
    }
}